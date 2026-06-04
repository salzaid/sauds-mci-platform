import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin, Plus, UserCheck } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const eventTypes = ["TAGGED","ARRIVED_CCP","LOADED_TRANSPORT","ARRIVED_FACILITY","IN_RESUSCITATION","TO_IMAGING","TO_OR","TO_ICU","TO_WARD","DISCHARGED","TRANSFERRED","DECEASED","REASSESSED"];
const triageColors: Record<string, string> = {
  IMMEDIATE: "bg-red-600 text-white", DELAYED: "bg-yellow-500 text-black",
  MINIMAL: "bg-green-600 text-white", EXPECTANT: "bg-gray-700 text-gray-300",
  DECEASED: "bg-gray-900 text-gray-500", UNKNOWN: "bg-muted text-muted-foreground",
};

export default function CasualtyDetail({ id }: { id: number }) {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showConfirmId, setShowConfirmId] = useState(false);
  const utils = trpc.useUtils();

  const { data: casualty, isLoading } = trpc.casualties.get.useQuery({ id });
  const { data: timeline } = trpc.casualties.getTimeline.useQuery({ casualtyId: id });
  const { data: triageHistory } = trpc.casualties.getTriageHistory.useQuery({ casualtyId: id });

  const addEvent = trpc.casualties.addEvent.useMutation({
    onSuccess: () => { utils.casualties.getTimeline.invalidate({ casualtyId: id }); utils.casualties.get.invalidate({ id }); setShowAddEvent(false); toast.success("Event recorded"); reset(); },
    onError: (err) => toast.error(err.message),
  });

  const confirmId = trpc.casualties.confirmIdentity.useMutation({
    onSuccess: () => { utils.casualties.get.invalidate({ id }); setShowConfirmId(false); toast.success("Identity confirmed"); resetId(); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { eventType: "ARRIVED_FACILITY", locationDescription: "", notes: "" },
  });
  const { register: registerI, handleSubmit: handleSubmitI, reset: resetId } = useForm({
    defaultValues: { firstName: "", lastName: "", nationalId: "" },
  });

  if (isLoading) return <div className="p-6 space-y-4">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (!casualty) return <div className="p-6 text-muted-foreground">Casualty not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => { if (window.history.length > 1) { window.history.back(); } else { navigate("/tracking"); } }}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded font-bold ${triageColors[casualty.currentTriageCategory]}`}>{casualty.currentTriageCategory}</span>
            {casualty.identityConfirmed && <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">Identity Confirmed</Badge>}
          </div>
          <h1 className="text-2xl font-bold font-mono">{casualty.provisionalId}</h1>
          {casualty.identityConfirmed && <p className="text-muted-foreground">{casualty.firstName} {casualty.lastName}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {casualty.sex} {casualty.estimatedAge ? `· ~${casualty.estimatedAge}yr` : ""} · {casualty.disposition.replace(/_/g," ")}
          </p>
        </div>
        <div className="flex gap-2">
          {!casualty.identityConfirmed && (
            <Button variant="outline" size="sm" onClick={() => setShowConfirmId(true)}>
              <UserCheck className="h-4 w-4 mr-2" />Confirm Identity
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddEvent(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Event Timeline</CardTitle></CardHeader>
          <CardContent>
            {timeline?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No events recorded</p>
            ) : (
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
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />{new Date(ev.validTime).toLocaleString()}
                      </p>
                      {ev.locationDescription && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.locationDescription}</p>}
                      {ev.notes && <p className="text-xs text-muted-foreground mt-1 italic">{ev.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Triage history */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Triage Assessments</CardTitle></CardHeader>
          <CardContent>
            {triageHistory?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No triage assessments recorded</p>
            ) : (
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
                      {ta.needleDecompression && <span className="text-yellow-400">Needle decomp.</span>}
                    </div>
                    {ta.isReassessment && <Badge variant="outline" className="text-xs mt-1">Reassessment #{ta.reassessmentCount}</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Tracking Event</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => addEvent.mutate({ casualtyId: id, incidentId: casualty.incidentId, ...d as any }))} className="space-y-4">
            <div className="space-y-2"><Label>Event Type</Label>
              <Select onValueChange={v => setValue("eventType", v)} defaultValue="ARRIVED_FACILITY">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{eventTypes.map(e => <SelectItem key={e} value={e}>{e.replace(/_/g," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input {...register("locationDescription")} placeholder="Ward, bay, facility name..." /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea {...register("notes")} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddEvent(false)}>Cancel</Button>
              <Button type="submit" disabled={addEvent.isPending}>{addEvent.isPending ? "Recording..." : "Record Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Identity Dialog */}
      <Dialog open={showConfirmId} onOpenChange={setShowConfirmId}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirm Patient Identity — تأكيد هوية المريض</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitI(d => confirmId.mutate({ id, ...d as any }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>First Name *</Label><Input {...registerI("firstName",{required:true})} /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input {...registerI("lastName",{required:true})} /></div>
            </div>
            <div className="space-y-2"><Label>National ID / Civil ID</Label><Input {...registerI("nationalId")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConfirmId(false)}>Cancel</Button>
              <Button type="submit" disabled={confirmId.isPending}>{confirmId.isPending ? "Confirming..." : "Confirm Identity"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
