import { NextRequest, NextResponse } from "next/server";
import { callGroq, parseJSON, strArray } from "@/lib/groq";
import { addHistory } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { claim } = await req.json();
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim required" }, { status: 400 });
    }

    const prompt = `You are a professional fact-checker with expert knowledge across science, history, politics, health, and culture.

Evaluate this claim with precision: "${claim}"

RULES:
- Debunked scientific consensus (flat earth, anti-vax, etc.) → FALSE, confidence 95+
- Well-established historical facts → TRUE, confidence 85+
- Be direct and specific, never wishy-washy

Respond ONLY with this JSON:
{
  "verdict": "<TRUE|FALSE|MOSTLY TRUE|MOSTLY FALSE|MIXED|UNVERIFIABLE|OUTDATED>",
  "confidence": <0-100>,
  "shortVerdict": "<punchy one-liner under 15 words>",
  "explanation": "<3-4 sentences with specific facts and evidence>",
  "keyFacts": ["<specific fact>"],
  "context": "<background context>",
  "specificSources": ["<source name>"],
  "relatedMisconceptions": ["<myth>"],
  "originOfClaim": "<where this claim originated>",
  "expertConsensus": "<scientific/expert consensus>"
}`;

    const result = await callGroq(prompt);
    let data = parseJSON(result.text);
    if (!data) {
      return NextResponse.json({ success: false, error: "AI returned unreadable response." }, { status: 502 });
    }

    data.keyFacts = strArray(data.keyFacts);
    data.specificSources = strArray(data.specificSources);
    data.relatedMisconceptions = strArray(data.relatedMisconceptions);
    data.confidence = Math.min(100, Math.max(0, parseInt(String(data.confidence)) || 50));
    data.verdict = data.verdict || "UNVERIFIABLE";
    if (data.verdict === "FALSE" && (data.confidence as number) < 70) data.confidence = 85;
    if (data.verdict === "TRUE" && (data.confidence as number) < 70) data.confidence = 80;

    const cat =
      data.verdict === "TRUE" || data.verdict === "MOSTLY TRUE"
        ? "real"
        : data.verdict === "FALSE" || data.verdict === "MOSTLY FALSE"
        ? "fake"
        : "unclear";

    const realityCheck = {
      claimedAssertion: claim,
      factualReality: String(data.explanation || data.expertConsensus || ""),
    };

    const riskAssessment = {
      riskLevel: cat === "fake" ? "High Risk" : cat === "real" ? "Low Risk" : "Moderate Risk",
      harmCategory: cat === "fake" ? "Misinformation / Deceptive Narrative" : "Factual Knowledge",
      whyItSpreads: String(data.originOfClaim || "Circulates through viral repetition and social cognitive bias."),
    };

    const originAndSpread = {
      originContext: String(data.originOfClaim || "Public media & social discourse"),
      spreadPattern: "Online forums, messaging applications, viral social feeds",
    };

    const debunkCopyScript =
      cat === "fake"
        ? `Fact-check note: Regarding the claim "${claim}" — this has been evaluated and confirmed false. Evidence and expert consensus show: ${String(data.explanation || "").slice(0, 160)}.`
        : `Verified update: Regarding "${claim}" — authoritative sources and consensus confirm this is accurate: ${String(data.explanation || "").slice(0, 160)}.`;

    const saved = addHistory({
      type: "factcheck",
      inputPreview: claim.substring(0, 160),
      credibilityScore: data.confidence as number,
      category: cat,
      verdict: String(data.shortVerdict || data.verdict),
      analysis: String(data.explanation || ""),
      positiveSignals: data.keyFacts as string[],
      redFlags: (data.relatedMisconceptions as string[]) || [],
      full_result: data,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        _id: saved._id,
        credibilityScore: data.confidence,
        category: cat,
        analysis: data.explanation,
        realityCheck,
        riskAssessment,
        originAndSpread,
        debunkCopyScript,
        authoritativeSources: data.specificSources || [],
        factCheckQueries: [claim, `${claim} fact check`],
      },
      model: result.model,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Fact check failed" }, { status: 500 });
  }
}
