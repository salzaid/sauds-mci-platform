import { Link } from "wouter";
import { AlertTriangle, Eye, Stethoscope, Activity, Shield, Truck, BarChart3, Users, Syringe, Package, FileText, Radio, ClipboardList, ChevronRight, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DemoHome() {
  const modules = [
    { icon: AlertTriangle, title: "Incidents", desc: "Declare and manage MCI incidents with full lifecycle tracking", href: "/demo/incidents", color: "text-red-400" },
    { icon: Stethoscope, title: "Scene Triage", desc: "SALT, START & JumpSTART decision trees with casualty registration", href: "/demo/triage", color: "text-orange-400" },
    { icon: Users, title: "Patient Tracking", desc: "HICS 254-equivalent immutable event log from scene to discharge", href: "/demo/tracking", color: "text-yellow-400" },
    { icon: Syringe, title: "OR Queue", desc: "11-state surgical case machine with DCS flag and MTP tracking", href: "/demo/or-queue", color: "text-blue-400" },
    { icon: Package, title: "Resources", desc: "Real-time inventory — ventilators, beds, blood products, PPE", href: "/demo/resources", color: "text-green-400" },
    { icon: Truck, title: "Transport", desc: "Inter-facility transport manifests and status tracking", href: "/demo/transport", color: "text-purple-400" },
    { icon: FileText, title: "ICS Forms", desc: "HICS 201, 202, 213, 214, 254 form submission and acknowledgement", href: "/demo/ics-forms", color: "text-cyan-400" },
    { icon: ClipboardList, title: "WHO EMT MDS", desc: "85-item Emergency Medical Team daily situation reports", href: "/demo/emt-mds", color: "text-pink-400" },
    { icon: BarChart3, title: "After-Action Review", desc: "KPI dashboard — mortality rate, OR throughput, identity confirmation", href: "/demo/aar", color: "text-orange-400" },
    { icon: Radio, title: "Communications", desc: "Incident-scoped messaging by channel (COMMAND, MEDICAL, LOGISTICS)", href: "/demo/comms", color: "text-indigo-400" },
    { icon: Globe, title: "Family Reunification", desc: "Privacy-preserving public portal for family status lookups", href: "/demo/public-portal", color: "text-teal-400" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="container py-16 relative">
          <div className="max-w-3xl">
            {/* Demo badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/30 rounded-full text-xs text-yellow-400 font-medium mb-6">
              <Eye className="h-3.5 w-3.5" />
              Interactive Demo — No login required · Read-only · Sample data
            </div>

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
              MCI & Disaster<br />
              <span className="text-primary">Management Platform</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-2">منصة إدارة حوادث الإصابات الجماعية والكوارث</p>
            <p className="text-muted-foreground mb-8 max-w-xl">
              A comprehensive platform supporting the full chain of survival — from scene triage through definitive surgical care, inter-facility coordination, and after-action review. Aligned with SALT, HICS, CO-S-TR, WHO EMT MDS, and HL7 FHIR R4/R5.
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <Link href="/demo">
                <Button size="lg">
                  <Eye className="h-4 w-4 mr-2" />
                  Explore Demo Dashboard
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Live Platform (Login Required)
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Built by <span className="font-medium text-foreground">Saud Naji Alzaid</span> · MIT License · 3 incidents · 43 casualties · Full sample data pre-loaded
            </p>
          </div>
        </div>
      </div>

      {/* Sample data summary */}
      <div className="container pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Incidents", value: "3", sub: "1 Escalated, 1 Active, 1 Closed", color: "text-red-400" },
            { label: "Casualties", value: "43", sub: "Across all incidents", color: "text-yellow-400" },
            { label: "OR Cases", value: "9", sub: "4 Complete, 5 Active/Pending", color: "text-blue-400" },
            { label: "ICS Forms", value: "7", sub: "HICS 201, 202, 213, 214, 254", color: "text-purple-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="font-medium text-sm mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Module grid */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Explore All 11 Modules</h2>
          <p className="text-muted-foreground">Click any module to explore with pre-loaded sample data</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href} className="block">
                <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg shrink-0 mt-0.5">
                      <Icon className={`h-5 w-5 ${mod.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm">{mod.title}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Standards */}
      <div className="border-t border-border">
        <div className="container py-8">
          <div className="flex flex-wrap gap-3 items-center justify-center text-xs text-muted-foreground">
            {["SALT Triage", "START / JumpSTART", "HICS", "CO-S-TR", "WHO EMT MDS", "HL7 FHIR R4/R5", "HIPAA / GDPR", "NDMS / ESF-8"].map(s => (
              <span key={s} className="px-3 py-1 bg-muted rounded-full">{s}</span>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            © 2026 Saud Naji Alzaid · MIT License · <Link href="/" className="text-primary hover:underline">Live Platform</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
