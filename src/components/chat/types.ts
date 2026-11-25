export interface ExtractedClaim {
  claim: string;
  verdict: string;
  note: string;
}

export interface AnalysisData {
  credibilityScore: number;
  category:
    | "real"
    | "fake"
    | "misleading"
    | "clickbait"
    | "satire"
    | "unclear"
    | string;
  verdict: string;
  analysis: string;
  consensusFact?: string;
  realityCheck?: {
    claimedAssertion: string;
    factualReality: string;
  };
  extractedClaims?: ExtractedClaim[];
  riskAssessment?: {
    riskLevel?: string;
    harmCategory?: string;
    whyItSpreads?: string;
  };
  originAndSpread?: {
    originContext?: string;
    spreadPattern?: string;
  };
  authoritativeSources?: string[];
  redFlags?: string[];
  positiveSignals?: string[];
  debunkCopyScript?: string;
  verificationSteps?: string[];
  factCheckQueries?: string[];
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
  analysisData?: AnalysisData;
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
