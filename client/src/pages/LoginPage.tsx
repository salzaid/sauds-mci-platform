import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, EyeOff, Lock, Mail, ChevronDown, ChevronUp, Copy, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const demoAccounts = [
  { role: "role.superadmin", email: "superadmin@demo.mci", color: "text-red-400 border-red-500/30" },
  { role: "role.admin",      email: "admin@demo.mci",      color: "text-orange-400 border-orange-500/30" },
  { role: "role.incident_commander", email: "commander@demo.mci", color: "text-yellow-400 border-yellow-500/30" },
  { role: "role.clinician",  email: "clinician@demo.mci",  color: "text-blue-400 border-blue-500/30" },
  { role: "role.triage_officer", email: "triage@demo.mci", color: "text-green-400 border-green-500/30" },
  { role: "role.logistics",  email: "logistics@demo.mci",  color: "text-purple-400 border-purple-500/30" },
  { role: "role.viewer",     email: "viewer@demo.mci",     color: "text-muted-foreground border-border" },
];

const DEMO_PASSWORD = "Demo@1234";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { t, dir } = useLang();
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const utils = trpc.useUtils();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const login = trpc.customAuth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success(t("auth.signIn"));
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const fillDemo = (email: string) => {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
    toast.info(email);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(DEMO_PASSWORD)
      .then(() => toast.success(t("common.copy")))
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4" dir={dir}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-xl">
          <AlertTriangle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-bold text-lg text-foreground">Saud's MCI Platform</p>
          <p className="text-xs text-muted-foreground">منصة سعود للكوارث الطبية</p>
        </div>
      </div>

      {/* Demo credentials banner */}
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => setShowDemo(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400 hover:bg-yellow-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0" />
            <span className="font-medium">{t("auth.demoAccounts")}</span>
          </div>
          {showDemo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showDemo && (
          <div className="mt-2 bg-card border border-yellow-500/20 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t("auth.demoPassword")}:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{DEMO_PASSWORD}</code>
                <button type="button" onClick={copyPassword} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" className={`text-xs shrink-0 ${acc.color}`}>{t(acc.role)}</Badge>
                    <span className="text-xs text-muted-foreground font-mono truncate">{acc.email}</span>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">→</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-muted/30 border-t border-border">
              <p className="text-xs text-muted-foreground">{t("auth.demoAutoFill")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Login form */}
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">{t("auth.signIn")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("auth.inviteOnlyDesc")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("email", { required: t("common.required") })}
                  type="email"
                  placeholder="you@hospital.example"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("auth.password")}</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("password", { required: t("common.required") })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/" className="text-primary hover:underline">{t("auth.requestAccess")}</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
