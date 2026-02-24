import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Channel, Conversation, ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Phone, Video, MoreVertical,
  CheckCheck, Paperclip, Smile, MessageCircle,
  Mail, PhoneCall, Globe, AlertTriangle,
} from "lucide-react";

const channelIcons: Record<Channel, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-4 w-4" />,
  webchat: <Globe className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <PhoneCall className="h-4 w-4" />,
};

const channelLabels: Record<Channel, string> = {
  whatsapp: "WhatsApp", webchat: "Web Chat", email: "Email", phone: "Phone",
};

const URGENT_KEYWORDS = ["urgent", "urgente", "pricing", "precio", "immediate", "inmediato"];

function hasUrgentKeywords(text: string) {
  const lower = text.toLowerCase();
  return URGENT_KEYWORDS.some(k => lower.includes(k));
}

export default function Engagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, conversations, addMessageToConversation } = useData();
  const lead = leads.find(l => l.id === id);

  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const filteredConvs = useMemo(() => {
    let convs = id
      ? conversations.filter(c => c.leadId === id)
      : conversations;
    if (channelFilter !== "all") convs = convs.filter(c => c.channel === channelFilter);
    return convs.sort((a, b) => {
      // Prioritize urgent
      const aUrgent = a.messages.some(m => hasUrgentKeywords(m.text));
      const bUrgent = b.messages.some(m => hasUrgentKeywords(m.text));
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return b.unreadCount - a.unreadCount;
    });
  }, [conversations, id, channelFilter]);

  const selectedConv = filteredConvs.find(c => c.id === selectedConvId) || filteredConvs[0];

  const sendMessage = () => {
    if (!input.trim() || !selectedConv) return;
    addMessageToConversation(selectedConv.id, {
      sender: "agent",
      text: input,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      channel: selectedConv.channel,
    });
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => lead ? navigate(`/leads/${lead.id}`) : navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="font-medium text-sm">
            {lead ? `${lead.name} — Conversations` : "Engagement Workspace"}
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredConvs.length} conversation{filteredConvs.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Channel tabs */}
      <Tabs value={channelFilter} onValueChange={setChannelFilter} className="shrink-0 px-4 pt-2">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-1">{channelIcons.whatsapp} WhatsApp</TabsTrigger>
          <TabsTrigger value="webchat" className="flex items-center gap-1">{channelIcons.webchat} Web Chat</TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1">{channelIcons.email} Email</TabsTrigger>
          <TabsTrigger value="phone" className="flex items-center gap-1">{channelIcons.phone} Phone</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 border-r overflow-y-auto bg-card shrink-0">
          {filteredConvs.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No conversations found.</p>
          )}
          {filteredConvs.map(conv => {
            const isUrgent = conv.messages.some(m => hasUrgentKeywords(m.text));
            const isSelected = selectedConv?.id === conv.id;
            return (
              <div
                key={conv.id}
                className={`p-3 border-b cursor-pointer transition-colors ${isSelected ? "bg-accent" : "hover:bg-accent/50"}`}
                onClick={() => setSelectedConvId(conv.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{channelIcons[conv.channel]}</span>
                  <span className="font-medium text-sm flex-1 truncate">{conv.leadName}</span>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">{conv.unreadCount}</Badge>
                  )}
                  {isUrgent && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{conv.lastMessage}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary" className="text-[10px]">{channelLabels[conv.channel]}</Badge>
                  <span className="text-[10px] text-muted-foreground">{conv.lastMessageTime}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat view */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
                <div className="h-9 w-9 rounded-full bg-stage-won flex items-center justify-center text-primary-foreground font-semibold text-xs">
                  {selectedConv.leadName.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedConv.leadName}</p>
                  <p className="text-xs text-muted-foreground">{channelLabels[selectedConv.channel]} · {selectedConv.assignedAgent}</p>
                </div>
                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-xs font-normal">{new Date(selectedConv.createdAt).toLocaleDateString()}</Badge>
                  </div>
                  {selectedConv.messages.map(msg => {
                    const isAgent = msg.sender === "agent" || msg.sender === "bot";
                    const urgent = hasUrgentKeywords(msg.text);
                    return (
                      <div key={msg.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isAgent
                            ? "bg-chat-outgoing text-primary-foreground rounded-br-md"
                            : `bg-card border rounded-bl-md ${urgent ? "border-destructive/50" : ""}`
                        }`}>
                          <p>{msg.text}</p>
                          {urgent && !isAgent && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                              <span className="text-[10px] text-destructive font-medium">Escalation suggested</span>
                            </div>
                          )}
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            isAgent ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            <span className="text-[10px]">{msg.time}</span>
                            {isAgent && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="px-4 py-3 border-t bg-card flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
                <Input
                  placeholder="Type a message..."
                  className="flex-1"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <Button variant="ghost" size="icon"><Smile className="h-4 w-4" /></Button>
                <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
