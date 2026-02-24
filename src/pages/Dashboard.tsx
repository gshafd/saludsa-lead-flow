import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { Lead, LeadStage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, Clock, Users, CheckCircle2, Phone, Mail, Calendar,
  ArrowRight, AlertTriangle, UserX,
} from "lucide-react";

const stageColors: Record<string, string> = {
  New: "bg-stage-new", Contacted: "bg-stage-contacted",
  Qualified: "bg-stage-qualified", Won: "bg-stage-won",
};

const taskIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  meeting: <Calendar className="h-3.5 w-3.5" />,
};

type Period = "7" | "30" | "90";

export default function Dashboard() {
  const navigate = useNavigate();
  const { leads, tasks, pipelineData } = useData();
  const [period, setPeriod] = useState<Period>("30");

  const metrics = useMemo(() => {
    const now = new Date("2026-02-24T12:00:00");
    const days = parseInt(period);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    const inPeriod = leads.filter(l => new Date(l.createdAt) >= cutoff);
    const inWeek = leads.filter(l => {
      const d = new Date(l.createdAt);
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    });
    const wonInPeriod = inPeriod.filter(l => l.stage === "Won").length;
    const convRate = inPeriod.length > 0 ? Math.round((wonInPeriod / inPeriod.length) * 100) : 0;
    const qualifiedThisMonth = leads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getMonth() === 1 && d.getFullYear() === 2026 && (l.stage === "Qualified" || l.stage === "Won");
    }).length;

    // Avg time to first contact (for contacted leads)
    const contacted = inPeriod.filter(l => l.lastContactedAt);
    const avgMinutes = contacted.length > 0
      ? contacted.reduce((sum, l) => {
          const diff = (new Date(l.lastContactedAt).getTime() - new Date(l.createdAt).getTime()) / 60000;
          return sum + Math.max(0, diff);
        }, 0) / contacted.length
      : 0;
    const avgHours = (avgMinutes / 60).toFixed(1);

    const unassignedCount = leads.filter(l => !l.assignedTo).length;

    // SLA breaches: score >= 75 and not contacted within 60 min
    const slaBreaches = leads.filter(l => {
      if (l.qualScore < 75) return false;
      if (!l.lastContactedAt) return true;
      const diff = (new Date(l.lastContactedAt).getTime() - new Date(l.createdAt).getTime()) / 60000;
      return diff > 60;
    }).length;

    return {
      totalInPeriod: inPeriod.length,
      thisWeek: inWeek.length,
      convRate,
      avgHours,
      qualifiedThisMonth,
      unassignedCount,
      slaBreaches,
    };
  }, [leads, period]);

  // Time-series data for last 90 days
  const timeSeriesData = useMemo(() => {
    const now = new Date("2026-02-24T12:00:00");
    const weeks: { label: string; created: number; qualified: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(now); end.setDate(end.getDate() - i * 7);
      const start = new Date(end); start.setDate(start.getDate() - 7);
      const label = `${start.getMonth() + 1}/${start.getDate()}`;
      const created = leads.filter(l => {
        const d = new Date(l.createdAt);
        return d >= start && d < end;
      }).length;
      const qualified = leads.filter(l => {
        const d = new Date(l.createdAt);
        return d >= start && d < end && (l.stage === "Qualified" || l.stage === "Won");
      }).length;
      weeks.push({ label, created, qualified });
    }
    return weeks;
  }, [leads]);

  // Funnel conversion
  const funnelData = useMemo(() => {
    const stages: LeadStage[] = ["New", "Contacted", "Qualified", "Won"];
    return stages.map((stage, i) => {
      const count = leads.filter(l => stages.indexOf(l.stage) >= i).length;
      const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
      return { stage, count, pct };
    });
  }, [leads]);

  const todayTasks = tasks.filter(t => !t.completed).slice(0, 10);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Lead management overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/leads?new=1")}>+ New Lead</Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Users className="h-5 w-5 text-stage-new" />} label={`Leads (${period}d)`} value={String(metrics.totalInPeriod)} sub={`+${metrics.thisWeek} this week`} />
        <MetricCard icon={<TrendingUp className="h-5 w-5 text-stage-won" />} label="Conversion Rate" value={`${metrics.convRate}%`} sub={`Won / total in ${period}d`} />
        <MetricCard icon={<Clock className="h-5 w-5 text-stage-contacted" />} label="Avg Time to Contact" value={`${metrics.avgHours} hrs`} sub="Median first response" />
        <MetricCard icon={<CheckCircle2 className="h-5 w-5 text-stage-qualified" />} label="Qualified This Month" value={String(metrics.qualifiedThisMonth)} sub="Feb 2026" />
      </div>

      {/* SLA + Unassigned alerts */}
      {(metrics.slaBreaches > 0 || metrics.unassignedCount > 0) && (
        <div className="flex gap-4 flex-wrap">
          {metrics.slaBreaches > 0 && (
            <Card className="border-destructive/30 flex-1 min-w-[200px]">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold">{metrics.slaBreaches} SLA Breaches</p>
                  <p className="text-xs text-muted-foreground">High-score leads not contacted within 60 min</p>
                </div>
              </CardContent>
            </Card>
          )}
          {metrics.unassignedCount > 0 && (
            <Card className="border-stage-contacted/30 flex-1 min-w-[200px]">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <UserX className="h-5 w-5 text-stage-contacted" />
                <div>
                  <p className="text-sm font-semibold">{metrics.unassignedCount} Unassigned</p>
                  <p className="text-xs text-muted-foreground">Leads without assigned rep</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} barSize={48}>
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {pipelineData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {pipelineData.map((s) => (
                <div key={s.stage} className="text-center">
                  <div className="text-2xl font-bold">{s.count}</div>
                  <Badge variant="secondary" className="text-xs mt-1">{s.stage}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Today's Follow-ups
              <Badge variant="outline">{todayTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {todayTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Time series + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leads Created vs Qualified (12 weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="hsl(217, 91%, 50%)" strokeWidth={2} name="Created" />
                  <Line type="monotone" dataKey="qualified" stroke="hsl(262, 83%, 58%)" strokeWidth={2} name="Qualified" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              {funnelData.map((f, i) => (
                <div key={f.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{f.stage}</span>
                    <span className="text-muted-foreground">{f.count} ({f.pct}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${f.pct}%`,
                        backgroundColor: pipelineData[i]?.color || "hsl(217, 91%, 50%)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            Recent Leads
            <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 px-2 font-medium">Lead</th>
                  <th className="text-left py-3 px-2 font-medium">Company</th>
                  <th className="text-left py-3 px-2 font-medium">Source</th>
                  <th className="text-left py-3 px-2 font-medium">Stage</th>
                  <th className="text-left py-3 px-2 font-medium">Score</th>
                  <th className="text-left py-3 px-2 font-medium">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 8).map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td className="py-3 px-2">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.email}</div>
                    </td>
                    <td className="py-3 px-2">{lead.company}</td>
                    <td className="py-3 px-2 text-muted-foreground">{lead.source}</td>
                    <td className="py-3 px-2">
                      <Badge className={`${stageColors[lead.stage]} text-xs border-0`}>{lead.stage}</Badge>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${
                        lead.qualLevel === "High" ? "text-qual-high" :
                        lead.qualLevel === "Medium" ? "text-qual-medium" : "text-qual-low"
                      }`}>{lead.qualScore}%</span>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{lead.assignedTo}</td>
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

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task }: { task: { id: string; title: string; leadName: string; dueDate: string; completed: boolean; type: string } }) {
  const { toggleTask } = useData();
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${task.completed ? "bg-muted/50 opacity-60" : "hover:bg-accent/50"}`}>
      <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? "line-through" : ""}`}>{task.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{task.leadName} · {task.dueDate}</p>
      </div>
      <span className="text-muted-foreground">{taskIcons[task.type]}</span>
    </div>
  );
}
