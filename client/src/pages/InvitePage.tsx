import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, XCircle, Clock, User, Building2, Shield, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin", admin: "Admin",
  incident_commander: "Incident Commander", clinician: "Clinician",
  triage_officer: "Triage Officer", logistics: "Logistics Officer", viewer: "Viewer",
};

const roleColors: Record<string, string> = {
  superadmin: "text-red-400 border-red-500/30", admin: "text-orange-400 border-orange-500/30",
  incident_commander: "text-yellow-400 border-yellow-500/30", clinician: "text-blue-400 border-blue-500/30",
  triage_officer: "text-green-400 border-green-500/30", logistics: "text-purple-400 border-purple-500/30",
  viewer: "text-muted-foreground border-border",
};

export default function InvitePage({ token }: { token: string }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [claimed, setClaimed] = useState(false);

  const { data: invite, isLoading, error } = trpc.invitations.getByToken.useQuery(
    { token },
    { retry: false, enabled: !!token }
  );

  const claim = trpc.invitations.claim.useMutation({
    onSuccess: (data) => {
      setClaimed(true);
      toast.success(`Welcome! Your role has been set to ${roleLabels[data.role]}.`);
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAccept = () => {
    if (!isAuthenticated) {
      // Store token in sessionStorage so we can claim after login
      sessionStorage.setItem("pending_invite_token", token);
      window.location.href = getLoginUrl();
      return;
    }
    claim.mutate({ token });
  };

  // Auto-claim if user just logged in and has a pending token
  useEffect(() => {
    const pendingToken = sessionStorage.getItem("pending_invite_token");
    if (isAuthenticated && pendingToken && pendingToken === token && !claimed) {
      sessionStorage.removeItem("pending_invite_token");
      claim.mutate({ token });
    }
  }, [isAuthenticated, token, claimed]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
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

      <Card className="w-full max-w-md">
        {/* Error states */}
        {error && (
          <>
            <CardHeader className="text-center pb-2">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <CardTitle className="text-xl">Invitation Invalid</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">{error.message}</p>
              <Button variant="outline" onClick={() => navigate("/")}>Go to Home</Button>
            </CardContent>
          </>
        )}

        {/* Success state */}
        {claimed && (
          <>
            <CardHeader className="text-center pb-2">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <CardTitle className="text-xl">Welcome aboard!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">Your account has been set up. Redirecting to the dashboard...</p>
              <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </CardContent>
          </>
        )}

        {/* Valid invite */}
        {invite && !claimed && (
          <>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">You've been invited!</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">{invite.invitedByName}</span> has invited you to join Saud's MCI Platform
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Invite details */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Role</p>
                    <Badge variant="outline" className={`mt-0.5 ${roleColors[invite.role]}`}>
                      {roleLabels[invite.role]}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Invited Email</p>
                    <p className="text-sm font-medium">{invite.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="text-sm font-medium">{new Date(invite.expiresAt).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
                  </div>
                </div>
              </div>

              {/* Personal message */}
              {invite.message && (
                <div className="border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Message from {invite.invitedByName}</p>
                  <p className="text-sm italic">"{invite.message}"</p>
                </div>
              )}

              {/* CTA */}
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    <p className="text-sm text-green-400">Signed in as <span className="font-medium">{user?.name}</span></p>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleAccept}
                    disabled={claim.isPending}
                  >
                    {claim.isPending ? "Activating account..." : "Accept Invitation & Enter Platform"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Sign in to accept this invitation. Your role will be applied automatically.
                  </p>
                  <Button className="w-full" size="lg" onClick={handleAccept}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Accept
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                By accepting, you agree to use this platform in accordance with Kuwait Ministry of Health data policies.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
