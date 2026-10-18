import { useState, useEffect, useCallback, useMemo } from "react";
import JobMap from "./JobMap";
import LoginPage from "./LoginPage";
import {
  getJobs,
  createJob,
  deleteJob,
  applyForJob,
  checkBackendStatus,
  FALLBACK_JOBS,
} from "./services/api";
import "./App.css";
import cityImg from "./assets/city.jpg";
import logoImg from "./assets/Logo.png";
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Sparkles,
  ArrowRight,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Tag,
  UserCheck,
  PlusCircle,
  Clock,
  Filter,
  DollarSign,
  ChevronRight,
  Shield,
  Layers,
  Phone,
  Mail,
  User,
  X,
  Menu,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Lock,
  UploadCloud,
  FileText,
  Paperclip
} from "lucide-react";

const INITIAL_FORM = {
  jobName: "",
  company: "",
  category: "Technology",
  location: "Colombo",
  salary: "",
  jobType: "Full-time",
  description: "",
};

const INITIAL_APPLICATION = {
  applicantName: "",
  email: "",
  telephone: "",
  city: "Colombo",
  experience: "1-3 years",
  notes: "",
  cvFileName: "",
  cvData: "",
};

const CATEGORIES = [
  "All Categories",
  "Technology",
  "Design",
  "Marketing",
  "Finance",
  "Engineering",
  "Healthcare",
  "Customer Support",
  "General",
];

const JOB_TYPES = ["All Types", "Full-time", "Part-time", "Remote", "Contract", "Internship"];

const SRI_LANKA_CITIES = [
  "Colombo", "Kandy", "Galle", "Negombo", "Jaffna", "Trincomalee", "Batticaloa",
  "Anuradhapura", "Polonnaruwa", "Kurunegala", "Ratnapura", "Badulla", "Matara",
  "Hambantota", "Nuwara Eliya", "Matale", "Kalutara", "Gampaha", "Kegalle",
  "Ampara", "Monaragala", "Vavuniya", "Mannar", "Mullaitivu", "Kilinochchi",
  "Puttalam", "Weligama", "Ella", "Hatton", "Dambulla", "Sigiriya", "Hikkaduwa",
  "Tangalle", "Ambalangoda", "Panadura", "Moratuwa", "Dehiwala", "Kaduwela",
  "Avissawella", "Balangoda", "Embilipitiya", "Tissamaharama", "Remote"
];


function App() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedJobType, setSelectedJobType] = useState("All Types");
  const [sortBy, setSortBy] = useState("latest");

  // User Role: 'job_seeker' (Applicant) or 'employer' (Job poster)
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("smartjob_role") || "job_seeker";
  });

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("smartjob_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isLoggedIn = !!currentUser;

  // Auth enforcement states for guest protection
  const [pendingAuthAction, setPendingAuthAction] = useState(null);

  // Check if current logged-in user is the account that entered this vacancy
  const isJobCreator = useCallback((job) => {
    if (!currentUser || !job) return false;
    const currentId = (currentUser.id || currentUser._id || "").toString().trim().toLowerCase();
    const currentEmail = (currentUser.email || "").toString().trim().toLowerCase();
    const currentNic = (currentUser.nic || "").toString().trim();

    const creatorId = (job.postedBy || job.userId || "").toString().trim().toLowerCase();
    const creatorEmail = (job.postedByEmail || job.userEmail || "").toString().trim().toLowerCase();
    const creatorNic = (job.postedByNic || job.userNic || "").toString().trim();

    if (currentId && (currentId === creatorId || currentId === creatorEmail || currentId === creatorNic)) return true;
    if (currentEmail && (currentEmail === creatorEmail || currentEmail === creatorId)) return true;
    if (currentNic && (currentNic === creatorNic || currentNic === creatorId)) return true;
    return false;
  }, [currentUser]);

  // Active page: 'home' | 'login'
  const [currentPage, setCurrentPage] = useState(() => {
    return window.location.hash === "#login" ? "login" : "home";
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#login") {
        setCurrentPage("login");
      } else {
        setCurrentPage("home");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.location.hash = page === "login" ? "#login" : "#home";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem("smartjob_user", JSON.stringify(user));
    if (user.role) {
      setUserRole(user.role);
      localStorage.setItem("smartjob_role", user.role);
    }
    // Load this user's own applied-jobs list (not shared across accounts)
    try {
      const key = getUserAppliedKey(user);
      const saved = localStorage.getItem(key);
      if (!saved) {
        setAppliedJobIds([]);
      } else {
        const parsed = JSON.parse(saved);
        setAppliedJobIds(
          Array.isArray(parsed)
            ? parsed.filter(
                (id) =>
                  id &&
                  typeof id === "string" &&
                  id !== "undefined" &&
                  id !== "null" &&
                  id !== "[object Object]"
              )
            : []
        );
      }
    } catch {
      setAppliedJobIds([]);
    }
    navigateTo("home");
    showToast(`Welcome back, ${user.name || "User"}!`, "success");

    // Automatically resume pending application or job post action if user was prompted to login
    if (pendingAuthAction) {
      if (pendingAuthAction.type === "apply" && pendingAuthAction.job) {
        const targetJob = pendingAuthAction.job;
        setPendingAuthAction(null);
        setTimeout(() => {
          setJobToApply(targetJob);
          setApplyError("");
          setApplySuccess(false);
          setApplicationData({
            applicantName: user?.name || "",
            email: user?.email || "",
            telephone: user?.telephone || "",
            city: user?.address || "Colombo",
            experience: "1-3 years",
            notes: "",
          });
          setIsApplyModalOpen(true);
          showToast(`Ready to apply for "${targetJob.jobName || targetJob.title}"!`, "success");
        }, 400);
      } else if (pendingAuthAction.type === "post") {
        setPendingAuthAction(null);
        setTimeout(() => {
          setFormError("");
          setIsPostModalOpen(true);
          showToast("Ready to publish your vacancy!", "success");
        }, 400);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("smartjob_user");
    setPendingAuthAction(null);
    setIsPostModalOpen(false);
    setIsApplyModalOpen(false);
    // Clear the in-memory applied list — each user loads their own on login
    setAppliedJobIds([]);
    showToast("Signed out successfully");
  };

  // Applied job IDs stored in localStorage — keyed per user so different
  // users on the same device can each apply independently.
  // Email is used as the primary stable key because Google/Apple/offline
  // logins generate a random id/nic on every session, whereas email is constant.
  const getUserAppliedKey = (user) => {
    const uid =
      (user?.email && user.email.trim().toLowerCase()) ||
      user?.nic ||
      user?.id ||
      user?._id ||
      "guest";
    return `smartjob_applied_ids_${uid}`;
  };

  const [appliedJobIds, setAppliedJobIds] = useState(() => {
    try {
      const user = (() => {
        try { return JSON.parse(localStorage.getItem("smartjob_user")); } catch { return null; }
      })();
      const key = getUserAppliedKey(user);
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Filter out null / undefined / "[undefined]" / "[object Object]" strings
      // that may have been saved by a previous buggy session – those would cause
      // every job card to show as "Applied" because they match every job's resolved ID.
      return Array.isArray(parsed)
        ? parsed.filter(
            (id) =>
              id &&
              typeof id === "string" &&
              id !== "undefined" &&
              id !== "null" &&
              id !== "[object Object]"
          )
        : [];
    } catch {
      return [];
    }
  });

  // Theme: 'dark' or 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("smartjob_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("smartjob_theme", theme);
  }, [theme]);

  // One-time mount cleanup: purge any corrupted "[object Object]" or empty IDs
  // from ALL per-user applied-job keys left by a previous buggy session.
  // Without this, every job card would show as "Applied" on next visit.
  useEffect(() => {
    try {
      const BAD_VALUES = new Set(["", "null", "undefined", "[object Object]"]);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("smartjob_applied_ids_")) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (id) => id && typeof id === "string" && !BAD_VALUES.has(id)
            );
            if (cleaned.length !== parsed.length) {
              localStorage.setItem(key, JSON.stringify(cleaned));
              console.info("[SmartJob] Cleaned corrupted applied-job IDs from", key);
            }
          }
        }
      }
    } catch {
      // Non-critical — ignore any localStorage errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState({ connected: false, checking: true });

  // Modals state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);

  // Form states
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [formError, setFormError] = useState("");

  const [applicationData, setApplicationData] = useState(INITIAL_APPLICATION);
  const [cvFile, setCvFile] = useState(null);
  const [isDraggingCv, setIsDraggingCv] = useState(false);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show auto-dismiss toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Switch role handler
  const handleRoleChange = (role) => {
    setUserRole(role);
    localStorage.setItem("smartjob_role", role);
    showToast(
      role === "employer"
        ? "🏢 Switched to Employer Mode! You can post new vacancies & manage listings."
        : "👤 Switched to Job Seeker Mode! Explore positions and apply directly.",
      "success"
    );
  };

  // Fetch jobs from backend API with automatic fallback
  const fetchJobsData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status = await checkBackendStatus();
      setBackendStatus({ connected: !!status.connected, checking: false });

      const data = await getJobs();

      if (Array.isArray(data) && data.length > 0) {
        // Filter out any fake/fallback IDs — only show real DB jobs when connected
        const realJobs = status.connected
          ? data.filter(j => {
              const id = String(j._id || j.id || "");
              return !id.startsWith("sample-") && !id.startsWith("local-");
            })
          : data;

        if (realJobs.length > 0) {
          setJobs(realJobs);
        } else if (status.connected) {
          // Backend connected but DB empty — auto-seed default jobs
          console.log("[SmartJob] Backend connected but no real jobs found — seeding defaults...");
          try {
            const seedRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/jobs/seed`, { method: "POST" });
            if (seedRes.ok) {
              const seeded = await seedRes.json();
              if (Array.isArray(seeded.jobs) && seeded.jobs.length > 0) {
                setJobs(seeded.jobs);
              } else {
                setJobs(FALLBACK_JOBS);
              }
            } else {
              setJobs(FALLBACK_JOBS);
            }
          } catch {
            setJobs(FALLBACK_JOBS);
          }
        } else {
          setJobs(FALLBACK_JOBS);
        }
      } else {
        setJobs(FALLBACK_JOBS);
      }
    } catch (err) {
      console.warn("Using high-availability fallback vacancies:", err);
      setJobs(FALLBACK_JOBS);
      setBackendStatus({ connected: false, checking: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchJobsData();
  }, [fetchJobsData]);

  // Handle Post Job Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Application Input Change
  const handleApplyInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for opening the Post Job modal with login protection
  const handleOpenPostModal = () => {
    if (!isLoggedIn) {
      setPendingAuthAction({ type: "post", role: "employer" });
      navigateTo("login");
      return;
    }
    setFormError("");
    setIsPostModalOpen(true);
  };

  // Handle Create Job Submit (Employer only - Login enforced)
  const handlePostJob = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!isLoggedIn) {
      setFormError("Unauthorized: You must be logged in to post a vacancy.");
      showToast("Please log in to post a vacancy", "error");
      return;
    }

    if (!formData.jobName.trim()) {
      setFormError("Job title is required.");
      return;
    }
    if (!formData.salary || Number(formData.salary) <= 0) {
      setFormError("Please enter a valid salary amount.");
      return;
    }
    if (!formData.location.trim()) {
      setFormError("Location is required.");
      return;
    }

    try {
      setSubmittingJob(true);
      const res = await createJob({
        ...formData,
        salary: Number(formData.salary),
      });

      const newJob = res.job || res;
      setJobs((prev) => [newJob, ...prev]);
      setIsPostModalOpen(false);
      setFormData(INITIAL_FORM);
      showToast(`🎉 Vacancy "${newJob.jobName || formData.jobName}" posted successfully!`);
    } catch (err) {
      setFormError(err.message || "Failed to create job.");
    } finally {
      setSubmittingJob(false);
    }
  };

  // CV / Resume upload handlers
  const processCvFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setApplyError("CV file size exceeds 5MB limit. Please upload a smaller PDF or Word document.");
      return;
    }
    setCvFile(file);
    setApplyError("");
    const reader = new FileReader();
    reader.onload = () => {
      setApplicationData((prev) => ({
        ...prev,
        cvFileName: file.name,
        cvData: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processCvFile(file);
  };

  const handleCvDragOver = (e) => {
    e.preventDefault();
    setIsDraggingCv(true);
  };

  const handleCvDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingCv(false);
  };

  const handleCvDrop = (e) => {
    e.preventDefault();
    setIsDraggingCv(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processCvFile(file);
  };

  const handleRemoveCv = () => {
    setCvFile(null);
    setApplicationData((prev) => ({
      ...prev,
      cvFileName: "",
      cvData: "",
    }));
  };

  // Open Application Modal (Login enforced)
  const handleOpenApplyModal = (job) => {
    if (!job) return;

    if (!isLoggedIn) {
      setPendingAuthAction({ type: "apply", job, role: "job_seeker" });
      navigateTo("login");
      return;
    }

    setJobToApply(job);
    setApplyError("");
    setApplySuccess(false);
    setCvFile(null);
    setIsDraggingCv(false);
    setApplicationData({
      applicantName: currentUser?.name || "",
      email: currentUser?.email || "",
      telephone: currentUser?.telephone || "",
      city: currentUser?.address || "Colombo",
      experience: "1-3 years",
      notes: "",
      cvFileName: "",
      cvData: "",
    });
    setIsApplyModalOpen(true);
    if (selectedJob) setSelectedJob(null);
  };

  // Submit Application (Login enforced)
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!jobToApply) return;

    if (!isLoggedIn) {
      setApplyError("Unauthorized: You must be logged in to apply for this job.");
      showToast("Please log in to apply for jobs", "error");
      return;
    }

    if (!applicationData.applicantName.trim()) {
      setApplyError("Please enter your full name.");
      return;
    }
    if (!applicationData.email.trim() || !applicationData.email.includes("@")) {
      setApplyError("Please enter a valid email address.");
      return;
    }
    if (!applicationData.telephone.trim()) {
      setApplyError("Please enter your contact phone or WhatsApp number.");
      return;
    }

    try {
      setSubmittingApply(true);
      setApplyError("");

      // Safely extract a plain string job ID from multiple possible fields.
      // Handles: plain strings, numbers, Mongoose ObjectId, and { $oid: "..." }.
      const rawId = jobToApply._id ?? jobToApply.id ?? jobToApply.jobId ?? null;
      let jobId = "";
      if (rawId != null) {
        if (typeof rawId === "object" && rawId.$oid) {
          jobId = String(rawId.$oid).trim();
        } else if (typeof rawId === "object" && rawId.toString) {
          const s = rawId.toString().trim();
          jobId = (s && s !== "[object Object]") ? s : "";
        } else {
          const s = String(rawId).trim();
          jobId = (s && s !== "[object Object]" && s !== "undefined" && s !== "null") ? s : "";
        }
      }

      // Debug: log what we resolved (visible in browser DevTools console)
      console.debug("[SmartJob] Apply → jobToApply:", jobToApply, "→ resolved jobId:", jobId || "(empty)");

      // Try sending to backend; handle duplicate-application (409) explicitly.
      const isFakeId = !jobId ||
        jobId.startsWith("sample-") ||
        jobId.startsWith("local-");

      if (isFakeId) {
        // Offline/fallback job — warn the user but still record locally
        console.warn("[SmartJob] Applying to a fallback job (fake ID) — saving locally only.");
        showToast("⚠️ Live jobs list tika load karanna page refresh karanna.", "error");
      }

      if (jobId && !isFakeId) {
        try {
          await applyForJob(jobId, applicationData);
        } catch (backendErr) {
          // If the backend says this user already applied, surface that message
          if (backendErr?.status === 409 || backendErr?.alreadyApplied) {
            setAppliedJobIds((prev) => {
              const updated = [...new Set([...prev, jobId])];
              localStorage.setItem(getUserAppliedKey(currentUser), JSON.stringify(updated));
              return updated;
            });
            setApplyError("You have already applied for this job.");
            setSubmittingApply(false);
            return;
          }
          // Surface all other backend errors clearly instead of silent local fallback
          const msg = backendErr?.message || "";
          if (msg.includes("Login Required") || msg.includes("Access Denied")) {
            setApplyError(msg);
            setSubmittingApply(false);
            return;
          }
          // Network or unexpected error — warn but continue (allows local tracking)
          console.warn("[SmartJob] Backend apply error:", msg);
          setApplyError("Application sent but could not confirm with server. Please check your connection.");
          setSubmittingApply(false);
          return;
        }
      }

      // Use a stable local key: prefer jobId, fall back to job name
      const localKey = jobId || `${jobToApply.jobName || jobToApply.title || "unknown"}-${jobToApply.company || ""}`.replace(/\s+/g, "-").toLowerCase();

      setAppliedJobIds((prev) => {
        const updated = [...new Set([...prev, localKey])];
        localStorage.setItem(getUserAppliedKey(currentUser), JSON.stringify(updated));
        return updated;
      });

      setApplySuccess(true);
      showToast(`✅ Application submitted for ${jobToApply.jobName || jobToApply.title}! Recruiter has been notified.`);

      setTimeout(() => {
        setIsApplyModalOpen(false);
        setApplySuccess(false);
        setJobToApply(null);
        setCvFile(null);
      }, 2000);
    } catch (err) {
      setApplyError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmittingApply(false);
    }
  };

  // Handle Delete Job (Strictly restricted to the specific account that created the job)
  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!jobId) return;

    if (!currentUser) {
      alert("Access Denied: You must be logged in to delete vacancies.");
      return;
    }

    const targetJob =
      jobs.find((j) => (j._id || j.id) === jobId) ||
      (selectedJob && (selectedJob._id || selectedJob.id) === jobId ? selectedJob : null);

    if (targetJob && !isJobCreator(targetJob) && userRole !== "admin") {
      alert("Access Denied: You can only delete vacancies created by your own account.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${jobTitle || "this vacancy"}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteJob(jobId, userRole);
      setJobs((prev) => prev.filter((j) => (j._id || j.id) !== jobId));
      if (selectedJob && (selectedJob._id || selectedJob.id) === jobId) {
        setSelectedJob(null);
      }
      showToast("Vacancy removed successfully from database.");
    } catch (err) {
      alert("Failed to delete job: " + err.message);
    }
  };

  // Search and filter jobs
  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      const title = job.jobName || job.title || "";
      const company = job.company || "";
      const category = job.category || "";
      const jobLoc = job.location || "";
      const type = job.jobType || "Full-time";

      const sTerm = search.trim().toLowerCase();
      const lTerm = location.trim().toLowerCase();

      const matchesSearch =
        !sTerm ||
        title.toLowerCase().includes(sTerm) ||
        company.toLowerCase().includes(sTerm) ||
        category.toLowerCase().includes(sTerm) ||
        jobLoc.toLowerCase().includes(sTerm);

      const matchesLocation =
        !lTerm ||
        jobLoc.toLowerCase().includes(lTerm) ||
        lTerm.includes(jobLoc.toLowerCase());

      const matchesCategory =
        selectedCategory === "All Categories" ||
        category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

      const matchesJobType =
        selectedJobType === "All Types" ||
        type.toLowerCase().trim() === selectedJobType.toLowerCase().trim();

      return matchesSearch && matchesLocation && matchesCategory && matchesJobType;
    });

    if (sortBy === "salary-high") {
      result.sort((a, b) => (Number(b.salary) || 0) - (Number(a.salary) || 0));
    } else if (sortBy === "salary-low") {
      result.sort((a, b) => (Number(a.salary) || 0) - (Number(b.salary) || 0));
    }

    return result;
  }, [jobs, search, location, selectedCategory, selectedJobType, sortBy]);

  return (
    <div className={`app ${currentPage === "login" ? "login-view-active" : ""}`}>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header (Shown on Home page) */}
      {currentPage === "home" && (
        <header className="navbar-wrapper">
        <nav className="navbar">
          <a
            className="logo"
            href="#home"
            title="SmartJob"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("home");
            }}
          >
            <img src={logoImg} alt="SmartJob Logo" className="brand-logo-img" />
          </a>

          {/* Interactive Role Switcher */}
          <div className="role-switcher-container">
            <div className="role-switcher" role="radiogroup" aria-label="Role selection">
              <button
                type="button"
                className={`role-tab ${userRole === "job_seeker" ? "active" : ""}`}
                onClick={() => {
                  handleRoleChange("job_seeker");
                  if (currentPage !== "home") navigateTo("home");
                }}
                title="Job Seeker mode: Search and apply for vacancies"
              >
                <UserCheck size={14} />
                <span>Job Seeker (Apply)</span>
              </button>

              <button
                type="button"
                className={`role-tab ${userRole === "employer" ? "active employer-active" : ""}`}
                onClick={() => {
                  handleRoleChange("employer");
                  if (currentPage !== "home") navigateTo("home");
                }}
                title="Employer mode: Post & manage vacancies"
              >
                <Building2 size={14} />
                <span>Employer (Post & Manage)</span>
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <a href="#home" onClick={() => { setMobileMenuOpen(false); navigateTo("home"); }}>Home</a>
            <a href="#jobs" onClick={() => { setMobileMenuOpen(false); navigateTo("home"); }}>Vacancies</a>
            <a href="#job-map" onClick={() => { setMobileMenuOpen(false); navigateTo("home"); }}>Search with Map</a>
            <a href="#how-it-works" onClick={() => { setMobileMenuOpen(false); navigateTo("home"); }}>How It Works</a>
          </div>

          {/* Header Action Buttons */}
          <div className="nav-actions">
            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={() => {
                const nextTheme = theme === "dark" ? "light" : "dark";
                setTheme(nextTheme);
              }}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark and Light Mode"
            >
              {theme === "dark" ? (
                <>
                  <Sun size={16} className="theme-icon sun-icon" />
                  <span className="theme-text">Light</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="theme-icon moon-icon" />
                  <span className="theme-text">Dark</span>
                </>
              )}
            </button>

            {/* When Logged In: Show 'Find Jobs' & User Status + Logout. When NOT Logged In: Show 'Login' */}
            {isLoggedIn ? (
              <div className="logged-in-nav-actions">
                <a
                  className="btn-explore-nav"
                  href="#jobs"
                  onClick={() => {
                    if (currentPage !== "home") navigateTo("home");
                  }}
                >
                  Find Jobs <ArrowRight size={15} />
                </a>

                {userRole === "employer" && (
                  <button
                    type="button"
                    className="btn-post-nav employer-nav-btn"
                    onClick={() => {
                      if (currentPage !== "home") navigateTo("home");
                      handleOpenPostModal();
                    }}
                  >
                    <PlusCircle size={15} /> Post Job
                  </button>
                )}

                <div className="user-profile-badge" title={`Signed in as ${currentUser.name}`}>
                  <div className="user-avatar-dot">
                    {(currentUser.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="user-display-name">
                    {currentUser.name?.split(" ")[0] || "User"}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-logout-nav"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-login-nav"
                onClick={() => navigateTo("login")}
                title="Login to SmartJob"
              >
                <LogIn size={15} />
                <span>Login</span>
              </button>
            )}

            <button
              className="menu-button"
              aria-label="Toggle Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>
      )}

      {/* Role Banner Ribbon (Shown when on home page) */}
      {currentPage === "home" && (
        <div className={`role-ribbon ${userRole === "employer" ? "employer-ribbon" : "seeker-ribbon"}`}>
          <div className="role-ribbon-content">
            {userRole === "employer" ? (
              <>
                <div className="ribbon-text">
                  <strong>🏢 Employer Mode Active:</strong> You can publish new vacancies and manage listings.
                </div>
                <button
                  type="button"
                  className={`ribbon-btn ${!isLoggedIn ? "require-auth-btn" : ""}`}
                  onClick={handleOpenPostModal}
                >
                  {!isLoggedIn ? <Lock size={14} /> : <PlusCircle size={14} />}
                  {!isLoggedIn ? "+ Post Vacancy (Login Required)" : "+ Post Vacancy Now"}
                </button>
              </>
            ) : (
              <>
                <div className="ribbon-text">
                  <strong>👤 Job Seeker Mode Active:</strong> Explore open positions, search on the Sri Lanka map, and apply in 1-click.
                </div>
                <a href="#job-map" className="ribbon-link">
                  <MapPin size={14} /> Open Location Map
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {currentPage === "login" ? (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => navigateTo("home")}
          initialRole={userRole}
        />
      ) : (
        <main>
          {/* Hero Section with Animated City Background */}
          <section className="hero" id="home">
            {/* Animated City Background Layer */}
            <div className="hero-bg-wrapper">
            <img
              src={cityImg}
              alt="City Background"
              className="hero-bg-animated-image"
            />
            <div className="hero-bg-overlay"></div>
            <div className="hero-bg-gradient-bottom"></div>
          </div>

          <div className="hero-content-layer">
            <div className="hero-left-content">
              <div className="hero-badge">
                <Sparkles size={14} />
                <span>SRI LANKA'S CAREER & VACANCY PLATFORM</span>
              </div>

              <h1 className="hero-title">
                Find your next job, <br />
                <span className="hero-gradient-text">or hire top talent.</span>
              </h1>

              <p className="hero-description">
                Connecting ambitious Sri Lankan job seekers with leading employers.
                Search vacancies, explore opportunities on our interactive island map, and apply directly.
              </p>

              <div className="hero-quick-features">
                <div className="hero-feature-badge">
                  <CheckCircle2 size={14} className="feature-check" />
                  <span>Verified Employers</span>
                </div>
                <div className="hero-feature-badge">
                  <MapPin size={14} className="feature-check" />
                  <span>Island-wide Locations</span>
                </div>
                <div className="hero-feature-badge">
                  <Send size={14} className="feature-check" />
                  <span>1-Click Applications</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Centered Search Bar & Quick Tags */}
            <div className="hero-search-center">
              <div className="search-bar-container">
                <div className="search-input-group">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Enter your job title, keywords, or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="search-input-group location-input-group">
                  <MapPin size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search city (Colombo, Kandy, Galle)..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="search-submit-btn"
                  onClick={() => {
                    document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Search Vacancies
                </button>
              </div>

              {/* Quick Keyword Chips */}
              <div className="quick-tags-row">
                <span className="quick-tag-label">Popular Searches:</span>
                {["Colombo", "Kandy", "Software Engineer", "Marketing", "Remote", "Internship"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="quick-chip"
                    onClick={() => {
                      if (["Colombo", "Kandy"].includes(tag)) {
                        setLocation(tag);
                      } else {
                        setSearch(tag);
                      }
                      document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Vacancies Section */}
        <section className="jobs-section" id="jobs">
          <div className="section-header-row">
            <div>
              <span className="section-pill">
                <BriefcaseBusiness size={13} /> ACTIVE VACANCIES
              </span>
              <h2>Explore Open Positions</h2>
              <p>
                {userRole === "employer"
                  ? "Manage, review, or publish vacancies for your organization."
                  : "Discover matching roles in Sri Lanka and apply directly with your contact information."}
              </p>
            </div>

            <div className="jobs-action-controls">
              {userRole === "employer" && (
                <button
                  type="button"
                  className={`btn-add-primary ${!isLoggedIn ? "require-auth-btn" : ""}`}
                  onClick={handleOpenPostModal}
                >
                  {!isLoggedIn ? <Lock size={16} /> : <PlusCircle size={16} />}
                  {!isLoggedIn ? "Post a Vacancy (Login Required)" : "Post a Vacancy"}
                </button>
              )}

              <button
                type="button"
                className="btn-refresh-icon"
                onClick={fetchJobsData}
                title="Refresh listings from MongoDB"
              >
                <RefreshCw size={15} className={loading ? "spin" : ""} />
              </button>

              <span className="results-counter">
                {loading
                  ? "Loading..."
                  : (search || location || selectedCategory !== "All Categories" || selectedJobType !== "All Types")
                  ? `Showing ${filteredJobs.length} of ${jobs.length} jobs`
                  : `${filteredJobs.length} total vacancies`}
              </span>
            </div>
          </div>

          {/* Filter Pills & Sort Bar */}
          <div className="filter-controls-bar">
            {/* Category Pills */}
            <div className="category-pills-row">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sub-filters: Job Type & Sort */}
            <div className="filter-sub-row">
              <div className="sub-filter-group">
                <Filter size={14} />
                <span>Job Type:</span>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="sub-filter-group">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest">Latest First</option>
                  <option value="salary-high">Salary: High to Low</option>
                  <option value="salary-low">Salary: Low to High</option>
                </select>
              </div>

              {(search || location || selectedCategory !== "All Categories" || selectedJobType !== "All Types") && (
                <button
                  type="button"
                  className="btn-clear-filters"
                  onClick={() => {
                    setSearch("");
                    setLocation("");
                    setSelectedCategory("All Categories");
                    setSelectedJobType("All Types");
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-card">
              <RefreshCw size={28} className="spin" />
              <p>Connecting to backend and loading vacancies from MongoDB...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-card">
              <AlertCircle size={40} color="#f87171" />
              <h3>Backend Connection Issue</h3>
              <p>{error}</p>
              <button type="button" className="btn-retry" onClick={fetchJobsData}>
                <RefreshCw size={14} /> Retry Connection
              </button>
            </div>
          )}

          {/* Jobs Grid */}
          {!loading && !error && (
            <div className="job-cards-grid">
              {filteredJobs.map((job) => {
                // Safely resolve a plain string ID for this job card.
                // String() handles plain strings, numbers and Mongoose ObjectId correctly.
                // Reject "[object Object]" so an un-serialised object never poisons the list.
                const rawJobId = job._id || job.id;
                const jobId =
                  rawJobId != null && String(rawJobId).trim() !== "" && String(rawJobId).trim() !== "[object Object]"
                    ? String(rawJobId).trim()
                    : null;
                const isApplied = !!jobId && appliedJobIds.includes(jobId);

                return (
                  <article key={jobId} className="vacancy-card">
                    <div className="vacancy-card-header">
                      <div className="vacancy-avatar">
                        {(job.company || "C").charAt(0).toUpperCase()}
                      </div>

                      <div className="vacancy-title-wrap">
                        <h3>{job.jobName || job.title}</h3>
                        <span className="vacancy-company">
                          <Building2 size={13} /> {job.company || "Company not specified"}
                        </span>
                      </div>

                      <div className="vacancy-type-badge">
                        {job.jobType || "Full-time"}
                      </div>
                    </div>

                    <div className="vacancy-meta-row">
                      <div className="meta-item">
                        <MapPin size={14} />
                        <span>
                          {(job.jobType === "Remote" || (job.location || "").toLowerCase() === "remote")
                            ? "Remote — Sri Lanka"
                            : `${job.location || "Colombo"}, Sri Lanka`}
                        </span>
                      </div>

                      <div className="meta-item salary-meta">
                        <DollarSign size={14} />
                        <strong>
                          {typeof job.salary === "number"
                            ? `Rs. ${job.salary.toLocaleString()} / mo`
                            : (job.salary || "Negotiable")}
                        </strong>
                      </div>
                    </div>

                    {job.description && (
                      <p className="vacancy-snippet">
                        {job.description.length > 120
                          ? `${job.description.substring(0, 120)}...`
                          : job.description}
                      </p>
                    )}

                    <div className="vacancy-card-footer">
                      <span className="vacancy-category-tag">
                        <Tag size={12} /> {job.category || "General"}
                      </span>

                      {/* Action buttons based on Role */}
                      <div className="card-btn-group">
                        <button
                          type="button"
                          className="btn-details-card"
                          onClick={() => setSelectedJob(job)}
                          title="View job overview"
                        >
                          Details
                        </button>

                        {/* Creator delete action - Strictly for job creator */}
                        {isJobCreator(job) && (
                          <button
                            type="button"
                            className="btn-delete-card"
                            onClick={() => handleDeleteJob(jobId, job.jobName || job.title)}
                            title="Delete this vacancy (Creator action)"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}

                        {/* Apply action */}
                        <button
                          type="button"
                          className={`btn-apply-card ${isApplied ? "applied" : ""} ${!isLoggedIn ? "require-auth" : ""}`}
                          onClick={() => handleOpenApplyModal(job)}
                          disabled={isApplied}
                          title={!isLoggedIn ? "Please log in to apply for this vacancy" : "Apply directly"}
                        >
                          {isApplied ? (
                            <>
                              <CheckCircle2 size={14} /> Applied
                            </>
                          ) : !isLoggedIn ? (
                            <>
                              <Lock size={14} /> Apply Now
                            </>
                          ) : (
                            <>
                              <Send size={14} /> Apply Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="no-vacancies-card">
                  <Search size={36} />
                  <h3>No vacancies found</h3>
                  <p>Try searching with another keyword or city, or reset filters.</p>
                  <button
                    type="button"
                    className="btn-reset-search"
                    onClick={() => {
                      setSearch("");
                      setLocation("");
                      setSelectedCategory("All Categories");
                      setSelectedJobType("All Types");
                    }}
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Location Map Section */}
        <JobMap
          jobs={jobs}
          onApplyJob={handleOpenApplyModal}
          onViewDetails={(job) => setSelectedJob(job)}
          userRole={userRole}
          isLoggedIn={isLoggedIn}
        />

        {/* How It Works Section */}
        <section className="how-it-works-section" id="how-it-works">
          <div className="section-center-heading">
            <span className="section-pill">
              <Shield size={13} /> SIMPLE & POWERFUL
            </span>
            <h2>How SmartJob Works</h2>
            <p>Designed for seamless hiring and job discovery in Sri Lanka.</p>
          </div>

          <div className="steps-cards-grid">
            <div className="step-card">
              <div className="step-num-badge">1</div>
              <div className="step-icon-wrap amber">
                <Building2 size={24} />
              </div>
              <h3>Employers Post Vacancies</h3>
              <p>
                Recruiters quickly publish open roles with salary, category, and city location directly to the live platform.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">2</div>
              <div className="step-icon-wrap violet">
                <MapPin size={24} />
              </div>
              <h3>Explore on the Map</h3>
              <p>
                Job seekers browse opportunities island-wide visually using our interactive Sri Lanka map or filter by keywords.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">3</div>
              <div className="step-icon-wrap emerald">
                <Send size={24} />
              </div>
              <h3>Apply Directly</h3>
              <p>
                Candidates submit their contact details, qualifications, and cover notes directly for the vacancy.
              </p>
            </div>
          </div>
        </section>

        {/* Animated Modern Footer */}
        <footer className="footer">
          {/* Animated Glowing Laser Ribbon Top Border */}
          <div className="footer-animated-glow-line"></div>

          {/* Floating Ambient Glow Orbs */}
          <div className="footer-ambient-glow glow-1"></div>
          <div className="footer-ambient-glow glow-2"></div>

          <div className="footer-content-inner">
            <div className="footer-top">
              <div className="footer-brand">
                <a className="logo" href="#home" title="SmartJob">
                  <img src={logoImg} alt="SmartJob Logo" className="brand-logo-img footer-logo-img" />
                </a>
                <p className="footer-tagline">
                  Sri Lanka's premier job platform connecting employers with top career seekers across Colombo, Kandy, Galle, and islandwide.
                </p>
                <div className="footer-badges-row">
                  <span className="footer-feature-pill">
                    <span className="live-status-dot"></span> Active Jobs
                  </span>
                  <span className="footer-feature-pill">
                    <Sparkles size={13} className="sparkle-accent" /> Smart AI Search
                  </span>
                </div>
              </div>

              <div className="footer-links-group">
                <h4>Platform Navigation</h4>
                <a href="#home">🏠 Home Overview</a>
                <a href="#jobs">💼 Browse Vacancies</a>
                <a href="#job-map">🗺️ Search with Map</a>
                <a href="#how-it-works">⚡ How It Works</a>
              </div>

              <div className="footer-highlights-group">
                <h4>Key Features</h4>
                <div className="footer-highlight-card">
                  <span className="highlight-icon">🗺️</span>
                  <div>
                    <strong>Interactive Island Map</strong>
                    <p>Visual vacancy explorer across all provinces</p>
                  </div>
                </div>
                <div className="footer-highlight-card">
                  <span className="highlight-icon">⚡</span>
                  <div>
                    <strong>1-Click Applications</strong>
                    <p>Apply directly without complicated resumes</p>
                  </div>
                </div>
              </div>

              <div className="footer-role-actions">
                <h4>Mode Selector</h4>
                <button
                  type="button"
                  className={`footer-role-btn ${userRole === "job_seeker" ? "active" : ""}`}
                  onClick={() => handleRoleChange("job_seeker")}
                >
                  👤 Job Seeker Mode
                </button>
                <button
                  type="button"
                  className={`footer-role-btn ${userRole === "employer" ? "active" : ""}`}
                  onClick={() => handleRoleChange("employer")}
                >
                  🏢 Employer Mode
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Solid Black Bottom Strip */}
          <div className="footer-bottom-strip">
            <div className="footer-bottom">
              <div className="footer-bottom-left">
                <span>© 2026 <strong>SmartJob</strong> · Full Screen Modern Edition</span>
                <span className="footer-dot-sep">•</span>
                <span className="footer-db-badge">
                  <span className="live-status-dot"></span>
                  {backendStatus.connected ? "MongoDB Atlas Connected" : "Local Database Active"}
                </span>
              </div>
              <div className="footer-bottom-right">
                <span>Crafted for Sri Lanka 🇱🇰 · Fast, Reliable & Secure</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: Post a Job Modal (Employer only)                */}
      {/* ======================================================== */}
      {isPostModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPostModalOpen(false)}>
          <div
            className="modern-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Post a new job"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-x-close"
              onClick={() => setIsPostModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-header">
              <span className="section-pill amber-pill">
                <Building2 size={13} /> EMPLOYER PORTAL
              </span>
              <h2>Post a New Vacancy</h2>
              <p>Fill in details to publish your job vacancy to the MongoDB database.</p>
            </div>

            {formError && (
              <div className="form-error-alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePostJob} className="modal-form">
              <div className="form-field">
                <label htmlFor="jobName">Job Title *</label>
                <input
                  id="jobName"
                  name="jobName"
                  type="text"
                  placeholder="Enter your job title"
                  value={formData.jobName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="company">Company Name</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Enter your company name"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="Technology">Technology</option>
                    <option value="Design">Design / Creative</option>
                    <option value="Marketing">Marketing / Sales</option>
                    <option value="Finance">Finance / Accounting</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="location">City / Location in Sri Lanka *</label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  >
                    {SRI_LANKA_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="jobType">Job Type</label>
                  <select
                    id="jobType"
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleInputChange}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="salary">Monthly Salary (LKR) *</label>
                <input
                  id="salary"
                  name="salary"
                  type="number"
                  min="0"
                  placeholder="Enter your monthly salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="description">Requirements & Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Enter your job requirements and description"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsPostModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-primary"
                  disabled={submittingJob}
                >
                  {submittingJob ? "Publishing to MongoDB..." : "Publish Vacancy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Job Application Modal (Job Seekers)             */}
      {/* ======================================================== */}
      {isApplyModalOpen && jobToApply && (
        <div className="modal-overlay" onClick={() => setIsApplyModalOpen(false)}>
          <div
            className="modern-modal apply-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Apply for vacancy"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-x-close"
              onClick={() => setIsApplyModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-header">
              <span className="section-pill emerald-pill">
                <Send size={13} /> DIRECT JOB APPLICATION
              </span>
              <h2>Apply for Position</h2>
              <div className="apply-target-card">
                <h4>{jobToApply.jobName || jobToApply.title}</h4>
                <p>
                  <Building2 size={13} /> {jobToApply.company || "Company"} •{" "}
                  <MapPin size={13} /> {jobToApply.location || "Colombo"}, Sri Lanka
                </p>
                <span className="apply-salary-tag">
                  {typeof jobToApply.salary === "number"
                    ? `Rs. ${jobToApply.salary.toLocaleString()} / month`
                    : (jobToApply.salary || "Negotiable")}
                </span>
              </div>
            </div>

            {applySuccess ? (
              <div className="apply-success-box">
                <CheckCircle2 size={48} color="#10b981" />
                <h3>Application Sent Successfully!</h3>
                <p>
                  Your application has been delivered to <strong>{jobToApply.company}</strong>. The hiring team will contact you via email or phone.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="modal-form">
                {applyError && (
                  <div className="form-error-alert">
                    <AlertCircle size={16} />
                    <span>{applyError}</span>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="applicantName">Full Name *</label>
                  <div className="input-icon-wrap">
                    <User size={16} />
                    <input
                      id="applicantName"
                      name="applicantName"
                      type="text"
                      placeholder="Enter your full name"
                      value={applicationData.applicantName}
                      onChange={handleApplyInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="email">Email Address *</label>
                    <div className="input-icon-wrap">
                      <Mail size={16} />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={applicationData.email}
                        onChange={handleApplyInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="telephone">Phone / WhatsApp Number *</label>
                    <div className="input-icon-wrap">
                      <Phone size={16} />
                      <input
                        id="telephone"
                        name="telephone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={applicationData.telephone}
                        onChange={handleApplyInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="city">Your Location / City *</label>
                    <select
                      id="city"
                      name="city"
                      value={applicationData.city}
                      onChange={handleApplyInputChange}
                      required
                    >
                      {SRI_LANKA_CITIES.filter(c => c !== "Remote").map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="experience">Experience Level</label>
                    <select
                      id="experience"
                      name="experience"
                      value={applicationData.experience}
                      onChange={handleApplyInputChange}
                    >
                      <option value="Entry Level / Fresh Graduate">Entry Level / Fresh Graduate</option>
                      <option value="1-2 years">1 - 2 years</option>
                      <option value="3-5 years">3 - 5 years</option>
                      <option value="5+ years">5+ years senior</option>
                    </select>
                  </div>
                </div>

                {/* CV / Resume Upload Field */}
                <div className="form-field cv-upload-field">
                  <div className="cv-upload-label-row">
                    <label htmlFor="cvFileInput">
                      <Paperclip size={14} /> Upload CV / Resume
                    </label>
                    <span className="cv-badge-req">PDF, DOC, DOCX (Max 5MB)</span>
                  </div>

                  <div
                    className={`cv-dropzone-box ${cvFile ? "has-file" : ""} ${isDraggingCv ? "is-dragging" : ""}`}
                    onDragOver={handleCvDragOver}
                    onDragLeave={handleCvDragLeave}
                    onDrop={handleCvDrop}
                    onClick={() => document.getElementById("cvFileInput")?.click()}
                  >
                    <input
                      id="cvFileInput"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCvFileChange}
                      style={{ display: "none" }}
                    />

                    {cvFile ? (
                      <div className="cv-selected-card">
                        <div className="cv-file-icon-wrap">
                          <FileText size={24} color="#6366f1" />
                        </div>
                        <div className="cv-file-details">
                          <strong className="cv-filename">{cvFile.name}</strong>
                          <span className="cv-filesize">
                            {(cvFile.size / 1024).toFixed(1)} KB • Attached successfully
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-remove-cv"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCv();
                          }}
                          title="Remove attached CV"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="cv-empty-dropzone">
                        <div className="cv-cloud-icon">
                          <UploadCloud size={24} />
                        </div>
                        <div className="cv-dropzone-text">
                          <p><strong>Click to browse</strong> or drag & drop your CV file</p>
                          <span>PDF, Word (.doc, .docx) formats supported</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="notes">Cover Note / Why are you a good fit?</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    placeholder="Enter your cover note"
                    value={applicationData.notes}
                    onChange={handleApplyInputChange}
                  ></textarea>
                </div>

                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setIsApplyModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-primary"
                    disabled={submittingApply}
                  >
                    {submittingApply ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Job Overview Details Modal                      */}
      {/* ======================================================== */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div
            className="modern-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Vacancy details"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-x-close"
              onClick={() => setSelectedJob(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-header">
              <span className="section-pill">VACANCY OVERVIEW</span>
              <h2>{selectedJob.jobName || selectedJob.title}</h2>
              <p className="modal-company-sub">
                <Building2 size={16} /> {selectedJob.company || "Company not specified"}
              </p>
            </div>

            <div className="details-info-grid">
              <div className="detail-stat-box">
                <span className="box-label">Location</span>
                <strong>{selectedJob.location || "Colombo"}, Sri Lanka</strong>
              </div>

              <div className="detail-stat-box">
                <span className="box-label">Monthly Salary</span>
                <strong className="emerald-text">
                  {typeof selectedJob.salary === "number"
                    ? `Rs. ${selectedJob.salary.toLocaleString()}`
                    : (selectedJob.salary || "Negotiable")}
                </strong>
              </div>

              <div className="detail-stat-box">
                <span className="box-label">Job Type</span>
                <strong>{selectedJob.jobType || "Full-time"}</strong>
              </div>

              <div className="detail-stat-box">
                <span className="box-label">Category</span>
                <strong>{selectedJob.category || "General"}</strong>
              </div>
            </div>

            {selectedJob.description && (
              <div className="modal-description-section">
                <h4>Role Details & Requirements</h4>
                <p>{selectedJob.description}</p>
              </div>
            )}

            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>

              {isJobCreator(selectedJob) && (
                <button
                  type="button"
                  className="btn-modal-delete"
                  onClick={() => {
                    const id = selectedJob._id || selectedJob.id;
                    handleDeleteJob(id, selectedJob.jobName || selectedJob.title);
                  }}
                >
                  <Trash2 size={15} /> Delete Vacancy
                </button>
              )}

              <button
                type="button"
                className={`btn-modal-primary ${!isLoggedIn ? "require-auth" : ""}`}
                onClick={() => handleOpenApplyModal(selectedJob)}
              >
                {!isLoggedIn ? <Lock size={15} /> : <Send size={15} />}
                {!isLoggedIn ? "Login to Apply" : "Apply for this Vacancy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
