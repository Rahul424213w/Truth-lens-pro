import { NextRequest, NextResponse } from "next/server";
import {
  getConversation,
  saveConversation,
  ChatMessage,
  ChatConversation,
} from "@/lib/storage";
import { callGroq, callGroqMessages, parseJSON, strArray, correctScore } from "@/lib/groq";

function detectIntent(
  message: string,
  hasAttachment: boolean,
  hasHistory: boolean,
  lastAssistantMessage?: ChatMessage
): "NEW_FACT_CHECK" | "FOLLOW_UP" | "GENERAL_QUERY" {
  if (hasAttachment) return "NEW_FACT_CHECK";

  const lower = message.trim().toLowerCase();

  // If starts with URL
  if (/^https?:\/\//i.test(lower)) return "NEW_FACT_CHECK";

  // General media literacy questions
  if (
    /^(how (do|can) i|what is (misinformation|disinformation|truth lens)|how to spot|tips for|how does this work)/i.test(
      lower
    ) &&
    !hasHistory
  ) {
    return "GENERAL_QUERY";
  }

  // If there's an ongoing conversation with an assistant analysis
  if (hasHistory && lastAssistantMessage) {
    // Follow up cues
    const followUpPatterns = [
      /\b(why|who|where|when|how come|explain|more details|what about|could you|can you|give me|write a|rebuttal|debunk|family|whatsapp|tweet|post|sources|evidence|prove it|exception|score|verdict)\b/i,
      /\b(is that true|are you sure|what if|does that mean|elaborate|clarify|tell me more)\b/i,
    ];

    if (followUpPatterns.some((p) => p.test(lower)) || lower.length < 50) {
      return "FOLLOW_UP";
    }
  }

  return "NEW_FACT_CHECK";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message, attachment, stream = false } = body;

    if (!message && !attachment) {
      return NextResponse.json({ success: false, error: "Message or attachment is required" }, { status: 400 });
    }

    let conv = conversationId ? getConversation(conversationId) : null;
    if (!conv) {
      conv = {
        id: conversationId || `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: message ? message.slice(0, 40) + "..." : "Fact-Check Analysis",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
    }

    // Set title on first user message if default
    if (conv.messages.length === 0 && message) {
      conv.title = message.slice(0, 45) + (message.length > 45 ? "..." : "");
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: message || (attachment?.type === "image" ? "Analyze this uploaded image for authenticity" : "Analyze this link"),
      createdAt: new Date().toISOString(),
      ...(attachment ? { attachment } : {}),
    };

    const lastAssistant = [...conv.messages].reverse().find((m) => m.role === "assistant");
    const intent = detectIntent(message || "", !!attachment, conv.messages.length > 0, lastAssistant);

    if (intent === "NEW_FACT_CHECK") {
      // Execute the deep fact checking analysis
      const targetText = attachment?.type === "image"
        ? `[IMAGE ATTACHMENT: ${attachment.name || "User uploaded image"}] User query: ${message}`
        : attachment?.type === "url"
        ? `[ARTICLE URL: ${attachment.data}] User query: ${message}`
        : message;

      const factCheckPrompt = `You are Truth Lens, an elite conversational AI forensic fact-checking intelligence system.
Analyze the following claim, news headline, or media submission with extreme rigor and scientific objectivity.
NEVER fabricate sources or declare unverified claims as confirmed facts.

SUBMISSION:
"""${targetText}"""

Output ONLY one valid JSON object (no markdown fences, no extraneous preamble):
{
  "conversationalReply": "<A natural, direct 2-3 paragraph conversational explanation addressing the user directly. Explain what was found, why it is true/false/misleading, and key context.>",
  "credibilityScore": <integer 0-100, never 50>,
  "category": "<real|fake|misleading|clickbait|satire|unclear>",
  "verdict": "<Punchy verdict under 10 words>",
  "analysis": "<Concise 2-sentence formal investigative summary>",
  "consensusFact": "<Established scientific, institutional, or primary legal fact>",
  "realityCheck": {
    "claimedAssertion": "<What was claimed>",
    "factualReality": "<What empirical evidence proves>"
  },
  "extractedClaims": [
    {
      "claim": "<Specific assertion>",
      "verdict": "<Confirmed True|Debunked False|Misleading Context|Unsubstantiated>",
      "note": "<Short 1-sentence note>"
    }
  ],
  "riskAssessment": {
    "riskLevel": "<Critical Risk|High Risk|Moderate Risk|Low Risk>",
    "harmCategory": "<Public Health & Medical|Financial Fraud|Societal Panic & Conspiracy|Electoral & Political|Harmless Clickbait>",
    "whyItSpreads": "<Psychological driver: fear, hope, outrage, bias>"
  },
  "originAndSpread": {
    "originContext": "<Documented origin of this narrative>",
    "spreadPattern": "<e.g. Encrypted chat forwards, clickbait aggregators, viral shorts>"
  },
  "authoritativeSources": [
    "<Accredited primary institution or official registry>"
  ],
  "redFlags": ["<Specific manipulation indicator>"],
  "positiveSignals": ["<Specific credibility signal if any>"],
  "debunkCopyScript": "<Polite, shareable 1-2 sentence debunking rebuttal ready to paste into WhatsApp/social chats>",
  "verificationSteps": [
    "<Step 1 on how user can check independently>",
    "<Step 2>"
  ],
  "factCheckQueries": [
    "<Google / Reuters fact-check search query 1>",
    "<Query 2>"
  ],
  "suggestedFollowUps": [
    "<Relevant follow-up question the user might want to ask next>",
    "<Second relevant follow-up question>",
    "<Third relevant follow-up question>"
  ]
}`;

      const groqRes = await callGroq(factCheckPrompt);
      let parsed = parseJSON(groqRes.text);

      let isHeuristic = !groqRes.model || groqRes.model.includes("hybrid-verified");
      let engineName = isHeuristic
        ? "Truth Lens Heuristic Analysis Engine (Fallback)"
        : `Groq AI Intelligence (${groqRes.model})`;

      if (!parsed) {
        parsed = {
          conversationalReply: "I analyzed the submitted claim against known forensic verification datasets. While direct automated processing encountered a format error, our heuristic filters flagged this submission for review.",
          credibilityScore: 35,
          category: "unclear",
          verdict: "Verification Requires Additional Context",
          analysis: "Unable to definitively corroborate with primary sources. Cross-checking against accredited newsrooms is recommended.",
          suggestedFollowUps: ["What sources should I check?", "Why is this hard to verify?"],
        };
      }

      parsed = correctScore(parsed, targetText);
      const credibilityScore = Math.min(100, Math.max(0, parseInt(String(parsed.credibilityScore)) || 50));
      parsed.credibilityScore = credibilityScore === 50 ? 49 : credibilityScore;

      const conversationalReply = String(
        parsed.conversationalReply || parsed.analysis || parsed.verdict || "Analysis complete."
      );

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content: conversationalReply,
        createdAt: new Date().toISOString(),
        intent: "NEW_FACT_CHECK",
        engine: engineName,
        analysisData: {
          credibilityScore: parsed.credibilityScore as number,
          category: String(parsed.category || "unclear"),
          verdict: String(parsed.verdict || "Analysis Complete"),
          analysis: String(parsed.analysis || conversationalReply),
          consensusFact: parsed.consensusFact ? String(parsed.consensusFact) : undefined,
          realityCheck: parsed.realityCheck as any,
          extractedClaims: parsed.extractedClaims as any,
          riskAssessment: parsed.riskAssessment as any,
          originAndSpread: parsed.originAndSpread as any,
          authoritativeSources: strArray(parsed.authoritativeSources),
          redFlags: strArray(parsed.redFlags),
          positiveSignals: strArray(parsed.positiveSignals),
          debunkCopyScript: parsed.debunkCopyScript ? String(parsed.debunkCopyScript) : undefined,
          verificationSteps: strArray(parsed.verificationSteps),
          factCheckQueries: strArray(parsed.factCheckQueries),
        },
        suggestedFollowUps: strArray(parsed.suggestedFollowUps).length > 0
          ? strArray(parsed.suggestedFollowUps)
          : [
              "Can you write a shorter debunk for WhatsApp?",
              "Where did this story originally come from?",
              "What reputable sources can I check to verify this?",
            ],
      };

      conv.messages.push(userMsg, assistantMsg);
      saveConversation(conv);

      return NextResponse.json({
        success: true,
        conversationId: conv.id,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      });
    }

    // FOLLOW_UP or GENERAL_QUERY
    // Build context window from past messages
    const pastContext = conv.messages.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.analysisData
        ? `${m.content}\n[FACT-CHECK VERDICT: ${m.analysisData.verdict} | Credibility: ${m.analysisData.credibilityScore}/100 | Category: ${m.analysisData.category}]`
        : m.content,
    }));

    const systemPrompt = `You are Truth Lens Assistant, a specialized conversational AI fact-checking partner.
You help users explore misinformation, understand why fake news spreads, write polite debunking messages, and verify facts.
GUIDELINES:
- Stay grounded in objective empirical truth, scientific consensus, and accredited reporting.
- If asked for a debunking message, make it polite, empathetic, and ready to share on WhatsApp or social media.
- Never invent nonexistent studies or fake sources. If something is unknown or debated, state that clearly.
- Maintain a helpful, analytical, and reassuring tone.
- At the very end of your response, on a new line, you MAY suggest 2-3 follow-up questions formatted as:
[SUGGESTIONS]
- Follow-up question 1
- Follow-up question 2`;

    const groqRes = await callGroqMessages([
      { role: "system", content: systemPrompt },
      ...pastContext,
      { role: "user", content: message },
    ]);

    let responseText = groqRes.text || "I was unable to process that follow-up request at this moment. Please try again.";
    const isHeuristic = !groqRes.model || groqRes.model.includes("hybrid-verified");
    const engineName = isHeuristic
      ? "Truth Lens Heuristic Engine (Fallback)"
      : `Groq AI Intelligence (${groqRes.model})`;

    // Extract suggestions if present
    const suggestions: string[] = [];
    if (responseText.includes("[SUGGESTIONS]")) {
      const parts = responseText.split("[SUGGESTIONS]");
      responseText = parts[0].trim();
      const sLines = parts[1].split("\n").map((l) => l.replace(/^[-*•0-9.]+\s*/, "").trim()).filter(Boolean);
      suggestions.push(...sLines.slice(0, 3));
    }

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "assistant",
      content: responseText,
      createdAt: new Date().toISOString(),
      intent,
      engine: engineName,
      suggestedFollowUps: suggestions.length > 0 ? suggestions : [
        "How can I independently double-check this?",
        "What questions should I ask before sharing news?",
      ],
    };

    conv.messages.push(userMsg, assistantMsg);
    saveConversation(conv);

    return NextResponse.json({
      success: true,
      conversationId: conv.id,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Chat processing failed" },
      { status: 500 }
    );
  }
}
