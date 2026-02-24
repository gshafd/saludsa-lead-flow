import { Lead, QualLevel, ScoreBreakdown, LeadSource } from "./types";

export const SOURCE_SCORES: Record<LeadSource, number> = {
  "Website Form": 20,
  "WhatsApp Inbound": 18,
  "Broker Referral": 25,
  "Call Center": 15,
  "Trade Show": 8,
  "LinkedIn": 10,
};

export const SCORING_WEIGHTS = {
  companySize: { max: 30, description: "Company Size (max 30): clamp(employees / 100, 0, 1) × 30" },
  source: { description: "Lead Source (8–25): varies by channel" },
  engagement: { max: 30, description: "Engagement (max 30): chats×5 + emails×4 + calls×6" },
  intent: { value: 15, description: "Intent Signal (0 or 15): requested quote/pricing" },
  recency: { value: 5, description: "Recency Bonus (0 or 5): contacted within 24 h" },
};

export function calculateScore(
  lead: Pick<Lead, "companySize" | "source" | "chatInteractions" | "emailResponses" | "callsCount" | "requestedQuote" | "lastContactedAt">
): ScoreBreakdown {
  const companySizeScore = Math.round(Math.min(lead.companySize / 100, 1) * 30);
  const sourceScore = SOURCE_SCORES[lead.source as LeadSource] ?? 10;
  const rawEngagement = lead.chatInteractions * 5 + lead.emailResponses * 4 + lead.callsCount * 6;
  const engagementScore = Math.min(Math.round(rawEngagement), 30);
  const intentScore = lead.requestedQuote ? 15 : 0;

  let recencyBonus = 0;
  if (lead.lastContactedAt) {
    const hours = (Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60);
    recencyBonus = hours <= 24 ? 5 : 0;
  }

  const total = Math.round(Math.min(companySizeScore + sourceScore + engagementScore + intentScore + recencyBonus, 100));

  return { companySizeScore, sourceScore, engagementScore, intentScore, recencyBonus, total };
}

export function qualLevel(score: number): QualLevel {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function getScoreExplanations(
  breakdown: ScoreBreakdown,
  lead: Pick<Lead, "companySize" | "source" | "chatInteractions" | "emailResponses" | "callsCount" | "requestedQuote" | "lastContactedAt">
) {
  return [
    {
      label: "Company Size",
      value: breakdown.companySizeScore,
      explanation: `${lead.companySize} emp. → ${lead.companySize >= 100 ? "enterprise" : lead.companySize >= 50 ? "mid-market" : "small business"} signal`,
    },
    {
      label: "Lead Source",
      value: breakdown.sourceScore,
      explanation: `${lead.source} channel weight`,
    },
    {
      label: "Engagement",
      value: breakdown.engagementScore,
      explanation: `${lead.chatInteractions} chats · ${lead.emailResponses} emails · ${lead.callsCount} calls`,
    },
    {
      label: "Intent Signal",
      value: breakdown.intentScore,
      explanation: lead.requestedQuote ? "Requested quote/pricing" : "No quote request yet",
    },
    {
      label: "Recency Bonus",
      value: breakdown.recencyBonus,
      explanation: breakdown.recencyBonus > 0 ? "Contacted within 24 h" : "No recent contact",
    },
  ];
}

export function topDriversSummary(
  breakdown: ScoreBreakdown,
  lead: Pick<Lead, "companySize" | "source" | "chatInteractions" | "emailResponses" | "callsCount" | "requestedQuote" | "lastContactedAt">
): string {
  const items = getScoreExplanations(breakdown, lead)
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  return items.map((i) => `${i.label} (+${i.value}): ${i.explanation}`).join(". ") + ".";
}
