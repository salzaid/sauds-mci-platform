import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Globe, Search, Heart, Phone, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const dispositionLabels: Record<string, { en: string; ar: string; color: string }> = {
  AT_SCENE: { en: "At Scene", ar: "في موقع الحادث", color: "text-orange-400" },
  IN_TRANSPORT: { en: "In Transport", ar: "قيد النقل", color: "text-blue-400" },
  AT_FACILITY: { en: "Receiving Treatment", ar: "يتلقى العلاج", color: "text-green-400" },
  DISCHARGED: { en: "Discharged", ar: "تم الخروج", color: "text-muted-foreground" },
  TRANSFERRED: { en: "Transferred", ar: "تم النقل", color: "text-purple-400" },
  DECEASED: { en: "Deceased", ar: "متوفى", color: "text-gray-500" },
};

export default function PublicPortal() {
  const [searchId, setSearchId] = useState("");
  const [searched, setSearched] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");

  // We use a simple search — in production this would be privacy-preserving
  const { data: incidents } = trpc.incidents.list.useQuery({ status: "ACTIVATED", limit: 5 });

  const isAr = lang === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><a className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></a></Link>
            <AlertTriangle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">MCI Platform — Kuwait MoH</p>
              <p className="text-xs text-muted-foreground">Family Reunification Portal — بوابة لمّ شمل الأسر</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            <Globe className="h-4 w-4 mr-2" />
            {lang === "en" ? "العربية" : "English"}
          </Button>
        </div>
      </div>

      <div className="container py-12 max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            {isAr ? "بوابة لمّ شمل الأسر" : "Family Reunification Portal"}
          </h1>
          <p className="text-muted-foreground">
            {isAr
              ? "يمكنك البحث عن ذويك المصابين في الحوادث الكبرى. لا تُعرض أي بيانات طبية شخصية."
              : "Search for your loved ones affected by mass casualty incidents. No personal medical data is displayed."
            }
          </p>
        </div>

        {/* Active incidents notice */}
        {incidents && incidents.length > 0 && (
          <Card className="mb-6 border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400">
                  {isAr ? "حوادث نشطة حالياً" : "Currently Active Incidents"}
                </span>
              </div>
              {incidents.map(inc => (
                <p key={inc.id} className="text-sm text-muted-foreground">
                  {inc.name} — {new Date(inc.activatedAt).toLocaleDateString()}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isAr ? "البحث عن مصاب" : "Search for a Casualty"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? "رقم الهوية المدنية أو رقم بطاقة الحادث" : "Civil ID or Disaster Tag Number"}</Label>
              <Input
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                placeholder={isAr ? "أدخل رقم الهوية..." : "Enter ID or tag number (e.g. KW-MCI-2026-0042-T037)..."}
                dir={isAr ? "rtl" : "ltr"}
              />
            </div>
            <Button className="w-full" onClick={() => setSearched(true)} disabled={!searchId.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {isAr ? "بحث" : "Search"}
            </Button>
          </CardContent>
        </Card>

        {/* Search result placeholder */}
        {searched && (
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {isAr
                  ? "لم يتم العثور على نتائج. يرجى التحقق من الرقم والمحاولة مرة أخرى، أو الاتصال بخط المساعدة."
                  : "No results found. Please verify the ID and try again, or contact the helpline."
                }
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {isAr ? "رقم الطوارئ: 112" : "Emergency Helpline: 112"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact info */}
        <div className="mt-8 p-4 bg-card rounded-xl border border-border text-center">
          <Phone className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="font-semibold text-sm mb-1">
            {isAr ? "خط المساعدة الطارئ" : "Emergency Helpline"}
          </p>
          <p className="text-2xl font-bold text-primary">112</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "متاح على مدار الساعة" : "Available 24/7"}
          </p>
        </div>

        {/* Privacy notice */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          {isAr
            ? "هذه البوابة تعرض معلومات الحالة العامة فقط. لا تُشارك أي بيانات طبية شخصية. وزارة الصحة — دولة الكويت."
            : "This portal displays general status information only. No personal medical data is shared. Kuwait Ministry of Health."
          }
        </p>
      </div>
    </div>
  );
}
