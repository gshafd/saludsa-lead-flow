import { useState } from "react";
import { leads } from "@/lib/mock-data";
import { Lead, LeadStage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";

const stageColors: Record<string, string> = {
  New: "bg-stage-new",
  Contacted: "bg-stage-contacted",
  Qualified: "bg-stage-qualified",
  Won: "bg-stage-won",
};

export default function LeadsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [newLeadOpen, setNewLeadOpen] = useState(searchParams.get("new") === "1");

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} total leads</p>
        </div>
        <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <NewLeadForm onSubmit={(id) => { setNewLeadOpen(false); navigate(`/leads/${id}`); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or company..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Won">Won</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Lead</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plan Interest</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stage</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{lead.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone}</div>
                    </td>
                    <td className="py-3 px-4">{lead.company}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.planInterest}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.source}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${stageColors[lead.stage]} text-xs border-0`}>{lead.stage}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        lead.qualLevel === "High" ? "text-qual-high" :
                        lead.qualLevel === "Medium" ? "text-qual-medium" : "text-qual-low"
                      }`}>{lead.qualScore}%</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewLeadForm({ onSubmit }: { onSubmit: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Full Name</Label><Input placeholder="e.g. Juan Pérez" /></div>
        <div><Label>Company</Label><Input placeholder="e.g. Empresa ABC" /></div>
        <div><Label>Phone</Label><Input placeholder="+593 99 000 0000" /></div>
        <div><Label>Email</Label><Input placeholder="email@company.com" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Source</Label>
          <Select defaultValue="Website Form">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Website Form">Website Form</SelectItem>
              <SelectItem value="WhatsApp Inbound">WhatsApp Inbound</SelectItem>
              <SelectItem value="Broker Referral">Broker Referral</SelectItem>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="Trade Show">Trade Show</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Plan Interest</Label>
          <Select defaultValue="Plan Corporativo Premium">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Plan Corporativo Premium">Plan Corporativo Premium</SelectItem>
              <SelectItem value="Plan Corporativo Estándar">Plan Corporativo Estándar</SelectItem>
              <SelectItem value="Plan Familiar Premium">Plan Familiar Premium</SelectItem>
              <SelectItem value="Plan Familiar Plus">Plan Familiar Plus</SelectItem>
              <SelectItem value="Plan Individual Básico">Plan Individual Básico</SelectItem>
              <SelectItem value="Plan Individual Plus">Plan Individual Plus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={() => onSubmit("LD-001")}>Create Lead</Button>
      </div>
    </div>
  );
}
