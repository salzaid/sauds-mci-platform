import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  AlertTriangle, Users, Syringe, Activity, Package, Truck,
  FileText, ClipboardList, BarChart3, Radio, ChevronRight,
  MapPin, Clock, ArrowLeft, CheckCircle, Eye, Globe, Shield,
  RefreshCw, Search
} from "lucide-react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  ACTIVATED: "bg-green-500/20 text-green-400 border-green-500/30",
  ESCALATED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DEACTIVATED: "bg-muted text-muted-foreground border-border",
  CLOSED: "bg-muted text-muted-foreground border-border",
};
const severityColors: Record<string, string> = {
  LOW: "text-green-400", MODERATE: "text-yellow-400", HIGH: "text-orange-400", CATASTROPHIC: "text-red-400",
};
const triageColors: Record<string, string> = {
  IMMEDIATE: "bg-red-600 text-white", DELAYED: "bg-yellow-500 text-black",
  MINIMAL: "bg-green-600 text-white", EXPECTANT: "bg-gray-700 text-gray-300",
  DECEASED: "bg-gray-900 text-gray-500", UNKNOWN: "bg-muted text-muted-foreground",
};
const orStatusColors: Record<string, string> = {
  PROPOSED: "bg-muted text-muted-foreground", SCHEDULED: "bg-blue-500/20 text-blue-400",
  IN_OR_PREP: "bg-yellow-500/20 text-yellow-400", INDUCTION: "bg-orange-500/20 text-orange-400",
  INCISION: "bg-red-500/20 text-red-400", CLOSURE: "bg-purple-500/20 text-purple-400",
  IN_PACU: "bg-cyan-500/20 text-cyan-400", OUT_PACU: "bg-green-500/20 text-green-400",
  COMPLETE: "bg-muted text-muted-foreground", CANCELLED: "bg-muted text-muted-foreground", ABORTED: "bg-red-900/20 text-red-600",
};

const ReadOnlyBanner = () => (
  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400 mb-4">
    <Eye className="h-3.5 w-3.5 shrink-0" />
    <span>Demo mode — read-only. All data is sample data for showcase purposes.</span>
  </div>
);

// ─── Demo Dashboard ───────────────────────────────────────────────────────────

export function DemoDashboard() {
  const overview = trpc.demo.overview.useQuery(undefined, { refetchInterval: 30000 });
  const incidents = trpc.demo.listIncidents.useQuery({ status: "ACTIVATED", limit: 5 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Command Dashboard — لوحة القيادة</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time overview across all active incidents</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { overview.refetch(); incidents.refetch(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>
      <ReadOnlyBanner />

      {overview.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Active Incidents", value: overview.data?.activeIncidents ?? 0, color: "text-red-400", icon: AlertTriangle, href: "/demo/incidents" },
            { label: "Total Casualties", value: overview.data?.totalCasualties ?? 0, color: "text-yellow-400", icon: Users, href: "/demo/tracking" },
            { label: "Immediate (Red)", value: overview.data?.immediateCount ?? 0, color: "text-red-500", icon: Syringe, href: "/demo/triage" },
            { label: "Active OR Cases", value: overview.data?.orActive ?? 0, color: "text-blue-400", icon: Activity, href: "/demo/or-queue" },
            { label: "Pending OR Cases", value: overview.data?.orPending ?? 0, color: "text-purple-400", icon: Activity, href: "/demo/or-queue" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm text-muted-foreground mb-1">{stat.label}</p><p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p></div>
                      <div className="p-3 rounded-xl bg-muted"><Icon className={`h-6 w-6 ${stat.color}`} /></div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Active Incidents</CardTitle>
            <Link href="/demo/incidents" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidents.isLoading ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />) :
            incidents.data?.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">No active incidents</p> :
            incidents.data?.map(inc => (
              <Link key={inc.id} href={`/demo/incidents/${inc.id}`} className="block p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{inc.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{inc.incidentCode}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={statusColors[inc.status]}>{inc.status}</Badge>
                    <span className={`text-xs font-medium ${severityColors[inc.severity]}`}>{inc.severity}</span>
                  </div>
                </div>
                {inc.locationDescription && <p className="text-xs text-muted-foreground mt-1 truncate">{inc.locationDescription}</p>}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Quick Navigation</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "Incidents", href: "/demo/incidents", icon: AlertTriangle, color: "text-red-400" },
              { label: "Triage", href: "/demo/triage", icon: Syringe, color: "text-yellow-400" },
              { label: "Patient Tracking", href: "/demo/tracking", icon: Users, color: "text-blue-400" },
              { label: "OR Queue", href: "/demo/or-queue", icon: Activity, color: "text-green-400" },
              { label: "Resources", href: "/demo/resources", icon: Package, color: "text-purple-400" },
              { label: "After-Action Review", href: "/demo/aar", icon: BarChart3, color: "text-orange-400" },
            ].map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-center">
                  <Icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Demo Incidents ───────────────────────────────────────────────────────────

export function DemoIncidents() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: incidents, isLoading } = trpc.demo.listIncidents.useQuery({ status: statusFilter !== "all" ? statusFilter : undefined, limit: 20 });

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Incidents — الحوادث</h1><p className="text-muted-foreground text-sm mt-1">All declared MCI incidents</p></div>
      <ReadOnlyBanner />
      <div className="flex gap-2 flex-wrap">
        {["all","ACTIVATED","ESCALATED","DEACTIVATED","CLOSED"].map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : s}
          </Button>
        ))}
      </div>
      {isLoading ? <div className="space-y-3">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-24" />)}</div> :
      <div className="space-y-3">
        {incidents?.map(inc => (
          <Link key={inc.id} href={`/demo/incidents/${inc.id}`} className="block">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={statusColors[inc.status]}>{inc.status}</Badge>
                      <span className={`text-xs font-semibold ${severityColors[inc.severity]}`}>{inc.severity}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{inc.type.replace(/_/g," ")}</span>
                    </div>
                    <h3 className="font-semibold truncate">{inc.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{inc.incidentCode}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      {inc.locationDescription && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inc.locationDescription}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(inc.activatedAt).toLocaleString()}</span>
                      {inc.estimatedCasualties ? <span>~{inc.estimatedCasualties} est. casualties</span> : null}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>}
    </div>
  );
}

// ─── Demo Incident Detail ─────────────────────────────────────────────────────

export function DemoIncidentDetail({ id }: { id: number }) {
  const { data: incident, isLoading } = trpc.demo.getIncident.useQuery({ id });
  const { data: board } = trpc.demo.getIncidentBoard.useQuery({ id }, { refetchInterval: 15000 });

  if (isLoading) return <div className="p-6 space-y-4">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (!incident) return <div className="p-6 text-muted-foreground">Incident not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/demo/incidents"><a className="p-2 rounded-lg hover:bg-accent transition-colors"><ArrowLeft className="h-4 w-4" /></a></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={statusColors[incident.status]}>{incident.status}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{incident.incidentCode}</span>
          </div>
          <h1 className="text-2xl font-bold">{incident.name}</h1>
          {incident.nameAr && <p className="text-muted-foreground text-sm" dir="rtl">{incident.nameAr}</p>}
          <p className="text-xs text-muted-foreground mt-1">Activated: {new Date(incident.activatedAt).toLocaleString()}{incident.locationDescription && ` · ${incident.locationDescription}`}</p>
        </div>
      </div>
      <ReadOnlyBanner />

      {board && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(board.triageTally).map(([cat, count]) => (
            <Card key={cat} className="text-center"><CardContent className="p-4">
              <div className={`text-2xl font-bold ${cat === "IMMEDIATE" ? "text-red-400" : cat === "DELAYED" ? "text-yellow-400" : cat === "MINIMAL" ? "text-green-400" : "text-gray-400"}`}>{count}</div>
              <div className="text-xs text-muted-foreground mt-1">{cat}</div>
            </CardContent></Card>
          ))}
          <Card className="text-center"><CardContent className="p-4"><div className="text-2xl font-bold text-blue-400">{board.orQueue}</div><div className="text-xs text-muted-foreground mt-1">OR Queue</div></CardContent></Card>
          <Card className="text-center"><CardContent className="p-4"><div className="text-2xl font-bold text-purple-400">{board.transportQueue}</div><div className="text-xs text-muted-foreground mt-1">In Transport</div></CardContent></Card>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Patient Tracking", icon: Users, href: `/demo/tracking/${id}`, color: "text-yellow-400" },
          { label: "OR Queue", icon: Syringe, href: `/demo/or-queue/${id}`, color: "text-blue-400" },
          { label: "Transport", icon: Truck, href: `/demo/transport/${id}`, color: "text-green-400" },
          { label: "ICS Forms", icon: FileText, href: `/demo/ics-forms/${id}`, color: "text-purple-400" },
          { label: "Communications", icon: Radio, href: `/demo/comms/${id}`, color: "text-orange-400" },
          { label: "EMT MDS", icon: ClipboardList, href: `/demo/emt-mds`, color: "text-cyan-400" },
          { label: "After-Action", icon: BarChart3, href: `/demo/aar`, color: "text-pink-400" },
          { label: "Triage Board", icon: Activity, href: `/demo/triage/${id}`, color: "text-red-400" },
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

      <Card>
        <CardHeader><CardTitle className="text-base">Incident Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{incident.type.replace(/_/g," ")}</p></div>
          <div><p className="text-muted-foreground text-xs">Severity</p><p className={`font-medium ${severityColors[incident.severity]}`}>{incident.severity}</p></div>
          <div><p className="text-muted-foreground text-xs">Est. Casualties</p><p className="font-medium">{incident.estimatedCasualties ?? "—"}</p></div>
          {incident.closedAt && <div><p className="text-muted-foreground text-xs">Closed</p><p className="font-medium">{new Date(incident.closedAt).toLocaleString()}</p></div>}
          {incident.notes && <div className="col-span-3"><p className="text-muted-foreground text-xs">Notes</p><p className="font-medium text-sm">{incident.notes}</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Demo Triage ──────────────────────────────────────────────────────────────

export function DemoTriage({ incidentId }: { incidentId?: number }) {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: casualties, isLoading } = trpc.demo.listCasualties.useQuery({ incidentId: selectedIncident! }, { enabled: !!selectedIncident, refetchInterval: 20000 });

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Scene Triage — الفرز الميداني</h1><p className="text-muted-foreground text-sm mt-1">SALT · START · JumpSTART — casualty triage board</p></div>
      <ReadOnlyBanner />
      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedIncident && casualties && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED"].map(cat => {
            const count = casualties.filter(c => c.currentTriageCategory === cat).length;
            return (
              <Card key={cat} className="text-center"><CardContent className="p-4">
                <div className={`text-3xl font-bold mb-1 ${cat === "IMMEDIATE" ? "text-red-400" : cat === "DELAYED" ? "text-yellow-400" : cat === "MINIMAL" ? "text-green-400" : "text-gray-400"}`}>{count}</div>
                <div className={`text-xs px-2 py-0.5 rounded font-medium inline-block ${triageColors[cat]}`}>{cat}</div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
      {selectedIncident && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Registered Casualties</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-12" />)}</div> :
            casualties?.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">No casualties registered</p> :
            <div className="space-y-2">
              {casualties?.map(c => (
                <Link key={c.id} href={`/demo/casualties/${c.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${triageColors[c.currentTriageCategory]}`}>{c.currentTriageCategory.slice(0,3)}</span>
                    <div>
                      <p className="font-mono text-sm font-medium">{c.provisionalId}</p>
                      <p className="text-xs text-muted-foreground">{c.sex} {c.estimatedAge ? `· ~${c.estimatedAge}yr` : ""} · {c.disposition.replace(/_/g," ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.identityConfirmed && <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">ID Confirmed</Badge>}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>}
          </CardContent>
        </Card>
      )}
      {!selectedIncident && <Card><CardContent className="py-16 text-center text-muted-foreground"><Syringe className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Select an incident to view the triage board</p></CardContent></Card>}
    </div>
  );
}

// ─── Demo Patient Tracking ────────────────────────────────────────────────────

export function DemoPatientTracking({ incidentId }: { incidentId?: number }) {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [catFilter, setCatFilter] = useState("all");
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: casualties, isLoading } = trpc.demo.listCasualties.useQuery({ incidentId: selectedIncident!, triageCategory: catFilter !== "all" ? catFilter : undefined, limit: 100 }, { enabled: !!selectedIncident, refetchInterval: 20000 });

  const dispositionColors: Record<string, string> = {
    AT_SCENE: "text-orange-400", IN_TRANSPORT: "text-blue-400", AT_FACILITY: "text-green-400",
    DISCHARGED: "text-muted-foreground", TRANSFERRED: "text-purple-400", DECEASED: "text-gray-500",
  };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Patient Tracking — تتبع المرضى</h1><p className="text-muted-foreground text-sm mt-1">HICS 254-equivalent tracking board</p></div>
      <ReadOnlyBanner />
      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedIncident && (
        <>
          <div className="flex gap-2 flex-wrap">
            {["all","IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED","UNKNOWN"].map(cat => (
              <Button key={cat} variant={catFilter === cat ? "default" : "outline"} size="sm" onClick={() => setCatFilter(cat)}>
                {cat === "all" ? "All" : cat}
              </Button>
            ))}
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Casualties ({casualties?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <div className="space-y-2">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-14" />)}</div> :
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left pb-2 pr-4">Provisional ID</th>
                    <th className="text-left pb-2 pr-4">Triage</th>
                    <th className="text-left pb-2 pr-4">Name</th>
                    <th className="text-left pb-2 pr-4">Age/Sex</th>
                    <th className="text-left pb-2 pr-4">Disposition</th>
                    <th className="text-left pb-2">Identity</th>
                    <th className="pb-2"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {casualties?.map(c => (
                      <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 pr-4 font-mono text-xs font-medium">{c.provisionalId}</td>
                        <td className="py-3 pr-4"><span className={`text-xs px-2 py-0.5 rounded font-bold ${triageColors[c.currentTriageCategory]}`}>{c.currentTriageCategory}</span></td>
                        <td className="py-3 pr-4">{c.identityConfirmed ? `${c.firstName} ${c.lastName}` : <span className="text-muted-foreground italic">Unknown</span>}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{c.estimatedAge ? `~${c.estimatedAge}yr` : "—"} / {c.sex}</td>
                        <td className="py-3 pr-4"><span className={`text-xs font-medium ${dispositionColors[c.disposition]}`}>{c.disposition.replace(/_/g," ")}</span></td>
                        <td className="py-3 pr-4">{c.identityConfirmed ? <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">Confirmed</Badge> : <Badge variant="outline" className="text-xs">Provisional</Badge>}</td>
                        <td className="py-3"><Link href={`/demo/casualties/${c.id}`} className="text-primary hover:text-primary/80"><ChevronRight className="h-4 w-4" /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
            </CardContent>
          </Card>
        </>
      )}
      {!selectedIncident && <Card><CardContent className="py-16 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Select an incident to view the tracking board</p></CardContent></Card>}
    </div>
  );
}

// ─── Demo Casualty Detail ─────────────────────────────────────────────────────

export function DemoCasualtyDetail({ id }: { id: number }) {
  const { data: casualty, isLoading } = trpc.demo.getCasualty.useQuery({ id });
  const { data: timeline } = trpc.demo.getCasualtyTimeline.useQuery({ casualtyId: id });
  const { data: triageHistory } = trpc.demo.getCasualtyTriage.useQuery({ casualtyId: id });

  if (isLoading) return <div className="p-6 space-y-4">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (!casualty) return <div className="p-6 text-muted-foreground">Casualty not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/demo/tracking"><a className="p-2 rounded-lg hover:bg-accent transition-colors"><ArrowLeft className="h-4 w-4" /></a></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded font-bold ${triageColors[casualty.currentTriageCategory]}`}>{casualty.currentTriageCategory}</span>
            {casualty.identityConfirmed && <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">Identity Confirmed</Badge>}
          </div>
          <h1 className="text-2xl font-bold font-mono">{casualty.provisionalId}</h1>
          {casualty.identityConfirmed && <p className="text-muted-foreground">{casualty.firstName} {casualty.lastName}</p>}
          <p className="text-xs text-muted-foreground mt-1">{casualty.sex} {casualty.estimatedAge ? `· ~${casualty.estimatedAge}yr` : ""} · {casualty.disposition.replace(/_/g," ")}</p>
        </div>
      </div>
      <ReadOnlyBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Event Timeline</CardTitle></CardHeader>
          <CardContent>
            {timeline?.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">No events recorded</p> :
            <div className="space-y-3">
              {timeline?.map((ev, i) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    {i < (timeline.length - 1) && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{ev.eventType.replace(/_/g," ")}</span>
                      {ev.triageCategory && <span className={`text-xs px-1.5 py-0.5 rounded ${triageColors[ev.triageCategory]}`}>{ev.triageCategory}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{new Date(ev.validTime).toLocaleString()}</p>
                    {ev.locationDescription && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.locationDescription}</p>}
                    {ev.notes && <p className="text-xs text-muted-foreground mt-1 italic">{ev.notes}</p>}
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Triage Assessments</CardTitle></CardHeader>
          <CardContent>
            {triageHistory?.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">No triage assessments</p> :
            <div className="space-y-3">
              {triageHistory?.map(ta => (
                <div key={ta.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${triageColors[ta.category]}`}>{ta.category}</span>
                    <span className="text-xs text-muted-foreground">{ta.algorithm} · {new Date(ta.assessedAt).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {ta.respiratoryRate && <span>RR: {ta.respiratoryRate}/min</span>}
                    {ta.pulsePresent !== null && <span>Pulse: {ta.pulsePresent ? "Present" : "Absent"}</span>}
                    {ta.mentalStatus && <span>Mental: {ta.mentalStatus}</span>}
                    {ta.tourniquet && <span className="text-orange-400">Tourniquet</span>}
                    {ta.airwayOpened && <span className="text-blue-400">Airway opened</span>}
                  </div>
                  {ta.notes && <p className="text-xs text-muted-foreground mt-1 italic">{ta.notes}</p>}
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Demo OR Queue ────────────────────────────────────────────────────────────

export function DemoORQueue({ incidentId }: { incidentId?: number }) {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: orCases, isLoading } = trpc.demo.listOrCases.useQuery({ incidentId: selectedIncident!, limit: 50 }, { enabled: !!selectedIncident, refetchInterval: 15000 });

  const filtered = statusFilter === "all" ? orCases : orCases?.filter(c => c.status === statusFilter);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">OR Queue — قائمة انتظار غرفة العمليات</h1><p className="text-muted-foreground text-sm mt-1">Surgical case prioritisation and state machine</p></div>
      <ReadOnlyBanner />
      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedIncident && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center"><CardContent className="p-4"><div className="text-3xl font-bold text-red-400">{orCases?.filter(c => ["IN_OR_PREP","INDUCTION","INCISION","CLOSURE"].includes(c.status)).length ?? 0}</div><div className="text-xs text-muted-foreground mt-1">Active in OR</div></CardContent></Card>
            <Card className="text-center"><CardContent className="p-4"><div className="text-3xl font-bold text-yellow-400">{orCases?.filter(c => ["PROPOSED","SCHEDULED"].includes(c.status)).length ?? 0}</div><div className="text-xs text-muted-foreground mt-1">Pending</div></CardContent></Card>
            <Card className="text-center"><CardContent className="p-4"><div className="text-3xl font-bold text-green-400">{orCases?.filter(c => c.status === "COMPLETE").length ?? 0}</div><div className="text-xs text-muted-foreground mt-1">Completed</div></CardContent></Card>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>All</Button>
            {["PROPOSED","SCHEDULED","IN_OR_PREP","INDUCTION","INCISION","CLOSURE","IN_PACU","OUT_PACU","COMPLETE","CANCELLED","ABORTED"].map(s => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>{s.replace(/_/g," ")}</Button>
            ))}
          </div>
          <div className="space-y-3">
            {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20" />) :
            filtered?.map(c => (
              <Card key={c.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={orStatusColors[c.status]}>{c.status.replace(/_/g," ")}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{c.caseCode}</span>
                        {c.isDamageControl && <Badge variant="outline" className="text-orange-400 border-orange-500/30 text-xs">DCS</Badge>}
                        {c.mtpActivated && <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs">MTP Active</Badge>}
                      </div>
                      <p className="font-medium text-sm">{c.procedureType ?? "Procedure TBD"}</p>
                      <p className="text-xs text-muted-foreground">Priority: {c.priority}/100 · Casualty #{c.casualtyId}</p>
                      {c.incisionAt && <p className="text-xs text-muted-foreground">Incision: {new Date(c.incisionAt).toLocaleTimeString()}</p>}
                      {c.closureAt && <p className="text-xs text-muted-foreground">Closure: {new Date(c.closureAt).toLocaleTimeString()}</p>}
                      {(c.rbcUnitsUsed || c.ffpUnitsUsed || c.plateletsUsed) ? (
                        <p className="text-xs text-muted-foreground mt-1">Blood: {c.rbcUnitsUsed} pRBC · {c.ffpUnitsUsed} FFP · {c.plateletsUsed} PLT</p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      {!selectedIncident && <Card><CardContent className="py-16 text-center text-muted-foreground"><Syringe className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Select an incident to view the OR queue</p></CardContent></Card>}
    </div>
  );
}

// ─── Demo Resources ───────────────────────────────────────────────────────────

export function DemoResources() {
  const { data: summary, isLoading } = trpc.demo.resourceSummary.useQuery();

  const resourceGroups: Record<string, string[]> = {
    "Critical Care": ["VENTILATOR","ICU_BED","HDU_BED","ECMO","DIALYSIS_STATION"],
    "Surgical": ["OR_ROOM","CT_SCANNER","CARM","MRI"],
    "Ward": ["WARD_BED"],
    "Blood Products": ["BLOOD_O_POS","BLOOD_O_NEG","BLOOD_A_POS","BLOOD_A_NEG","BLOOD_B_POS","BLOOD_B_NEG","BLOOD_AB_POS","BLOOD_AB_NEG"],
    "PPE": ["PPE_UNIVERSAL","PPE_DROPLET","PPE_AIRBORNE","PPE_CBRN"],
    "Medications": ["TXA","ATROPINE","PRALIDOXIME"],
  };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Resources & Logistics — الموارد</h1><p className="text-muted-foreground text-sm mt-1">Real-time inventory across all facilities</p></div>
      <ReadOnlyBanner />
      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-32" />)}</div> :
      Object.entries(resourceGroups).map(([group, types]) => {
        const groupResources = summary?.raw.filter(r => types.includes(r.type)) ?? [];
        if (groupResources.length === 0) return null;
        return (
          <div key={group}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupResources.map(r => {
                const pct = r.total > 0 ? Math.round((r.inUse / r.total) * 100) : 0;
                const isLow = r.available <= (r.lowThreshold ?? 0) && (r.lowThreshold ?? 0) > 0;
                return (
                  <Card key={r.id} className={isLow ? "border-orange-500/50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-muted-foreground">{r.type.replace(/_/g," ")}</p></div>
                        {isLow && <Badge variant="outline" className="text-orange-400 border-orange-500/30 text-xs">LOW</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                        <div><p className="text-2xl font-bold">{r.total}</p><p className="text-muted-foreground">Total</p></div>
                        <div><p className="text-2xl font-bold text-red-400">{r.inUse}</p><p className="text-muted-foreground">In Use</p></div>
                        <div><p className={`text-2xl font-bold ${r.available > 0 ? "text-green-400" : "text-red-400"}`}>{r.available}</p><p className="text-muted-foreground">Available</p></div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1 text-right">{pct}% utilization</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Demo Transport ───────────────────────────────────────────────────────────

export function DemoTransport({ incidentId }: { incidentId?: number }) {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: transports, isLoading } = trpc.demo.listTransports.useQuery({ incidentId: selectedIncident! }, { enabled: !!selectedIncident });

  const statusColors: Record<string, string> = {
    AVAILABLE: "text-green-400", DISPATCHED: "text-blue-400", EN_ROUTE: "text-yellow-400",
    AT_SCENE: "text-orange-400", LOADED: "text-purple-400", RETURNING: "text-cyan-400", OUT_OF_SERVICE: "text-muted-foreground",
  };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Transport — النقل</h1><p className="text-muted-foreground text-sm mt-1">Inter-facility transport assets and status</p></div>
      <ReadOnlyBanner />
      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedIncident && (
        <div className="space-y-3">
          {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20" />) :
          transports?.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground"><Truck className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No transports registered</p></CardContent></Card> :
          transports?.map(tr => (
            <Card key={tr.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${statusColors[tr.status]}`}>{tr.status.replace(/_/g," ")}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{tr.type}</span>
                      <span className="text-xs font-mono text-muted-foreground">{tr.transportCode}</span>
                    </div>
                    {tr.driverName && <p className="text-sm">Driver: {tr.driverName}</p>}
                    {tr.notes && <p className="text-xs text-muted-foreground mt-1">{tr.notes}</p>}
                    {tr.dispatchedAt && <p className="text-xs text-muted-foreground">Dispatched: {new Date(tr.dispatchedAt).toLocaleTimeString()}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!selectedIncident && <Card><CardContent className="py-16 text-center text-muted-foreground"><Truck className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Select an incident to view transports</p></CardContent></Card>}
    </div>
  );
}

// ─── Demo ICS Forms ───────────────────────────────────────────────────────────

export function DemoICSForms({ incidentId }: { incidentId?: number }) {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: forms, isLoading } = trpc.demo.listIcsForms.useQuery({ incidentId: selectedIncident! }, { enabled: !!selectedIncident });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground", SUBMITTED: "bg-blue-500/20 text-blue-400",
    ACKNOWLEDGED: "bg-green-500/20 text-green-400", SUPERSEDED: "bg-muted text-muted-foreground",
  };
  const formDescriptions: Record<string, string> = {
    HICS_201: "Incident Briefing", HICS_202: "Incident Objectives", HICS_203: "Organization Assignment",
    HICS_204: "Assignment List", HICS_205A: "Communications List", HICS_213: "General Message",
    HICS_214: "Activity Log", HICS_254: "Disaster Victim/Patient Tracking",
  };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">ICS Forms — نماذج ICS</h1><p className="text-muted-foreground text-sm mt-1">HICS 201, 202, 203, 204, 205A, 213, 214, 254</p></div>
      <ReadOnlyBanner />
      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedIncident && (
        <div className="space-y-3">
          {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16" />) :
          forms?.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No ICS forms submitted</p></CardContent></Card> :
          forms?.map(form => (
            <Card key={form.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={statusColors[form.status]}>{form.status}</Badge>
                      <span className="text-sm font-semibold">{form.formType.replace(/_/g," ")}</span>
                      <span className="text-xs text-muted-foreground">— {formDescriptions[form.formType]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{new Date(form.createdAt).toLocaleString()}
                      {form.acknowledgedAt && <span className="ml-2 text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Acknowledged</span>}
                    </p>
                    {form.formData && typeof form.formData === "object" && (form.formData as any).subject && (
                      <p className="text-xs text-muted-foreground mt-1">Subject: {(form.formData as any).subject}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!selectedIncident && <Card><CardContent className="py-16 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Select an incident to view ICS forms</p></CardContent></Card>}
    </div>
  );
}

// ─── Demo EMT MDS ─────────────────────────────────────────────────────────────

export function DemoEMTMds() {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>();
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: reports, isLoading } = trpc.demo.listEmtMds.useQuery({ incidentId: selectedIncident! }, { enabled: !!selectedIncident });

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">WHO EMT MDS Reports</h1><p className="text-muted-foreground text-sm mt-1">Emergency Medical Team Minimum Data Set — 85 items, 4 categories</p></div>
      <ReadOnlyBanner />
      <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
        <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
      </Select>
      {selectedIncident && (
        <div className="space-y-4">
          {isLoading ? Array.from({length:2}).map((_,i) => <Skeleton key={i} className="h-40" />) :
          reports?.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground"><ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No EMT MDS reports</p></CardContent></Card> :
          reports?.map(r => {
            const data = r.reportData as any;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{data.orgName} — {new Date(r.reportDate).toLocaleDateString()}</CardTitle>
                    <Badge variant="outline" className={r.status === "SUBMITTED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Classification: {data.emtClassification}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm mb-4">
                    {[
                      { label: "Consultations", value: data.totalConsultations },
                      { label: "Admissions", value: data.newAdmissions },
                      { label: "Trauma Cases", value: data.traumaCases },
                      { label: "Surgical Procs", value: data.surgicalProcedures },
                      { label: "Deaths", value: data.deaths, color: "text-red-400" },
                      { label: "Discharges", value: data.discharges, color: "text-green-400" },
                      { label: "Referrals", value: data.referrals },
                      { label: "Bed Capacity", value: data.totalBedCapacity },
                    ].map(stat => (
                      <div key={stat.label} className="p-3 bg-muted/50 rounded-lg">
                        <p className={`text-2xl font-bold ${stat.color ?? ""}`}>{stat.value ?? 0}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  {data.operationalConstraints && <div className="p-3 bg-muted/30 rounded-lg text-xs"><p className="font-medium mb-1">Operational Constraints</p><p className="text-muted-foreground">{data.operationalConstraints}</p></div>}
                  {data.communityRisks && <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs mt-2"><p className="font-medium mb-1 text-orange-400">Community Risks</p><p className="text-muted-foreground">{data.communityRisks}</p></div>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Demo AAR ─────────────────────────────────────────────────────────────────

export function DemoAAR() {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>();
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: kpis, isLoading } = trpc.demo.aarKpis.useQuery({ incidentId: selectedIncident! }, { enabled: !!selectedIncident });

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">After-Action Review — مراجعة ما بعد الحادث</h1><p className="text-muted-foreground text-sm mt-1">KPI analysis and incident performance metrics</p></div>
      <ReadOnlyBanner />
      <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident for AAR..." /></SelectTrigger>
        <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name} ({inc.status})</SelectItem>)}</SelectContent>
      </Select>
      {!selectedIncident && <Card><CardContent className="py-16 text-center text-muted-foreground"><BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Select an incident to view AAR KPIs</p><p className="text-xs mt-2">Try the CLOSED "Farwaniya Building Collapse" for a complete AAR</p></CardContent></Card>}
      {selectedIncident && isLoading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-28" />)}</div>}
      {kpis && (
        <>
          <div className="p-4 bg-card rounded-xl border border-border">
            <h2 className="font-semibold mb-1">{kpis.incidentName}</h2>
            <p className="text-xs text-muted-foreground font-mono">{kpis.incidentCode}</p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span>Activated: {new Date(kpis.activatedAt).toLocaleString()}</span>
              {kpis.closedAt && <span>Closed: {new Date(kpis.closedAt).toLocaleString()}</span>}
              {kpis.durationHours !== null && <span>Duration: {kpis.durationHours}h</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Casualties", value: kpis.totalCasualties, color: "text-yellow-400" },
              { label: "Deceased", value: `${kpis.deceased} (${kpis.mortalityRate}%)`, color: "text-red-400" },
              { label: "Discharged", value: kpis.discharged, color: "text-green-400" },
              { label: "OR Cases Completed", value: kpis.orCompleted, color: "text-blue-400" },
              { label: "Identity Confirmed", value: `${kpis.identityConfirmed}/${kpis.totalCasualties}`, color: "text-purple-400" },
              { label: "Duration", value: kpis.durationHours !== null ? `${kpis.durationHours}h` : "Ongoing", color: "text-orange-400" },
              { label: "Mortality Rate", value: `${kpis.mortalityRate}%`, color: "text-red-400" },
              { label: "Survival Rate", value: `${100 - kpis.mortalityRate}%`, color: "text-green-400" },
            ].map(stat => (
              <Card key={stat.label}><CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Standard KPIs — ASPR TRACIE / HICS</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left pb-2 pr-6">KPI</th><th className="text-left pb-2 pr-6">Value</th><th className="text-left pb-2">Benchmark</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-6">Total Casualties</td><td className="py-2 pr-6 font-medium">{kpis.totalCasualties}</td><td className="py-2 text-muted-foreground">—</td></tr>
                    <tr><td className="py-2 pr-6">Mortality Rate</td><td className="py-2 pr-6 font-medium">{kpis.mortalityRate}%</td><td className="py-2 text-muted-foreground">Varies by incident type</td></tr>
                    <tr><td className="py-2 pr-6">OR Cases Completed</td><td className="py-2 pr-6 font-medium">{kpis.orCompleted}</td><td className="py-2 text-muted-foreground">—</td></tr>
                    <tr><td className="py-2 pr-6">Identity Confirmation Rate</td><td className="py-2 pr-6 font-medium">{kpis.totalCasualties > 0 ? Math.round((kpis.identityConfirmed / kpis.totalCasualties) * 100) : 0}%</td><td className="py-2 text-muted-foreground">Target: 100%</td></tr>
                    <tr><td className="py-2 pr-6">Incident Duration</td><td className="py-2 pr-6 font-medium">{kpis.durationHours !== null ? `${kpis.durationHours} hours` : "Ongoing"}</td><td className="py-2 text-muted-foreground">—</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Demo Communications ──────────────────────────────────────────────────────

export function DemoComms({ incidentId }: { incidentId?: number }) {
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [channel, setChannel] = useState("GENERAL");
  const { data: incidents } = trpc.demo.listIncidents.useQuery({ limit: 20 });
  const { data: messages, isLoading } = trpc.demo.listComms.useQuery({ incidentId: selectedIncident!, channel, limit: 50 }, { enabled: !!selectedIncident, refetchInterval: 10000 });

  const channels = ["COMMAND","OPERATIONS","LOGISTICS","MEDICAL","GENERAL"];
  const priorityColors: Record<string, string> = { ROUTINE: "text-muted-foreground", URGENT: "text-orange-400", FLASH: "text-red-400" };
  const channelColors: Record<string, string> = { COMMAND: "text-red-400", OPERATIONS: "text-orange-400", LOGISTICS: "text-blue-400", MEDICAL: "text-green-400", GENERAL: "text-muted-foreground" };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Communications — الاتصالات</h1><p className="text-muted-foreground text-sm mt-1">Incident-scoped messaging by channel and priority</p></div>
      <ReadOnlyBanner />
      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedIncident && (
        <>
          <div className="flex gap-2 flex-wrap">
            {channels.map(ch => (
              <Button key={ch} variant={channel === ch ? "default" : "outline"} size="sm" onClick={() => setChannel(ch)}>
                <span className={channelColors[ch]}>{ch}</span>
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16" />) :
            messages?.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground"><Radio className="h-8 w-8 mx-auto mb-2 opacity-20" /><p className="text-sm">No messages in {channel} channel</p></CardContent></Card> :
            messages?.map(msg => (
              <Card key={msg.id} className={msg.priority === "FLASH" ? "border-red-500/50" : msg.priority === "URGENT" ? "border-orange-500/30" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {msg.priority !== "ROUTINE" && <Badge variant="outline" className={`${priorityColors[msg.priority]} border-current text-xs`}>{msg.priority}</Badge>}
                        <span className={`text-xs font-medium ${channelColors[msg.channel]}`}>{msg.channel}</span>
                        <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        {msg.acknowledgedAt && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Ack</span>}
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      {!selectedIncident && <Card><CardContent className="py-16 text-center text-muted-foreground"><Radio className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Select an incident to view communications</p></CardContent></Card>}
    </div>
  );
}

// ─── Demo Public Portal ───────────────────────────────────────────────────────

export function DemoPublicPortal() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isAr ? "rtl" : "ltr"}>
      <div className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/demo"><a className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></a></Link>
            <AlertTriangle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Saud's MCI Platform</p>
              <p className="text-xs text-muted-foreground">Family Reunification Portal — بوابة لمّ شمل الأسر</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            <Globe className="h-4 w-4 mr-2" />{lang === "en" ? "العربية" : "English"}
          </Button>
        </div>
      </div>
      <div className="container py-12 max-w-2xl">
        <div className="text-center mb-10">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">{isAr ? "بوابة لمّ شمل الأسر" : "Family Reunification Portal"}</h1>
          <p className="text-muted-foreground">{isAr ? "يمكنك البحث عن ذويك المصابين في الحوادث الكبرى." : "Search for loved ones affected by mass casualty incidents."}</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Demo Mode</p>
            <p className="text-xs">In the live platform, family members can search by civil ID or triage tag number to find the general status of a loved one. No personal medical data is displayed.</p>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-6">{isAr ? "هذه البوابة تعرض معلومات الحالة العامة فقط. لا تُشارك أي بيانات طبية شخصية." : "This portal displays general status information only. No personal medical data is shared."}</p>
      </div>
    </div>
  );
}
