import { BrowserRouter, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import { FeedbackProvider } from "./components/ui/FeedbackProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import RouteScrollAndTitle from "./components/common/RouteScrollAndTitle.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import OfflineBanner from "./components/common/OfflineBanner.jsx";
import ShortcutHelp from "./components/common/ShortcutHelp.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

function GuardedRoutes() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <AppRoutes />
    </ErrorBoundary>
  );
}

/**
 * App — Root component.
 * Wraps the application in BrowserRouter, RouteScrollAndTitle, and AuthProvider.
 */
function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <OfflineBanner />
      <ShortcutHelp />
      <RouteScrollAndTitle />
      <QueryClientProvider client={queryClient}>
        <FeedbackProvider>
          <AuthProvider>
            <GuardedRoutes />
          </AuthProvider>
        </FeedbackProvider>
      </QueryClientProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
