import { leads, pipelineData, tasks } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
} from "lucide-react";

const stageColors: Record<string, string> = {
  New: "bg-stage-new",
  Contacted: "bg-stage-contacted",
  Qualified: "bg-stage-qualified",
  Won: "bg-stage-won",
};

const taskIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  meeting: <Calendar className="h-3.5 w-3.5" />,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.stage === "Won").length;
  const conversionRate = Math.round((wonLeads / totalLeads) * 100);
  const todayTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Lead management overview — February 2026</p>
        </div>
        <Button onClick={() => navigate("/leads?new=1")}>+ New Lead</Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Users className="h-5 w-5 text-stage-new" />} label="Total Leads" value={totalLeads.toString()} sub="+2 this week" />
        <MetricCard icon={<TrendingUp className="h-5 w-5 text-stage-won" />} label="Conversion Rate" value={`${conversionRate}%`} sub="Across all stages" />
        <MetricCard icon={<Clock className="h-5 w-5 text-stage-contacted" />} label="Avg. Time to Contact" value="1.8 hrs" sub="Target: < 2 hrs" />
        <MetricCard icon={<CheckCircle2 className="h-5 w-5 text-stage-qualified" />} label="Qualified This Month" value="2" sub="Goal: 5" />
      </div>

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

            {/* Pipeline stages row */}
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
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  task.completed ? "bg-muted/50 opacity-60" : "hover:bg-accent/50"
                }`}
              >
                <Checkbox checked={task.completed} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.leadName} · {task.dueDate}
                  </p>
                </div>
                <span className="text-muted-foreground">{taskIcons[task.type]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads Table */}
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
                {leads.slice(0, 5).map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="py-3 px-2">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.email}</div>
                    </td>
                    <td className="py-3 px-2">{lead.company}</td>
                    <td className="py-3 px-2 text-muted-foreground">{lead.source}</td>
                    <td className="py-3 px-2">
                      <Badge
                        className={`${stageColors[lead.stage]} text-xs border-0`}
                      >
                        {lead.stage}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${
                        lead.qualLevel === "High" ? "text-qual-high" :
                        lead.qualLevel === "Medium" ? "text-qual-medium" : "text-qual-low"
                      }`}>
                        {lead.qualScore}%
                      </span>
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
