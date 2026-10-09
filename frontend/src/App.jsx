import { BrowserRouter, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import { FeedbackProvider } from "./components/ui/FeedbackProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import RouteScrollAndTitle from "./components/common/RouteScrollAndTitle.jsx";
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
    <BrowserRouter>
      <RouteScrollAndTitle />
      <QueryClientProvider client={queryClient}>
        <FeedbackProvider>
          <AuthProvider>
            <GuardedRoutes />
          </AuthProvider>
        </FeedbackProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
