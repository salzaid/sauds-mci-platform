import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Users, Building2, Shield, Search, Plus, Edit, Mail, Send, Copy, RefreshCw, XCircle, Clock, UserPlus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

const roles = ["superadmin","admin","incident_commander","clinician","triage_officer","logistics","viewer"] as const;

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin", admin: "Admin", incident_commander: "Incident Commander",
  clinician: "Clinician", triage_officer: "Triage Officer", logistics: "Logistics Officer", viewer: "Viewer",
};

const roleColors: Record<string, string> = {
  superadmin: "text-red-400 border-red-500/30", admin: "text-orange-400 border-orange-500/30",
  incident_commander: "text-yellow-400 border-yellow-500/30", clinician: "text-blue-400 border-blue-500/30",
  triage_officer: "text-green-400 border-green-500/30", logistics: "text-purple-400 border-purple-500/30",
  viewer: "text-muted-foreground border-border",
};

const inviteStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ACCEPTED: "bg-green-500/20 text-green-400 border-green-500/30",
  REVOKED: "bg-muted text-muted-foreground border-border",
  EXPIRED: "bg-muted text-muted-foreground border-border",
};

const requestStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  INVITED: "bg-green-500/20 text-green-400 border-green-500/30",
  REJECTED: "bg-muted text-muted-foreground border-border",
};

export default function AdminPanel() {
  const { t } = useLang();
  const { user } = useAuth();
  const [editUser, setEditUser] = useState<any>(null);
  const [editFacility, setEditFacility] = useState<any>(null);
  const [showCreateFacility, setShowCreateFacility] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string; email: string } | null>(null);
  const [prefillEmail, setPrefillEmail] = useState("");
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: users, isLoading: usersLoading } = trpc.admin.listUsers.useQuery({ search, limit: 50 });
  const { data: facilities, isLoading: facilitiesLoading } = trpc.admin.listFacilities.useQuery({ includeInactive: true });
  const { data: auditLogs } = trpc.admin.listAuditLogs.useQuery({ limit: 50 });
  const { data: invitesList, isLoading: invitesLoading } = trpc.invitations.list.useQuery({ limit: 50 });
  const { data: accessRequests, isLoading: requestsLoading } = trpc.system.listAccessRequests.useQuery({ limit: 50 });

  const pendingRequestCount = accessRequests?.filter(r => r.status === "PENDING").length ?? 0;

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => { utils.admin.listUsers.invalidate(); setEditUser(null); toast.success("User updated"); },
    onError: (err) => toast.error(err.message),
  });

  const createFacility = trpc.admin.createFacility.useMutation({
    onSuccess: () => { utils.admin.listFacilities.invalidate(); setShowCreateFacility(false); toast.success("Facility created"); resetFac(); },
    onError: (err) => toast.error(err.message),
  });

  const sendInvite = trpc.invitations.create.useMutation({
    onSuccess: (data) => {
      utils.invitations.list.invalidate();
      setInviteResult({ inviteUrl: data.inviteUrl, email: data.invitation.email });
      resetInvite();
      toast.success(`Invitation created for ${data.invitation.email}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeInvite = trpc.invitations.revoke.useMutation({
    onSuccess: () => { utils.invitations.list.invalidate(); toast.success("Invitation revoked"); },
    onError: (err) => toast.error(err.message),
  });

  const resendInvite = trpc.invitations.resend.useMutation({
    onSuccess: (data) => {
      utils.invitations.list.invalidate();
      navigator.clipboard.writeText(data.inviteUrl).catch(() => {});
      toast.success("Invite link extended and copied to clipboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRequest = trpc.system.updateAccessRequest.useMutation({
    onSuccess: () => { utils.system.listAccessRequests.invalidate(); toast.success("Request updated"); },
    onError: (err) => toast.error(err.message),
  });

  const { register: registerU, handleSubmit: handleSubmitU, setValue: setValueU } = useForm();
  const { register: registerF, handleSubmit: handleSubmitF, reset: resetFac, setValue: setValueF } = useForm({
    defaultValues: { name: "", nameAr: "", code: "", type: "hospital", city: "", phone: "", traumaLevel: "", totalBeds: 0, icuBeds: 0, orRooms: 0, ventilators: 0 },
  });
  const { register: registerI, handleSubmit: handleSubmitI, reset: resetInvite, setValue: setValueI } = useForm({
    defaultValues: { email: prefillEmail, role: "viewer", facilityId: undefined as number | undefined, message: "" },
  });

  const isAdmin = user?.role === "superadmin" || user?.role === "admin";
  if (!isAdmin) return (
    <div className="p-6 text-center text-muted-foreground">
      <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p>Admin access required</p>
    </div>
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!")).catch(() => toast.error("Could not copy"));
  };

  const handleInviteFromRequest = (email: string, facility: string) => {
    setPrefillEmail(email);
    setValueI("email", email);
    setValueI("message", `Approved access request from ${facility}`);
    setShowInvite(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel — لوحة الإدارة</h1>
        <p className="text-muted-foreground text-sm mt-1">User management, invitations, access requests, facilities, and audit logs</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" className="relative">
            <UserPlus className="h-4 w-4 mr-2" />Access Requests
            {pendingRequestCount > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {pendingRequestCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations"><Mail className="h-4 w-4 mr-2" />Invitations</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
          <TabsTrigger value="facilities"><Building2 className="h-4 w-4 mr-2" />Facilities</TabsTrigger>
          <TabsTrigger value="audit"><Shield className="h-4 w-4 mr-2" />Audit Log</TabsTrigger>
        </TabsList>

        {/* ── Access Requests Tab ─────────────────────────────────────────────── */}
        <TabsContent value="requests" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Hospital staff who submitted a request from the landing page. Review each request and send an invitation directly from here.
          </p>
          {requestsLoading ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-24" />) :
          accessRequests?.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No access requests yet</p>
            </CardContent></Card>
          ) : accessRequests?.map(req => (
            <Card key={req.id} className={req.status === "PENDING" ? "border-yellow-500/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={requestStatusColors[req.status]}>{req.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="font-semibold">{req.fullName}</p>
                    <p className="text-sm text-muted-foreground">{req.jobTitle} — {req.facility}</p>
                    <p className="text-sm text-primary">{req.email}</p>
                    <p className="text-xs text-muted-foreground mt-2 italic">"{req.reason}"</p>
                  </div>
                  {req.status === "PENDING" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" onClick={() => { handleInviteFromRequest(req.email, req.facility); updateRequest.mutate({ id: req.id, status: "INVITED" }); }}>
                        <Mail className="h-3 w-3 mr-1" />Send Invite
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
                        onClick={() => updateRequest.mutate({ id: req.id, status: "REJECTED" })}>
                        <XCircle className="h-3 w-3 mr-1" />Reject
                      </Button>
                    </div>
                  )}
                  {req.status === "INVITED" && (
                    <div className="flex items-center gap-1 text-green-400 text-xs shrink-0">
                      <CheckCircle className="h-4 w-4" />Invited
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Invitations Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="invitations" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Invite people to the platform before they sign in.</p>
            <Button onClick={() => setShowInvite(true)}><Plus className="h-4 w-4 mr-2" />Send Invitation</Button>
          </div>
          <div className="space-y-3">
            {invitesLoading ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />) :
            invitesList?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No invitations sent yet</p>
                <Button className="mt-4" onClick={() => setShowInvite(true)}><Plus className="h-4 w-4 mr-2" />Send First Invitation</Button>
              </CardContent></Card>
            ) : invitesList?.map(inv => (
              <Card key={inv.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={inviteStatusColors[inv.status]}>{inv.status}</Badge>
                        <Badge variant="outline" className={`text-xs ${roleColors[inv.role]}`}>{roleLabels[inv.role]}</Badge>
                      </div>
                      <p className="font-medium text-sm">{inv.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Invited by {inv.invitedByName} · {new Date(inv.createdAt).toLocaleDateString()}
                        {inv.status === "PENDING" && <span className="ml-2">· Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>}
                        {inv.status === "ACCEPTED" && inv.acceptedAt && <span className="ml-2 text-green-400">· Accepted {new Date(inv.acceptedAt).toLocaleDateString()}</span>}
                      </p>
                      {inv.message && <p className="text-xs text-muted-foreground italic mt-1">"{inv.message}"</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {inv.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => resendInvite.mutate({ id: inv.id, origin: window.location.origin })} disabled={resendInvite.isPending}>
                            <RefreshCw className="h-3 w-3 mr-1" />Resend
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => revokeInvite.mutate({ id: inv.id })} disabled={revokeInvite.isPending}>
                            <XCircle className="h-3 w-3 mr-1" />Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Users Tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-4 space-y-3">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left p-4 pr-4">Name</th>
                      <th className="text-left p-4 pr-4">Email</th>
                      <th className="text-left p-4 pr-4">Role</th>
                      <th className="text-left p-4 pr-4">Status</th>
                      <th className="text-left p-4 pr-4">Last Sign In</th>
                      <th className="p-4"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {users?.map(u => (
                        <tr key={u.id} className="hover:bg-accent/30">
                          <td className="p-4 pr-4 font-medium">{u.name ?? "—"}</td>
                          <td className="p-4 pr-4 text-muted-foreground">{u.email ?? "—"}</td>
                          <td className="p-4 pr-4">
                            <Badge variant="outline" className={`text-xs ${roleColors[u.role]}`}>{t(`role.${u.role}`)}</Badge>
                          </td>
                          <td className="p-4 pr-4">
                            <span className={`text-xs font-medium ${u.isActive ? "text-green-400" : "text-muted-foreground"}`}>
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4 pr-4 text-xs text-muted-foreground">{new Date(u.lastSignedIn).toLocaleDateString()}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm" onClick={() => { setEditUser(u); setValueU("role", u.role); setValueU("isActive", u.isActive); setValueU("jobTitle", u.jobTitle ?? ""); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Facilities Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="facilities" className="space-y-4 mt-4">
          <Button onClick={() => setShowCreateFacility(true)}><Plus className="h-4 w-4 mr-2" />Add Facility</Button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilitiesLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-40" />) :
            facilities?.map(f => (
              <Card key={f.id} className={`${!f.isActive ? "opacity-50" : ""} cursor-pointer hover:border-primary/50 transition-colors`} onClick={() => setEditFacility(f)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{f.name}</p>
                      {f.nameAr && <p className="text-xs text-muted-foreground" dir="rtl">{f.nameAr}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">{f.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mb-2">{f.code}</p>
                  {f.city && <p className="text-xs text-muted-foreground">{f.city}</p>}
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                    <div><p className="font-bold">{f.totalBeds}</p><p className="text-muted-foreground">Beds</p></div>
                    <div><p className="font-bold">{f.icuBeds}</p><p className="text-muted-foreground">ICU</p></div>
                    <div><p className="font-bold">{f.orRooms}</p><p className="text-muted-foreground">ORs</p></div>
                    <div><p className="font-bold">{f.ventilators}</p><p className="text-muted-foreground">Vents</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Audit Log Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3">Time</th><th className="text-left p-3">User</th>
                    <th className="text-left p-3">Action</th><th className="text-left p-3">Resource</th>
                    <th className="text-left p-3">IP</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs?.map(log => (
                      <tr key={log.id} className="hover:bg-accent/20">
                        <td className="p-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-3">{log.userEmail ?? `User #${log.userId}`}</td>
                        <td className="p-3 font-medium">{log.action}</td>
                        <td className="p-3 text-muted-foreground">{log.resourceType} {log.resourceId ? `#${log.resourceId}` : ""}</td>
                        <td className="p-3 text-muted-foreground font-mono">{log.ipAddress ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!auditLogs || auditLogs.length === 0) && (
                  <div className="py-8 text-center text-muted-foreground text-sm">No audit log entries</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Send Invitation Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showInvite} onOpenChange={v => { setShowInvite(v); if (!v) { setInviteResult(null); setPrefillEmail(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />Send Invitation — دعوة مستخدم جديد
            </DialogTitle>
          </DialogHeader>
          {inviteResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <p className="text-green-400 font-semibold mb-1">Invitation created!</p>
                <p className="text-sm text-muted-foreground">Share this link with <span className="font-medium text-foreground">{inviteResult.email}</span></p>
              </div>
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input value={inviteResult.inviteUrl} readOnly className="text-xs font-mono" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(inviteResult.inviteUrl)}><Copy className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">The link expires in 7 days.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setInviteResult(null); setPrefillEmail(""); }}>Send Another</Button>
                <Button onClick={() => { setShowInvite(false); setInviteResult(null); setPrefillEmail(""); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmitI(d => sendInvite.mutate({ ...d as any, origin: window.location.origin }))} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input {...registerI("email", { required: true })} type="email" placeholder="colleague@example.com" defaultValue={prefillEmail} />
              </div>
              <div className="space-y-2">
                <Label>Assigned Role</Label>
                <Select onValueChange={v => setValueI("role", v)} defaultValue="viewer">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map(r => <SelectItem key={r} value={r}><span className={roleColors[r]}>{roleLabels[r]}</span></SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Facility (optional)</Label>
                <Select onValueChange={v => setValueI("facilityId", Number(v))}>
                  <SelectTrigger><SelectValue placeholder="No specific facility" /></SelectTrigger>
                  <SelectContent>{facilities?.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Personal Message (optional)</Label>
                <Textarea {...registerI("message")} rows={3} maxLength={500} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button type="submit" disabled={sendInvite.isPending}>
                  <Send className="h-4 w-4 mr-2" />{sendInvite.isPending ? "Creating..." : "Create Invitation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit User: {editUser?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitU(d => updateUser.mutate({ id: editUser.id, ...d as any }))} className="space-y-4">
            <div className="space-y-2"><Label>Role</Label>
              <Select onValueChange={v => setValueU("role", v)} defaultValue={editUser?.role}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{t(`role.${r}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Job Title</Label><Input {...registerU("jobTitle")} defaultValue={editUser?.jobTitle ?? ""} /></div>
            <div className="flex items-center gap-3">
              <Switch id="active" defaultChecked={editUser?.isActive} onCheckedChange={v => setValueU("isActive", v)} />
              <Label htmlFor="active">Active Account</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updateUser.isPending}>{updateUser.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Create Facility Dialog ───────────────────────────────────────────── */}
      <Dialog open={showCreateFacility} onOpenChange={setShowCreateFacility}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Facility — إضافة منشأة</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitF(d => createFacility.mutate(d as any))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Name (EN) *</Label><Input {...registerF("name", { required: true })} /></div>
              <div className="space-y-2"><Label>الاسم (AR)</Label><Input {...registerF("nameAr")} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Code *</Label><Input {...registerF("code", { required: true })} placeholder="KW-MOH-001" /></div>
              <div className="space-y-2"><Label>Type</Label>
                <Select onValueChange={v => setValueF("type", v)} defaultValue="hospital">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["hospital","field_hospital","clinic","command_center"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>City</Label><Input {...registerF("city")} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input {...registerF("phone")} /></div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-2"><Label>Total Beds</Label><Input type="number" {...registerF("totalBeds", { valueAsNumber: true })} min={0} /></div>
              <div className="space-y-2"><Label>ICU Beds</Label><Input type="number" {...registerF("icuBeds", { valueAsNumber: true })} min={0} /></div>
              <div className="space-y-2"><Label>OR Rooms</Label><Input type="number" {...registerF("orRooms", { valueAsNumber: true })} min={0} /></div>
              <div className="space-y-2"><Label>Ventilators</Label><Input type="number" {...registerF("ventilators", { valueAsNumber: true })} min={0} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateFacility(false)}>Cancel</Button>
              <Button type="submit" disabled={createFacility.isPending}>{createFacility.isPending ? "Creating..." : "Create Facility"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
