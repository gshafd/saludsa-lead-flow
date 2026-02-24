import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  Lead, Activity, Task, Conversation, AuditEntry, LeadStage, ChatMessage, Channel,
} from "@/lib/types";
import {
  initialLeads, initialActivities, initialTasks, initialConversations,
  salesReps, computePipelineData, webChatDemoFlows,
} from "@/lib/seed-data";
import { calculateScore, qualLevel } from "@/lib/scoring";

interface DataContextType {
  leads: Lead[];
  activities: Activity[];
  tasks: Task[];
  conversations: Conversation[];
  auditLog: AuditEntry[];
  salesReps: typeof salesReps;
  webChatDemoFlows: typeof webChatDemoFlows;
  pipelineData: ReturnType<typeof computePipelineData>;

  updateLead: (id: string, updates: Partial<Lead>, actor?: string) => void;
  addActivity: (activity: Omit<Activity, "id">) => void;
  addConversation: (conv: Omit<Conversation, "id">) => void;
  addMessageToConversation: (convId: string, msg: Omit<ChatMessage, "id">) => void;
  toggleTask: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  recalcLeadScore: (id: string) => void;
  createLeadFromChat: (lead: Omit<Lead, "id" | "qualScore" | "qualLevel" | "scoreBreakdown">) => string;
}

const DataContext = createContext<DataContextType>(null!);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const addAudit = useCallback((leadId: string, field: string, oldVal: string, newVal: string, actor: string, reason: string) => {
    setAuditLog(prev => [{
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leadId, field, oldValue: oldVal, newValue: newVal, actor, reason,
      timestamp: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const recalcLeadScore = useCallback((id: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l;
      const breakdown = calculateScore(l);
      const ql = qualLevel(breakdown.total);
      return { ...l, qualScore: breakdown.total, qualLevel: ql, scoreBreakdown: breakdown };
    }));
  }, []);

  const updateLead = useCallback((id: string, updates: Partial<Lead>, actor = "Carlos Mendoza") => {
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l;
      // Audit
      for (const [key, val] of Object.entries(updates)) {
        const oldVal = String((l as any)[key] ?? "");
        const newVal = String(val);
        if (oldVal !== newVal) {
          addAudit(id, key, oldVal, newVal, actor, "Manual update");
        }
      }
      const updated = { ...l, ...updates };
      const breakdown = calculateScore(updated);
      const ql = qualLevel(breakdown.total);
      return { ...updated, qualScore: breakdown.total, qualLevel: ql, scoreBreakdown: breakdown };
    }));
  }, [addAudit]);

  const addActivity = useCallback((activity: Omit<Activity, "id">) => {
    const id = `A${Date.now()}`;
    setActivities(prev => [{ ...activity, id }, ...prev]);
    // Update lead's lastContactedAt and engagement counts
    setLeads(prev => prev.map(l => {
      if (l.id !== activity.leadId) return l;
      const updates: Partial<Lead> = { lastContactedAt: new Date().toISOString() };
      if (activity.type === "chat") updates.chatInteractions = l.chatInteractions + 1;
      if (activity.type === "email") updates.emailResponses = l.emailResponses + 1;
      if (activity.type === "call") updates.callsCount = l.callsCount + 1;
      const updated = { ...l, ...updates };
      const breakdown = calculateScore(updated);
      return { ...updated, qualScore: breakdown.total, qualLevel: qualLevel(breakdown.total), scoreBreakdown: breakdown };
    }));
    addAudit(activity.leadId, "activity", "", activity.title, activity.actor || "System", "Activity logged");
  }, [addAudit]);

  const addConversation = useCallback((conv: Omit<Conversation, "id">) => {
    const id = `CONV-${Date.now()}`;
    setConversations(prev => [{ ...conv, id }, ...prev]);
  }, []);

  const addMessageToConversation = useCallback((convId: string, msg: Omit<ChatMessage, "id">) => {
    const msgId = `CM-${Date.now()}`;
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const newMsg = { ...msg, id: msgId };
      return {
        ...c,
        messages: [...c.messages, newMsg],
        lastMessage: msg.text.slice(0, 60),
        lastMessageTime: msg.time,
        unreadCount: msg.sender === "lead" ? c.unreadCount + 1 : c.unreadCount,
      };
    }));
    // Update engagement counts on lead
    const conv = conversations.find(c => c.id === convId);
    if (conv && msg.sender === "agent") {
      setLeads(prev => prev.map(l => {
        if (l.id !== conv.leadId) return l;
        const updated = { ...l, chatInteractions: l.chatInteractions + 1, lastContactedAt: new Date().toISOString() };
        const breakdown = calculateScore(updated);
        return { ...updated, qualScore: breakdown.total, qualLevel: qualLevel(breakdown.total), scoreBreakdown: breakdown };
      }));
    }
  }, [conversations]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    setTasks(prev => [{ ...task, id: `T${Date.now()}` }, ...prev]);
  }, []);

  const createLeadFromChat = useCallback((leadData: Omit<Lead, "id" | "qualScore" | "qualLevel" | "scoreBreakdown">) => {
    const id = `LD-${String(leads.length + 1).padStart(3, "0")}`;
    const breakdown = calculateScore(leadData);
    const ql = qualLevel(breakdown.total);
    const newLead: Lead = { ...leadData, id, qualScore: breakdown.total, qualLevel: ql, scoreBreakdown: breakdown };
    setLeads(prev => [newLead, ...prev]);
    addAudit(id, "created", "", "New lead from web chat", "System", "Web chat capture");
    return id;
  }, [leads.length, addAudit]);

  const pipelineData = useMemo(() => computePipelineData(leads), [leads]);

  const value: DataContextType = {
    leads, activities, tasks, conversations, auditLog, salesReps, webChatDemoFlows, pipelineData,
    updateLead, addActivity, addConversation, addMessageToConversation,
    toggleTask, addTask, recalcLeadScore, createLeadFromChat,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
