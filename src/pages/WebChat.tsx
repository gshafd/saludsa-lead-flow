import { useState } from "react";
import { useData } from "@/context/DataContext";
import { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, MessageCircle } from "lucide-react";

export default function WebChat() {
  const { webChatDemoFlows, createLeadFromChat, addActivity } = useData();
  const [selectedFlow, setSelectedFlow] = useState(webChatDemoFlows[0]?.id || "");
  const [messages, setMessages] = useState<ChatMessage[]>(webChatDemoFlows[0]?.messages || []);
  const [input, setInput] = useState("");
  const [captured, setCaptured] = useState(false);

  const handleSelectFlow = (flowId: string) => {
    const flow = webChatDemoFlows.find(f => f.id === flowId);
    if (flow) {
      setSelectedFlow(flowId);
      setMessages(flow.messages);
      setCaptured(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: `UC-${Date.now()}`,
      sender: "lead",
      text: input,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      channel: "webchat",
    };
    setMessages(prev => [...prev, msg]);
    setInput("");

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `BOT-${Date.now()}`,
        sender: "bot",
        text: "Thank you for your message. An advisor will contact you soon. Is there anything else I can help with?",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        channel: "webchat",
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  const handleCaptureLead = () => {
    const flow = webChatDemoFlows.find(f => f.id === selectedFlow);
    if (!flow || captured) return;

    const leadNames: Record<string, { name: string; company: string; email: string; size: number; source: string; segment: "corporate" | "individual"; plan: string; householdSize?: number; dependents?: number; decisionTimeline?: string }> = {
      "demo-1": { name: "Lisa Parker", company: "Individual", email: "lisa.parker@gmail.com", size: 1, source: "Website Form", segment: "individual", plan: "Family Plan", householdSize: 4, dependents: 2, decisionTimeline: "< 2 weeks" },
      "demo-2": { name: "Mark Sullivan", company: "Individual", email: "mark.sullivan@outlook.com", size: 1, source: "Website Form", segment: "individual", plan: "Premium Individual", householdSize: 1, dependents: 0, decisionTimeline: "< 30 days" },
      "demo-3": { name: "Robert Chen", company: "TechVentures Inc", email: "robert.chen@techventures.com", size: 60, source: "Broker Referral", segment: "corporate", plan: "Corporate Premium Plan" },
      "demo-4": { name: "Alex Rivera", company: "Individual", email: "alex.rivera@gmail.com", size: 1, source: "Website Form", segment: "individual", plan: "Family Plan", householdSize: 3, dependents: 1, decisionTimeline: "Immediate" },
    };

    const info = leadNames[selectedFlow];
    if (info) {
      const id = createLeadFromChat({
        name: info.name, company: info.company, email: info.email,
        phone: "+593 99 000 0000", source: info.source as any,
        planInterest: info.plan, stage: "New",
        assignedTo: "Carlos Mendoza", region: "Quito",
        companySize: info.size, createdAt: new Date().toISOString(),
        lastContactedAt: new Date().toISOString(), requestedQuote: true,
        chatInteractions: Math.floor(flow.messages.length / 2),
        emailResponses: 0, callsCount: 0,
        consentStatus: "granted", consentTimestamp: new Date().toISOString(),
        consentMethod: "Web chat opt-in",
        segment: info.segment,
        householdSize: info.householdSize,
        dependents: info.dependents,
        decisionTimeline: info.decisionTimeline,
      });

      addActivity({
        leadId: id, type: "chat",
        title: "Web chat transcript captured",
        description: `Automated web chat flow: ${flow.title}. ${flow.messages.length} messages.`,
        date: new Date().toISOString(), actor: "System",
      });

      setCaptured(true);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Website Chat Demo</h1>
        <p className="text-sm text-muted-foreground">Simulated virtual assistant — qualification flow demos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Flow selector */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">Demo Flows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {webChatDemoFlows.map(flow => (
              <Button
                key={flow.id}
                variant={selectedFlow === flow.id ? "default" : "outline"}
                className="w-full justify-start text-left text-xs h-auto py-2"
                onClick={() => handleSelectFlow(flow.id)}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-2 shrink-0" />
                {flow.title}
              </Button>
            ))}
            <div className="pt-3">
              <Button
                variant="secondary"
                className="w-full text-xs"
                onClick={handleCaptureLead}
                disabled={captured}
              >
                {captured ? "✓ Lead Captured" : "Capture as Lead"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat widget */}
        <Card className="lg:col-span-3 flex flex-col max-h-[70vh]">
          <CardHeader className="pb-2 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <CardTitle className="text-sm font-semibold">FDRYZE — Virtual Assistant</CardTitle>
                <p className="text-xs opacity-80">Online</p>
              </div>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map(msg => {
                const isBot = msg.sender === "bot";
                const isLead = msg.sender === "lead";
                return (
                  <div key={msg.id} className={`flex ${isLead ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {isBot && (
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isLead
                          ? "bg-chat-outgoing text-primary-foreground rounded-br-md"
                          : "bg-card border rounded-bl-md"
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isLead ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                      </div>
                      {isLead && (
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="px-4 py-3 border-t flex items-center gap-2">
            <Input
              placeholder="Type your message..."
              className="flex-1"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* README note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">📋 Demo Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p><strong>Scoring weights:</strong> Corporate: Company Size (max 30) + Source (8–25) + Engagement (max 30) + Intent (0/15) + Recency (0/5). Individual: Household (max 10) + Source (8–18) + Engagement (max 30) + Intent (0/15) + Recency (0/5) + Family Plan (0/15) + Timeline (0/10).</p>
          <p><strong>Demo data:</strong> 200 corporate + 25 individual leads in <code>src/lib/seed-data.ts</code>. 10 sales reps across 8 regions.</p>
          <p><strong>Web Chat scenarios:</strong> 4 flows — Family Coverage, Individual Premium, Corporate Plan, Family Maternity. Click "Capture as Lead" to create CRM record.</p>
          <p><strong>Thresholds:</strong> High ≥ 75, Medium 50–74, Low &lt; 50.</p>
        </CardContent>
      </Card>
    </div>
  );
}
