import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Activity, Users, Stethoscope, Syringe, Radio, RefreshCw, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

function StatCard({ title, value, icon: Icon, color, href }: { title: string; value: number | string; icon: any; color: string; href?: string }) {
  const content = (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-muted`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

export default function Dashboard() {
  const { t } = useLang();
  const [refreshKey, setRefreshKey] = useState(0);
  const overview = trpc.dashboard.overview.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const incidents = trpc.incidents.list.useQuery({ status: "ACTIVATED", limit: 5 });

  const statusColors: Record<string, string> = {
    ACTIVATED: "bg-green-500/20 text-green-400 border-green-500/30",
    ESCALATED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    DEACTIVATED: "bg-muted text-muted-foreground",
    CLOSED: "bg-muted text-muted-foreground",
  };

  const severityColors: Record<string, string> = {
    LOW: "text-green-400",
    MODERATE: "text-yellow-400",
    HIGH: "text-orange-400",
    CATASTROPHIC: "text-red-400",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {overview.data ? `Last updated: ${new Date(overview.data.asOf).toLocaleTimeString()}` : "Loading..."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { overview.refetch(); incidents.refetch(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {overview.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title={t("dashboard.activeIncidents")} value={overview.data?.activeIncidents ?? 0} icon={AlertTriangle} color="text-red-400" href="/incidents" />
          <StatCard title={t("dashboard.totalCasualties")} value={overview.data?.totalCasualties ?? 0} icon={Users} color="text-yellow-400" href="/tracking" />
          <StatCard title={t("dashboard.immediate")} value={overview.data?.immediateCount ?? 0} icon={Stethoscope} color="text-red-500" href="/triage" />
          <StatCard title={t("dashboard.orActive")} value={overview.data?.orActive ?? 0} icon={Syringe} color="text-blue-400" href="/or-queue" />
          <StatCard title={t("dashboard.orPending")} value={overview.data?.orPending ?? 0} icon={Activity} color="text-purple-400" href="/or-queue" />
        </div>
      )}

      {/* Active Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Active Incidents</CardTitle>
            <Link href="/incidents" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidents.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : incidents.data?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active incidents</p>
              </div>
            ) : (
              incidents.data?.map(inc => (
                <Link key={inc.id} href={`/incidents/${inc.id}`} className="block p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{inc.name}</p>
                        <p className="text-xs text-muted-foreground">{inc.incidentCode}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className={statusColors[inc.status] ?? ""}>
                          {t(`incident.status.${inc.status}`)}
                        </Badge>
                        <span className={`text-xs font-medium ${severityColors[inc.severity] ?? ""}`}>
                          {t(`incident.severity.${inc.severity}`)}
                        </span>
                      </div>
                    </div>
                    {inc.locationDescription && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{inc.locationDescription}</p>
                    )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "Declare Incident", labelAr: "الإعلان عن حادث", href: "/incidents", icon: AlertTriangle, color: "text-red-400" },
              { label: "Register Casualty", labelAr: "تسجيل ضحية", href: "/triage", icon: Users, color: "text-yellow-400" },
              { label: "OR Queue", labelAr: "قائمة العمليات", href: "/or-queue", icon: Syringe, color: "text-blue-400" },
              { label: "Resources", labelAr: "الموارد", href: "/resources", icon: Activity, color: "text-green-400" },
              { label: "ICS Forms", labelAr: "نماذج ICS", href: "/ics-forms", icon: Radio, color: "text-purple-400" },
              { label: "After-Action", labelAr: "مراجعة الحادث", href: "/aar", icon: Activity, color: "text-orange-400" },
            ].map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-center">
                    <Icon className={`h-6 w-6 ${action.color}`} />
                    <span className="text-xs font-medium">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.labelAr}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
