import { useState, useEffect } from "react";
import "./AppleSignIn.css";

export default function AppleSignIn({ onSuccess, onClose, selectedRole = "job_seeker" }) {
  const [step, setStep] = useState("landing"); // 'landing' | 'email' | 'password' | 'loading' | 'success'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 300);
  };

  const handleContinueWithEmail = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStep("password");
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    setStep("loading");

    setTimeout(() => {
      setStep("success");
      const appleUser = {
        id: `apple-${email.trim().toLowerCase()}`,
        name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        email: email.trim().toLowerCase(),
        nic: `apple-${email.trim().toLowerCase()}`,
        role: selectedRole,
        telephone: "",
        address: "Sri Lanka",
        provider: "Apple",
      };
      setTimeout(() => {
        onSuccess(appleUser);
      }, 1200);
    }, 1800);
  };

  return (
    <div className={`apple-overlay ${mounted ? "apple-overlay--visible" : ""}`} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={`apple-modal ${mounted ? "apple-modal--visible" : ""}`}>

        {/* Decorative blobs */}
        <div className="apple-blob apple-blob--1" />
        <div className="apple-blob apple-blob--2" />
        <div className="apple-blob apple-blob--3" />

        {/* Close button */}
        <button className="apple-close-btn" onClick={handleClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* LANDING */}
        {step === "landing" && (
          <div className="apple-content apple-content--landing">
            <div className="apple-logo-ring">
              <svg viewBox="0 0 24 24" fill="currentColor" className="apple-logo-svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 3.52c.62-.75 1.04-1.8.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z" />
              </svg>
            </div>
            <h1 className="apple-title">Sign in with Apple</h1>
            <p className="apple-subtitle">
              Use your Apple ID to sign in to<br />
              <span className="apple-app-name">SmartJob AI</span>
            </p>
            <div className="apple-trust-badges">
              <div className="apple-badge">
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                <span>End-to-end encrypted</span>
              </div>
              <div className="apple-badge">
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Private &amp; secure</span>
              </div>
              <div className="apple-badge">
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span>No data sharing</span>
              </div>
            </div>
            <button className="apple-btn-primary" onClick={() => setStep("email")}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 3.52c.62-.75 1.04-1.8.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z" />
              </svg>
              Continue with Apple ID
            </button>
            <p className="apple-legal">
              By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
              Apple does not share your personal data with SmartJob AI.
            </p>
          </div>
        )}

        {/* EMAIL */}
        {step === "email" && (
          <div className="apple-content">
            <button className="apple-back-link" onClick={() => { setStep("landing"); setError(""); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="15 18 9 12 15 6" /></svg>
              Back
            </button>
            <div className="apple-logo-ring apple-logo-ring--sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="apple-logo-svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 3.52c.62-.75 1.04-1.8.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z" />
              </svg>
            </div>
            <h2 className="apple-title apple-title--sm">Enter your Apple ID</h2>
            <p className="apple-subtitle">Your Apple ID is the email you use with Apple services.</p>
            <form onSubmit={handleContinueWithEmail} className="apple-form">
              <div className="apple-field-group">
                <label className="apple-label">Apple ID (Email)</label>
                <input
                  type="email"
                  className={`apple-input ${error ? "apple-input--error" : ""}`}
                  placeholder="you@icloud.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoFocus
                  autoComplete="email"
                />
                {error && <span className="apple-error-msg">{error}</span>}
              </div>
              <button type="submit" className="apple-btn-primary">
                Continue
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </form>
            <div className="apple-divider"><span /><span>or</span><span /></div>
            <button className="apple-btn-ghost" onClick={() => setStep("landing")}>Create a new Apple ID</button>
          </div>
        )}

        {/* PASSWORD */}
        {step === "password" && (
          <div className="apple-content">
            <button className="apple-back-link" onClick={() => { setStep("email"); setError(""); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="15 18 9 12 15 6" /></svg>
              Back
            </button>
            <div className="apple-face-id-wrap">
              <div className="apple-face-id-ring">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="30" height="30">
                  <path d="M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0V1m6 2h4a2 2 0 012 2v4m0 6v6a2 2 0 01-2 2h-4m0 0H9m6 0v2M9 21H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="10" r="1" fill="currentColor" />
                  <circle cx="15" cy="10" r="1" fill="currentColor" />
                  <path d="M9 15s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <h2 className="apple-title apple-title--sm">Enter your password</h2>
            <p className="apple-email-chip">
              <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              {email}
            </p>
            <form onSubmit={handleSignIn} className="apple-form">
              <div className="apple-field-group">
                <label className="apple-label">Password</label>
                <div className="apple-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`apple-input ${error ? "apple-input--error" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button type="button" className="apple-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {error && <span className="apple-error-msg">{error}</span>}
              </div>
              <a href="#forgot" className="apple-forgot" onClick={(e) => e.preventDefault()}>Forgot Apple ID or password?</a>
              <button type="submit" className="apple-btn-primary">Sign In</button>
            </form>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div className="apple-content apple-content--centered">
            <div className="apple-spinner-wrap">
              <div className="apple-spinner" />
              <div className="apple-logo-ring apple-logo-ring--sm apple-logo-ring--glow">
                <svg viewBox="0 0 24 24" fill="currentColor" className="apple-logo-svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 3.52c.62-.75 1.04-1.8.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z" />
                </svg>
              </div>
            </div>
            <p className="apple-loading-text">Signing you in…</p>
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div className="apple-content apple-content--centered">
            <div className="apple-success-ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="32" height="32" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="apple-success-text">Signed in successfully!</p>
            <p className="apple-success-sub">Welcome to SmartJob AI</p>
          </div>
        )}
      </div>
    </div>
  );
}
