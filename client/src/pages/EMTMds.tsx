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
import { ClipboardList, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export default function EMTMds() {
  const { t } = useLang();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: incidents } = trpc.incidents.list.useQuery({ limit: 20 });
  const { data: reports, isLoading } = trpc.emtMds.list.useQuery(
    { incidentId: selectedIncident! }, { enabled: !!selectedIncident }
  );

  const saveReport = trpc.emtMds.save.useMutation({
    onSuccess: () => { utils.emtMds.list.invalidate(); setShowCreate(false); toast.success("Report saved"); reset(); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      orgName: "", emtClassification: "", totalConsultations: 0, newAdmissions: 0,
      totalBedCapacity: 0, traumaCases: 0, surgicalProcedures: 0, deaths: 0,
      discharges: 0, referrals: 0, notes: "",
    },
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground", SUBMITTED: "bg-blue-500/20 text-blue-400", EXPORTED: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">WHO EMT MDS Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Emergency Medical Team Minimum Data Set — 85 items, 4 categories</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!selectedIncident}><Plus className="h-4 w-4 mr-2" />New Report</Button>
      </div>

      <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
        <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
      </Select>

      {selectedIncident && (
        <div className="space-y-3">
          {isLoading ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />) :
          reports?.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No EMT MDS reports yet</p>
            </CardContent></Card>
          ) : reports?.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={statusColors[r.status]}>{r.status}</Badge>
                    <span className="text-sm font-medium">Report: {new Date(r.reportDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Submitted: {new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New WHO EMT MDS Daily Report</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => saveReport.mutate({ incidentId: selectedIncident!, facilityId: 1, reportDate: new Date(), reportData: d, status: "SUBMITTED" }))} className="space-y-4">
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              WHO Emergency Medical Team Minimum Data Set — 85 items across 4 categories: Team Information, Daily Summary, MDS Statistics, Needs & Risks
            </div>
            <div className="space-y-2"><Label>Organization Name</Label><Input {...register("orgName")} /></div>
            <div className="space-y-2"><Label>EMT Classification</Label><Input {...register("emtClassification")} placeholder="EMT-1, EMT-2, EMT-3..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Total Consultations</Label><Input type="number" {...register("totalConsultations",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>New Admissions</Label><Input type="number" {...register("newAdmissions",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Total Bed Capacity</Label><Input type="number" {...register("totalBedCapacity",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Trauma Cases</Label><Input type="number" {...register("traumaCases",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Surgical Procedures</Label><Input type="number" {...register("surgicalProcedures",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Deaths</Label><Input type="number" {...register("deaths",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Discharges</Label><Input type="number" {...register("discharges",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Referrals</Label><Input type="number" {...register("referrals",{valueAsNumber:true})} min={0} /></div>
            </div>
            <div className="space-y-2"><Label>Needs & Risks Notes</Label><Input {...register("notes")} placeholder="Operational constraints, community risks..." /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={saveReport.isPending}>{saveReport.isPending ? "Saving..." : "Submit Report"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
