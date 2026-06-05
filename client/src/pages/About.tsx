import { Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import {
  AlertTriangle, Github, Heart, Stethoscope, Shield, Activity,
  Users, Truck, FileText, BarChart3, Radio, ClipboardList, Globe,
  ArrowLeft, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function About() {
  const { dir } = useLang();

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Saud's MCI Platform</span>
          </div>
          <a
            href="https://github.com/saud-alzaid/mci-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="container py-20 relative max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/20 rounded-xl">
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">About</p>
              <p className="text-xs text-muted-foreground">منصة سعود للكوارث الطبية</p>
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Saud's MCI &<br />
            <span className="text-primary">Disaster Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
            A comprehensive, open-source Mass Casualty Incident and Disaster Management Platform — built by a clinician, for clinicians.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/saud-alzaid/mci-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
            <Link href="/demo" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors">
              <Activity className="h-4 w-4" />
              Try the Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Inspiration */}
      <div className="container py-16 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-red-400" />
              <h2 className="text-2xl font-bold">Inspiration</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                This platform was born from a deeply personal place. As a trauma surgeon and intensivist practising in Kuwait and the broader Gulf region, I have witnessed first-hand the chaos that unfolds in the first hours of a mass casualty incident — the improvised triage tags, the paper tracking sheets, the radio calls that go unanswered, the blood bank that runs dry before anyone realises it.
              </p>
              <p>
                Recent events in Kuwait and across the region — industrial accidents, road mass casualties, and the ever-present spectre of regional instability — made it clear that the gap between internationally recognised MCI standards and the tools available on the ground was unacceptably wide. Hospital incident command systems existed on paper. Triage algorithms were taught in courses but rarely practised in a digital environment. After-action reviews were conducted from memory.
              </p>
              <p>
                I built this platform to close that gap. Not as an academic exercise, but as a practical tool that a triage officer can use with gloves on, that an incident commander can rely on at 3am, and that a logistics coordinator can use to know — in real time — that the blood bank is about to run out of O-negative.
              </p>
              <p>
                The platform is aligned with SALT, HICS, CO-S-TR, WHO EMT MDS, and HL7 FHIR R4/R5 because those are the standards that the international emergency medicine and disaster response community has converged on. They are not perfect, but they are shared — and shared standards save lives when hospitals from different systems have to work together.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Author card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <Stethoscope className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Saud N Alzaid</h3>
                  <p className="text-sm text-muted-foreground">Trauma Surgeon & Intensivist</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Kuwait · Gulf Region</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Practising trauma surgeon and intensivist with a clinical focus on damage-control surgery, massive transfusion protocols, and critical care in resource-limited settings.</p>
                <p>Builds software at the intersection of emergency medicine and information systems.</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Trauma Surgery", "Critical Care", "MCI Response", "HICS", "SALT Triage", "DCS / MTP"].map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href="https://github.com/saud-alzaid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                  github.com/saud-alzaid
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Standards */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Clinical Standards</h3>
              <div className="flex flex-wrap gap-2">
                {["SALT Triage", "START / JumpSTART", "HICS", "CO-S-TR", "WHO EMT MDS", "HL7 FHIR R4/R5", "NDMS / ESF-8"].map(s => (
                  <span key={s} className="px-2.5 py-1 bg-muted rounded-full text-xs text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform overview */}
      <div className="border-t border-border">
        <div className="container py-16 max-w-4xl">
          <h2 className="text-2xl font-bold mb-3">What the Platform Does</h2>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            Saud's MCI Platform covers the full chain of survival — from the moment the first triage tag is placed at the scene through to the after-action review that improves the next response.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Stethoscope, title: "Scene Triage", titleAr: "الفرز الميداني", desc: "SALT, START & JumpSTART decision trees with guided casualty registration and real-time category tracking.", color: "text-red-400" },
              { icon: Users, title: "Patient Tracking", titleAr: "تتبع المرضى", desc: "HICS 254-equivalent immutable event log from scene to discharge. Every location change, triage reassessment, and clinical event is recorded.", color: "text-yellow-400" },
              { icon: Shield, title: "Hospital Command", titleAr: "قيادة المستشفى", desc: "CO-S-TR dashboard with live triage tally, OR queue, blood bank status, ventilator census, and ICU capacity.", color: "text-blue-400" },
              { icon: Activity, title: "OR / Surgical Queue", titleAr: "قائمة العمليات", desc: "11-state surgical case machine with damage-control surgery flag, MTP tracking (1:1:1 ratio), and priority scoring.", color: "text-green-400" },
              { icon: Truck, title: "Transport & Logistics", titleAr: "النقل والموارد", desc: "Inter-facility transport manifests, real-time resource inventory, and low-threshold alerts for critical supplies.", color: "text-purple-400" },
              { icon: FileText, title: "ICS Forms", titleAr: "نماذج ICS", desc: "Digital HICS 201, 202, 213, 214, and 254 with submission and acknowledgement workflow.", color: "text-cyan-400" },
              { icon: ClipboardList, title: "WHO EMT MDS", titleAr: "تقارير WHO", desc: "85-item Emergency Medical Team Minimum Data Set for daily situation reporting to health authorities.", color: "text-pink-400" },
              { icon: BarChart3, title: "After-Action Review", titleAr: "مراجعة ما بعد الحادث", desc: "KPI dashboard covering mortality rate, OR throughput, identity confirmation rate, and incident duration.", color: "text-orange-400" },
              { icon: Radio, title: "Communications", titleAr: "الاتصالات", desc: "Incident-scoped messaging across Command, Operations, Logistics, Medical, and General channels with ROUTINE / URGENT / FLASH priority.", color: "text-indigo-400" },
            ].map(mod => {
              const Icon = mod.icon;
              return (
                <div key={mod.title} className="bg-card border border-border rounded-xl p-5">
                  <Icon className={`h-7 w-7 mb-3 ${mod.color}`} />
                  <h3 className="font-semibold mb-0.5">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{mod.titleAr}</p>
                  <p className="text-sm text-muted-foreground">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Open source */}
      <div className="border-t border-border bg-card/30">
        <div className="container py-12 max-w-4xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Github className="h-5 w-5" />
                <h2 className="text-xl font-bold">Open Source</h2>
              </div>
              <p className="text-muted-foreground text-sm max-w-lg">
                This project is released under the MIT Licence. You are free to use, modify, and distribute it — including for commercial purposes — as long as the copyright notice is retained. Contributions, issues, and pull requests are welcome.
              </p>
            </div>
            <a
              href="https://github.com/saud-alzaid/mci-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors shrink-0"
            >
              <Github className="h-4 w-4" />
              View on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="container py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 Saud N Alzaid · MIT License</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Platform</Link>
            <Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link>
            <Link href="/public-portal" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Globe className="h-3 w-3" />Family Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
