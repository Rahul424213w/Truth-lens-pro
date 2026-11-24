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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  attachment?: {
    type: "image" | "url";
    data: string;
    name?: string;
  };
  analysisData?: any;
  intent?: "NEW_FACT_CHECK" | "FOLLOW_UP" | "GENERAL_QUERY";
  engine?: string;
  suggestedFollowUps?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

// Global cache across API invocations in Next.js dev/serverless
declare global {
  var __TRUTH_LENS_HISTORY__: AnalysisRecord[] | undefined;
  var __TRUTH_LENS_CONVERSATIONS__: ChatConversation[] | undefined;
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

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: "conv-welcome",
    title: "Coffee Cancer Cure Verification",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Is it true that drinking 3 cups of coffee daily cures cancer and replaces chemotherapy?",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "No, this claim is dangerous medical misinformation. No clinical trial or peer-reviewed oncology study supports coffee as a cure for cancer or a substitute for chemotherapy. While moderate coffee consumption has mild antioxidant properties, attributing curative power to it contradicts established medical consensus and poses severe risk if patients delay evidence-based treatments.",
        createdAt: new Date(Date.now() - 3600000 * 2 + 1000).toISOString(),
        intent: "NEW_FACT_CHECK",
        engine: "Groq LLM (openai/gpt-oss-120b)",
        suggestedFollowUps: [
          "Can you write a 1-sentence polite debunk for WhatsApp?",
          "Where did this coffee cure rumor originate?",
          "Are there any proven health benefits of coffee?",
        ],
        analysisData: {
          credibilityScore: 5,
          category: "fake",
          verdict: "No Cure: Coffee Does Not Replace Cancer Therapy",
          analysis: "Extensive clinical reviews by the World Health Organization and National Cancer Institute refute claims that coffee can treat or reverse malignant tumors.",
          consensusFact: "Standard oncological protocols require verified surgery, chemotherapy, radiation, or targeted immunotherapy. Dietary beverages cannot eliminate malignant neoplasms.",
          realityCheck: {
            claimedAssertion: "Drinking 3 cups of coffee daily completely cures cancer and eliminates the need for chemotherapy.",
            factualReality: "Coffee contains antioxidants but has no curative impact on active cancer; delaying chemotherapy for coffee is life-threatening.",
          },
          extractedClaims: [
            {
              claim: "Coffee cures all stages of cancer",
              verdict: "Debunked False",
              note: "Zero clinical trials corroborate any curative effect.",
            },
            {
              claim: "Eliminates need for chemotherapy",
              verdict: "Debunked False",
              note: "Severe medical hazard if evidence-based therapy is postponed.",
            },
          ],
          riskAssessment: {
            riskLevel: "Critical Risk",
            harmCategory: "Public Health & Medical Misinformation",
            whyItSpreads: "Preys on emotional vulnerability and fear of chemotherapy side effects.",
          },
          originAndSpread: {
            originContext: "Viral health-clickbait blogs recycled on social messaging forwards.",
            spreadPattern: "Encrypted messaging chains and sensational social media video clips.",
          },
          authoritativeSources: [
            "World Health Organization (WHO)",
            "National Cancer Institute (NCI)",
            "American Cancer Society",
          ],
          redFlags: [
            "Promises a universal 'miracle cure' without clinical trial data",
            "Urges patients to reject standard medical therapy",
            "Sensationalist certainty language with no named oncologist",
          ],
          positiveSignals: [],
          debunkCopyScript: "Fact-check: Coffee does not cure cancer or replace chemotherapy. Medical consensus and the National Cancer Institute confirm standard treatments must not be delayed.",
          factCheckQueries: [
            "coffee cures cancer fact check",
            "coffee replace chemotherapy debunked",
          ],
        },
      },
      {
        id: "msg-3",
        role: "user",
        content: "Can you write a short polite message I can forward to my family WhatsApp group to debunk it?",
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: "msg-4",
        role: "assistant",
        content: "Here is a gentle, polite response you can copy and paste directly into your family group chat:\n\n> *\"Hi family! Just a quick heads-up on the message going around about coffee curing cancer — major health organizations like the National Cancer Institute and WHO have confirmed this is false. While coffee is fine to drink in moderation, it cannot cure cancer or replace medical treatment. Let's make sure anyone undergoing therapy checks with their doctor first! ❤️\"*\n\nThis format avoids calling anyone out directly while protecting vulnerable relatives.",
        createdAt: new Date(Date.now() - 3600000 * 1 + 1000).toISOString(),
        intent: "FOLLOW_UP",
        engine: "Groq LLM (openai/gpt-oss-120b)",
        suggestedFollowUps: [
          "What questions should I ask before sharing health news?",
          "How can I spot other miracle health cure hoaxes?",
        ],
      },
    ],
  },
];

if (!global.__TRUTH_LENS_CONVERSATIONS__) {
  global.__TRUTH_LENS_CONVERSATIONS__ = [...INITIAL_CONVERSATIONS];
}

export function getConversations(): ChatConversation[] {
  return global.__TRUTH_LENS_CONVERSATIONS__ || [];
}

export function getConversation(id: string): ChatConversation | null {
  const all = getConversations();
  return all.find((c) => c.id === id) || null;
}

export function saveConversation(conv: ChatConversation): ChatConversation {
  if (!global.__TRUTH_LENS_CONVERSATIONS__) {
    global.__TRUTH_LENS_CONVERSATIONS__ = [];
  }
  const idx = global.__TRUTH_LENS_CONVERSATIONS__.findIndex((c) => c.id === conv.id);
  conv.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    global.__TRUTH_LENS_CONVERSATIONS__[idx] = conv;
  } else {
    global.__TRUTH_LENS_CONVERSATIONS__.unshift(conv);
  }
  return conv;
}

export function deleteConversation(id: string): boolean {
  if (!global.__TRUTH_LENS_CONVERSATIONS__) return false;
  const initialLen = global.__TRUTH_LENS_CONVERSATIONS__.length;
  global.__TRUTH_LENS_CONVERSATIONS__ = global.__TRUTH_LENS_CONVERSATIONS__.filter((c) => c.id !== id);
  return global.__TRUTH_LENS_CONVERSATIONS__.length < initialLen;
}

export function clearAllConversations(): void {
  global.__TRUTH_LENS_CONVERSATIONS__ = [];
}
