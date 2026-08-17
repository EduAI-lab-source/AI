import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ToolDetail from "./pages/ToolDetail";
import Guide from "./pages/Guide";
import NotFound from "./pages/NotFound";

function AppRoutes() {
  return <Switch><Route path="/" component={Home} /><Route path="/guia" component={Guide} /><Route path="/herramientas/:slug" component={ToolDetail} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router hook={useHashLocation}><AppRoutes /></Router></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
