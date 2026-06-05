import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { t } = useLang();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPassword = watch("newPassword");

  const passwordRequirements = [
    { label: t("auth.passwordReq1"), met: newPassword.length >= 8 },
    { label: t("auth.passwordReq2"), met: /\d/.test(newPassword) },
    { label: t("auth.passwordReq3"), met: /[a-zA-Z]/.test(newPassword) },
  ];

  const changePassword = trpc.customAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success(t("auth.passwordChanged"));
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {t("auth.changePassword")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => changePassword.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("auth.currentPassword")}</Label>
            <div className="relative">
              <Input
                {...register("currentPassword", { required: t("common.required") })}
                type={showCurrent ? "text" : "password"}
                placeholder="••••••••"
                className="pr-9"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("auth.newPassword")}</Label>
            <div className="relative">
              <Input
                {...register("newPassword", { required: t("common.required"), minLength: { value: 8, message: t("auth.passwordMin") } })}
                type={showNew ? "text" : "password"}
                placeholder="••••••••"
                className="pr-9"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            {newPassword.length > 0 && (
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
              <Input
                {...register("confirmPassword", { required: t("common.required"), validate: v => v === newPassword || t("auth.passwordsNoMatch") })}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="pr-9"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? t("common.saving") : t("auth.changePassword")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
