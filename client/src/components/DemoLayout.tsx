import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, AlertTriangle, Activity, Users, Stethoscope,
  Truck, FileText, BarChart3, Radio, Globe, Menu, ChevronRight,
  Syringe, Package, ClipboardList, Eye, X
} from "lucide-react";

const navItems = [
  { key: "nav.dashboard", label: "Dashboard", href: "/demo", icon: LayoutDashboard },
  { key: "nav.incidents", label: "Incidents", href: "/demo/incidents", icon: AlertTriangle },
  { key: "nav.triage", label: "Triage", href: "/demo/triage", icon: Stethoscope },
  { key: "nav.tracking", label: "Patient Tracking", href: "/demo/tracking", icon: Activity },
  { key: "nav.orQueue", label: "OR Queue", href: "/demo/or-queue", icon: Syringe },
  { key: "nav.resources", label: "Resources", href: "/demo/resources", icon: Package },
  { key: "nav.transport", label: "Transport", href: "/demo/transport", icon: Truck },
  { key: "nav.icsForms", label: "ICS Forms", href: "/demo/ics-forms", icon: FileText },
  { key: "nav.emtMds", label: "EMT MDS", href: "/demo/emt-mds", icon: ClipboardList },
  { key: "nav.aar", label: "After-Action Review", href: "/demo/aar", icon: BarChart3 },
  { key: "nav.comms", label: "Communications", href: "/demo/comms", icon: Radio },
];

interface DemoLayoutProps {
  children: React.ReactNode;
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  const { lang, setLang, dir } = useLang();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location === item.href || (item.href !== "/demo" && location.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
        {isActive && <ChevronRight className={`h-3 w-3 ${dir === "rtl" ? "mr-auto rotate-180" : "ml-auto"}`} />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <AlertTriangle className="h-6 w-6 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-sm text-sidebar-foreground truncate">Saud's MCI Platform</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-xs px-1.5 py-0 text-yellow-400 border-yellow-500/40 bg-yellow-500/10">
              <Eye className="h-2.5 w-2.5 mr-1" />DEMO
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => <NavLink key={item.href} item={item} />)}
        <div className="pt-3 pb-1">
          <Link href="/demo/public-portal" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150">
            <Globe className="h-4 w-4 shrink-0" />
            <span>Family Reunification Portal</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent transition-all"
        >
          <Globe className="h-3.5 w-3.5" />
          {lang === "en" ? "Switch to العربية" : "Switch to English"}
        </button>
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent transition-all">
          <AlertTriangle className="h-3.5 w-3.5" />
          Exit Demo
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden" dir={dir}>
      {/* Demo Banner */}
      {!bannerDismissed && (
        <div className="shrink-0 bg-yellow-500/15 border-b border-yellow-500/30 px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-yellow-400 shrink-0" />
            <span className="text-yellow-300 font-medium">Demo Mode</span>
            <span className="text-yellow-400/80 hidden sm:inline">— Read-only showcase with sample data. No login required. All data is fictional.</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xs text-yellow-400 hover:text-yellow-300 underline hidden sm:block">
              View live platform →
            </Link>
            <button onClick={() => setBannerDismissed(true)} className="text-yellow-400/60 hover:text-yellow-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-64 shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-64 z-10"><Sidebar /></div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <button onClick={() => setSidebarOpen(true)} className="text-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">Saud's MCI</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0 text-yellow-400 border-yellow-500/40">DEMO</Badge>
            </div>
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-muted-foreground text-xs font-medium">
              {lang === "en" ? "AR" : "EN"}
            </button>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
