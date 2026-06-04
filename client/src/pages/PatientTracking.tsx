import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronRight, Search, Filter } from "lucide-react";
import { Link } from "wouter";

const triageColors: Record<string, string> = {
  IMMEDIATE: "bg-red-600 text-white", DELAYED: "bg-yellow-500 text-black",
  MINIMAL: "bg-green-600 text-white", EXPECTANT: "bg-gray-700 text-gray-300",
  DECEASED: "bg-gray-900 text-gray-500", UNKNOWN: "bg-muted text-muted-foreground",
};

const dispositionColors: Record<string, string> = {
  AT_SCENE: "text-orange-400", IN_TRANSPORT: "text-blue-400", AT_FACILITY: "text-green-400",
  DISCHARGED: "text-muted-foreground", TRANSFERRED: "text-purple-400", DECEASED: "text-gray-500",
};

export default function PatientTracking({ incidentId }: { incidentId?: number }) {
  const { t } = useLang();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: incidents } = trpc.incidents.list.useQuery({ limit: 20 });
  const { data: casualties, isLoading } = trpc.casualties.list.useQuery(
    { incidentId: selectedIncident!, triageCategory: categoryFilter !== "all" ? categoryFilter as any : undefined, limit: 100 },
    { enabled: !!selectedIncident, refetchInterval: 20000 }
  );

  const filtered = casualties?.filter(c =>
    !search || c.provisionalId.toLowerCase().includes(search.toLowerCase()) ||
    (c.firstName && c.firstName.toLowerCase().includes(search.toLowerCase())) ||
    (c.lastName && c.lastName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patient Tracking — تتبع المرضى</h1>
        <p className="text-muted-foreground text-sm mt-1">HICS 254-equivalent tracking board</p>
      </div>

      {/* Incident selector */}
      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>
            {incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name} — {inc.incidentCode}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {selectedIncident && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-64" placeholder="Search by ID or name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all","IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED","UNKNOWN"].map(cat => (
                <Button key={cat} variant={categoryFilter === cat ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(cat)}>
                  {cat === "all" ? "All" : t(`triage.${cat}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Tracking board */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Casualties ({filtered?.length ?? 0})</span>
                <span className="text-xs text-muted-foreground font-normal">Auto-refreshes every 20s</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : filtered?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No casualties found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="text-left pb-2 pr-4">Provisional ID</th>
                        <th className="text-left pb-2 pr-4">Triage</th>
                        <th className="text-left pb-2 pr-4">Name</th>
                        <th className="text-left pb-2 pr-4">Age/Sex</th>
                        <th className="text-left pb-2 pr-4">Disposition</th>
                        <th className="text-left pb-2 pr-4">Location</th>
                        <th className="text-left pb-2">Identity</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered?.map(c => (
                        <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3 pr-4 font-mono text-xs font-medium">{c.provisionalId}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${triageColors[c.currentTriageCategory]}`}>
                              {c.currentTriageCategory}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {c.identityConfirmed ? `${c.firstName} ${c.lastName}` : <span className="text-muted-foreground italic">Unknown</span>}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {c.estimatedAge ? `~${c.estimatedAge}yr` : "—"} / {c.sex}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs font-medium ${dispositionColors[c.disposition]}`}>
                              {c.disposition.replace(/_/g," ")}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-muted-foreground truncate max-w-32">
                            {c.currentLocation ?? c.locationGps ?? "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {c.identityConfirmed
                              ? <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">Confirmed</Badge>
                              : <Badge variant="outline" className="text-muted-foreground text-xs">Provisional</Badge>
                            }
                          </td>
                          <td className="py-3">
                            <Link href={`/casualties/${c.id}`} className="text-primary hover:text-primary/80"><ChevronRight className="h-4 w-4" /></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedIncident && (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Select an incident to view the tracking board</p>
        </CardContent></Card>
      )}
    </div>
  );
}
