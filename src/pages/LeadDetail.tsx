import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leads, activities } from "@/lib/mock-data";
import { LeadStage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, Calendar, ArrowLeft, MessageSquare,
  FileText, CheckCircle2, Clock, Brain, Sparkles,
  Building2, Globe, Users, TrendingUp, Target,
} from "lucide-react";

const stageColors: Record<string, string> = {
  New: "bg-stage-new",
  Contacted: "bg-stage-contacted",
  Qualified: "bg-stage-qualified",
  Won: "bg-stage-won",
};

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <Clock className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  call: "bg-stage-new/10 text-stage-new",
  email: "bg-stage-contacted/10 text-stage-contacted",
  meeting: "bg-stage-qualified/10 text-stage-qualified",
  note: "bg-muted text-muted-foreground",
  task: "bg-stage-won/10 text-stage-won",
  chat: "bg-primary/10 text-primary",
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lead = leads.find((l) => l.id === id) || leads[0];
  const leadActivities = activities.filter((a) => a.leadId === lead.id);
  const [stage, setStage] = useState<LeadStage>(lead.stage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{lead.name}</h1>
            <Badge className={`${stageColors[stage]} border-0`}>{stage}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{lead.company} · {lead.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Phone className="h-3.5 w-3.5 mr-1" /> Call</Button>
          <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5 mr-1" /> Email</Button>
          <Button variant="outline" size="sm"><Calendar className="h-3.5 w-3.5 mr-1" /> Schedule</Button>
          <Button size="sm" onClick={() => navigate(`/engagement/${lead.id}`)}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lead Info + AI */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Email" value={lead.email} />
              <InfoRow label="Phone" value={lead.phone} />
              <InfoRow label="Company" value={lead.company} />
              <InfoRow label="Source" value={lead.source} />
              <InfoRow label="Plan Interest" value={lead.planInterest} />
              <InfoRow label="Assigned To" value={lead.assignedTo} />
              <InfoRow label="Created" value={lead.createdAt} />
              <InfoRow label="Last Contact" value={lead.lastContact || "—"} />
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Update Status</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI Qualification Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score */}
              <div className="text-center py-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary/20">
                  <span className={`text-2xl font-bold ${
                    lead.qualLevel === "High" ? "text-qual-high" :
                    lead.qualLevel === "Medium" ? "text-qual-medium" : "text-qual-low"
                  }`}>{lead.qualScore}%</span>
                </div>
                <div className="mt-2">
                  <Badge variant={lead.qualLevel === "High" ? "default" : "secondary"} className={
                    lead.qualLevel === "High" ? "bg-qual-high" :
                    lead.qualLevel === "Medium" ? "bg-qual-medium" : "bg-qual-low"
                  }>
                    {lead.qualLevel} Qualification
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Factors */}
              <div className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Contributing Factors</p>
                <Factor icon={<Building2 className="h-3.5 w-3.5" />} text="Company size: 50+ employees" score={90} />
                <Factor icon={<MessageSquare className="h-3.5 w-3.5" />} text="Engaged via 3 chat conversations" score={80} />
                <Factor icon={<Users className="h-3.5 w-3.5" />} text="Referred by certified broker" score={85} />
                <Factor icon={<Globe className="h-3.5 w-3.5" />} text="Website form submission (high intent)" score={75} />
                <Factor icon={<TrendingUp className="h-3.5 w-3.5" />} text="Requested premium tier pricing" score={92} />
                <Factor icon={<Target className="h-3.5 w-3.5" />} text="Decision timeline: < 30 days" score={88} />
              </div>

              <Separator />
              <p className="text-xs text-muted-foreground">
                <Brain className="h-3 w-3 inline mr-1" />
                Score generated by Saludsa AI engine based on behavioral and firmographic signals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
                <Button size="sm" variant="outline">+ Add Activity</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-6">
                  {leadActivities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-4 pl-2">
                      <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${activityColors[activity.type]}`}>
                        {activityIcons[activity.type]}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{activity.title}</p>
                          {activity.completed === false && (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={className}>{children}</p>;
}

function Factor({ icon, text, score }: { icon: React.ReactNode; text: string; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <span className="flex-1">{text}</span>
      <span className="text-xs font-semibold text-muted-foreground">{score}</span>
    </div>
  );
}
