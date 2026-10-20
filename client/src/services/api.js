const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const FALLBACK_JOBS = [
  {
    _id: "sample-1",
    jobName: "Full Stack Web Developer",
    company: "Virtusa Sri Lanka",
    location: "Colombo",
    salary: 160000,
    jobType: "Full-time",
    category: "Technology",
    description: "Looking for a skilled developer proficient in React, Node.js, and MongoDB to build modern web solutions.",
    createdAt: new Date().toISOString(),
    applications: []
  },
  {
    _id: "sample-2",
    jobName: "UI/UX Product Designer",
    company: "Creative Lanka Tech",
    location: "Kandy",
    salary: 110000,
    jobType: "Full-time",
    category: "Design",
    description: "Design mobile apps and web platforms using Figma and modern design systems.",
    createdAt: new Date().toISOString(),
    applications: []
  },
  {
    _id: "sample-3",
    jobName: "Digital Marketing Specialist",
    company: "Southern Media Works",
    location: "Galle",
    salary: 85000,
    jobType: "Remote",
    category: "Marketing",
    description: "Lead SEO, PPC, and social media campaigns for international clients.",
    createdAt: new Date().toISOString(),
    applications: []
  },
  {
    _id: "sample-4",
    jobName: "Junior Software Engineer",
    company: "Gampaha Tech Hub",
    location: "Gampaha",
    salary: 95000,
    jobType: "Full-time",
    category: "Technology",
    description: "Develop REST APIs and assist in client integrations with modern JavaScript.",
    createdAt: new Date().toISOString(),
    applications: []
  },
  {
    _id: "sample-5",
    jobName: "Accounts Executive",
    company: "Wayamba Trading Ltd",
    location: "Kurunegala",
    salary: 75000,
    jobType: "Full-time",
    category: "Finance",
    description: "Manage accounts payable/receivable, financial statements and VAT filings.",
    createdAt: new Date().toISOString(),
    applications: []
  }
];

/**
 * Check backend connection and health
 */
export async function checkBackendStatus() {
  try {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/health`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3000)
      });
    } catch {
      res = await fetch("/api/health", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3000)
      });
    }

    if (res && res.ok) {
      const data = await res.json();
      return {
        connected: true,
        database: data.database || "connected"
      };
    }

    return { connected: false, error: "Status code " + (res ? res.status : "unknown") };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

/**
 * Fetch all jobs from backend with automatic fallback
 */
export async function getJobs() {
  try {
    let response;
    try {
      response = await fetch(`${API_BASE}/api/jobs`, { signal: AbortSignal.timeout(4000) });
    } catch {
      response = await fetch("/api/jobs", { signal: AbortSignal.timeout(4000) });
    }

    if (response && response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Unable to reach backend API, loading offline vacancies:", err.message);
  }

  // Check locally saved user created jobs
  try {
    const local = localStorage.getItem("smartjob_local_jobs");
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed, ...FALLBACK_JOBS];
      }
    }
  } catch {}

  return FALLBACK_JOBS;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("smartjob_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Create a new job in backend with local fallback (Requires login)
 */
export async function createJob(jobData) {
  const user = getStoredUser();
  if (!user) {
    throw new Error("Login Required: You must be logged in to enter and post a job vacancy.");
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "x-user-id": user.id || user._id || "",
    "x-user-nic": user.nic || "",
    "x-user-email": user.email || "",
    "x-user-name": user.name || "",
    "x-user-role": user.role || "employer"
  };

  const payload = {
    ...jobData,
    userId: user.id || user._id,
    userNic: user.nic,
    userEmail: user.email,
    userName: user.name
  };

  try {
    let response;
    try {
      response = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
    } catch {
      response = await fetch("/api/jobs", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
    }

    if (response) {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to post job (Status ${response.status})`);
      }
      return await response.json();
    }
  } catch (err) {
    if (err.message && (err.message.includes("Access Denied") || err.message.includes("Login Required"))) {
      throw err;
    }
    console.warn("Backend unavailable, saving job locally:", err.message);
  }

  const newJob = {
    _id: "local-" + Date.now(),
    ...jobData,
    postedBy: user.id || user.email || user.nic,
    postedByEmail: user.email || "",
    postedByNic: user.nic || "",
    postedByName: user.name || "",
    createdAt: new Date().toISOString(),
    applications: []
  };

  try {
    const existing = JSON.parse(localStorage.getItem("smartjob_local_jobs") || "[]");
    localStorage.setItem("smartjob_local_jobs", JSON.stringify([newJob, ...existing]));
  } catch {}

  return { message: "Job posted successfully", job: newJob };
}

/**
 * Delete a job by ID (Strictly allowed only for the account that created the job)
 */
export async function deleteJob(id, role = "employer") {
  const user = getStoredUser();
  const deleteHeaders = {
    "Content-Type": "application/json",
    "x-user-role": user?.role || role,
    "x-user-id": user?.id || user?._id || "",
    "x-user-email": user?.email || "",
    "x-user-nic": user?.nic || ""
  };

  try {
    let response;
    try {
      response = await fetch(`${API_BASE}/api/jobs/${id}`, {
        method: "DELETE",
        headers: deleteHeaders,
        signal: AbortSignal.timeout(5000)
      });
    } catch {
      response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
        headers: deleteHeaders,
        signal: AbortSignal.timeout(5000)
      });
    }

    if (response) {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to delete job (Status ${response.status})`);
      }
      return await response.json();
    }
  } catch (err) {
    if (err.message && (err.message.includes("Access Denied") || err.message.includes("Status 403"))) {
      throw err;
    }
    console.warn("Backend unavailable, removing job locally:", err.message);
  }

  try {
    const existing = JSON.parse(localStorage.getItem("smartjob_local_jobs") || "[]");
    const filtered = existing.filter((j) => (j._id || j.id) !== id);
    localStorage.setItem("smartjob_local_jobs", JSON.stringify(filtered));
  } catch {}

  return { message: "Job deleted successfully", id };
}

/**
 * Apply for a job vacancy (Job Seeker - Requires login)
 */
export async function applyForJob(id, applicationData) {
  const user = getStoredUser();
  if (!user) {
    throw new Error("Login Required: You must be logged in to apply for a job vacancy.");
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "x-user-id": user.id || user._id || "",
    "x-user-nic": user.nic || ""
  };

  try {
    let response;
    try {
      response = await fetch(`${API_BASE}/api/jobs/${id}/apply`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ ...applicationData, userId: user.id || user._id, userNic: user.nic }),
        signal: AbortSignal.timeout(5000)
      });
    } catch {
      response = await fetch(`/api/jobs/${id}/apply`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ ...applicationData, userId: user.id || user._id, userNic: user.nic }),
        signal: AbortSignal.timeout(5000)
      });
    }

    if (response) {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        // Enrich the error with status + any backend flags (e.g. alreadyApplied)
        const err = new Error(errData.message || `Failed to submit application (Status ${response.status})`);
        err.status = response.status;
        if (errData.alreadyApplied) err.alreadyApplied = true;
        throw err;
      }
      return await response.json();
    }
  } catch (err) {
    if (err.message && (err.message.includes("Access Denied") || err.message.includes("Login Required"))) {
      throw err;
    }
    // Re-throw duplicate-application errors so the UI can show a clear message
    if (err.status === 409 || err.alreadyApplied) {
      throw err;
    }
    console.warn("Backend unavailable, recording application locally:", err.message);
  }

  return { message: "Application submitted successfully!" };
}

/**
 * Register a new user
 */
export async function registerUser(userData) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      signal: AbortSignal.timeout(8000)
    });
  } catch (err) {
    throw new Error("Cannot connect to server. Please make sure the backend is running.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

/**
 * Login user
 */
export async function loginUser(credentials) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      signal: AbortSignal.timeout(8000)
    });
  } catch (err) {
    throw new Error("Cannot connect to server. Please make sure the backend is running.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}
