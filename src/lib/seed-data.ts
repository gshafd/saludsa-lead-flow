import {
  Lead, Activity, Task, Conversation, ChatMessage, SalesRep,
  LeadSource, LeadStage, Channel,
} from "./types";
import { calculateScore, qualLevel } from "./scoring";

// ── Deterministic seeded RNG ──
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const rng = seededRng(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
};
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

// ── Reference lists ──
const CORP_FIRST_NAMES = [
  "Maria","Carlos","Lucia","Roberto","Sofia","Andres","Carmen","Diego",
  "Ana","Jose","Valentina","Fernando","Gabriela","Patricio","Daniela",
  "Miguel","Camila","Ricardo","Alejandra","Pablo","Isabella","Santiago",
  "Natalia","Eduardo","Lorena","Sebastian","Veronica","Francisco","Paola",
  "Javier","Andrea","Tomas","Monica","Luis","Carolina","Alvaro","Diana",
  "Manuel","Jessica","Hector","Adriana","Emilio","Sandra","Nicolas","Laura",
];
const CORP_LAST_NAMES = [
  "Gonzalez","Espinoza","Paredes","Villacis","Cevallos","Ramirez","Aguirre",
  "Moreno","Lopez","Herrera","Guzman","Mendoza","Ruiz","Castro","Suarez",
  "Cordova","Salazar","Vega","Ortiz","Delgado","Flores","Reyes","Jimenez",
  "Pena","Torres","Benitez","Sandoval","Vargas","Rojas","Zambrano",
];
const COMPANIES = [
  "TechCorp Ecuador","Grupo Financiero Andes","National Pharmaceuticals",
  "Quito Construction S.A.","Pacific Importers","Sierra Automotive",
  "Montecristi Textiles","Banana Export S.A.","Eastern Petroleum",
  "Costa Agriculture","Pacific Insurance","Loja Mining","Andes Telecom",
  "Valley Foods","Guayas Industrial","National Transport",
  "Renewable Energy EC","Software Solutions EC","Consulting Partners Quito",
  "Retail Group Ecuador","Integral Health","EC Higher Education",
  "Coastal Hospitality","Southern Commerce","Express Logistics",
  "National Real Estate","Digital Media Ecuador","Creative Agency EC",
  "Andean Labs","Southern Construction",
];
const REGIONS = ["Quito","Guayaquil","Cuenca","Ambato","Loja","Manta","Riobamba","Machala"];
const CORP_PLANS = [
  "Corporate Premium Plan","Corporate Standard Plan","Corporate Family Plan",
  "Corporate Plus Plan",
];
const INDIVIDUAL_PLANS = [
  "Individual Plan","Family Plan","Premium Individual",
  "Individual Basic","Family Plus",
];
const CORP_SOURCES: { src: LeadSource; weight: number }[] = [
  { src: "Website Form", weight: 40 },
  { src: "WhatsApp Inbound", weight: 20 },
  { src: "Broker Referral", weight: 15 },
  { src: "Call Center", weight: 15 },
  { src: "Trade Show", weight: 5 },
  { src: "LinkedIn", weight: 5 },
];
const INDIVIDUAL_SOURCES: { src: LeadSource; weight: number }[] = [
  { src: "Website Form", weight: 40 },
  { src: "WhatsApp Inbound", weight: 25 },
  { src: "Call Center", weight: 20 },
  { src: "Referral", weight: 15 },
];
const STAGES: LeadStage[] = ["New","Contacted","Qualified","Won"];
const CONSENT_METHODS = ["Web form opt-in","Verbal consent recorded","Email opt-in link","WhatsApp confirmation"];

function pickWeightedSource(sources: { src: LeadSource; weight: number }[]): LeadSource {
  const r = rng() * 100;
  let cum = 0;
  for (const s of sources) { cum += s.weight; if (r < cum) return s.src; }
  return sources[0].src;
}

// ── Sales Reps ──
export const salesReps: SalesRep[] = [
  { id: "REP-01", name: "Carlos Mendoza", region: "Quito", email: "c.mendoza@fdryze.com" },
  { id: "REP-02", name: "Ana Ruiz", region: "Guayaquil", email: "a.ruiz@fdryze.com" },
  { id: "REP-03", name: "Patricia Herrera", region: "Cuenca", email: "p.herrera@fdryze.com" },
  { id: "REP-04", name: "Marco Delgado", region: "Quito", email: "m.delgado@fdryze.com" },
  { id: "REP-05", name: "Silvia Flores", region: "Guayaquil", email: "s.flores@fdryze.com" },
  { id: "REP-06", name: "Tomas Vega", region: "Ambato", email: "t.vega@fdryze.com" },
  { id: "REP-07", name: "Lorena Cordova", region: "Manta", email: "l.cordova@fdryze.com" },
  { id: "REP-08", name: "Javier Suarez", region: "Loja", email: "j.suarez@fdryze.com" },
  { id: "REP-09", name: "Daniela Torres", region: "Riobamba", email: "d.torres@fdryze.com" },
  { id: "REP-10", name: "Eduardo Sandoval", region: "Machala", email: "e.sandoval@fdryze.com" },
];

// ── Time helpers ──
const NOW = new Date("2026-02-24T12:00:00");
function daysAgo(d: number) {
  const dt = new Date(NOW);
  dt.setDate(dt.getDate() - d);
  dt.setHours(randInt(7, 18), randInt(0, 59), 0, 0);
  return dt.toISOString();
}

// ── Generate 200 corporate leads ──
function generateCorporateLeads(): Lead[] {
  const result: Lead[] = [];
  const usedNames = new Set<string>();
  for (let i = 1; i <= 200; i++) {
    let name: string;
    do {
      name = `${pick(CORP_FIRST_NAMES)} ${pick(CORP_LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const company = pick(COMPANIES);
    const region = pick(REGIONS);
    const rep = pick(salesReps);
    const source = pickWeightedSource(CORP_SOURCES);
    const companySize = source === "Broker Referral" || source === "LinkedIn"
      ? randInt(30, 500)
      : randInt(5, 200);
    const stage = pick(STAGES);
    const createdDaysAgo = randInt(1, 90);
    const createdAt = daysAgo(createdDaysAgo);
    const contacted = stage !== "New";
    const lastContactedDaysAgo = contacted ? randInt(0, Math.min(createdDaysAgo, 14)) : 0;
    const lastContactedAt = contacted ? daysAgo(lastContactedDaysAgo) : "";
    const chatInteractions = randInt(0, 6);
    const emailResponses = randInt(0, 4);
    const callsCount = randInt(0, 3);
    const requestedQuote = rng() > 0.6;
    const consentStatus = rng() > 0.15 ? "granted" as const : rng() > 0.5 ? "pending" as const : "declined" as const;
    const planInterest = pick(CORP_PLANS);

    const partial: Parameters<typeof calculateScore>[0] = {
      companySize, source, chatInteractions, emailResponses, callsCount,
      requestedQuote, lastContactedAt, segment: "corporate", planInterest,
    };
    const breakdown = calculateScore(partial);

    const emailUser = name.toLowerCase().replace(/[^a-z ]/g, "").split(" ");
    const emailAddr = `${emailUser[0]}.${emailUser[1]}@${company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}.ec`;

    result.push({
      id: `LD-${String(i).padStart(3, "0")}`,
      name, company, email: emailAddr,
      phone: `+593 9${randInt(6, 9)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      source, planInterest, stage,
      qualScore: breakdown.total, qualLevel: qualLevel(breakdown.total),
      assignedTo: rep.name, region, companySize,
      createdAt, lastContactedAt, requestedQuote,
      chatInteractions, emailResponses, callsCount,
      consentStatus,
      consentTimestamp: consentStatus === "granted" ? createdAt : undefined,
      consentMethod: consentStatus === "granted" ? pick(CONSENT_METHODS) : undefined,
      scoreBreakdown: breakdown,
      segment: "corporate",
    });
  }
  return result;
}

// ── Generate 25 individual leads ──
interface IndividualSeed {
  name: string; plan: string; source: LeadSource; stage: LeadStage;
  householdSize: number; dependents: number; coverageLevel: string;
  budgetRange: string; decisionTimeline: string;
}

const INDIVIDUAL_SEEDS: IndividualSeed[] = [
  { name: "Emily Carter", plan: "Family Plan", source: "Website Form", stage: "Qualified", householdSize: 4, dependents: 2, coverageLevel: "Premium", budgetRange: "$200-$350/mo", decisionTimeline: "< 30 days" },
  { name: "James Rodriguez", plan: "Premium Individual", source: "WhatsApp Inbound", stage: "Contacted", householdSize: 1, dependents: 0, coverageLevel: "Premium", budgetRange: "$100-$150/mo", decisionTimeline: "< 30 days" },
  { name: "Olivia Chen", plan: "Family Plan", source: "Call Center", stage: "New", householdSize: 5, dependents: 3, coverageLevel: "Standard", budgetRange: "$150-$250/mo", decisionTimeline: "1-3 months" },
  { name: "Daniel Foster", plan: "Individual Basic", source: "Website Form", stage: "Contacted", householdSize: 1, dependents: 0, coverageLevel: "Basic", budgetRange: "$50-$80/mo", decisionTimeline: "1-3 months" },
  { name: "Sarah Mitchell", plan: "Family Plan", source: "Referral", stage: "Won", householdSize: 3, dependents: 1, coverageLevel: "Premium", budgetRange: "$250-$400/mo", decisionTimeline: "Immediate" },
  { name: "Michael Thompson", plan: "Individual Plan", source: "Website Form", stage: "New", householdSize: 1, dependents: 0, coverageLevel: "Standard", budgetRange: "$60-$100/mo", decisionTimeline: "Exploring" },
  { name: "Jessica Lee", plan: "Family Plus", source: "WhatsApp Inbound", stage: "Qualified", householdSize: 4, dependents: 2, coverageLevel: "Premium", budgetRange: "$300-$450/mo", decisionTimeline: "< 2 weeks" },
  { name: "David Nguyen", plan: "Premium Individual", source: "Website Form", stage: "Won", householdSize: 2, dependents: 0, coverageLevel: "Premium", budgetRange: "$120-$180/mo", decisionTimeline: "< 30 days" },
  { name: "Amanda Brooks", plan: "Family Plan", source: "Call Center", stage: "Contacted", householdSize: 5, dependents: 3, coverageLevel: "Standard", budgetRange: "$200-$300/mo", decisionTimeline: "1-3 months" },
  { name: "Christopher White", plan: "Individual Plan", source: "Website Form", stage: "Lost", householdSize: 1, dependents: 0, coverageLevel: "Basic", budgetRange: "$40-$60/mo", decisionTimeline: "Exploring" },
  { name: "Rachel Kim", plan: "Family Plan", source: "Referral", stage: "Qualified", householdSize: 3, dependents: 1, coverageLevel: "Premium", budgetRange: "$200-$350/mo", decisionTimeline: "< 30 days" },
  { name: "Andrew Martinez", plan: "Individual Basic", source: "WhatsApp Inbound", stage: "New", householdSize: 1, dependents: 0, coverageLevel: "Basic", budgetRange: "$50-$75/mo", decisionTimeline: "1-3 months" },
  { name: "Lauren Davis", plan: "Family Plus", source: "Website Form", stage: "Contacted", householdSize: 4, dependents: 2, coverageLevel: "Standard", budgetRange: "$180-$280/mo", decisionTimeline: "< 30 days" },
  { name: "Brian Wilson", plan: "Premium Individual", source: "Call Center", stage: "New", householdSize: 2, dependents: 1, coverageLevel: "Premium", budgetRange: "$130-$200/mo", decisionTimeline: "Exploring" },
  { name: "Megan Taylor", plan: "Family Plan", source: "Website Form", stage: "Lost", householdSize: 3, dependents: 1, coverageLevel: "Standard", budgetRange: "$150-$250/mo", decisionTimeline: "1-3 months" },
  { name: "Kevin Brown", plan: "Individual Plan", source: "WhatsApp Inbound", stage: "Contacted", householdSize: 1, dependents: 0, coverageLevel: "Standard", budgetRange: "$70-$110/mo", decisionTimeline: "< 30 days" },
  { name: "Stephanie Garcia", plan: "Family Plan", source: "Referral", stage: "Qualified", householdSize: 6, dependents: 4, coverageLevel: "Premium", budgetRange: "$350-$500/mo", decisionTimeline: "< 2 weeks" },
  { name: "Jason Clark", plan: "Individual Basic", source: "Website Form", stage: "New", householdSize: 1, dependents: 0, coverageLevel: "Basic", budgetRange: "$45-$70/mo", decisionTimeline: "Exploring" },
  { name: "Nicole Adams", plan: "Family Plus", source: "Call Center", stage: "Contacted", householdSize: 4, dependents: 2, coverageLevel: "Standard", budgetRange: "$200-$320/mo", decisionTimeline: "1-3 months" },
  { name: "Ryan Moore", plan: "Premium Individual", source: "Website Form", stage: "Qualified", householdSize: 1, dependents: 0, coverageLevel: "Premium", budgetRange: "$110-$160/mo", decisionTimeline: "< 30 days" },
  { name: "Ashley Johnson", plan: "Family Plan", source: "WhatsApp Inbound", stage: "New", householdSize: 5, dependents: 3, coverageLevel: "Standard", budgetRange: "$180-$300/mo", decisionTimeline: "1-3 months" },
  { name: "Matthew Harris", plan: "Individual Plan", source: "Website Form", stage: "Contacted", householdSize: 2, dependents: 1, coverageLevel: "Standard", budgetRange: "$80-$120/mo", decisionTimeline: "< 30 days" },
  { name: "Samantha Robinson", plan: "Family Plan", source: "Referral", stage: "Won", householdSize: 4, dependents: 2, coverageLevel: "Premium", budgetRange: "$280-$400/mo", decisionTimeline: "Immediate" },
  { name: "Tyler Evans", plan: "Individual Basic", source: "Call Center", stage: "Lost", householdSize: 1, dependents: 0, coverageLevel: "Basic", budgetRange: "$40-$60/mo", decisionTimeline: "Exploring" },
  { name: "Brittany Scott", plan: "Family Plus", source: "Website Form", stage: "Contacted", householdSize: 3, dependents: 1, coverageLevel: "Standard", budgetRange: "$170-$260/mo", decisionTimeline: "< 30 days" },
];

function generateIndividualLeads(startId: number): Lead[] {
  return INDIVIDUAL_SEEDS.map((seed, i) => {
    const id = `LD-${String(startId + i).padStart(3, "0")}`;
    const region = pick(REGIONS);
    const rep = pick(salesReps);
    const createdDaysAgo = randInt(1, 60);
    const createdAt = daysAgo(createdDaysAgo);
    const contacted = seed.stage !== "New";
    const lastContactedDaysAgo = contacted ? randInt(0, Math.min(createdDaysAgo, 10)) : 0;
    const lastContactedAt = contacted ? daysAgo(lastContactedDaysAgo) : "";
    const chatInteractions = randInt(0, 5);
    const emailResponses = randInt(0, 3);
    const callsCount = randInt(0, 2);
    const requestedQuote = rng() > 0.5;
    const consentStatus = rng() > 0.2 ? "granted" as const : "pending" as const;

    const partial: Parameters<typeof calculateScore>[0] = {
      companySize: 1, source: seed.source, chatInteractions, emailResponses, callsCount,
      requestedQuote, lastContactedAt, segment: "individual", planInterest: seed.plan,
      householdSize: seed.householdSize, decisionTimeline: seed.decisionTimeline,
    };
    const breakdown = calculateScore(partial);

    const emailUser = seed.name.toLowerCase().replace(/[^a-z ]/g, "").split(" ");
    const emailAddr = `${emailUser[0]}.${emailUser[1]}@gmail.com`;

    return {
      id, name: seed.name, company: "Individual", email: emailAddr,
      phone: `+593 9${randInt(6, 9)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      source: seed.source, planInterest: seed.plan, stage: seed.stage,
      qualScore: breakdown.total, qualLevel: qualLevel(breakdown.total),
      assignedTo: rep.name, region, companySize: 1,
      createdAt, lastContactedAt, requestedQuote,
      chatInteractions, emailResponses, callsCount,
      consentStatus,
      consentTimestamp: consentStatus === "granted" ? createdAt : undefined,
      consentMethod: consentStatus === "granted" ? pick(CONSENT_METHODS) : undefined,
      scoreBreakdown: breakdown,
      segment: "individual" as const,
      householdSize: seed.householdSize,
      dependents: seed.dependents,
      coverageLevel: seed.coverageLevel,
      budgetRange: seed.budgetRange,
      decisionTimeline: seed.decisionTimeline,
    };
  });
}

// ── Generate activities ──
const CORP_ACTIVITY_TEMPLATES: { type: Activity["type"]; titles: string[] }[] = [
  { type: "note", titles: ["Lead captured","Initial assessment","Research completed","Notes updated"] },
  { type: "call", titles: ["Outbound call","Follow-up call","Qualification call","Demo scheduling call"] },
  { type: "email", titles: ["Welcome email sent","Plan comparison sent","Follow-up email","Proposal sent"] },
  { type: "meeting", titles: ["Virtual presentation","In-person meeting","Product demo","Contract review"] },
  { type: "chat", titles: ["WhatsApp follow-up","Web chat inquiry","Chat qualification","Quick response"] },
  { type: "task", titles: ["Send proposal","Schedule demo","Prepare ROI analysis","Follow-up reminder"] },
];

const INDIVIDUAL_ACTIVITY_TEMPLATES: { type: Activity["type"]; titles: string[] }[] = [
  { type: "note", titles: ["Website form submitted for family plan","Premium estimate request noted","Coverage inquiry logged"] },
  { type: "call", titles: ["Scheduled phone call with advisor","Follow-up call about coverage","Advisor consultation call"] },
  { type: "email", titles: ["Monthly premium estimate sent","Plan comparison email","Coverage options email"] },
  { type: "chat", titles: ["WhatsApp conversation about pediatric coverage","Asked about maternity add-on","Requested monthly premium estimate","Chat about dental coverage"] },
  { type: "task", titles: ["Send family plan brochure","Schedule advisor callback","Prepare premium quote"] },
];

function generateActivities(leads: Lead[]): Activity[] {
  const result: Activity[] = [];
  let id = 1;
  for (const lead of leads) {
    const count = randInt(2, 10);
    const created = new Date(lead.createdAt);
    const templates = lead.segment === "individual" ? INDIVIDUAL_ACTIVITY_TEMPLATES : CORP_ACTIVITY_TEMPLATES;
    for (let j = 0; j < count; j++) {
      const tmpl = pick(templates);
      const dayOffset = randInt(0, Math.max(1, Math.floor((NOW.getTime() - created.getTime()) / 86400000)));
      const actDate = new Date(created);
      actDate.setDate(actDate.getDate() + dayOffset);
      actDate.setHours(randInt(8, 17), randInt(0, 59));
      const companyLabel = lead.segment === "individual" ? "" : ` at ${lead.company}`;
      result.push({
        id: `A${id++}`,
        leadId: lead.id,
        type: tmpl.type,
        title: pick(tmpl.titles),
        description: `${pick(tmpl.titles)} for ${lead.name}${companyLabel}.`,
        date: actDate.toISOString(),
        completed: tmpl.type === "task" ? rng() > 0.5 : undefined,
        actor: lead.assignedTo,
      });
    }
  }
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── Generate tasks ──
function generateTasks(leads: Lead[]): Task[] {
  const taskTypes: Task["type"][] = ["call","email","meeting"];
  const taskTitles = [
    "Send proposal document","Follow-up call","Schedule product demo",
    "Send referral info","Prepare quote","Contract review",
    "Send pricing comparison","Follow-up on coverage questions",
  ];
  const result: Task[] = [];
  const subset = pickN(leads.filter(l => l.stage !== "Won" && l.stage !== "Lost"), 20);
  let id = 1;
  for (const lead of subset) {
    const due = new Date(NOW);
    due.setDate(due.getDate() + randInt(-2, 5));
    result.push({
      id: `T${id++}`,
      leadId: lead.id,
      leadName: lead.name,
      title: pick(taskTitles),
      dueDate: due.toISOString().slice(0, 10),
      completed: rng() > 0.7,
      type: pick(taskTypes),
    });
  }
  return result;
}

// ── Generate conversations (English) ──
const CORP_MSG_TEMPLATES: string[][] = [
  [
    "Hi! I'm {agent} from FDRYZE. We received your inquiry about our {plan}. Do you have a few minutes to chat?",
    "Hello! Yes, of course. We're looking for a health plan for our employees.",
    "Great. The {plan} includes full medical coverage, dental, and access to our specialist network. Are you interested in international coverage?",
    "Yes, we have employees who travel frequently. What coverage do you offer abroad?",
    "The plan includes international emergency coverage up to $500,000. I'll send you the details by email.",
    "That sounds great. Can we schedule a meeting with our HR director?",
  ],
  [
    "Good morning, I'm reaching out from FDRYZE regarding the quote you requested.",
    "Good morning, yes, I need information for my company of {size} employees.",
    "We have very competitive corporate options. What coverage do you need as a priority?",
    "We need dental and maternity coverage as mandatory benefits.",
    "Both are included in our Corporate Plan. I'll prepare a customized proposal for you.",
    "Perfect, I'll be waiting. My email is {email}.",
  ],
];

const INDIVIDUAL_MSG_TEMPLATES: string[][] = [
  [
    "Hi! I'm {agent} from FDRYZE. I see you submitted a form about our family plans. How can I help?",
    "Hello! Yes, I'm looking for coverage for my family of 4.",
    "Great choice! Our Family Plan covers up to 6 members. What's your main priority — pediatric care, maternity, or general coverage?",
    "Pediatric care is our top priority. We have two young kids.",
    "Our Family Plan includes full pediatric coverage including preventive care. Would you like a premium estimate?",
    "Yes please! What would the monthly cost be approximately?",
    "For a family of 4 with premium pediatric coverage, plans start at $220/month. I'll send you a detailed quote.",
    "That's within our budget. Can we schedule a call to finalize?",
  ],
  [
    "Hello! Thanks for reaching out on WhatsApp. I'm {agent}, your health plan advisor.",
    "Hi! I need an individual health plan. I'm self-employed and currently uninsured.",
    "I understand. We have plans starting from $55/month. Do you need dental and vision coverage?",
    "Yes, dental for sure. Vision would be nice too.",
    "Our Premium Individual plan includes both. Can I ask about your budget range?",
    "I'm thinking around $100-150 per month.",
    "Perfect, that fits our Premium Individual plan. I'll prepare your pricing quote right away.",
  ],
  [
    "Hi there! I noticed you were browsing our family plan options on the website.",
    "Yes, I'm interested in the maternity add-on. Is that available?",
    "Absolutely! Our maternity coverage includes prenatal, delivery, and postnatal care. How soon do you need coverage?",
    "We're planning to start a family soon, so within the next couple of months.",
    "I'd recommend our Family Plus plan with the maternity benefit. Would you like me to send you the details?",
    "Yes, that would be great. Also, does it cover pediatric care for the newborn?",
    "Yes, the newborn is automatically covered from birth. I'll email you the full breakdown.",
  ],
];

const CORP_EMAIL_TEMPLATE: string[][] = [
  [
    "Subject: Corporate Health Plan Inquiry — 85 employees\n\nDear FDRYZE team,\n\nI'm reaching out to explore corporate health plan options for our company of 85 employees. We're currently evaluating providers for Q2.\n\nBest regards",
    "Dear {lead},\n\nThank you for your interest! I'd be happy to discuss our corporate plans. For a company of 85 employees, we can offer significant volume discounts.\n\nWould next Tuesday at 10am work for a brief call?\n\nBest,\n{agent}",
    "That works perfectly. Please send a calendar invite to my email.\n\nAlso, do your plans include international emergency coverage? Several of our executives travel frequently.",
    "Absolutely. Our Corporate Premium plan includes international coverage up to $500K. I'll include that in our discussion.\n\nCalendar invite sent!",
  ],
];

const WEB_CHAT_INDIVIDUAL_TEMPLATE: string[][] = [
  [
    "Hello! Welcome to FDRYZE. How can I help you today?",
    "Hi, I'm looking for a health plan for myself and my 2 kids.",
    "I'd be happy to help! Are you looking for our Family Plan or Individual plans for each person?",
    "A family plan would be better. What does it cover?",
    "Our Family Plan includes medical, dental, and preventive care for up to 6 members. Plans start at $180/month. Would you like a personalized quote?",
    "Yes please. How do I get started?",
    "I'll connect you with an advisor who can walk you through the options. Can I get your name and preferred contact method?",
  ],
];

function generateConversations(leads: Lead[]): Conversation[] {
  const result: Conversation[] = [];
  let id = 1;

  // 2 WhatsApp for corporate
  const corpLeads = leads.filter(l => l.segment === "corporate" && l.stage !== "New");
  const corpWA = pickN(corpLeads, 2);
  for (const lead of corpWA) {
    const template = pick(CORP_MSG_TEMPLATES);
    const messages: ChatMessage[] = template.map((text, i) => ({
      id: `CM${id}-${i}`,
      sender: (i % 2 === 0 ? "agent" : "lead") as "agent" | "lead",
      text: text.replace("{agent}", lead.assignedTo.split(" ")[0]).replace("{plan}", lead.planInterest).replace("{size}", String(lead.companySize)).replace("{email}", lead.email),
      time: `${10 + Math.floor(i / 2)}:${30 + (i % 2) * 3}`,
      channel: "whatsapp" as Channel,
    }));
    result.push({
      id: `CONV-${id}`, leadId: lead.id, leadName: lead.name, channel: "whatsapp",
      assignedAgent: lead.assignedTo,
      lastMessage: messages[messages.length - 1].text.slice(0, 60),
      lastMessageTime: messages[messages.length - 1].time,
      unreadCount: rng() > 0.6 ? randInt(1, 3) : 0,
      messages, createdAt: lead.createdAt,
    });
    id++;
  }

  // 2 WhatsApp for individual
  const indivLeads = leads.filter(l => l.segment === "individual" && l.stage !== "New");
  const indivWA = pickN(indivLeads, 2);
  for (const lead of indivWA) {
    const template = pick(INDIVIDUAL_MSG_TEMPLATES);
    const messages: ChatMessage[] = template.map((text, i) => ({
      id: `CM${id}-${i}`,
      sender: (i % 2 === 0 ? "agent" : "lead") as "agent" | "lead",
      text: text.replace("{agent}", lead.assignedTo.split(" ")[0]).replace("{plan}", lead.planInterest).replace("{lead}", lead.name),
      time: `${9 + Math.floor(i / 2)}:${15 + (i % 2) * 5}`,
      channel: "whatsapp" as Channel,
    }));
    result.push({
      id: `CONV-${id}`, leadId: lead.id, leadName: lead.name, channel: "whatsapp",
      assignedAgent: lead.assignedTo,
      lastMessage: messages[messages.length - 1].text.slice(0, 60),
      lastMessageTime: messages[messages.length - 1].time,
      unreadCount: rng() > 0.5 ? randInt(1, 4) : 0,
      messages, createdAt: lead.createdAt,
    });
    id++;
  }

  // 1 email thread for corporate
  const corpEmail = pickN(corpLeads.filter(l => !corpWA.includes(l)), 1);
  for (const lead of corpEmail) {
    const template = CORP_EMAIL_TEMPLATE[0];
    const messages: ChatMessage[] = template.map((text, i) => ({
      id: `CM${id}-${i}`,
      sender: (i % 2 === 0 ? "lead" : "agent") as "agent" | "lead",
      text: text.replace("{agent}", lead.assignedTo.split(" ")[0]).replace("{lead}", lead.name),
      time: `${8 + i}:00`,
      channel: "email" as Channel,
    }));
    result.push({
      id: `CONV-${id}`, leadId: lead.id, leadName: lead.name, channel: "email",
      assignedAgent: lead.assignedTo,
      lastMessage: messages[messages.length - 1].text.slice(0, 60),
      lastMessageTime: messages[messages.length - 1].time,
      unreadCount: 0,
      messages, createdAt: lead.createdAt,
    });
    id++;
  }

  // 1 web chat transcript for individual
  const indivWebChat = pickN(indivLeads.filter(l => !indivWA.includes(l)), 1);
  for (const lead of indivWebChat) {
    const template = WEB_CHAT_INDIVIDUAL_TEMPLATE[0];
    const messages: ChatMessage[] = template.map((text, i) => ({
      id: `CM${id}-${i}`,
      sender: (i % 2 === 0 ? "bot" : "lead") as "bot" | "lead",
      text: text,
      time: `${14 + Math.floor(i / 2)}:${10 + (i % 2) * 5}`,
      channel: "webchat" as Channel,
    }));
    result.push({
      id: `CONV-${id}`, leadId: lead.id, leadName: lead.name, channel: "webchat",
      assignedAgent: lead.assignedTo,
      lastMessage: messages[messages.length - 1].text.slice(0, 60),
      lastMessageTime: messages[messages.length - 1].time,
      unreadCount: 1,
      messages, createdAt: lead.createdAt,
    });
    id++;
  }

  // Additional conversations from remaining corporate leads
  const remainingCorp = pickN(corpLeads.filter(l => !corpWA.includes(l) && !corpEmail.includes(l)), 10);
  for (const lead of remainingCorp) {
    const channel = pick(["whatsapp", "webchat", "phone"] as Channel[]);
    const template = pick(CORP_MSG_TEMPLATES);
    const messages: ChatMessage[] = template.map((text, i) => ({
      id: `CM${id}-${i}`,
      sender: (i % 2 === 0 ? "agent" : "lead") as "agent" | "lead",
      text: text.replace("{agent}", lead.assignedTo.split(" ")[0]).replace("{plan}", lead.planInterest).replace("{size}", String(lead.companySize)).replace("{email}", lead.email),
      time: `${10 + Math.floor(i / 2)}:${20 + (i % 2) * 7}`,
      channel,
    }));
    result.push({
      id: `CONV-${id}`, leadId: lead.id, leadName: lead.name, channel,
      assignedAgent: lead.assignedTo,
      lastMessage: messages[messages.length - 1].text.slice(0, 60),
      lastMessageTime: messages[messages.length - 1].time,
      unreadCount: rng() > 0.7 ? randInt(1, 3) : 0,
      messages, createdAt: lead.createdAt,
    });
    id++;
  }

  // Additional individual conversations
  const remainingIndiv = pickN(indivLeads.filter(l => !indivWA.includes(l) && !indivWebChat.includes(l)), 5);
  for (const lead of remainingIndiv) {
    const channel = pick(["whatsapp", "webchat"] as Channel[]);
    const template = pick(INDIVIDUAL_MSG_TEMPLATES);
    const messages: ChatMessage[] = template.map((text, i) => ({
      id: `CM${id}-${i}`,
      sender: (i % 2 === 0 ? "agent" : "lead") as "agent" | "lead",
      text: text.replace("{agent}", lead.assignedTo.split(" ")[0]).replace("{plan}", lead.planInterest).replace("{lead}", lead.name),
      time: `${11 + Math.floor(i / 2)}:${5 + (i % 2) * 8}`,
      channel,
    }));
    result.push({
      id: `CONV-${id}`, leadId: lead.id, leadName: lead.name, channel,
      assignedAgent: lead.assignedTo,
      lastMessage: messages[messages.length - 1].text.slice(0, 60),
      lastMessageTime: messages[messages.length - 1].time,
      unreadCount: rng() > 0.5 ? randInt(1, 2) : 0,
      messages, createdAt: lead.createdAt,
    });
    id++;
  }

  return result;
}

// ── Web Chat demo flows (English) ──
export const webChatDemoFlows: { id: string; title: string; messages: ChatMessage[] }[] = [
  {
    id: "demo-1",
    title: "Family Coverage Inquiry",
    messages: [
      { id: "WC1-1", sender: "bot", text: "Hello! I can help you choose a health plan. Are you looking for coverage for yourself, your family, or your company?", time: "09:00" },
      { id: "WC1-2", sender: "lead", text: "My family. We're a family of 4.", time: "09:01" },
      { id: "WC1-3", sender: "bot", text: "Great! How many dependents need coverage?", time: "09:01" },
      { id: "WC1-4", sender: "lead", text: "2 children, ages 5 and 8.", time: "09:02" },
      { id: "WC1-5", sender: "bot", text: "What's your coverage priority? Pediatric care, maternity, dental, or general medical?", time: "09:02" },
      { id: "WC1-6", sender: "lead", text: "Pediatric care and dental are the most important for us.", time: "09:03" },
      { id: "WC1-7", sender: "bot", text: "What's your monthly budget range for the family plan?", time: "09:03" },
      { id: "WC1-8", sender: "lead", text: "Around $200 to $350 per month.", time: "09:04" },
      { id: "WC1-9", sender: "bot", text: "When do you need the coverage to start?", time: "09:04" },
      { id: "WC1-10", sender: "lead", text: "As soon as possible, within the next 2 weeks ideally.", time: "09:05" },
      { id: "WC1-11", sender: "bot", text: "Were you referred by an existing member or did you find us online?", time: "09:05" },
      { id: "WC1-12", sender: "lead", text: "A friend who's a member recommended you.", time: "09:06" },
      { id: "WC1-13", sender: "bot", text: "To send you a personalized quote, could you share your name and email?", time: "09:06" },
      { id: "WC1-14", sender: "lead", text: "Lisa Parker, lisa.parker@gmail.com", time: "09:07" },
      { id: "WC1-15", sender: "bot", text: "Do you consent to FDRYZE processing your personal data per our privacy policy?", time: "09:07" },
      { id: "WC1-16", sender: "lead", text: "Yes, I consent.", time: "09:08" },
      { id: "WC1-17", sender: "bot", text: "✅ Thank you, Lisa! Based on your needs, I recommend our Family Plan with pediatric and dental add-ons. An advisor will contact you within 2 hours. Would you prefer a phone call or email?", time: "09:08" },
      { id: "WC1-18", sender: "lead", text: "Phone call please.", time: "09:09" },
      { id: "WC1-19", sender: "bot", text: "Perfect! An advisor will call you shortly. Thank you for choosing FDRYZE!", time: "09:09" },
    ],
  },
  {
    id: "demo-2",
    title: "Individual Premium Inquiry",
    messages: [
      { id: "WC2-1", sender: "bot", text: "Hello! I can help you choose a health plan. Are you looking for coverage for yourself, your family, or your company?", time: "11:00" },
      { id: "WC2-2", sender: "lead", text: "Just for myself.", time: "11:01" },
      { id: "WC2-3", sender: "bot", text: "Great! Our Individual plans start from $55/month. Do you need dental and vision coverage?", time: "11:01" },
      { id: "WC2-4", sender: "lead", text: "Yes, I want comprehensive coverage including dental.", time: "11:02" },
      { id: "WC2-5", sender: "bot", text: "Our Premium Individual plan includes dental, vision, and international emergency coverage. What's your budget range?", time: "11:02" },
      { id: "WC2-6", sender: "lead", text: "I can do $100-150 per month.", time: "11:03" },
      { id: "WC2-7", sender: "bot", text: "That fits our Premium Individual plan perfectly. When do you need coverage to begin?", time: "11:03" },
      { id: "WC2-8", sender: "lead", text: "Within the next month, I'm switching jobs and losing my current coverage.", time: "11:04" },
      { id: "WC2-9", sender: "bot", text: "I understand the urgency. Can I have your name and email to send a detailed quote?", time: "11:04" },
      { id: "WC2-10", sender: "lead", text: "Mark Sullivan, mark.sullivan@outlook.com", time: "11:05" },
      { id: "WC2-11", sender: "bot", text: "Do you consent to our privacy policy for processing your data?", time: "11:05" },
      { id: "WC2-12", sender: "lead", text: "Yes.", time: "11:06" },
      { id: "WC2-13", sender: "bot", text: "✅ All set, Mark! I'll send you the Premium Individual quote right away. An advisor will follow up within 24 hours. Thank you!", time: "11:06" },
    ],
  },
  {
    id: "demo-3",
    title: "Corporate Plan Inquiry",
    messages: [
      { id: "WC3-1", sender: "bot", text: "Hello! I can help you choose a health plan. Are you looking for coverage for yourself, your family, or your company?", time: "14:00" },
      { id: "WC3-2", sender: "lead", text: "My company. We have about 60 employees.", time: "14:01" },
      { id: "WC3-3", sender: "bot", text: "Excellent! For 60 employees we have very competitive corporate options. What's your industry?", time: "14:01" },
      { id: "WC3-4", sender: "lead", text: "We're a tech company, software development.", time: "14:02" },
      { id: "WC3-5", sender: "bot", text: "What timeline are you looking at for enrolling your team?", time: "14:02" },
      { id: "WC3-6", sender: "lead", text: "We need this in place by Q2, so within 2 months.", time: "14:03" },
      { id: "WC3-7", sender: "bot", text: "Do you need international coverage? Many tech companies have remote workers abroad.", time: "14:03" },
      { id: "WC3-8", sender: "lead", text: "Yes, we have a few people in Colombia and Peru.", time: "14:04" },
      { id: "WC3-9", sender: "bot", text: "Were you referred by a broker or insurance advisor?", time: "14:04" },
      { id: "WC3-10", sender: "lead", text: "Yes, Pacific Insurance referred us.", time: "14:05" },
      { id: "WC3-11", sender: "bot", text: "To prepare a corporate proposal, could you share your name, company name, and email?", time: "14:05" },
      { id: "WC3-12", sender: "lead", text: "Robert Chen, TechVentures Inc, robert.chen@techventures.com", time: "14:06" },
      { id: "WC3-13", sender: "bot", text: "Do you consent to our data processing policy?", time: "14:06" },
      { id: "WC3-14", sender: "lead", text: "Yes, I accept.", time: "14:07" },
      { id: "WC3-15", sender: "bot", text: "✅ Thank you, Robert! A corporate specialist will contact you within 2 hours with a tailored proposal. Thank you for considering FDRYZE!", time: "14:07" },
    ],
  },
  {
    id: "demo-4",
    title: "Family Maternity Coverage",
    messages: [
      { id: "WC4-1", sender: "bot", text: "Hello! I can help you choose a health plan. Are you looking for coverage for yourself, your family, or your company?", time: "16:00" },
      { id: "WC4-2", sender: "lead", text: "My family. My wife is expecting and we need maternity coverage.", time: "16:01" },
      { id: "WC4-3", sender: "bot", text: "Congratulations! How many family members need coverage?", time: "16:01" },
      { id: "WC4-4", sender: "lead", text: "Three — me, my wife, and the baby on the way.", time: "16:02" },
      { id: "WC4-5", sender: "bot", text: "Our Family Plan includes prenatal, delivery, and postnatal care. The newborn is automatically covered from birth. What's your budget range?", time: "16:02" },
      { id: "WC4-6", sender: "lead", text: "We're flexible, maybe $250-400 per month.", time: "16:03" },
      { id: "WC4-7", sender: "bot", text: "How soon do you need the maternity coverage to start?", time: "16:03" },
      { id: "WC4-8", sender: "lead", text: "Immediately — she's 4 months along.", time: "16:04" },
      { id: "WC4-9", sender: "bot", text: "I understand the urgency. Were you referred by anyone?", time: "16:04" },
      { id: "WC4-10", sender: "lead", text: "No, I found you through a Google search.", time: "16:05" },
      { id: "WC4-11", sender: "bot", text: "To fast-track your application, could you provide your name and email?", time: "16:05" },
      { id: "WC4-12", sender: "lead", text: "Alex Rivera, alex.rivera@gmail.com", time: "16:06" },
      { id: "WC4-13", sender: "bot", text: "Do you consent to our privacy policy?", time: "16:06" },
      { id: "WC4-14", sender: "lead", text: "Yes.", time: "16:07" },
      { id: "WC4-15", sender: "bot", text: "✅ Given the urgency, an advisor will call you within 30 minutes. We'll prioritize getting your maternity coverage active quickly. Thank you, Alex!", time: "16:07" },
    ],
  },
];

// ── Build everything ──
const corporateLeads = generateCorporateLeads();
const individualLeads = generateIndividualLeads(201);
export const initialLeads: Lead[] = [...corporateLeads, ...individualLeads];
export const initialActivities = generateActivities(initialLeads);
export const initialTasks = generateTasks(initialLeads);
export const initialConversations = generateConversations(initialLeads);

// Pipeline data derived
export function computePipelineData(leads: Lead[]) {
  const stages: LeadStage[] = ["New","Contacted","Qualified","Won","Lost"];
  const colors: Record<LeadStage, string> = {
    New: "hsl(217, 91%, 50%)", Contacted: "hsl(38, 92%, 50%)",
    Qualified: "hsl(262, 83%, 58%)", Won: "hsl(142, 71%, 45%)",
    Lost: "hsl(0, 72%, 51%)",
  };
  return stages.map(stage => ({
    stage,
    count: leads.filter(l => l.stage === stage).length,
    color: colors[stage],
  }));
}
