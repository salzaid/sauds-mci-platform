import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Plus, ChevronRight, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const incidentTypes = ["MASS_CASUALTY","HAZMAT","NATURAL_DISASTER","ACTIVE_SHOOTER","CHEMICAL","RADIATION","BIOLOGICAL","EXPLOSION","FIRE","FLOOD","OTHER"];
const severities = ["LOW","MODERATE","HIGH","CATASTROPHIC"];

const statusColors: Record<string, string> = {
  ACTIVATED: "bg-green-500/20 text-green-400 border-green-500/30",
  ESCALATED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DEACTIVATED: "bg-muted text-muted-foreground border-border",
  CLOSED: "bg-muted text-muted-foreground border-border",
};
const severityColors: Record<string, string> = {
  LOW: "text-green-400", MODERATE: "text-yellow-400", HIGH: "text-orange-400", CATASTROPHIC: "text-red-400",
};

export default function Incidents() {
  const { t } = useLang();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: incidents, isLoading } = trpc.incidents.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    limit: 50,
  });

  const createMutation = trpc.incidents.create.useMutation({
    onSuccess: () => { utils.incidents.list.invalidate(); setShowCreate(false); toast.success("Incident declared"); reset(); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { name: "", nameAr: "", type: "MASS_CASUALTY", severity: "MODERATE", locationDescription: "", estimatedCasualties: 0, notes: "" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents — الحوادث</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and monitor all MCI incidents</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />{t("incident.create")}</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all","ACTIVATED","ESCALATED","DEACTIVATED","CLOSED"].map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : t(`incident.status.${s}`)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : incidents?.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No incidents found</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Declare First Incident</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {incidents?.map(inc => (
            <Link key={inc.id} href={`/incidents/${inc.id}`} className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className={statusColors[inc.status]}>{t(`incident.status.${inc.status}`)}</Badge>
                          <span className={`text-xs font-semibold ${severityColors[inc.severity]}`}>{t(`incident.severity.${inc.severity}`)}</span>
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
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Declare New Incident — الإعلان عن حادث جديد</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d as any))} className="space-y-4">
            <div className="space-y-2"><Label>Incident Name (English) *</Label><Input {...register("name",{required:true})} placeholder="e.g. Kuwait Petrochemical Plant Fire" /></div>
            <div className="space-y-2"><Label>اسم الحادث (عربي)</Label><Input {...register("nameAr")} placeholder="اسم الحادث" dir="rtl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Type</Label>
                <Select onValueChange={v => setValue("type",v)} defaultValue="MASS_CASUALTY">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{incidentTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Severity</Label>
                <Select onValueChange={v => setValue("severity",v)} defaultValue="MODERATE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input {...register("locationDescription")} placeholder="Scene location or address" /></div>
            <div className="space-y-2"><Label>Estimated Casualties</Label><Input type="number" {...register("estimatedCasualties",{valueAsNumber:true})} min={0} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea {...register("notes")} placeholder="Initial briefing notes..." rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Declaring..." : "Declare Incident"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
