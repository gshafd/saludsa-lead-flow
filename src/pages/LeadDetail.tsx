import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { LeadStage } from "@/lib/types";
import { getScoreExplanations, topDriversSummary, SCORING_WEIGHTS } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Phone, Mail, Calendar, ArrowLeft, MessageSquare,
  FileText, CheckCircle2, Clock, Sparkles,
  Building2, TrendingUp, Info, Shield, History,
  Plus, AlertTriangle,
} from "lucide-react";

const stageColors: Record<string, string> = {
  New: "bg-stage-new", Contacted: "bg-stage-contacted",
  Qualified: "bg-stage-qualified", Won: "bg-stage-won",
};

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />, email: <Mail className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />, note: <FileText className="h-4 w-4" />,
  task: <Clock className="h-4 w-4" />, chat: <MessageSquare className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  call: "bg-stage-new/10 text-stage-new", email: "bg-stage-contacted/10 text-stage-contacted",
  meeting: "bg-stage-qualified/10 text-stage-qualified", note: "bg-muted text-muted-foreground",
  task: "bg-stage-won/10 text-stage-won", chat: "bg-primary/10 text-primary",
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, activities, auditLog, updateLead, addActivity, salesReps } = useData();
  const lead = leads.find((l) => l.id === id);

  const leadActivities = useMemo(
    () => lead ? activities.filter((a) => a.leadId === lead.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [],
    [activities, lead]
  );

  const leadAudits = useMemo(
    () => lead ? auditLog.filter(a => a.leadId === lead.id) : [],
    [auditLog, lead]
  );

  const scoreExplanations = lead ? getScoreExplanations(lead.scoreBreakdown, lead) : [];
  const driversSummary = lead ? topDriversSummary(lead.scoreBreakdown, lead) : "";

  const [stage, setStage] = useState<LeadStage>(lead?.stage ?? "New");
  const [companySize, setCompanySize] = useState(String(lead?.companySize ?? 0));
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  if (!lead) return <div className="p-6">Lead not found</div>;

  const handleStageChange = (v: string) => {
    setStage(v as LeadStage);
    updateLead(lead.id, { stage: v as LeadStage });
  };

  const handleCompanySizeBlur = () => {
    const size = parseInt(companySize) || lead.companySize;
    if (size !== lead.companySize) {
      updateLead(lead.id, { companySize: size });
    }
  };

  const handleToggleQuote = () => {
    updateLead(lead.id, { requestedQuote: !lead.requestedQuote });
  };

  // Score threshold suggestion
  const scoreSuggestion = lead.qualScore >= 75 && lead.stage === "Contacted"
    ? `Score rose to ${lead.qualScore}. Suggest escalate to enterprise team.`
    : lead.qualScore >= 50 && lead.stage === "New"
    ? `Score is ${lead.qualScore}. Suggest move to Contacted.`
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{lead.name}</h1>
            <Badge className={`${stageColors[lead.stage]} border-0`}>{lead.stage}</Badge>
            <span className={`text-sm font-semibold ${
              lead.qualLevel === "High" ? "text-qual-high" :
              lead.qualLevel === "Medium" ? "text-qual-medium" : "text-qual-low"
            }`}>{lead.qualScore}%</span>
          </div>
          <p className="text-sm text-muted-foreground">{lead.company} · {lead.id} · {lead.region}</p>
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

      {scoreSuggestion && (
        <Card className="border-stage-contacted/40">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-stage-contacted" />
            <p className="text-sm font-medium">{scoreSuggestion}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
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
              <InfoRow label="Region" value={lead.region} />
              <InfoRow label="Created" value={new Date(lead.createdAt).toLocaleDateString()} />
              <InfoRow label="Last Contact" value={lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : "—"} />
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Company Size</Label>
                <Input type="number" value={companySize} onChange={e => setCompanySize(e.target.value)} onBlur={handleCompanySizeBlur} className="mt-1 h-8" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Requested Quote</span>
                <Button variant={lead.requestedQuote ? "default" : "outline"} size="sm" onClick={handleToggleQuote} className="h-7 text-xs">
                  {lead.requestedQuote ? "Yes ✓" : "No"}
                </Button>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Update Status</Label>
                <Select value={stage} onValueChange={handleStageChange}>
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

          {/* Consent */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" /> Consent
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <InfoRow label="Status" value={lead.consentStatus} />
              {lead.consentTimestamp && <InfoRow label="Timestamp" value={new Date(lead.consentTimestamp).toLocaleString()} />}
              {lead.consentMethod && <InfoRow label="Method" value={lead.consentMethod} />}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Qualification Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Score Breakdown</p>
                {scoreExplanations.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-xs">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.explanation}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">+{item.value}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Total</span>
                  <span className="font-bold text-lg">{lead.qualScore}</span>
                </div>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground italic">{driversSummary}</p>
              <Dialog open={weightsOpen} onOpenChange={setWeightsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs w-full">
                    <Info className="h-3 w-3 mr-1" /> How score is calculated
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Scoring Weights</DialogTitle></DialogHeader>
                  <div className="space-y-3 text-sm">
                    {Object.entries(SCORING_WEIGHTS).map(([key, w]) => (
                      <div key={key} className="border-b pb-2">
                        <p className="font-medium">{key}</p>
                        <p className="text-muted-foreground text-xs">{w.description}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity Timeline + Audit */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><History className="h-3.5 w-3.5 mr-1" /> Audit Log</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Audit History — {lead.name}</DialogTitle></DialogHeader>
                      <div className="space-y-3 text-sm">
                        {leadAudits.length === 0 && <p className="text-muted-foreground">No audit entries yet.</p>}
                        {leadAudits.map(a => (
                          <div key={a.id} className="border-b pb-2">
                            <p className="font-medium">{a.field}: <span className="text-muted-foreground">{a.oldValue || "—"}</span> → <span className="text-foreground">{a.newValue}</span></p>
                            <p className="text-xs text-muted-foreground">{a.actor} · {new Date(a.timestamp).toLocaleString()} · {a.reason}</p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add Activity</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                      <AddActivityForm leadId={lead.id} onDone={() => setAddActivityOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
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
                          {activity.completed === false && <Badge variant="outline" className="text-xs">Pending</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                          {activity.actor && ` · ${activity.actor}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {leadActivities.length === 0 && <p className="text-sm text-muted-foreground pl-12">No activities recorded yet.</p>}
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

function AddActivityForm({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const { addActivity } = useData();
  const [type, setType] = useState<"call" | "email" | "meeting" | "note" | "chat">("call");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    addActivity({
      leadId, type, title, description: desc,
      date: new Date().toISOString(), actor: "Carlos Mendoza",
    });
    onDone();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={v => setType(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Activity title" /></div>
      <div><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Details..." /></div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!title.trim()}>Log Activity</Button>
      </div>
    </div>
  );
}
