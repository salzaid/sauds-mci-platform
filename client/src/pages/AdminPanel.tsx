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
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Users, Building2, Shield, Search, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

const roles = ["superadmin","admin","incident_commander","clinician","triage_officer","logistics","viewer"] as const;

const roleColors: Record<string, string> = {
  superadmin: "text-red-400 border-red-500/30", admin: "text-orange-400 border-orange-500/30",
  incident_commander: "text-yellow-400 border-yellow-500/30", clinician: "text-blue-400 border-blue-500/30",
  triage_officer: "text-green-400 border-green-500/30", logistics: "text-purple-400 border-purple-500/30",
  viewer: "text-muted-foreground border-border",
};

export default function AdminPanel() {
  const { t } = useLang();
  const { user } = useAuth();
  const [editUser, setEditUser] = useState<any>(null);
  const [editFacility, setEditFacility] = useState<any>(null);
  const [showCreateFacility, setShowCreateFacility] = useState(false);
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: users, isLoading: usersLoading } = trpc.admin.listUsers.useQuery({ search, limit: 50 });
  const { data: facilities, isLoading: facilitiesLoading } = trpc.admin.listFacilities.useQuery({ includeInactive: true });
  const { data: auditLogs } = trpc.admin.listAuditLogs.useQuery({ limit: 50 });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => { utils.admin.listUsers.invalidate(); setEditUser(null); toast.success("User updated"); },
    onError: (err) => toast.error(err.message),
  });

  const createFacility = trpc.admin.createFacility.useMutation({
    onSuccess: () => { utils.admin.listFacilities.invalidate(); setShowCreateFacility(false); toast.success("Facility created"); resetFac(); },
    onError: (err) => toast.error(err.message),
  });

  const updateFacility = trpc.admin.updateFacility.useMutation({
    onSuccess: () => { utils.admin.listFacilities.invalidate(); setEditFacility(null); toast.success("Facility updated"); },
    onError: (err) => toast.error(err.message),
  });

  const { register: registerU, handleSubmit: handleSubmitU, setValue: setValueU } = useForm();
  const { register: registerF, handleSubmit: handleSubmitF, reset: resetFac, setValue: setValueF } = useForm({
    defaultValues: { name: "", nameAr: "", code: "", type: "hospital", city: "", phone: "", traumaLevel: "", totalBeds: 0, icuBeds: 0, orRooms: 0, ventilators: 0 },
  });

  const isAdmin = user?.role === "superadmin" || user?.role === "admin";
  if (!isAdmin) return (
    <div className="p-6 text-center text-muted-foreground">
      <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p>Admin access required</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel — لوحة الإدارة</h1>
        <p className="text-muted-foreground text-sm mt-1">User management, facilities, roles, and audit logs</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
          <TabsTrigger value="facilities"><Building2 className="h-4 w-4 mr-2" />Facilities</TabsTrigger>
          <TabsTrigger value="audit"><Shield className="h-4 w-4 mr-2" />Audit Log</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
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

        {/* Facilities Tab */}
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

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3">Time</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Action</th>
                    <th className="text-left p-3">Resource</th>
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

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit User: {editUser?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitU(d => updateUser.mutate({ id: editUser.id, ...d as any }))} className="space-y-4">
            <div className="space-y-2"><Label>Role</Label>
              <Select onValueChange={v => setValueU("role",v)} defaultValue={editUser?.role}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{t(`role.${r}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Job Title</Label><Input {...registerU("jobTitle")} defaultValue={editUser?.jobTitle ?? ""} /></div>
            <div className="flex items-center gap-3">
              <Switch id="active" defaultChecked={editUser?.isActive} onCheckedChange={v => setValueU("isActive",v)} />
              <Label htmlFor="active">Active Account</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updateUser.isPending}>{updateUser.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Facility Dialog */}
      <Dialog open={showCreateFacility} onOpenChange={setShowCreateFacility}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Facility — إضافة منشأة</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitF(d => createFacility.mutate(d as any))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Name (EN) *</Label><Input {...registerF("name",{required:true})} /></div>
              <div className="space-y-2"><Label>الاسم (AR)</Label><Input {...registerF("nameAr")} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Code *</Label><Input {...registerF("code",{required:true})} placeholder="KW-MOH-001" /></div>
              <div className="space-y-2"><Label>Type</Label>
                <Select onValueChange={v => setValueF("type",v)} defaultValue="hospital">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["hospital","field_hospital","clinic","command_center"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>City</Label><Input {...registerF("city")} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input {...registerF("phone")} /></div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-2"><Label>Total Beds</Label><Input type="number" {...registerF("totalBeds",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>ICU Beds</Label><Input type="number" {...registerF("icuBeds",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>OR Rooms</Label><Input type="number" {...registerF("orRooms",{valueAsNumber:true})} min={0} /></div>
              <div className="space-y-2"><Label>Ventilators</Label><Input type="number" {...registerF("ventilators",{valueAsNumber:true})} min={0} /></div>
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
