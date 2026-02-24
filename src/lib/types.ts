export type LeadStage = "New" | "Contacted" | "Qualified" | "Won";
export type QualLevel = "High" | "Medium" | "Low";
export type LeadSource = "Website Form" | "WhatsApp Inbound" | "Broker Referral" | "Call Center" | "Trade Show" | "LinkedIn";
export type Channel = "whatsapp" | "webchat" | "email" | "phone";

export interface SalesRep {
  id: string;
  name: string;
  region: string;
  email: string;
}

export interface ScoreBreakdown {
  companySizeScore: number;
  sourceScore: number;
  engagementScore: number;
  intentScore: number;
  recencyBonus: number;
  total: number;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  planInterest: string;
  stage: LeadStage;
  qualScore: number;
  qualLevel: QualLevel;
  assignedTo: string;
  region: string;
  companySize: number;
  createdAt: string;
  lastContactedAt: string;
  requestedQuote: boolean;
  chatInteractions: number;
  emailResponses: number;
  callsCount: number;
  consentStatus: "granted" | "pending" | "declined";
  consentTimestamp?: string;
  consentMethod?: string;
  scoreBreakdown: ScoreBreakdown;
}

export interface Activity {
  id: string;
  leadId: string;
  type: "call" | "email" | "meeting" | "note" | "task" | "chat";
  title: string;
  description: string;
  date: string;
  completed?: boolean;
  actor?: string;
}

export interface ChatMessage {
  id: string;
  sender: "agent" | "lead" | "bot";
  text: string;
  time: string;
  channel?: Channel;
}

export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  channel: Channel;
  assignedAgent: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
  createdAt: string;
}

export interface Task {
  id: string;
  leadId: string;
  leadName: string;
  title: string;
  dueDate: string;
  completed: boolean;
  type: "call" | "email" | "meeting";
}

export interface AuditEntry {
  id: string;
  leadId: string;
  field: string;
  oldValue: string;
  newValue: string;
  actor: string;
  reason: string;
  timestamp: string;
}
