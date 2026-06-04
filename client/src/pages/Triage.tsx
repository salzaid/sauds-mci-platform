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
import { AlertTriangle, Plus, ChevronRight, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";

// SALT triage decision tree steps
const SALT_STEPS = [
  { id: "sort", label: "Sort — Global Survey", question: "Can the patient walk to a designated area?", yes: "MINIMAL", no: "assess" },
  { id: "assess", label: "Assess — Life Threats", question: "Does the patient have obvious life-threatening hemorrhage or airway obstruction?", yes: "lsi", no: "vitals" },
  { id: "lsi", label: "Lifesaving Intervention", question: "Can a lifesaving intervention (tourniquet, airway opening) be performed quickly?", yes: "vitals_post_lsi", no: "EXPECTANT" },
  { id: "vitals", label: "Assess Vitals", question: "Is respiratory rate > 30/min OR < 10/min, OR pulse absent, OR cannot follow commands?", yes: "IMMEDIATE", no: "DELAYED" },
  { id: "vitals_post_lsi", label: "Vitals After LSI", question: "After intervention: Is respiratory rate > 30/min OR < 10/min, OR pulse absent?", yes: "IMMEDIATE", no: "DELAYED" },
];

const categoryColors: Record<string, string> = {
  IMMEDIATE: "bg-red-600 text-white",
  DELAYED: "bg-yellow-500 text-black",
  MINIMAL: "bg-green-600 text-white",
  EXPECTANT: "bg-gray-700 text-gray-300",
  DECEASED: "bg-gray-900 text-gray-500",
};

const categoryLabels: Record<string, string> = {
  IMMEDIATE: "Immediate (Red)", DELAYED: "Delayed (Yellow)",
  MINIMAL: "Minimal (Green)", EXPECTANT: "Expectant (Black)", DECEASED: "Deceased",
};

export default function Triage({ incidentId }: { incidentId?: number }) {
  const { t } = useLang();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [showRegister, setShowRegister] = useState(false);
  const [triageStep, setTriageStep] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<string | null>(null);
  const [pendingCasualty, setPendingCasualty] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: incidents } = trpc.incidents.list.useQuery({ status: "ACTIVATED", limit: 20 });
  const { data: casualties, isLoading } = trpc.casualties.list.useQuery(
    { incidentId: selectedIncident! },
    { enabled: !!selectedIncident }
  );

  const createCasualty = trpc.casualties.create.useMutation({
    onSuccess: (data) => {
      utils.casualties.list.invalidate({ incidentId: selectedIncident });
      setPendingCasualty(data);
      setTriageStep("sort");
      setTriageResult(null);
      setShowRegister(false);
      toast.success(`Casualty registered: ${data.provisionalId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const addTriage = trpc.casualties.addTriage.useMutation({
    onSuccess: () => {
      utils.casualties.list.invalidate({ incidentId: selectedIncident });
      setTriageStep(null);
      setPendingCasualty(null);
      setTriageResult(null);
      toast.success("Triage assessment recorded");
    },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { estimatedAge: 0, sex: "UNKNOWN", tagSerial: "", locationGps: "", notes: "" },
  });

  const handleSALTStep = (answer: boolean) => {
    const step = SALT_STEPS.find(s => s.id === triageStep);
    if (!step) return;
    const next = answer ? step.yes : step.no;
    if (["IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED"].includes(next)) {
      setTriageResult(next);
      setTriageStep(null);
    } else {
      setTriageStep(next);
    }
  };

  const confirmTriage = () => {
    if (!pendingCasualty || !triageResult || !selectedIncident) return;
    addTriage.mutate({
      casualtyId: pendingCasualty.id,
      incidentId: selectedIncident,
      algorithm: "SALT",
      category: triageResult as any,
    });
  };

  const currentStep = SALT_STEPS.find(s => s.id === triageStep);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scene Triage — الفرز الميداني</h1>
          <p className="text-muted-foreground text-sm mt-1">SALT · START · JumpSTART decision trees</p>
        </div>
        <Button onClick={() => setShowRegister(true)} disabled={!selectedIncident}>
          <Plus className="h-4 w-4 mr-2" />Register Casualty
        </Button>
      </div>

      {/* Incident selector */}
      {!incidentId && (
        <div className="flex items-center gap-3">
          <Label className="shrink-0">Active Incident:</Label>
          <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
            <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
            <SelectContent>
              {incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name} — {inc.incidentCode}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Triage summary cards */}
      {selectedIncident && casualties && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED"].map(cat => {
            const count = casualties.filter(c => c.currentTriageCategory === cat).length;
            return (
              <Card key={cat} className="text-center">
                <CardContent className="p-4">
                  <div className={`text-3xl font-bold mb-1 ${cat === "IMMEDIATE" ? "text-red-400" : cat === "DELAYED" ? "text-yellow-400" : cat === "MINIMAL" ? "text-green-400" : "text-gray-400"}`}>{count}</div>
                  <div className={`text-xs px-2 py-0.5 rounded font-medium inline-block ${categoryColors[cat]}`}>{categoryLabels[cat]}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Casualty list */}
      {selectedIncident && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registered Casualties — المصابون المسجلون</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : casualties?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No casualties registered yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {casualties?.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded font-bold ${categoryColors[c.currentTriageCategory] ?? "bg-muted text-muted-foreground"}`}>
                        {c.currentTriageCategory === "IMMEDIATE" ? "RED" : c.currentTriageCategory === "DELAYED" ? "YEL" : c.currentTriageCategory === "MINIMAL" ? "GRN" : c.currentTriageCategory === "EXPECTANT" ? "BLK" : c.currentTriageCategory === "DECEASED" ? "DEC" : "UNK"}
                      </span>
                      <div>
                        <p className="font-mono text-sm font-medium">{c.provisionalId}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.sex} {c.estimatedAge ? `· ~${c.estimatedAge}yr` : ""} · {c.disposition.replace(/_/g," ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.identityConfirmed && <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">ID Confirmed</Badge>}
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/casualties/${c.id}`}><ChevronRight className="h-4 w-4" /></a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Register Casualty Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Register New Casualty — تسجيل مصاب جديد</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => createCasualty.mutate({ incidentId: selectedIncident!, ...d as any }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tag Serial</Label><Input {...register("tagSerial")} placeholder="KW-T-XXXXX" /></div>
              <div className="space-y-2"><Label>Est. Age</Label><Input type="number" {...register("estimatedAge",{valueAsNumber:true})} min={0} max={120} /></div>
            </div>
            <div className="space-y-2"><Label>Sex</Label>
              <Select onValueChange={v => setValue("sex",v)} defaultValue="UNKNOWN">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male — ذكر</SelectItem>
                  <SelectItem value="FEMALE">Female — أنثى</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown — غير معروف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>GPS Coordinates</Label><Input {...register("locationGps")} placeholder="29.0769,48.0758" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea {...register("notes")} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
              <Button type="submit" disabled={createCasualty.isPending}>{createCasualty.isPending ? "Registering..." : "Register & Start SALT Triage"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SALT Decision Tree Dialog */}
      <Dialog open={!!triageStep || !!triageResult} onOpenChange={() => { setTriageStep(null); setTriageResult(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>SALT Triage — {pendingCasualty?.provisionalId}</DialogTitle>
          </DialogHeader>
          {triageResult ? (
            <div className="text-center py-6 space-y-4">
              <div className={`inline-block px-6 py-3 rounded-xl text-xl font-bold ${categoryColors[triageResult]}`}>
                {categoryLabels[triageResult]}
              </div>
              <p className="text-muted-foreground text-sm">SALT algorithm result. Confirm to record this assessment.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setTriageStep("sort"); setTriageResult(null); }}>Re-assess</Button>
                <Button onClick={confirmTriage} disabled={addTriage.isPending}>
                  {addTriage.isPending ? "Recording..." : "Confirm Triage"}
                </Button>
              </div>
            </div>
          ) : currentStep ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{currentStep.label}</p>
                <p className="text-lg font-medium">{currentStep.question}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" className="h-16 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSALTStep(true)}>
                  <CheckCircle className="h-6 w-6 mr-2" /> YES
                </Button>
                <Button size="lg" className="h-16 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleSALTStep(false)}>
                  <XCircle className="h-6 w-6 mr-2" /> NO
                </Button>
              </div>
              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={() => { setTriageResult("DECEASED"); setTriageStep(null); }}>
                  Mark as Deceased
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
