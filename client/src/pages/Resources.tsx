import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const resourceTypes = ["VENTILATOR","ICU_BED","HDU_BED","WARD_BED","OR_ROOM","BLOOD_O_POS","BLOOD_O_NEG","BLOOD_A_POS","BLOOD_A_NEG","BLOOD_B_POS","BLOOD_B_NEG","BLOOD_AB_POS","BLOOD_AB_NEG","PPE_UNIVERSAL","PPE_DROPLET","PPE_AIRBORNE","PPE_CBRN","TXA","ATROPINE","PRALIDOXIME","DIALYSIS_STATION","CT_SCANNER","CARM","MRI","ECMO"];

const resourceGroups: Record<string, string[]> = {
  "Critical Care": ["VENTILATOR","ICU_BED","HDU_BED","ECMO","DIALYSIS_STATION"],
  "Surgical": ["OR_ROOM","CT_SCANNER","CARM","MRI"],
  "Ward": ["WARD_BED"],
  "Blood Products": ["BLOOD_O_POS","BLOOD_O_NEG","BLOOD_A_POS","BLOOD_A_NEG","BLOOD_B_POS","BLOOD_B_NEG","BLOOD_AB_POS","BLOOD_AB_NEG"],
  "PPE": ["PPE_UNIVERSAL","PPE_DROPLET","PPE_AIRBORNE","PPE_CBRN"],
  "Medications": ["TXA","ATROPINE","PRALIDOXIME"],
};

export default function Resources() {
  const { t } = useLang();
  const [showUpsert, setShowUpsert] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: summary, isLoading } = trpc.dashboard.resourceSummary.useQuery({}, { refetchInterval: 30000 });
  const { data: resources } = trpc.resources.list.useQuery({});

  const upsert = trpc.resources.upsert.useMutation({
    onSuccess: () => { utils.resources.list.invalidate(); utils.dashboard.resourceSummary.invalidate(); setShowUpsert(false); setEditItem(null); toast.success("Resource updated"); reset(); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { facilityId: 1, type: "VENTILATOR", name: "", total: 0, inUse: 0, available: 0, inMaintenance: 0, unit: "unit", lowThreshold: 0, notes: "" },
  });

  const openEdit = (item: any) => {
    setEditItem(item);
    Object.entries(item).forEach(([k, v]) => setValue(k as any, v as any));
    setShowUpsert(true);
  };

  const getUtilPct = (inUse: number, total: number) => total > 0 ? Math.round((inUse / total) * 100) : 0;
  const isLow = (r: any) => r.available <= r.lowThreshold && r.lowThreshold > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resources & Logistics — الموارد واللوجستيات</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time inventory — ventilators, beds, blood products, PPE</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { utils.resources.list.invalidate(); utils.dashboard.resourceSummary.invalidate(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button onClick={() => { setEditItem(null); reset(); setShowUpsert(true); }}>
            <Plus className="h-4 w-4 mr-2" />Add Resource
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        Object.entries(resourceGroups).map(([group, types]) => {
          const groupResources = resources?.filter(r => types.includes(r.type)) ?? [];
          if (groupResources.length === 0) return null;
          return (
            <div key={group}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupResources.map(r => {
                  const pct = getUtilPct(r.inUse, r.total);
                  const low = isLow(r);
                  return (
                    <Card key={r.id} className={`cursor-pointer hover:border-primary/50 transition-colors ${low ? "border-orange-500/50" : ""}`} onClick={() => openEdit(r)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.type.replace(/_/g," ")}</p>
                          </div>
                          {low && <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                          <div><p className="text-2xl font-bold text-foreground">{r.total}</p><p className="text-muted-foreground">Total</p></div>
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
        })
      )}

      {resources?.length === 0 && !isLoading && (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No resources configured yet</p>
          <Button className="mt-4" onClick={() => setShowUpsert(true)}><Plus className="h-4 w-4 mr-2" />Add First Resource</Button>
        </CardContent></Card>
      )}

      <Dialog open={showUpsert} onOpenChange={setShowUpsert}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Update Resource" : "Add Resource"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => upsert.mutate({ ...(editItem ? { id: editItem.id } : {}), ...d as any }))} className="space-y-4">
            <div className="space-y-2"><Label>Resource Name *</Label><Input {...register("name",{required:true})} placeholder="e.g. ICU Ventilator Bay A" /></div>
            <div className="space-y-2"><Label>Type</Label>
              <Select onValueChange={v => setValue("type",v)} defaultValue={editItem?.type ?? "VENTILATOR"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{resourceTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Total</Label><Input type="number" {...register("total",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>In Use</Label><Input type="number" {...register("inUse",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Available</Label><Input type="number" {...register("available",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>In Maintenance</Label><Input type="number" {...register("inMaintenance",{valueAsNumber:true})} min={0} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Unit</Label><Input {...register("unit")} placeholder="unit, beds, bottles..." /></div>
              <div className="space-y-2"><Label>Low Alert Threshold</Label><Input type="number" {...register("lowThreshold",{valueAsNumber:true})} min={0} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUpsert(false)}>Cancel</Button>
              <Button type="submit" disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
