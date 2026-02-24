import { Lead, QualLevel, ScoreBreakdown, LeadSource } from "./types";

export const SOURCE_SCORES: Record<LeadSource, number> = {
  "Website Form": 20,
  "WhatsApp Inbound": 18,
  "Broker Referral": 25,
  "Call Center": 15,
  "Trade Show": 8,
  "LinkedIn": 10,
  "Referral": 12,
};

// Individual-specific source scores (override for some)
const INDIVIDUAL_SOURCE_SCORES: Partial<Record<LeadSource, number>> = {
  "Website Form": 18,
  "Referral": 12,
};

export const SCORING_WEIGHTS = {
  companySize: { max: 30, description: "Company Size (max 30): clamp(employees / 100, 0, 1) × 30 — corporate only" },
  householdSize: { max: 10, description: "Household Size (max 10): clamp(household / 6, 0, 1) × 10 — individual only" },
  source: { description: "Lead Source (8–25): varies by channel" },
  engagement: { max: 30, description: "Engagement (max 30): chats×5 + emails×4 + calls×6" },
  intent: { value: 15, description: "Intent Signal (0 or 15): requested quote/pricing" },
  recency: { value: 5, description: "Recency Bonus (0 or 5): contacted within 24 h" },
  familyPlan: { value: 15, description: "Family Plan Interest (0 or 15): individual only" },
  decisionTimeline: { value: 10, description: "Decision Timeline < 30 days (0 or 10): individual only" },
};

export function isIndividual(lead: Pick<Lead, "companySize" | "segment">): boolean {
  return lead.segment === "individual" || (!lead.companySize || lead.companySize <= 1);
}

export function calculateScore(
  lead: Pick<Lead, "companySize" | "source" | "chatInteractions" | "emailResponses" | "callsCount" | "requestedQuote" | "lastContactedAt" | "segment" | "planInterest" | "householdSize" | "decisionTimeline">
): ScoreBreakdown {
  const individual = isIndividual(lead as any);

  let companySizeScore: number;
  if (individual) {
    // Use household size instead, max 10
    const hs = (lead as any).householdSize || 1;
    companySizeScore = Math.round(Math.min(hs / 6, 1) * 10);
  } else {
    companySizeScore = Math.round(Math.min(lead.companySize / 100, 1) * 30);
  }

  let sourceScore: number;
  if (individual && INDIVIDUAL_SOURCE_SCORES[lead.source as LeadSource] !== undefined) {
    sourceScore = INDIVIDUAL_SOURCE_SCORES[lead.source as LeadSource]!;
  } else {
    sourceScore = SOURCE_SCORES[lead.source as LeadSource] ?? 10;
  }

  const rawEngagement = lead.chatInteractions * 5 + lead.emailResponses * 4 + lead.callsCount * 6;
  const engagementScore = Math.min(Math.round(rawEngagement), 30);
  const intentScore = lead.requestedQuote ? 15 : 0;

  let recencyBonus = 0;
  if (lead.lastContactedAt) {
    const hours = (Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60);
    recencyBonus = hours <= 24 ? 5 : 0;
  }

  // Individual-only bonuses are folded into companySizeScore bucket for simplicity
  // but we'll add family plan and timeline as extra factors
  let extraIndividual = 0;
  if (individual) {
    const plan = (lead.planInterest || "").toLowerCase();
    if (plan.includes("family")) extraIndividual += 15;
    const timeline = (lead as any).decisionTimeline || "";
    if (timeline.includes("< 30") || timeline.includes("Under 30") || timeline.includes("Immediate") || timeline.includes("< 2 weeks")) {
      extraIndividual += 10;
    }
  }

  const total = Math.round(Math.min(companySizeScore + sourceScore + engagementScore + intentScore + recencyBonus + extraIndividual, 100));

  return { companySizeScore, sourceScore, engagementScore, intentScore, recencyBonus, total };
}

export function qualLevel(score: number): QualLevel {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function getScoreExplanations(
  breakdown: ScoreBreakdown,
  lead: Pick<Lead, "companySize" | "source" | "chatInteractions" | "emailResponses" | "callsCount" | "requestedQuote" | "lastContactedAt" | "segment" | "planInterest" | "householdSize" | "decisionTimeline">
) {
  const individual = isIndividual(lead as any);

  const factors: { label: string; value: number; explanation: string }[] = [];

  if (individual) {
    const hs = lead.householdSize || 1;
    factors.push({
      label: "Household Size",
      value: breakdown.companySizeScore,
      explanation: `${hs} person${hs > 1 ? "s" : ""} in household`,
    });
  } else {
    factors.push({
      label: "Company Size",
      value: breakdown.companySizeScore,
      explanation: `${lead.companySize} emp. → ${lead.companySize >= 100 ? "enterprise" : lead.companySize >= 50 ? "mid-market" : "small business"} signal`,
    });
  }

  factors.push({
    label: "Lead Source",
    value: breakdown.sourceScore,
    explanation: `${lead.source} channel weight`,
  });

  factors.push({
    label: "Engagement",
    value: breakdown.engagementScore,
    explanation: `${lead.chatInteractions} chats · ${lead.emailResponses} emails · ${lead.callsCount} calls`,
  });

  factors.push({
    label: "Intent Signal",
    value: breakdown.intentScore,
    explanation: lead.requestedQuote ? "Requested quote/pricing" : "No quote request yet",
  });

  factors.push({
    label: "Recency Bonus",
    value: breakdown.recencyBonus,
    explanation: breakdown.recencyBonus > 0 ? "Contacted within 24 h" : "No recent contact",
  });

  // Individual-specific factors
  if (individual) {
    const plan = (lead.planInterest || "").toLowerCase();
    const familyBonus = plan.includes("family") ? 15 : 0;
    if (familyBonus > 0) {
      factors.push({
        label: "Family Plan Interest",
        value: familyBonus,
        explanation: "Family plan requested",
      });
    }

    const timeline = lead.decisionTimeline || "";
    const timelineBonus = (timeline.includes("< 30") || timeline.includes("Under 30") || timeline.includes("Immediate") || timeline.includes("< 2 weeks")) ? 10 : 0;
    if (timelineBonus > 0) {
      factors.push({
        label: "Urgency Signal",
        value: timelineBonus,
        explanation: `Decision timeline: ${timeline}`,
      });
    }
  }

  return factors;
}

export function topDriversSummary(
  breakdown: ScoreBreakdown,
  lead: Pick<Lead, "companySize" | "source" | "chatInteractions" | "emailResponses" | "callsCount" | "requestedQuote" | "lastContactedAt" | "segment" | "planInterest" | "householdSize" | "decisionTimeline">
): string {
  const items = getScoreExplanations(breakdown, lead)
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  return items.map((i) => `${i.label} (+${i.value}): ${i.explanation}`).join(". ") + ".";
}
