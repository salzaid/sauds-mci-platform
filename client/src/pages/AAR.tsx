import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Download, Clock, Users, Syringe, UserCheck } from "lucide-react";

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color} opacity-60`} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AAR() {
  const { t } = useLang();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>();

  const { data: incidents } = trpc.incidents.list.useQuery({ limit: 50 });
  const { data: kpis, isLoading } = trpc.dashboard.aarKpis.useQuery(
    { incidentId: selectedIncident! }, { enabled: !!selectedIncident }
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">After-Action Review — مراجعة ما بعد الحادث</h1>
          <p className="text-muted-foreground text-sm mt-1">Timeline reconstruction, KPI analysis, and export</p>
        </div>
        {kpis && (
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export KPIs</Button>
        )}
      </div>

      <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident for AAR..." /></SelectTrigger>
        <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name} ({inc.status})</SelectItem>)}</SelectContent>
      </Select>

      {!selectedIncident && (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Select an incident to view after-action KPIs</p>
        </CardContent></Card>
      )}

      {selectedIncident && isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-28" />)}
        </div>
      )}

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
            <KpiCard label="Total Casualties" value={kpis.totalCasualties} icon={Users} color="text-yellow-400" />
            <KpiCard label="Deceased" value={kpis.deceased} sub={`${kpis.mortalityRate}% mortality`} icon={Users} color="text-red-400" />
            <KpiCard label="Discharged" value={kpis.discharged} icon={Users} color="text-green-400" />
            <KpiCard label="OR Cases Completed" value={kpis.orCompleted} icon={Syringe} color="text-blue-400" />
            <KpiCard label="Identity Confirmed" value={kpis.identityConfirmed} sub={`of ${kpis.totalCasualties} total`} icon={UserCheck} color="text-purple-400" />
            <KpiCard label="Incident Duration" value={kpis.durationHours !== null ? `${kpis.durationHours}h` : "Ongoing"} icon={Clock} color="text-orange-400" />
            <KpiCard label="Mortality Rate" value={`${kpis.mortalityRate}%`} icon={BarChart3} color="text-red-400" />
            <KpiCard label="Survival Rate" value={`${100 - kpis.mortalityRate}%`} icon={BarChart3} color="text-green-400" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Standard KPIs — ASPR TRACIE / HICS</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left pb-2 pr-6">KPI</th>
                    <th className="text-left pb-2 pr-6">Value</th>
                    <th className="text-left pb-2">Benchmark</th>
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
