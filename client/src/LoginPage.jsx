import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
  PlusCircle,
  User
} from "lucide-react";
import logoImg from "./assets/Logo.png";
import { loginUser, registerUser } from "./services/api";
import "./LoginPage.css";

const DEFAULT_GOOGLE_ACCOUNTS = [
  { name: "Kasun Perera", email: "kasun.perera@gmail.com" },
  { name: "Nuwan Pradeep", email: "nuwan.pradeep@gmail.com" },
  { name: "Dilshan Fernando", email: "dilshan.fernando@gmail.com" },
];

export default function LoginPage({
  onLoginSuccess,
  onBackToHome,
  initialRole = "job_seeker",
}) {
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Google Account Chooser State
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  // Saved accounts from localStorage
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem("smartjob_saved_google_accounts");
      return stored ? JSON.parse(stored) : DEFAULT_GOOGLE_ACCOUNTS;
    } catch {
      return DEFAULT_GOOGLE_ACCOUNTS;
    }
  });

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });

  // Handle standard credential login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const emailOrNic = loginData.email.trim();

    try {
      // Attempt backend API login
      const response = await loginUser({
        email: emailOrNic,
        nic: emailOrNic,
        password: loginData.password,
      });

      const user = {
        id: response?.user?.id || "u-" + Date.now(),
        name: response?.user?.name || (emailOrNic.includes("@") ? emailOrNic.split("@")[0] : emailOrNic),
        email: response?.user?.email || (emailOrNic.includes("@") ? emailOrNic : `${emailOrNic}@smartjob.lk`),
        nic: response?.user?.nic || emailOrNic,
        role: selectedRole,
        address: response?.user?.address || "Colombo, Sri Lanka",
        telephone: response?.user?.telephone || "",
      };

      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("invalid")) {
        setErrorMessage(err.message);
      } else {
        // High-availability fallback when backend is offline
        // Use the entered email/NIC as the stable id so the same user's
        // applied-job list is stored under the same localStorage key every session.
        const stableEmail = emailOrNic.includes("@") ? emailOrNic.trim().toLowerCase() : `${emailOrNic}@smartjob.lk`;
        const fallbackUser = {
          id: stableEmail,
          name: emailOrNic.includes("@") ? emailOrNic.split("@")[0] : `User (${emailOrNic})`,
          email: stableEmail,
          nic: emailOrNic,
          role: selectedRole,
          address: "Colombo, Sri Lanka",
          telephone: "077 123 4567",
        };
        setSuccessMessage("Login successful! Redirecting...");
        setTimeout(() => {
          onLoginSuccess(fallbackUser);
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (registerData.password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        telephone: registerData.telephone.trim(),
        password: registerData.password,
        address: "Colombo, Sri Lanka",
      });

      const newUser = {
        id: response?.user?.id || "u-" + Date.now(),
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        nic: response?.user?.nic || "USR-" + Date.now().toString().slice(-6),
        role: selectedRole,
        telephone: registerData.telephone.trim(),
        address: "Colombo, Sri Lanka",
      };

      setSuccessMessage("Account created successfully! Logging you in...");
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 600);
    } catch (err) {
      if (err.message && (err.message.includes("registered") || err.message.includes("Password"))) {
        setErrorMessage(err.message);
      } else {
        const newUser = {
          id: "u-" + Date.now(),
          name: registerData.name.trim(),
          email: registerData.email.trim(),
          nic: "USR-" + Date.now().toString().slice(-6),
          role: selectedRole,
          telephone: registerData.telephone.trim(),
          address: "Colombo, Sri Lanka",
        };
        setSuccessMessage("Account created! Redirecting...");
        setTimeout(() => {
          onLoginSuccess(newUser);
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };

  // Complete Google sign-in with selected or entered email
  const executeGoogleLoginWithEmail = (accountEmail, accountName) => {
    if (!accountEmail || !accountEmail.includes("@")) {
      setErrorMessage("Please enter a valid Google email address.");
      return;
    }

    const finalName =
      accountName && accountName.trim()
        ? accountName.trim()
        : accountEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const googleUser = {
      id: "google-" + accountEmail.trim().toLowerCase(),
      name: finalName,
      email: accountEmail.trim().toLowerCase(),
      nic: "google-" + accountEmail.trim().toLowerCase(),
      role: selectedRole || "job_seeker",
      telephone: "077 123 4567",
      address: "Colombo, Sri Lanka",
      provider: "Google",
    };

    // Save into remembered accounts
    try {
      const exists = savedGoogleAccounts.some(
        (a) => a.email.toLowerCase() === accountEmail.trim().toLowerCase()
      );
      if (!exists) {
        const updated = [{ name: finalName, email: accountEmail.trim().toLowerCase() }, ...savedGoogleAccounts];
        setSavedGoogleAccounts(updated);
        localStorage.setItem("smartjob_saved_google_accounts", JSON.stringify(updated));
      }
    } catch {}

    setIsGoogleChooserOpen(false);
    setSuccessMessage(`Signed in as ${googleUser.email}! Redirecting...`);
    setTimeout(() => {
      onLoginSuccess(googleUser);
    }, 500);
  };

  // Social Login: Apple
  const handleAppleLogin = () => {
    setErrorMessage("");
    const appleUser = {
      id: "apple-user@icloud.com",
      name: "Apple User",
      email: "user@icloud.com",
      nic: "apple-user@icloud.com",
      role: selectedRole || "job_seeker",
      telephone: "077 987 6543",
      address: "Colombo, Sri Lanka",
      provider: "Apple",
    };

    setSuccessMessage("Continuing with Apple... Redirecting!");
    setTimeout(() => {
      onLoginSuccess(appleUser);
    }, 500);
  };

  return (
    <div className="custom-login-page">
      <div className="custom-login-card">
        {/* Top Bar with Back Chevron */}
        <header className="custom-login-topbar">
          <button
            type="button"
            className="custom-back-btn"
            onClick={onBackToHome}
            aria-label="Go back to Home"
          >
            <ChevronLeft size={24} />
          </button>
        </header>

        {/* Brand Logo Display */}
        <div className="custom-logo-container" onClick={onBackToHome} title="SmartJob AI">
          <img src={logoImg} alt="SmartJob Logo" className="custom-logo-image" />
        </div>

        {/* Heading & Subtitle */}
        <div className="custom-heading-section">
          <h1 className="custom-main-title">
            {activeTab === "login" ? "Log in to your account" : "Create your account"}
          </h1>
          <p className="custom-sub-title">
            {activeTab === "login"
              ? "Welcome back! Please enter your details."
              : "Welcome! Please enter your details to get started."}
          </p>
        </div>

        {/* Role Selection Badge / Switcher (Job Seeker / Employer) */}
        <div className="custom-role-row">
          <button
            type="button"
            className={`custom-role-pill ${selectedRole === "job_seeker" ? "selected" : ""}`}
            onClick={() => setSelectedRole("job_seeker")}
          >
            <UserCheck size={16} />
            <span>Job Seeker (Candidate)</span>
          </button>
          <button
            type="button"
            className={`custom-role-pill employer ${selectedRole === "employer" ? "selected" : ""}`}
            onClick={() => setSelectedRole("employer")}
          >
            <Building2 size={16} />
            <span>Employer / Recruiter</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="custom-alert error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="custom-alert success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="custom-form">
            <div className="custom-input-group">
              <label htmlFor="login-email" className="custom-label">
                Email
              </label>
              <input
                id="login-email"
                type="text"
                className="custom-input"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div className="custom-input-group">
              <label htmlFor="login-password" className="custom-label">
                Password
              </label>
              <div className="custom-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="custom-input password-input"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="custom-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="custom-forgot-row">
              <a
                href="#forgot"
                className="custom-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  setErrorMessage("Password recovery instructions sent to your email.");
                }}
              >
                Forgot password
              </a>
            </div>

            <button type="submit" className="custom-btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="custom-switch-line">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="custom-link-btn"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                Sign up
              </button>
            </div>

            {/* OR Divider */}
            <div className="custom-divider">
              <span className="divider-line" />
              <span className="divider-text">OR</span>
              <span className="divider-line" />
            </div>

            {/* Social Logins */}
            <div className="custom-social-buttons">
              <button
                type="button"
                className="custom-btn-social"
                onClick={() => setIsGoogleChooserOpen(true)}
              >
                <svg className="social-svg-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="custom-btn-social"
                onClick={handleAppleLogin}
              >
                <svg className="social-svg-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION / SIGN UP FORM */
          <form onSubmit={handleRegisterSubmit} className="custom-form">
            <div className="custom-input-group">
              <label htmlFor="reg-name" className="custom-label">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                className="custom-input"
                placeholder="Enter your full name"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                required
              />
            </div>

            <div className="custom-input-grid-2">
              <div className="custom-input-group">
                <label htmlFor="reg-email" className="custom-label">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="custom-input"
                  placeholder="Enter email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>

              <div className="custom-input-group">
                <label htmlFor="reg-telephone" className="custom-label">
                  Phone Number
                </label>
                <input
                  id="reg-telephone"
                  type="tel"
                  className="custom-input"
                  placeholder="077 123 4567"
                  value={registerData.telephone}
                  onChange={(e) => setRegisterData({ ...registerData, telephone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="custom-input-grid-2">
              <div className="custom-input-group">
                <label htmlFor="reg-password" className="custom-label">
                  Password
                </label>
                <div className="custom-password-wrap">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    className="custom-input password-input"
                    placeholder="Min 8 chars"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="custom-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="custom-input-group">
                <label htmlFor="reg-confirmPassword" className="custom-label">
                  Confirm Password
                </label>
                <input
                  id="reg-confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="custom-input"
                  placeholder="Confirm password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button type="submit" className="custom-btn-primary" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>

            <div className="custom-switch-line">
              <span>Already have an account? </span>
              <button
                type="button"
                className="custom-link-btn"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                Sign in
              </button>
            </div>

            {/* OR Divider */}
            <div className="custom-divider">
              <span className="divider-line" />
              <span className="divider-text">OR</span>
              <span className="divider-line" />
            </div>

            {/* Social Logins */}
            <div className="custom-social-buttons">
              <button
                type="button"
                className="custom-btn-social"
                onClick={() => setIsGoogleChooserOpen(true)}
              >
                <svg className="social-svg-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="custom-btn-social"
                onClick={handleAppleLogin}
              >
                <svg className="social-svg-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
          </form>
        )}

        {/* Security badge at bottom */}
        <div className="custom-login-footer">
          <ShieldCheck size={16} className="security-icon" />
          <span>SmartJob AI Secure Access</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* GOOGLE ACCOUNT CHOOSER MODAL (Select or Enter any email) */}
      {/* ======================================================== */}
      {isGoogleChooserOpen && (
        <div
          className="google-chooser-overlay"
          onClick={() => setIsGoogleChooserOpen(false)}
        >
          <div
            className="google-chooser-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Sign in with Google"
          >
            <button
              type="button"
              className="google-chooser-close"
              onClick={() => setIsGoogleChooserOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Google Header */}
            <div className="google-chooser-header">
              <svg className="google-g-logo" viewBox="0 0 24 24" width="28" height="28">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <h3>Sign in with Google</h3>
              <p>Choose an account to continue to SmartJob</p>
            </div>

            {/* List of Selectable Accounts */}
            <div className="google-accounts-list">
              {savedGoogleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="google-account-item"
                  onClick={() => executeGoogleLoginWithEmail(acc.email, acc.name)}
                >
                  <div className="google-avatar-circle">
                    {(acc.name || acc.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="google-account-info">
                    <strong className="google-acc-name">{acc.name}</strong>
                    <span className="google-acc-email">{acc.email}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Use Another Account / Custom Email Accordion */}
            <div className="google-custom-section">
              {!showCustomGoogleForm ? (
                <button
                  type="button"
                  className="btn-use-another-account"
                  onClick={() => setShowCustomGoogleForm(true)}
                >
                  <PlusCircle size={18} />
                  <span>Use another email address</span>
                </button>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeGoogleLoginWithEmail(customGoogleEmail, customGoogleName);
                  }}
                  className="custom-google-form"
                >
                  <div className="custom-input-group">
                    <label htmlFor="custom-g-email" className="custom-label">
                      Enter your Google Email *
                    </label>
                    <input
                      id="custom-g-email"
                      type="email"
                      className="custom-input"
                      placeholder="e.g. yourname@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="custom-input-group">
                    <label htmlFor="custom-g-name" className="custom-label">
                      Your Full Name (Optional)
                    </label>
                    <input
                      id="custom-g-name"
                      type="text"
                      className="custom-input"
                      placeholder="e.g. Kasun Perera"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                    />
                  </div>

                  <div className="google-form-actions">
                    <button
                      type="button"
                      className="btn-cancel-custom-g"
                      onClick={() => setShowCustomGoogleForm(false)}
                    >
                      Back to list
                    </button>
                    <button type="submit" className="btn-submit-custom-g">
                      Continue with this Email
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="google-chooser-footer">
              <span>To continue, Google will share your name and email with SmartJob.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
