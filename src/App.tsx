import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { AccountProvider } from "@/lib/AccountProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import HomeAr from "@/pages/HomeAr";
import Customize from "@/pages/Customize";
import FinanceAr from "@/pages/FinanceAr";
import FinanceEn from "@/pages/FinanceEn";
import Store from "@/pages/Store";
import Services from "@/pages/Services";
import CrowdFinance from "@/pages/CrowdFinance";
import Transfers from "@/pages/Transfers";
import Payments from "@/pages/Payments";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeAr} />
      <Route path="/home-en" component={Home} />
      <Route path="/customize" component={Customize} />
      <Route path="/finance-ar" component={FinanceAr} />
      <Route path="/finance-en" component={FinanceEn} />
      <Route path="/store" component={Store} />
      <Route path="/services" component={Services} />
      <Route path="/crowd-finance" component={CrowdFinance} />
      <Route path="/transfers" component={Transfers} />
      <Route path="/payments" component={Payments} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AccountProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AccountProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;