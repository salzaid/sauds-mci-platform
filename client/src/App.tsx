import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import MCILayout from "./components/MCILayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import IncidentDetail from "./pages/IncidentDetail";
import Triage from "./pages/Triage";
import PatientTracking from "./pages/PatientTracking";
import CasualtyDetail from "./pages/CasualtyDetail";
import ORQueue from "./pages/ORQueue";
import Resources from "./pages/Resources";
import Transport from "./pages/Transport";
import ICSForms from "./pages/ICSForms";
import EMTMds from "./pages/EMTMds";
import AAR from "./pages/AAR";
import Comms from "./pages/Comms";
import AdminPanel from "./pages/AdminPanel";
import PublicPortal from "./pages/PublicPortal";
import InvitePage from "./pages/InvitePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DemoHome from "./pages/demo/DemoHome";
import DemoLayout from "./components/DemoLayout";
import {
  DemoDashboard, DemoIncidents, DemoIncidentDetail, DemoTriage,
  DemoPatientTracking, DemoCasualtyDetail, DemoORQueue, DemoResources,
  DemoTransport, DemoICSForms, DemoEMTMds, DemoAAR, DemoComms, DemoPublicPortal
} from "./pages/demo/DemoPages";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/public-portal" component={PublicPortal} />
      {/* Demo routes — no authentication required */}
      <Route path="/demo" component={DemoHome} />
      <Route path="/demo/dashboard">
        <DemoLayout><DemoDashboard /></DemoLayout>
      </Route>
      <Route path="/demo/incidents">
        <DemoLayout><DemoIncidents /></DemoLayout>
      </Route>
      <Route path="/demo/incidents/:id">
        {(params) => <DemoLayout><DemoIncidentDetail id={Number(params.id)} /></DemoLayout>}
      </Route>
      <Route path="/demo/triage">
        <DemoLayout><DemoTriage /></DemoLayout>
      </Route>
      <Route path="/demo/triage/:incidentId">
        {(params) => <DemoLayout><DemoTriage incidentId={Number(params.incidentId)} /></DemoLayout>}
      </Route>
      <Route path="/demo/tracking">
        <DemoLayout><DemoPatientTracking /></DemoLayout>
      </Route>
      <Route path="/demo/tracking/:incidentId">
        {(params) => <DemoLayout><DemoPatientTracking incidentId={Number(params.incidentId)} /></DemoLayout>}
      </Route>
      <Route path="/demo/casualties/:id">
        {(params) => <DemoLayout><DemoCasualtyDetail id={Number(params.id)} /></DemoLayout>}
      </Route>
      <Route path="/demo/or-queue">
        <DemoLayout><DemoORQueue /></DemoLayout>
      </Route>
      <Route path="/demo/or-queue/:incidentId">
        {(params) => <DemoLayout><DemoORQueue incidentId={Number(params.incidentId)} /></DemoLayout>}
      </Route>
      <Route path="/demo/resources">
        <DemoLayout><DemoResources /></DemoLayout>
      </Route>
      <Route path="/demo/transport">
        <DemoLayout><DemoTransport /></DemoLayout>
      </Route>
      <Route path="/demo/transport/:incidentId">
        {(params) => <DemoLayout><DemoTransport incidentId={Number(params.incidentId)} /></DemoLayout>}
      </Route>
      <Route path="/demo/ics-forms">
        <DemoLayout><DemoICSForms /></DemoLayout>
      </Route>
      <Route path="/demo/ics-forms/:incidentId">
        {(params) => <DemoLayout><DemoICSForms incidentId={Number(params.incidentId)} /></DemoLayout>}
      </Route>
      <Route path="/demo/emt-mds">
        <DemoLayout><DemoEMTMds /></DemoLayout>
      </Route>
      <Route path="/demo/aar">
        <DemoLayout><DemoAAR /></DemoLayout>
      </Route>
      <Route path="/demo/comms">
        <DemoLayout><DemoComms /></DemoLayout>
      </Route>
      <Route path="/demo/comms/:incidentId">
        {(params) => <DemoLayout><DemoComms incidentId={Number(params.incidentId)} /></DemoLayout>}
      </Route>
      <Route path="/demo/public-portal">
        <DemoLayout><DemoPublicPortal /></DemoLayout>
      </Route>

      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password">
        {() => {
          const token = new URLSearchParams(window.location.search).get("token") ?? "";
          return <ResetPasswordPage token={token} />;
        }}
      </Route>
      <Route path="/invite/:token">
        {(params) => <RegisterPage token={params.token} />}
      </Route>
      <Route path="/invite-manus/:token">
        {(params) => <InvitePage token={params.token} />}
      </Route>

      {/* Protected app routes — wrapped in MCILayout */}
      <Route path="/dashboard">
        <MCILayout><Dashboard /></MCILayout>
      </Route>
      <Route path="/incidents">
        <MCILayout><Incidents /></MCILayout>
      </Route>
      <Route path="/incidents/:id">
        {(params) => <MCILayout><IncidentDetail id={Number(params.id)} /></MCILayout>}
      </Route>
      <Route path="/triage">
        <MCILayout><Triage /></MCILayout>
      </Route>
      <Route path="/triage/:incidentId">
        {(params) => <MCILayout><Triage incidentId={Number(params.incidentId)} /></MCILayout>}
      </Route>
      <Route path="/tracking">
        <MCILayout><PatientTracking /></MCILayout>
      </Route>
      <Route path="/tracking/:incidentId">
        {(params) => <MCILayout><PatientTracking incidentId={Number(params.incidentId)} /></MCILayout>}
      </Route>
      <Route path="/casualties/:id">
        {(params) => <MCILayout><CasualtyDetail id={Number(params.id)} /></MCILayout>}
      </Route>
      <Route path="/or-queue">
        <MCILayout><ORQueue /></MCILayout>
      </Route>
      <Route path="/or-queue/:incidentId">
        {(params) => <MCILayout><ORQueue incidentId={Number(params.incidentId)} /></MCILayout>}
      </Route>
      <Route path="/resources">
        <MCILayout><Resources /></MCILayout>
      </Route>
      <Route path="/transport">
        <MCILayout><Transport /></MCILayout>
      </Route>
      <Route path="/transport/:incidentId">
        {(params) => <MCILayout><Transport incidentId={Number(params.incidentId)} /></MCILayout>}
      </Route>
      <Route path="/ics-forms">
        <MCILayout><ICSForms /></MCILayout>
      </Route>
      <Route path="/ics-forms/:incidentId">
        {(params) => <MCILayout><ICSForms incidentId={Number(params.incidentId)} /></MCILayout>}
      </Route>
      <Route path="/emt-mds">
        <MCILayout><EMTMds /></MCILayout>
      </Route>
      <Route path="/aar">
        <MCILayout><AAR /></MCILayout>
      </Route>
      <Route path="/comms">
        <MCILayout><Comms /></MCILayout>
      </Route>
      <Route path="/comms/:incidentId">
        {(params) => <MCILayout><Comms incidentId={Number(params.incidentId)} /></MCILayout>}
      </Route>
      <Route path="/admin">
        <MCILayout><AdminPanel /></MCILayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
