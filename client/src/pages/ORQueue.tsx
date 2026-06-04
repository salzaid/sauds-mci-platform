import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Syringe, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const orStatuses = ["PROPOSED","SCHEDULED","IN_OR_PREP","INDUCTION","INCISION","CLOSURE","IN_PACU","OUT_PACU","COMPLETE","CANCELLED","ABORTED"] as const;
const activeStatuses = ["PROPOSED","SCHEDULED","IN_OR_PREP","INDUCTION","INCISION","CLOSURE","IN_PACU","OUT_PACU"];

const statusColors: Record<string, string> = {
  PROPOSED: "bg-muted text-muted-foreground", SCHEDULED: "bg-blue-500/20 text-blue-400",
  IN_OR_PREP: "bg-yellow-500/20 text-yellow-400", INDUCTION: "bg-orange-500/20 text-orange-400",
  INCISION: "bg-red-500/20 text-red-400 status-pulse", CLOSURE: "bg-purple-500/20 text-purple-400",
  IN_PACU: "bg-cyan-500/20 text-cyan-400", OUT_PACU: "bg-green-500/20 text-green-400",
  COMPLETE: "bg-muted text-muted-foreground", CANCELLED: "bg-muted text-muted-foreground",
  ABORTED: "bg-red-900/20 text-red-600",
};

const nextTransitions: Record<string, string[]> = {
  PROPOSED: ["SCHEDULED","CANCELLED"], SCHEDULED: ["IN_OR_PREP","CANCELLED"],
  IN_OR_PREP: ["INDUCTION","ABORTED"], INDUCTION: ["INCISION","ABORTED"],
  INCISION: ["CLOSURE","ABORTED"], CLOSURE: ["IN_PACU"],
  IN_PACU: ["OUT_PACU"], OUT_PACU: ["COMPLETE"],
};

export default function ORQueue({ incidentId }: { incidentId?: number }) {
  const { t } = useLang();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: incidents } = trpc.incidents.list.useQuery({ limit: 20 });
  const { data: orCases, isLoading } = trpc.orCases.list.useQuery(
    { incidentId: selectedIncident!, limit: 50 },
    { enabled: !!selectedIncident, refetchInterval: 15000 }
  );

  const transition = trpc.orCases.transition.useMutation({
    onSuccess: () => { utils.orCases.list.invalidate(); toast.success("Status updated"); },
    onError: (err) => toast.error(err.message),
  });

  const createCase = trpc.orCases.create.useMutation({
    onSuccess: () => { utils.orCases.list.invalidate(); setShowCreate(false); toast.success("OR case created"); reset(); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { casualtyId: 0, facilityId: 1, procedureType: "", priority: 50, isDamageControl: false, estimatedDurationMin: 60, bloodType: "", notes: "" },
  });

  const filtered = statusFilter === "active"
    ? orCases?.filter(c => activeStatuses.includes(c.status))
    : statusFilter === "all" ? orCases
    : orCases?.filter(c => c.status === statusFilter);

  const activeCount = orCases?.filter(c => ["INCISION","CLOSURE"].includes(c.status)).length ?? 0;
  const pendingCount = orCases?.filter(c => ["PROPOSED","SCHEDULED"].includes(c.status)).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OR Queue — قائمة انتظار غرفة العمليات</h1>
          <p className="text-muted-foreground text-sm mt-1">Surgical case prioritization and state machine</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!selectedIncident}>
          <Plus className="h-4 w-4 mr-2" />New OR Case
        </Button>
      </div>

      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}

      {selectedIncident && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center"><CardContent className="p-4">
              <div className="text-3xl font-bold text-red-400">{activeCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Active in OR</div>
            </CardContent></Card>
            <Card className="text-center"><CardContent className="p-4">
              <div className="text-3xl font-bold text-yellow-400">{pendingCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending</div>
            </CardContent></Card>
            <Card className="text-center"><CardContent className="p-4">
              <div className="text-3xl font-bold text-green-400">{orCases?.filter(c => c.status === "COMPLETE").length ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </CardContent></Card>
          </div>

          <div className="flex gap-2 flex-wrap">
            {["active","all",...orStatuses].map(s => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
                {s === "active" ? "Active" : s === "all" ? "All" : t(`or.status.${s}`)}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20" />) :
            filtered?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Syringe className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No OR cases found</p>
              </CardContent></Card>
            ) : filtered?.map(c => (
              <Card key={c.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={statusColors[c.status]}>{t(`or.status.${c.status}`)}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{c.caseCode}</span>
                        {c.isDamageControl && <Badge variant="outline" className="text-orange-400 border-orange-500/30 text-xs">DCS</Badge>}
                        {c.mtpActivated && <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs">MTP Active</Badge>}
                      </div>
                      <p className="font-medium text-sm">{c.procedureType ?? "Procedure TBD"}</p>
                      <p className="text-xs text-muted-foreground">Priority: {c.priority}/100 · Casualty #{c.casualtyId}</p>
                      {c.incisionAt && <p className="text-xs text-muted-foreground">Incision: {new Date(c.incisionAt).toLocaleTimeString()}</p>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {nextTransitions[c.status]?.map(next => (
                        <Button key={next} size="sm" variant={next.includes("CANCEL") || next.includes("ABORT") ? "destructive" : "default"}
                          onClick={() => transition.mutate({ id: c.id, status: next as any })}
                          disabled={transition.isPending}
                          className="text-xs">
                          → {t(`or.status.${next}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New OR Case</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => createCase.mutate({ incidentId: selectedIncident!, ...d as any }))} className="space-y-4">
            <div className="space-y-2"><Label>Casualty ID *</Label><Input type="number" {...register("casualtyId",{valueAsNumber:true,required:true})} /></div>
            <div className="space-y-2"><Label>Procedure Type</Label><Input {...register("procedureType")} placeholder="e.g. Exploratory laparotomy" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Priority (1-100)</Label><Input type="number" {...register("priority",{valueAsNumber:true})} min={1} max={100} /></div>
              <div className="space-y-2"><Label>Est. Duration (min)</Label><Input type="number" {...register("estimatedDurationMin",{valueAsNumber:true})} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="dcs" onCheckedChange={v => setValue("isDamageControl",v)} />
              <Label htmlFor="dcs">Damage Control Surgery (DCS)</Label>
            </div>
            <div className="space-y-2"><Label>Blood Type</Label><Input {...register("bloodType")} placeholder="O+, A-, etc." /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea {...register("notes")} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createCase.isPending}>{createCase.isPending ? "Creating..." : "Create OR Case"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
