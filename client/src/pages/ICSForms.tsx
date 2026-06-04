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
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const formTypes = ["HICS_201","HICS_202","HICS_203","HICS_204","HICS_205A","HICS_213","HICS_214","HICS_254"];
const formDescriptions: Record<string, string> = {
  HICS_201: "Incident Briefing", HICS_202: "Incident Objectives", HICS_203: "Organization Assignment",
  HICS_204: "Assignment List", HICS_205A: "Communications List", HICS_213: "General Message",
  HICS_214: "Activity Log", HICS_254: "Disaster Victim/Patient Tracking",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground", SUBMITTED: "bg-blue-500/20 text-blue-400",
  ACKNOWLEDGED: "bg-green-500/20 text-green-400", SUPERSEDED: "bg-muted text-muted-foreground",
};

export default function ICSForms({ incidentId }: { incidentId?: number }) {
  const { t } = useLang();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState("HICS_213");
  const utils = trpc.useUtils();

  const { data: incidents } = trpc.incidents.list.useQuery({ limit: 20 });
  const { data: forms, isLoading } = trpc.icsForms.list.useQuery(
    { incidentId: selectedIncident! }, { enabled: !!selectedIncident }
  );

  const saveForm = trpc.icsForms.save.useMutation({
    onSuccess: () => { utils.icsForms.list.invalidate(); setShowCreate(false); toast.success("Form saved"); reset(); },
    onError: (err) => toast.error(err.message),
  });

  const acknowledge = trpc.icsForms.acknowledge.useMutation({
    onSuccess: () => { utils.icsForms.list.invalidate(); toast.success("Form acknowledged"); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { subject: "", from: "", to: "", message: "", priority: "ROUTINE" },
  });

  const onSubmit = (data: any) => {
    saveForm.mutate({
      incidentId: selectedIncident!,
      formType: selectedFormType as any,
      formData: data,
      status: "SUBMITTED",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ICS Forms — نماذج ICS</h1>
          <p className="text-muted-foreground text-sm mt-1">HICS 201, 202, 203, 204, 205A, 213, 214, 254</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!selectedIncident}><Plus className="h-4 w-4 mr-2" />New Form</Button>
      </div>

      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}

      {/* Form type quick-create buttons */}
      {selectedIncident && (
        <div className="flex gap-2 flex-wrap">
          {formTypes.map(ft => (
            <Button key={ft} variant="outline" size="sm" onClick={() => { setSelectedFormType(ft); setShowCreate(true); }}>
              <FileText className="h-3 w-3 mr-1" />{ft.replace(/_/g," ")}
            </Button>
          ))}
        </div>
      )}

      {selectedIncident && (
        <div className="space-y-3">
          {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16" />) :
          forms?.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No ICS forms submitted yet</p>
            </CardContent></Card>
          ) : forms?.map(form => (
            <Card key={form.id} className="hover:border-primary/30 transition-colors">
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
                      {form.acknowledgedAt && <span className="ml-2 text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Acknowledged {new Date(form.acknowledgedAt).toLocaleTimeString()}</span>}
                    </p>
                  </div>
                  {form.status === "SUBMITTED" && (
                    <Button size="sm" variant="outline" onClick={() => acknowledge.mutate({ id: form.id })}>
                      <CheckCircle className="h-4 w-4 mr-1" />Acknowledge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New {selectedFormType.replace(/_/g," ")} — {formDescriptions[selectedFormType]}</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Label>Form Type</Label>
            <Select value={selectedFormType} onValueChange={setSelectedFormType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{formTypes.map(ft => <SelectItem key={ft} value={ft}>{ft.replace(/_/g," ")} — {formDescriptions[ft]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>From</Label><Input {...register("from")} placeholder="Your name / role" /></div>
              <div className="space-y-2"><Label>To</Label><Input {...register("to")} placeholder="Recipient / section" /></div>
            </div>
            <div className="space-y-2"><Label>Subject</Label><Input {...register("subject")} /></div>
            <div className="space-y-2"><Label>Message / Content</Label><Textarea {...register("message")} rows={5} /></div>
            <div className="space-y-2"><Label>Priority</Label>
              <Select onValueChange={v => (document.getElementById("priority-hidden") as any).value = v} defaultValue="ROUTINE">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="FLASH">Flash</SelectItem>
                </SelectContent>
              </Select>
              <input id="priority-hidden" type="hidden" {...register("priority")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={saveForm.isPending}>{saveForm.isPending ? "Submitting..." : "Submit Form"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
