import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, EyeOff, Lock, Mail, ChevronDown, ChevronUp, Copy, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const demoAccounts = [
  { role: "Super Admin",        email: "superadmin@demo.mci",  color: "text-red-400 border-red-500/30" },
  { role: "Admin",              email: "admin@demo.mci",       color: "text-orange-400 border-orange-500/30" },
  { role: "Incident Commander", email: "commander@demo.mci",   color: "text-yellow-400 border-yellow-500/30" },
  { role: "Clinician",          email: "clinician@demo.mci",   color: "text-blue-400 border-blue-500/30" },
  { role: "Triage Officer",     email: "triage@demo.mci",      color: "text-green-400 border-green-500/30" },
  { role: "Logistics",          email: "logistics@demo.mci",   color: "text-purple-400 border-purple-500/30" },
  { role: "Viewer",             email: "viewer@demo.mci",      color: "text-muted-foreground border-border" },
];

const DEMO_PASSWORD = "Demo@1234";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const utils = trpc.useUtils();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const login = trpc.customAuth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Signed in successfully");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const fillDemo = (email: string) => {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
    toast.info(`Filled: ${email}`);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(DEMO_PASSWORD)
      .then(() => toast.success("Password copied to clipboard"))
      .catch(() => toast.error("Could not copy"));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
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
            <span className="font-medium">Demo Accounts</span>
            <span className="text-yellow-400/60 text-xs hidden sm:inline">— click to expand</span>
          </div>
          {showDemo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showDemo && (
          <div className="mt-2 bg-card border border-yellow-500/20 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Password for all accounts:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{DEMO_PASSWORD}</code>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy password"
                >
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
                    <Badge variant="outline" className={`text-xs shrink-0 ${acc.color}`}>
                      {acc.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono truncate">{acc.email}</span>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    Use →
                  </span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-muted/30 border-t border-border">
              <p className="text-xs text-muted-foreground">Click any row to auto-fill the form</p>
            </div>
          </div>
        )}
      </div>

      {/* Login form */}
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">Enter your credentials to access the platform</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("email", { required: "Email is required" })}
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
                <Label>Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("password", { required: "Password is required" })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/" className="text-primary hover:underline">
                Request access from your administrator
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center max-w-sm">
        Access is restricted to authorised personnel only. By signing in you agree to use this platform in accordance with applicable data protection policies.
      </p>
    </div>
  );
}
