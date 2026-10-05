import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import RouteScrollAndTitle from "./components/common/RouteScrollAndTitle.jsx";

/**
 * App — Root component.
 * Wraps the application in BrowserRouter, RouteScrollAndTitle, and AuthProvider.
 */
function App() {
  return (
    <BrowserRouter>
      <RouteScrollAndTitle />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
