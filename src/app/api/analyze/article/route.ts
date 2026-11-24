import { NextRequest, NextResponse } from "next/server";
import { callGroq, parseJSON, strArray, correctScore } from "@/lib/groq";
import { addHistory } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { url, content } = await req.json();
    if (!url || !content) {
      return NextResponse.json({ success: false, error: "URL and content required" }, { status: 400 });
    }

    const domain = (() => {
      try {
        return new URL(url).hostname.replace("www.", "");
      } catch {
        return url;
      }
    })();

    const prompt = `You are a senior journalist and media literacy expert with extensive fact-checking experience.

Analyze this article for credibility, bias, and journalistic standards.

Domain: ${domain}
Article Content:
"""${content.substring(0, 3500)}"""

SCORING: 0-20=fabricated, 21-40=misleading, 41-55=unclear, 56-75=mostly credible, 76-100=highly credible
NEVER default to exactly 50.

Respond ONLY with this JSON:
{
  "credibilityScore": <integer 0-100>,
  "category": "<real|fake|misleading|clickbait|satire|unclear>",
  "verdict": "<one sentence>",
  "analysis": "<5-6 sentences>",
  "sourceAssessment": {
    "domain": "${domain}",
    "domainType": "<mainstream-news|independent-news|tabloid|satire|blog|government|academic|unknown>",
    "knownBias": "<left|center-left|center|center-right|right|unknown>",
    "reliabilityRating": "<high|medium|low|unknown>",
    "notes": "<notes>"
  },
  "redFlags": ["<flag>"],
  "positiveSignals": ["<signal>"],
  "journalisticStandards": {
    "hasAuthor": false,
    "hasDate": false,
    "hasSources": false,
    "hasQuotes": false,
    "editorialStandards": "<professional|mixed|poor>"
  },
  "specificClaims": ["<claim>"],
  "claimAccuracy": ["<assessment>"],
  "biasIndicators": ["<indicator>"],
  "verificationSteps": ["<step>"],
  "suggestions": ["<advice>"],
  "relatedCredibleSources": ["<source>"]
}`;

    const result = await callGroq(prompt);
    let data = parseJSON(result.text);
    if (!data) {
      return NextResponse.json({ success: false, error: "AI returned unreadable response." }, { status: 502 });
    }

    data.credibilityScore = Math.min(100, Math.max(0, parseInt(String(data.credibilityScore)) || 50));
    ["redFlags", "positiveSignals", "specificClaims", "claimAccuracy", "biasIndicators", "verificationSteps", "suggestions", "relatedCredibleSources"].forEach((k) => {
      data![k] = strArray(data![k]);
    });
    data = correctScore(data, content);

    if (!data.authoritativeSources && data.relatedCredibleSources) {
      data.authoritativeSources = data.relatedCredibleSources;
    }
    if (!data.realityCheck && data.verdict) {
      data.realityCheck = {
        claimedAssertion: strArray(data.specificClaims)[0] || `Reported by ${domain}`,
        factualReality: String(data.analysis || data.verdict),
      };
    }
    if (!data.riskAssessment) {
      data.riskAssessment = {
        riskLevel: Number(data.credibilityScore) < 30 ? "High Risk" : Number(data.credibilityScore) < 60 ? "Moderate Risk" : "Low Risk",
        harmCategory: "Digital Journalism & Editorial Integrity",
        whyItSpreads: "Amplified through headlines, algorithmic feeds, and social bookmarking.",
      };
    }
    if (!data.originAndSpread) {
      data.originAndSpread = {
        originContext: domain,
        spreadPattern: "Web publishing, syndication networks, search discovery",
      };
    }
    if (!data.debunkCopyScript) {
      data.debunkCopyScript = `Regarding the article on ${domain}: An independent journalistic assessment indicates ${Number(data.credibilityScore) < 50 ? "significant credibility concerns and bias" : "satisfactory journalistic standards"}. Summary: ${String(data.analysis || "").slice(0, 160)}.`;
    }

    const saved = addHistory({
      type: "article",
      inputPreview: url,
      credibilityScore: data.credibilityScore as number,
      category: data.category as string,
      verdict: (data.verdict as string) || "Article Analysis Complete",
      analysis: (data.analysis as string) || "",
      redFlags: data.redFlags as string[],
      positiveSignals: data.positiveSignals as string[],
      verificationSteps: data.verificationSteps as string[],
      suggestions: data.suggestions as string[],
      full_result: data,
    });

    return NextResponse.json({ success: true, data: { ...data, _id: saved._id }, model: result.model });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Article analysis failed" }, { status: 500 });
  }
}
