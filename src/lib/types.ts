export type LeadStage = "New" | "Contacted" | "Qualified" | "Won";
export type QualLevel = "High" | "Medium" | "Low";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  planInterest: string;
  stage: LeadStage;
  qualScore: number;
  qualLevel: QualLevel;
  assignedTo: string;
  createdAt: string;
  lastContact: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: "call" | "email" | "meeting" | "note" | "task" | "chat";
  title: string;
  description: string;
  date: string;
  completed?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "agent" | "lead";
  text: string;
  time: string;
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
