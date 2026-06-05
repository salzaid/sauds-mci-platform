import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export default function ForgotPasswordPage() {
  const { t, dir } = useLang();
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "" },
  });

  const forgotPassword = trpc.customAuth.forgotPassword.useMutation({
    onSuccess: () => setSubmitted(true),
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
        {submitted ? (
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
            <div>
              <p className="font-semibold">{t("auth.checkInbox")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("auth.resetEmailSent")}</p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">{t("auth.backToSignIn")}</Button>
            </Link>
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{t("auth.resetPassword")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(d => forgotPassword.mutate({ ...d, origin: window.location.origin }))} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...register("email", { required: t("common.required") })}
                      type="email"
                      placeholder="you@hospital.example"
                      className="pl-9"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
                  {forgotPassword.isPending ? t("auth.sending") : t("auth.sendResetLink")}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3 w-3" />{t("auth.backToSignIn")}
                </Link>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
