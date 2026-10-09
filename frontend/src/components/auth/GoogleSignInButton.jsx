import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
        fill="#4285F4"
      />
      <path
        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * GoogleSignInButton — Official Google Identity Services integration.
 *
 * Adheres to:
 * - Apple + Linear + Premium University aesthetics
 * - Google Identity Services client protocol
 * - Disabled and loading state protections (no duplicate requests)
 * - Accessible keyboard navigation and aria labels
 */
export function GoogleSignInButton({ onSuccess, onError, disabled = false }) {
  const { googleLogin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [configError, setConfigError] = useState("");
  const buttonContainerRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(
    clientId && clientId.trim() !== "" && clientId !== "your_google_client_id_here"
  );

  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response || !response.credential) {
        if (onError) onError("Google sign-in did not return a valid credential.");
        return;
      }

      setIsProcessing(true);
      setConfigError("");

      try {
        const res = await googleLogin(response.credential);
        if (onSuccess) {
          onSuccess(res);
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "Google sign-in failed. Please verify your account and try again.";
        if (onError) {
          onError(msg);
        } else {
          setConfigError(msg);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [googleLogin, onSuccess, onError]
  );

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const initGsi = () => {
      if (window.google?.accounts?.id && buttonContainerRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "left",
          width: 380,
        });
      }
    };

    // If script is already loaded
    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      // Poll briefly for GIS script load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 100);

      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isConfigured, clientId, handleCredentialResponse]);

  const handlePlaceholderClick = () => {
    if (!isConfigured) {
      const msg =
        "Google Sign-In is not yet configured. Please set VITE_GOOGLE_CLIENT_ID in your frontend .env file.";
      setConfigError(msg);
      if (onError) onError(msg);
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* If Google client ID is configured, GIS renders the official compliant button */}
      {isConfigured ? (
        <div className="relative w-full flex justify-center">
          <div
            ref={buttonContainerRef}
            className={`w-full flex justify-center min-h-[44px] ${
              isProcessing || disabled ? "pointer-events-none opacity-60" : ""
            }`}
            aria-label="Continue with Google"
          />

          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 gap-2">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span>Signing in with Google...</span>
            </div>
          )}
        </div>
      ) : (
        /* Accessible fallback button when credentials are still being configured */
        <button
          type="button"
          onClick={handlePlaceholderClick}
          disabled={disabled || isProcessing}
          aria-label="Continue with Google"
          className="w-full h-11 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-3 text-sm font-semibold text-slate-700 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          <span>{isProcessing ? "Signing in with Google..." : "Continue with Google"}</span>
        </button>
      )}

      {configError && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2" role="alert">
          {configError}
        </p>
      )}
    </div>
  );
}

export default GoogleSignInButton;
