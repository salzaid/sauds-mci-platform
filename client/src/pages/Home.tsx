import { useAuth } from "@/_core/hooks/useAuth";
import { AlertTriangle, Globe, Stethoscope, Activity, Shield, Truck, BarChart3, Users, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Authenticated users go straight to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

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

            {/* Invite-only access notice */}
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-muted/60 border border-border rounded-xl">
              <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Invite-only access</p>
                <p className="text-xs text-muted-foreground">Access is restricted to authorised personnel. Contact your administrator to receive an invitation link.</p>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/public-portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-4 w-4" />
                Family Reunification Portal (public)
              </Link>
            </div>
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
