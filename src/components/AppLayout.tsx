import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, MessageSquare, Search, Bell,
  ChevronDown, Globe,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Engagement", url: "/engagement", icon: MessageSquare },
  { title: "Web Chat", url: "/webchat", icon: Globe },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 bg-card border-b flex items-center px-4 gap-4 shrink-0 z-30">
        <div className="font-bold text-lg tracking-tight text-primary">
          Saludsa<span className="text-muted-foreground font-normal ml-1">CRM</span>
        </div>
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="bg-accent text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search leads..." className="w-56 pl-9 h-9 bg-muted/50" />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">3</span>
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">CM</div>
            <span className="text-sm font-medium hidden lg:inline">Carlos M.</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
