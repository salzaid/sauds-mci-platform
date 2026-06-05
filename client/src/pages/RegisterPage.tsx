import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Eye, EyeOff, Lock, CheckCircle, XCircle, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

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

interface RegisterPageProps {
  token: string;
}

export default function RegisterPage({ token }: RegisterPageProps) {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const utils = trpc.useUtils();

  const { data: invite, isLoading, error } = trpc.invitations.getByToken.useQuery(
    { token },
    { retry: false, enabled: !!token }
  );

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(password) },
  ];

  const registerMutation = trpc.customAuth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Account created! Welcome to the platform.");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/20 rounded-xl">
          <AlertTriangle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-bold text-lg text-foreground">Saud's MCI Platform</p>
          <p className="text-xs text-muted-foreground">منصة سعود للكوارث الطبية</p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <p className="font-semibold">Invitation Invalid</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Valid invite — set password */}
      {invite && (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Create Your Account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Invited by <span className="font-medium text-foreground">{invite.invitedByName}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Invite details */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{invite.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={`text-xs ${roleColors[invite.role]}`}>
                  {roleLabels[invite.role]}
                </Badge>
              </div>
              {invite.message && (
                <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                  "{invite.message}"
                </p>
              )}
            </div>

            {/* Password form */}
            <form onSubmit={handleSubmit(d => registerMutation.mutate({ inviteToken: token, ...d }))} className="space-y-4">
              <div className="space-y-2">
                <Label>Create Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Minimum 8 characters" },
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}

                {/* Password requirements */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    {passwordRequirements.map(req => (
                      <div key={req.label} className="flex items-center gap-2 text-xs">
                        {req.met
                          ? <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          : <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        }
                        <span className={req.met ? "text-green-400" : "text-muted-foreground"}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: v => v === password || "Passwords do not match",
                    })}
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : "Create Account & Sign In"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Fix missing import
function Mail({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
