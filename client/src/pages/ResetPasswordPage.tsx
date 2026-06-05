import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface ResetPasswordPageProps {
  token: string;
}

export default function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const [, navigate] = useLocation();
  const { t, dir } = useLang();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const utils = trpc.useUtils();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const password = watch("newPassword");

  const passwordRequirements = [
    { label: t("auth.passwordReq1"), met: password.length >= 8 },
    { label: t("auth.passwordReq2"), met: /\d/.test(password) },
    { label: t("auth.passwordReq3"), met: /[a-zA-Z]/.test(password) },
  ];

  const resetPassword = trpc.customAuth.resetPassword.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success(t("auth.resetSuccess"));
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir={dir}>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/20 rounded-xl">
          <AlertTriangle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-bold text-lg text-foreground">Saud's MCI Platform</p>
          <p className="text-xs text-muted-foreground">منصة سعود للكوارث الطبية</p>
        </div>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">{t("auth.setNewPassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(d => resetPassword.mutate({ token, ...d }))} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.newPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("newPassword", { required: t("common.required"), minLength: { value: 8, message: t("auth.passwordMin") } })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
              {password.length > 0 && (
                <div className="space-y-1">
                  {passwordRequirements.map(req => (
                    <div key={req.label} className="flex items-center gap-2 text-xs">
                      {req.met ? <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <span className={req.met ? "text-green-400" : "text-muted-foreground"}>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("auth.confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("confirmPassword", { required: t("common.required"), validate: v => v === password || t("auth.passwordsNoMatch") })}
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

            <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? t("common.saving") : `${t("auth.resetPassword")} & ${t("auth.signIn")}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
