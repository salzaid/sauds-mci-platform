import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Globe, Stethoscope, Activity, Shield, Truck, BarChart3, Users, Lock, Send, CheckCircle, Eye } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  const requestAccess = trpc.system.requestAccess.useMutation({
    onSuccess: () => { setSubmitted(true); toast.success("Request submitted — the administrator will be notified."); },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { fullName: "", email: "", jobTitle: "", facility: "", reason: "" },
  });

  const features = [
    { icon: Stethoscope, title: "Scene Triage", titleAr: "الفرز الميداني", desc: "SALT, START & JumpSTART algorithms with real-time casualty registration", color: "text-red-400" },
    { icon: Activity, title: "Patient Tracking", titleAr: "تتبع المرضى", desc: "Full HICS 254-compliant tracking from scene to discharge", color: "text-yellow-400" },
    { icon: Shield, title: "Hospital Command", titleAr: "قيادة المستشفى", desc: "CO-S-TR dashboard with OR queue, blood bank, ICU census", color: "text-blue-400" },
    { icon: Users, title: "Incident Command", titleAr: "قيادة الحوادث", desc: "HICS-compliant ICS forms, role assignments, Job Action Sheets", color: "text-green-400" },
    { icon: Truck, title: "Inter-Facility Transport", titleAr: "النقل بين المنشآت", desc: "Regional bed board, transport manifests, patient distribution", color: "text-purple-400" },
    { icon: BarChart3, title: "After-Action Review", titleAr: "مراجعة ما بعد الحادث", desc: "Timeline reconstruction, KPI export, WHO EMT MDS reporting", color: "text-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="container py-20 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Saud's MCI Platform</p>
                <p className="text-xs text-muted-foreground">منصة سعود للكوارث الطبية</p>
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-3">
              Saud's MCI &<br />
              <span className="text-primary">Disaster Platform</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-2">منصة سعود لإدارة حوادث الإصابات الجماعية والكوارث</p>
            <p className="text-muted-foreground mb-8 max-w-xl">
              A comprehensive platform supporting the full chain of survival — from scene triage through definitive surgical care, inter-facility coordination, and after-action review.
            </p>

            {/* Access block */}
            <div className="flex items-start gap-3 px-5 py-4 bg-muted/60 border border-border rounded-xl max-w-lg mb-4">
              <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Invite-only access</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Access is restricted to authorised personnel. If you have received an invitation link, use it to sign in. Otherwise, you can request access below.
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
              <Button variant="outline" onClick={() => setShowForm(v => !v)}>
                {showForm ? "Hide form" : "Request Access"}
              </Button>
              <Link href="/demo" className="inline-flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors self-center font-medium">
                <Eye className="h-4 w-4" />
                Interactive Demo
              </Link>
              <Link href="/public-portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-center">
                <Globe className="h-4 w-4" />
                Family Reunification Portal
              </Link>
            </div>

            {/* Request Access Form */}
            {showForm && (
              <Card className="mt-6 max-w-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {submitted ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Send className="h-5 w-5 text-primary" />}
                    {submitted ? "Request Submitted" : "Request Access — طلب الوصول"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Your request has been sent to the platform administrator. You will receive an invitation link at your email address if approved.
                      </p>
                      <p className="text-xs text-muted-foreground">تم إرسال طلبك إلى مدير المنصة. ستتلقى رابط دعوة على بريدك الإلكتروني عند الموافقة.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(d => requestAccess.mutate(d as any))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Full Name *</Label>
                          <Input {...register("fullName", { required: true })} placeholder="Dr. Ahmed Al-Rashidi" />
                          {errors.fullName && <p className="text-xs text-destructive">Required</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email *</Label>
                          <Input {...register("email", { required: true })} type="email" placeholder="you@hospital.gov.kw" />
                          {errors.email && <p className="text-xs text-destructive">Valid email required</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Job Title *</Label>
                          <Input {...register("jobTitle", { required: true })} placeholder="Emergency Physician" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Hospital / Facility *</Label>
                          <Input {...register("facility", { required: true })} placeholder="Mubarak Al-Kabeer Hospital" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Reason for Access *</Label>
                        <Textarea
                          {...register("reason", { required: true, minLength: 10 })}
                          placeholder="Briefly describe your role and why you need access to the MCI platform..."
                          rows={3}
                        />
                        {errors.reason && <p className="text-xs text-destructive">Please provide at least 10 characters</p>}
                      </div>
                      <Button type="submit" className="w-full" disabled={requestAccess.isPending}>
                        <Send className="h-4 w-4 mr-2" />
                        {requestAccess.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">Platform Capabilities</h2>
          <p className="text-muted-foreground">Aligned with SALT, HICS, CO-S-TR, WHO EMT MDS, and HL7 FHIR R4/R5</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-xl p-6">
                <Icon className={`h-8 w-8 mb-4 ${f.color}`} />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{f.titleAr}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standards */}
      <div className="border-t border-border">
        <div className="container py-8">
          <div className="flex flex-wrap gap-4 items-center justify-center text-xs text-muted-foreground">
            {["SALT Triage", "START / JumpSTART", "HICS", "CO-S-TR", "WHO EMT MDS", "HL7 FHIR R4/R5", "HIPAA / GDPR", "NDMS / ESF-8"].map(s => (
              <span key={s} className="px-3 py-1 bg-muted rounded-full">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
