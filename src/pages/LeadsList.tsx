import { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { Lead, LeadStage, LeadSource } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

const stageColors: Record<string, string> = {
  New: "bg-stage-new", Contacted: "bg-stage-contacted",
  Qualified: "bg-stage-qualified", Won: "bg-stage-won",
  Lost: "bg-destructive",
};

const PAGE_SIZE = 25;

export default function LeadsList() {
  const navigate = useNavigate();
  const { leads, salesReps } = useData();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<"qualScore" | "createdAt">("qualScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [newLeadOpen, setNewLeadOpen] = useState(searchParams.get("new") === "1");

  const filtered = useMemo(() => {
    let result = leads.filter((l) => {
      const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.company.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "all" || l.stage === stageFilter;
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      const matchAssigned = assignedFilter === "all" || l.assignedTo === assignedFilter;
      const matchRegion = regionFilter === "all" || l.region === regionFilter;
      const matchSegment = segmentFilter === "all" || l.segment === segmentFilter;
      const matchScore = l.qualScore >= scoreRange[0] && l.qualScore <= scoreRange[1];
      return matchSearch && matchStage && matchSource && matchAssigned && matchRegion && matchSegment && matchScore;
    });
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "qualScore") cmp = a.qualScore - b.qualScore;
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [leads, search, stageFilter, sourceFilter, assignedFilter, regionFilter, segmentFilter, scoreRange, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const regions = useMemo(() => [...new Set(leads.map(l => l.region))].sort(), [leads]);

  const toggleSort = (field: "qualScore" | "createdAt") => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {leads.length} leads</p>
        </div>
        <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
            <NewLeadForm onSubmit={(id) => { setNewLeadOpen(false); navigate(`/leads/${id}`); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, company, email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Won">Won</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={segmentFilter} onValueChange={(v) => { setSegmentFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Website Form">Website Form</SelectItem>
            <SelectItem value="WhatsApp Inbound">WhatsApp</SelectItem>
            <SelectItem value="Broker Referral">Broker Referral</SelectItem>
            <SelectItem value="Call Center">Call Center</SelectItem>
            <SelectItem value="Trade Show">Trade Show</SelectItem>
            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assignedFilter} onValueChange={(v) => { setAssignedFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reps</SelectItem>
            {salesReps.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Score: {scoreRange[0]}–{scoreRange[1]}</Label>
          <Slider min={0} max={100} step={5} value={scoreRange} onValueChange={(v) => { setScoreRange(v); setPage(1); }} className="mt-1" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Lead</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Segment</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stage</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("qualScore")}>
                    <span className="flex items-center gap-1">Score <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Region</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assigned</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                    <span className="flex items-center gap-1">Created <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td className="py-3 px-4">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone}</div>
                    </td>
                    <td className="py-3 px-4">{lead.company}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{lead.segment === "individual" ? "Individual" : "Corporate"}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.source}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${stageColors[lead.stage] || "bg-muted"} text-xs border-0`}>{lead.stage}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        lead.qualLevel === "High" ? "text-qual-high" :
                        lead.qualLevel === "Medium" ? "text-qual-medium" : "text-qual-low"
                      }`}>{lead.qualScore}%</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.region}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.assignedTo}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">{page} / {totalPages || 1}</span>
              <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewLeadForm({ onSubmit }: { onSubmit: (id: string) => void }) {
  const { createLeadFromChat, salesReps: reps } = useData();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<LeadSource>("Website Form");
  const [plan, setPlan] = useState("Corporate Premium Plan");
  const [segment, setSegment] = useState<"corporate" | "individual">("corporate");

  const handleSubmit = () => {
    if (!name.trim()) return;
    const id = createLeadFromChat({
      name, company: segment === "individual" ? "Individual" : company, email, phone, source,
      planInterest: plan, stage: "New",
      assignedTo: reps[0].name, region: "Quito",
      companySize: segment === "individual" ? 1 : 10, createdAt: new Date().toISOString(),
      lastContactedAt: "", requestedQuote: false,
      chatInteractions: 0, emailResponses: 0, callsCount: 0,
      consentStatus: "pending",
      segment,
    });
    onSubmit(id);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Segment</Label>
        <Select value={segment} onValueChange={v => setSegment(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Full Name</Label><Input placeholder="e.g. John Smith" value={name} onChange={e => setName(e.target.value)} /></div>
        {segment === "corporate" && (
          <div><Label>Company</Label><Input placeholder="e.g. Acme Corp" value={company} onChange={e => setCompany(e.target.value)} /></div>
        )}
        <div><Label>Phone</Label><Input placeholder="+593 99 000 0000" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div><Label>Email</Label><Input placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Source</Label>
          <Select value={source} onValueChange={v => setSource(v as LeadSource)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Website Form">Website Form</SelectItem>
              <SelectItem value="WhatsApp Inbound">WhatsApp Inbound</SelectItem>
              <SelectItem value="Broker Referral">Broker Referral</SelectItem>
              <SelectItem value="Call Center">Call Center</SelectItem>
              <SelectItem value="Trade Show">Trade Show</SelectItem>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Plan Interest</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {segment === "corporate" ? (
                <>
                  <SelectItem value="Corporate Premium Plan">Corporate Premium</SelectItem>
                  <SelectItem value="Corporate Standard Plan">Corporate Standard</SelectItem>
                  <SelectItem value="Corporate Plus Plan">Corporate Plus</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="Individual Plan">Individual Plan</SelectItem>
                  <SelectItem value="Family Plan">Family Plan</SelectItem>
                  <SelectItem value="Premium Individual">Premium Individual</SelectItem>
                  <SelectItem value="Family Plus">Family Plus</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={!name.trim()}>Create Lead</Button>
      </div>
    </div>
  );
}
