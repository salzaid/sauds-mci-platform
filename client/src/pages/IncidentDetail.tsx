import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Users, Syringe, Truck, ArrowLeft, Activity, Radio } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ACTIVATED: "bg-green-500/20 text-green-400 border-green-500/30",
  ESCALATED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DEACTIVATED: "bg-muted text-muted-foreground",
  CLOSED: "bg-muted text-muted-foreground",
};

const triageColors: Record<string, string> = {
  IMMEDIATE: "bg-red-500/20 text-red-400", DELAYED: "bg-yellow-500/20 text-yellow-400",
  MINIMAL: "bg-green-500/20 text-green-400", EXPECTANT: "bg-gray-500/20 text-gray-400",
  DECEASED: "bg-gray-700/20 text-gray-500", UNKNOWN: "bg-muted text-muted-foreground",
};

export default function IncidentDetail({ id }: { id: number }) {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: incident, isLoading } = trpc.incidents.get.useQuery({ id });
  const { data: board } = trpc.incidents.getBoard.useQuery({ id }, { refetchInterval: 15000 });

  const updateStatus = trpc.incidents.updateStatus.useMutation({
    onSuccess: () => { utils.incidents.get.invalidate({ id }); utils.incidents.getBoard.invalidate({ id }); toast.success("Status updated"); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <div className="p-6 space-y-4">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (!incident) return <div className="p-6 text-muted-foreground">Incident not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/incidents")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={statusColors[incident.status]}>{t(`incident.status.${incident.status}`)}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{incident.incidentCode}</span>
          </div>
          <h1 className="text-2xl font-bold truncate">{incident.name}</h1>
          {incident.nameAr && <p className="text-muted-foreground text-sm" dir="rtl">{incident.nameAr}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Activated: {new Date(incident.activatedAt).toLocaleString()}
            {incident.locationDescription && ` · ${incident.locationDescription}`}
          </p>
        </div>
        <div className="shrink-0">
          <Select
            value={incident.status}
            onValueChange={v => updateStatus.mutate({ id, status: v as any })}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["ACTIVATED","ESCALATED","DEACTIVATED","CLOSED"].map(s => (
                <SelectItem key={s} value={s}>{t(`incident.status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live Board */}
      {board && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(board.triageTally).map(([cat, count]) => (
            <Card key={cat} className="text-center">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${triageColors[cat]?.split(" ")[1] ?? ""}`}>{count}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(`triage.${cat}`)}</div>
              </CardContent>
            </Card>
          ))}
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">{board.orQueue}</div>
              <div className="text-xs text-muted-foreground mt-1">OR Queue</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">{board.transportQueue}</div>
              <div className="text-xs text-muted-foreground mt-1">In Transport</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Triage", icon: AlertTriangle, href: `/triage/${id}`, color: "text-red-400" },
          { label: "Patient Tracking", icon: Users, href: `/tracking/${id}`, color: "text-yellow-400" },
          { label: "OR Queue", icon: Syringe, href: `/or-queue/${id}`, color: "text-blue-400" },
          { label: "Transport", icon: Truck, href: `/transport/${id}`, color: "text-green-400" },
          { label: "ICS Forms", icon: Activity, href: `/ics-forms/${id}`, color: "text-purple-400" },
          { label: "Communications", icon: Radio, href: `/comms/${id}`, color: "text-orange-400" },
          { label: "EMT MDS", icon: Activity, href: `/emt-mds`, color: "text-cyan-400" },
          { label: "After-Action", icon: Activity, href: `/aar`, color: "text-pink-400" },
        ].map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all">
              <Icon className={`h-5 w-5 ${action.color} shrink-0`} />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Incident details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Incident Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{incident.type.replace(/_/g," ")}</p></div>
          <div><p className="text-muted-foreground text-xs">Severity</p><p className="font-medium">{t(`incident.severity.${incident.severity}`)}</p></div>
          <div><p className="text-muted-foreground text-xs">Est. Casualties</p><p className="font-medium">{incident.estimatedCasualties ?? "—"}</p></div>
          {incident.locationDescription && <div className="col-span-2"><p className="text-muted-foreground text-xs">Location</p><p className="font-medium">{incident.locationDescription}</p></div>}
          {incident.notes && <div className="col-span-3"><p className="text-muted-foreground text-xs">Notes</p><p className="font-medium">{incident.notes}</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}
