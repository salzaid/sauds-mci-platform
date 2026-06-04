import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLang } from "@/contexts/LanguageContext";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, AlertTriangle, Activity, Users, Stethoscope,
  Truck, FileText, BarChart3, Radio, Settings, Globe, Menu, X,
  LogOut, User, ChevronRight, Syringe, Package, ClipboardList
} from "lucide-react";

const navItems = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.incidents", href: "/incidents", icon: AlertTriangle },
  { key: "nav.triage", href: "/triage", icon: Stethoscope },
  { key: "nav.tracking", href: "/tracking", icon: Activity },
  { key: "nav.orQueue", href: "/or-queue", icon: Syringe },
  { key: "nav.resources", href: "/resources", icon: Package },
  { key: "nav.transport", href: "/transport", icon: Truck },
  { key: "nav.icsForms", href: "/ics-forms", icon: FileText },
  { key: "nav.emtMds", href: "/emt-mds", icon: ClipboardList },
  { key: "nav.aar", href: "/aar", icon: BarChart3 },
  { key: "nav.comms", href: "/comms", icon: Radio },
];

const adminItems = [
  { key: "nav.admin", href: "/admin", icon: Settings },
];

interface MCILayoutProps {
  children: React.ReactNode;
}

export default function MCILayout({ children }: MCILayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { t, lang, setLang, dir } = useLang();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-5/6" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">MCI Platform</h1>
          </div>
          <p className="text-muted-foreground">Kuwait Ministry of Health — Disaster Management</p>
        </div>
        <Button size="lg" asChild>
          <a href={getLoginUrl()}>Sign In to Continue</a>
        </Button>
      </div>
    );
  }

  const isAdmin = user?.role === "superadmin" || user?.role === "admin";
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "??";

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location === item.href || location.startsWith(item.href + "/");
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
        <span>{t(item.key)}</span>
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
          <div className="text-xs text-muted-foreground truncate">منصة سعود للكوارث</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => <NavLink key={item.href} item={item} />)}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {lang === "ar" ? "الإدارة" : "Administration"}
              </p>
            </div>
            {adminItems.map(item => <NavLink key={item.href} item={item} />)}
          </>
        )}
        <div className="pt-3 pb-1">
          <Link href="/public-portal" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150">
            <Globe className="h-4 w-4 shrink-0" />
            <span>{t("nav.publicPortal")}</span>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-all duration-150">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-start">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{t(`role.${user?.role}`)}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setLang(lang === "en" ? "ar" : "en")}>
              <Globe className="h-4 w-4 mr-2" />
              {lang === "en" ? "العربية" : "English"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { void logout(); }} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden" dir={dir}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 z-10">
            <Sidebar />
          </div>
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
  );
}
