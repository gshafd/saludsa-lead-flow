import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leads, chatMessages as initialMessages } from "@/lib/mock-data";
import { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Send, Phone, Video, MoreVertical,
  Check, CheckCheck, Paperclip, Smile,
} from "lucide-react";

export default function Engagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lead = leads.find((l) => l.id === id) || leads[0];
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: `C${messages.length + 1}`,
      sender: "agent",
      text: input,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, newMsg]);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/leads/${lead.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-10 w-10 rounded-full bg-stage-won flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {lead.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{lead.name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-qual-high inline-block" />
            Online · {lead.company}
          </div>
        </div>
        <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
        {/* Date badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs font-normal">Today</Badge>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === "agent"
                  ? "bg-chat-outgoing text-primary-foreground rounded-br-md"
                  : "bg-card border rounded-bl-md"
              }`}
            >
              <p>{msg.text}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 ${
                msg.sender === "agent" ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                <span className="text-[10px]">{msg.time}</span>
                {msg.sender === "agent" && <CheckCheck className="h-3 w-3" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-card flex items-center gap-2">
        <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
        <Input
          placeholder="Type a message..."
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button variant="ghost" size="icon"><Smile className="h-4 w-4" /></Button>
        <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
