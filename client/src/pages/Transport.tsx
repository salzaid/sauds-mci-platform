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
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Plus } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const transportStatuses: Record<string, string> = {
  AVAILABLE: "text-green-400", DISPATCHED: "text-blue-400", EN_ROUTE: "text-yellow-400",
  AT_SCENE: "text-orange-400", LOADED: "text-purple-400", RETURNING: "text-cyan-400", OUT_OF_SERVICE: "text-muted-foreground",
};

export default function Transport({ incidentId }: { incidentId?: number }) {
  const { t } = useLang();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: incidents } = trpc.incidents.list.useQuery({ limit: 20 });
  const { data: transports, isLoading } = trpc.transports.list.useQuery(
    { incidentId: selectedIncident! }, { enabled: !!selectedIncident, refetchInterval: 20000 }
  );

  const createTransport = trpc.transports.create.useMutation({
    onSuccess: () => { utils.transports.list.invalidate(); setShowCreate(false); toast.success("Transport created"); reset(); },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = trpc.transports.updateStatus.useMutation({
    onSuccess: () => { utils.transports.list.invalidate(); toast.success("Status updated"); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { type: "AMBULANCE", driverName: "", etaMinutes: 15, notes: "" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transport — النقل</h1>
          <p className="text-muted-foreground text-sm mt-1">Inter-facility patient movement and transport manifests</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!selectedIncident}><Plus className="h-4 w-4 mr-2" />Add Transport</Button>
      </div>

      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}

      {selectedIncident && (
        <div className="space-y-3">
          {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20" />) :
          transports?.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No transports registered</p>
            </CardContent></Card>
          ) : transports?.map(tr => (
            <Card key={tr.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${transportStatuses[tr.status]}`}>{tr.status.replace(/_/g," ")}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{tr.type}</span>
                      <span className="text-xs font-mono text-muted-foreground">{tr.transportCode}</span>
                    </div>
                    {tr.driverName && <p className="text-sm">Driver: {tr.driverName}</p>}
                    {tr.etaMinutes && <p className="text-xs text-muted-foreground">ETA: {tr.etaMinutes} min</p>}
                    {tr.dispatchedAt && <p className="text-xs text-muted-foreground">Dispatched: {new Date(tr.dispatchedAt).toLocaleTimeString()}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {tr.status === "AVAILABLE" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: tr.id, status: "DISPATCHED" })}>Dispatch</Button>}
                    {tr.status === "DISPATCHED" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: tr.id, status: "EN_ROUTE" })}>En Route</Button>}
                    {tr.status === "EN_ROUTE" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: tr.id, status: "AT_SCENE" })}>At Scene</Button>}
                    {tr.status === "AT_SCENE" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: tr.id, status: "LOADED" })}>Loaded</Button>}
                    {tr.status === "LOADED" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: tr.id, status: "RETURNING" })}>Returning</Button>}
                    {tr.status === "RETURNING" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: tr.id, status: "AVAILABLE" })}>Available</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Transport Asset</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => createTransport.mutate({ incidentId: selectedIncident!, ...d as any }))} className="space-y-4">
            <div className="space-y-2"><Label>Type</Label>
              <Select onValueChange={v => setValue("type",v)} defaultValue="AMBULANCE">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["AMBULANCE","HELICOPTER","FIXED_WING","BUS","OTHER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Driver / Crew Name</Label><Input {...register("driverName")} /></div>
            <div className="space-y-2"><Label>ETA (minutes)</Label><Input type="number" {...register("etaMinutes",{valueAsNumber:true})} min={0} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input {...register("notes")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createTransport.isPending}>{createTransport.isPending ? "Creating..." : "Add Transport"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
