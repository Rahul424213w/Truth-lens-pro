import { NextRequest, NextResponse } from "next/server";
import { callGroq, parseJSON, strArray, correctScore } from "@/lib/groq";
import { addHistory } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || text.length < 5) {
      return NextResponse.json(
        { success: false, error: "Please enter text or a claim to analyze." },
        { status: 400 }
      );
    }

    const prompt = `You are Truth Lens, an elite forensic misinformation intelligence system.
Analyze this submitted statement with deep domain knowledge, scientific consensus, and investigative rigor.

STATEMENT TO EVALUATE:
"""${text.substring(0, 3500)}"""

SCORING CRITERIA (0-100 scale, never output exactly 50):
- 0-15: Completely fabricated hoax, debunked conspiracy, lethal or dangerous falsehood.
- 16-35: Mostly false, critical distortion, manufactured evidence, unfounded rumors.
- 36-55: Misleading context, cherry-picked statistics, clickbait exaggeration.
- 56-75: Partially accurate, missing crucial context, unconfirmed developing details.
- 76-90: Credible, verified by established reporting or official records.
- 91-100: Fully verified scientific/institutional fact backed by primary documentation.

Reply with ONE valid JSON object only (strictly valid JSON, no markdown code fences, no extra text):
{
  "credibilityScore": <integer 0-100>,
  "category": "<real|fake|misleading|clickbait|satire|unclear>",
  "verdict": "<short punchy verdict under 10 words>",
  "analysis": "<2-3 concise sentences explaining the factual evaluation>",
  "consensusFact": "<clear 1-2 sentence statement of established scientific, legal, or institutional reality>",
  "realityCheck": {
    "claimedAssertion": "<what the submission claims happened>",
    "factualReality": "<what empirical evidence, data, or official records actually confirm>"
  },
  "extractedClaims": [
    {
      "claim": "<specific atomic claim>",
      "verdict": "<Confirmed True|Debunked False|Misleading Context|Unsubstantiated>",
      "note": "<concise 1-sentence explanation of why>"
    }
  ],
  "riskAssessment": {
    "riskLevel": "<Critical Risk|High Risk|Moderate Risk|Low Risk>",
    "harmCategory": "<Public Health & Medical|Financial Fraud|Societal Panic & Conspiracy|Electoral & Political|Harmless Clickbait>",
    "whyItSpreads": "<1 clear sentence explaining why users share this: fear, false hope, confirmation bias, outrage>"
  },
  "originAndSpread": {
    "originContext": "<where this narrative or rumor originated or was previously documented>",
    "spreadPattern": "<e.g. Encrypted messaging forwards / Clickbait aggregators / Fringe forums / Social media video hooks>"
  },
  "authoritativeSources": [
    "<accredited institution or primary database e.g. World Health Organization (WHO)>",
    "<second reputable authority e.g. National Cancer Institute / AP Fact Check>"
  ],
  "redFlags": [
    "<specific red flag identified e.g. Miracle cure claim without clinical trial / Absolute certainty language / Anonymous sourcing>"
  ],
  "positiveSignals": [
    "<specific positive marker e.g. Matches verified WHO epidemiological bulletin / Attribution to named lead researchers>"
  ],
  "biasDiagnostics": {
    "sensationalism": "<Low|Moderate|High>",
    "tone": "<Alarmist|Sensational|Manipulative|Matter-of-fact|Balanced>",
    "manipulationTechnique": "<None|False Causality|Cherry-Picking|Appeal to Fear|Conspiracy Framing|Out of Context Quote>"
  },
  "debunkCopyScript": "<concise, polite 2-sentence debunking script ready to copy-paste into family groups or social threads>",
  "verificationSteps": [
    "<actionable verification step 1>",
    "<actionable verification step 2>"
  ],
  "factCheckQueries": [
    "<exact query to search on Google Fact Check Tools / Reuters / AP>",
    "<second targeted search query>"
  ]
}`;

    const result = await callGroq(prompt);
    let data = parseJSON(result.text);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "The analysis engine returned an unreadable response. Please retry." },
        { status: 502 }
      );
    }

    data.credibilityScore = Math.min(100, Math.max(0, parseInt(String(data.credibilityScore)) || 50));
    if (data.credibilityScore === 50) data.credibilityScore = 49;
    data.category = (data.category as string) || "unclear";
    data.redFlags = strArray(data.redFlags);
    data.positiveSignals = strArray(data.positiveSignals);
    data.verificationSteps = strArray(data.verificationSteps);
    data.factCheckQueries = strArray(data.factCheckQueries);
    data.authoritativeSources = strArray(data.authoritativeSources);
    data = correctScore(data, text);

    const saved = addHistory({
      type: "text",
      inputPreview: text.substring(0, 160),
      credibilityScore: data.credibilityScore as number,
      category: data.category as string,
      verdict: String(data.verdict || "Analysis Complete"),
      analysis: String(data.analysis || ""),
      redFlags: data.redFlags as string[],
      positiveSignals: data.positiveSignals as string[],
      verificationSteps: data.verificationSteps as string[],
      full_result: data,
    });

    return NextResponse.json({
      success: true,
      data: { ...data, _id: saved._id },
      model: result.model,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Text analysis failed" },
      { status: 500 }
    );
  }
}
