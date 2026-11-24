import { NextRequest, NextResponse } from "next/server";
import { callGroq, parseJSON, strArray } from "@/lib/groq";
import { addHistory } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { sources } = await req.json();
    if (!sources || sources.length < 2) {
      return NextResponse.json({ success: false, error: "At least 2 sources required" }, { status: 400 });
    }

    const formatted = (sources as string[]).map((s, i) => `SOURCE ${i + 1}:\n${s.substring(0, 1000)}`).join("\n\n");

    const prompt = `Compare these ${sources.length} news sources/reports about the same topic and assess consistency and credibility:

${formatted}

Respond ONLY with this JSON:
{
  "consistencyScore": <0-100>,
  "verdict": "<one sentence>",
  "analysis": "<4-5 sentences>",
  "agreements": ["<point>"],
  "disagreements": ["<conflict>"],
  "mostReliableSource": "<source and why>",
  "leastReliableSource": "<source and why>",
  "biasComparison": ["<difference>"],
  "factualConsistency": {
    "consistentFacts": ["<fact>"],
    "conflictingFacts": ["<fact>"],
    "uniqueClaims": ["<claim>"]
  },
  "narrativeDifferences": ["<difference>"],
  "recommendations": ["<advice>"],
  "truthLikelihood": "<assessment>"
}`;

    const result = await callGroq(prompt);
    let data = parseJSON(result.text);
    if (!data) {
      return NextResponse.json({ success: false, error: "AI returned unreadable response." }, { status: 502 });
    }

    data.consistencyScore = Math.min(100, Math.max(0, parseInt(String(data.consistencyScore)) || 50));
    data.category = "unclear";
    ["agreements", "disagreements", "biasComparison", "narrativeDifferences", "recommendations"].forEach((k) => {
      data![k] = strArray(data![k]);
    });
    const fc = (data.factualConsistency as Record<string, unknown>) || {};
    ["consistentFacts", "conflictingFacts", "uniqueClaims"].forEach((k) => {
      fc[k] = strArray(fc[k]);
    });
    data.factualConsistency = fc;

    const saved = addHistory({
      type: "compare",
      inputPreview: sources[0].substring(0, 160),
      credibilityScore: data.consistencyScore as number,
      category: "unclear",
      verdict: (data.verdict as string) || "Source Comparison Complete",
      analysis: (data.analysis as string) || "",
      redFlags: (data.disagreements as string[]) || [],
      positiveSignals: (data.agreements as string[]) || [],
      full_result: data,
    });

    return NextResponse.json({ success: true, data: { ...data, _id: saved._id }, model: result.model });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Comparison failed" }, { status: 500 });
  }
}
