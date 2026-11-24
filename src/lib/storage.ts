// Shared in-memory and local persistent store for Truth Lens analyses

export interface AnalysisRecord {
  _id: string;
  userId?: string;
  type: string;
  inputPreview: string;
  credibilityScore: number;
  category: string;
  verdict: string;
  analysis: string;
  redFlags?: string[];
  positiveSignals?: string[];
  verificationSteps?: string[];
  suggestions?: string[];
  specificClaims?: string[];
  claimVerdict?: string[];
  technicalAnalysis?: Record<string, string>;
  manipulationSigns?: string[];
  authenticitySignals?: string[];
  aiGenerationIndicators?: string[];
  full_result?: any;
  createdAt: string;
}

// Global cache across API invocations in Next.js dev/serverless
declare global {
  var __TRUTH_LENS_HISTORY__: AnalysisRecord[] | undefined;
}

const INITIAL_HISTORY: AnalysisRecord[] = [
  {
    _id: "demo-1",
    userId: "guest",
    type: "text",
    inputPreview: "Scientists confirm drinking coffee cures all known diseases and replaces medical therapy",
    credibilityScore: 8,
    category: "fake",
    verdict: "Completely False & Fabricated",
    analysis: "There is no credible peer-reviewed medical publication supporting this claim. While moderate coffee consumption has minor antioxidant benefits, claiming it cures all disease is dangerous medical misinformation.",
    redFlags: ["Absolute claims ('cures all')", "No peer-reviewed citation", "Contradicts scientific consensus"],
    positiveSignals: [],
    verificationSteps: ["Check WHO guidelines", "Search PubMed for clinical trials", "Consult licensed healthcare providers"],
    suggestions: ["Be skeptical of miracle cure claims", "Look for peer-reviewed citations"],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    _id: "demo-2",
    userId: "guest",
    type: "article",
    inputPreview: "https://who.int/news/item/malaria-progress-report-2024",
    credibilityScore: 92,
    category: "real",
    verdict: "Highly Credible & Verified Source",
    analysis: "Official release from the World Health Organization with verified statistical data, direct author attribution, methodology disclosure, and transparent peer references.",
    redFlags: [],
    positiveSignals: ["Institutional domain (.int)", "Transparent methodology", "Consistent with global health metrics"],
    verificationSteps: ["Cross-reference with CDC statistics", "Review methodology section"],
    suggestions: ["Primary source confirmed authentic"],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    _id: "demo-3",
    userId: "guest",
    type: "factcheck",
    inputPreview: "Did NASA hide a secret fleet of interstellar ships near Saturn?",
    credibilityScore: 12,
    category: "fake",
    verdict: "Debunked Conspiracy Theory",
    analysis: "This claim originates from unverified tabloid and sensationalist video channels repurposing standard Cassini imaging artifacts and compression noise.",
    redFlags: ["Sensationalist clickbait origin", "Zero astronomical confirmation", "Cassini raw data refutes claim"],
    positiveSignals: [],
    verificationSteps: ["Examine NASA Cassini mission public raw archives", "Review peer-reviewed planetary astronomy releases"],
    suggestions: ["Check amateur astronomy community logs"],
    createdAt: new Date(Date.now() - 3600000 * 42).toISOString(),
  },
  {
    _id: "demo-4",
    userId: "guest",
    type: "text",
    inputPreview: "New economic policy expected to reduce average household tax burden by 15% next quarter",
    credibilityScore: 68,
    category: "misleading",
    verdict: "Partially Accurate, Substantially Overstated",
    analysis: "The draft bill proposes a 15% reduction on a specific bracket of corporate surcharges, not average household income taxes. Presenting it as a general tax cut misrepresents the actual policy scope.",
    redFlags: ["Cherry-picked policy numbers", "Broad generalization of targeted exemption"],
    positiveSignals: ["Based on real pending legislation", "Bill number verified in legislature"],
    verificationSteps: ["Read the official draft text in legislative database", "Compare nonpartisan budget office estimates"],
    suggestions: ["Wait for final parliamentary vote and schedule"],
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  }
];

if (!global.__TRUTH_LENS_HISTORY__) {
  global.__TRUTH_LENS_HISTORY__ = [...INITIAL_HISTORY];
}

export function getHistory(type?: string): AnalysisRecord[] {
  const all = global.__TRUTH_LENS_HISTORY__ || [];
  if (!type || type === "all") return all;
  return all.filter((item) => item.type === type);
}

export function addHistory(record: Omit<AnalysisRecord, "_id" | "createdAt">): AnalysisRecord {
  if (!global.__TRUTH_LENS_HISTORY__) {
    global.__TRUTH_LENS_HISTORY__ = [];
  }
  const created: AnalysisRecord = {
    ...record,
    _id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  global.__TRUTH_LENS_HISTORY__.unshift(created);
  return created;
}

export function getStats() {
  const all = global.__TRUTH_LENS_HISTORY__ || [];
  const total = all.length;
  const byTypeMap: Record<string, number> = {};
  const byCategoryMap: Record<string, number> = {};
  let totalScore = 0;

  all.forEach((item) => {
    byTypeMap[item.type] = (byTypeMap[item.type] || 0) + 1;
    byCategoryMap[item.category] = (byCategoryMap[item.category] || 0) + 1;
    totalScore += item.credibilityScore || 0;
  });

  const byType = Object.entries(byTypeMap).map(([type, count]) => ({ type, count }));
  const byCategory = Object.entries(byCategoryMap).map(([category, count]) => ({ category, count }));
  const avg = total > 0 ? Math.round(totalScore / total) : 0;

  return {
    totalAnalyses: total,
    averageCredibilityScore: avg,
    byType,
    byCategory,
  };
}

export const TRENDING_CHECKS = [
  {
    claim: "Viral video claims mobile towers cause localized magnetic anomalies in urban tap water",
    category: "fake",
    credibilityScore: 5,
    verdict: "Fabricated Viral Hoax",
    shares: "142K shares",
    source: "Social Video Platforms",
  },
  {
    claim: "New government education subsidy circular circulating on WhatsApp with urgent registration link",
    category: "misleading",
    credibilityScore: 32,
    verdict: "Phishing Scheme Masquerading as Official Circular",
    shares: "89K forwards",
    source: "Messaging Apps",
  },
  {
    claim: "Global meteorological coalition records third consecutive month of unprecedented oceanic temperatures",
    category: "real",
    credibilityScore: 94,
    verdict: "Confirmed by Multiple National Oceanic Agencies",
    shares: "56K shares",
    source: "Peer-reviewed Monitoring Network",
  },
  {
    claim: "Celebrity CEO secretly bought controlling voting shares in global electrical grid operator",
    category: "fake",
    credibilityScore: 11,
    verdict: "Unfounded Conspiracy Theory",
    shares: "34K shares",
    source: "Alternative Forum",
  },
  {
    claim: "Leaked memo alleges major soft drink manufacturer switching back to pure cane sugar nationwide",
    category: "clickbait",
    credibilityScore: 28,
    verdict: "Out-of-Context Packaging Test Exaggerated as Permanent National Shift",
    shares: "73K shares",
    source: "News Aggregator",
  },
  {
    claim: "Satirical newsletter piece regarding politician banning Mondays shared as genuine legislative draft",
    category: "satire",
    credibilityScore: 18,
    verdict: "Satirical Content Misunderstood as Real Policy",
    shares: "22K shares",
    source: "Humor Website",
  }
];
