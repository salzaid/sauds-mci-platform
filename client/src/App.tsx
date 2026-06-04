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

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/public-portal" component={PublicPortal} />

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
