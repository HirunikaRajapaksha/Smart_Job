import express from "express";
import getJobModel from "../models/Job.js";
import getApplicationModel from "../models/Application.js";
import { isJobsDBReady, isSeekersDBReady } from "../db.js";

const router = express.Router();
let inMemoryJobs = [];

// Default seed jobs for Sri Lankan vacancies.
// NOTE: _id fields here are ONLY used when these are returned directly to the
// frontend as a fallback (i.e. when DB is not connected). The seedDefaultJobs()
// function strips _id before inserting into MongoDB so real ObjectIds are assigned.
export const DEFAULT_SEED_JOBS = [
  {
    _id: "seed-1",
    jobName: "Bank Manager",
    company: "Bank of Ceylon",
    category: "Banking",
    salary: 150000,
    location: "Colombo",
    jobType: "Full-time",
    description: "Manage bank operations, supervise staff, maintain customer relationships, and oversee financial activities. A relevant degree and banking experience are required.",
    applications: []
  },
  {
    _id: "seed-2",
    jobName: "Security Officer",
    company: "Samanala Security Services",
    category: "Security",
    salary: 65000,
    location: "Matara",
    jobType: "Full-time",
    description: "Protect property, monitor security systems, check visitors, and maintain a safe environment.",
    applications: []
  },
  {
    _id: "seed-3",
    jobName: "Cashier",
    company: "Cargills Food City",
    category: "Retail",
    salary: 55000,
    location: "Galle",
    jobType: "Part-time",
    description: "Handle customer payments, operate the cash register, and provide friendly customer service.",
    applications: []
  },
  {
    _id: "seed-4",
    jobName: "Sales Assistant",
    company: "Keells Super",
    category: "Sales",
    salary: 50000,
    location: "Kandy",
    jobType: "Part-time",
    description: "Assist customers, arrange products, manage shelves, and support daily sales activities.",
    applications: []
  },
  {
    _id: "seed-5",
    jobName: "Receptionist",
    company: "Asiri Hospital",
    category: "Administration",
    salary: 60000,
    location: "Kurunegala",
    jobType: "Full-time",
    description: "Welcome visitors, answer telephone calls, schedule appointments, and manage reception duties.",
    applications: []
  },
  {
    _id: "seed-6",
    jobName: "Nurse",
    company: "Lanka Hospitals",
    category: "Healthcare",
    salary: 85000,
    location: "Negombo",
    jobType: "Full-time",
    description: "Provide patient care, monitor health conditions, and assist doctors with medical procedures. Relevant nursing qualifications are required.",
    applications: []
  },
  {
    _id: "seed-7",
    jobName: "School Teacher",
    company: "Private International School",
    category: "Education",
    salary: 65000,
    location: "Jaffna",
    jobType: "Contract",
    description: "Prepare lessons, teach students, assess academic progress, and maintain a positive learning environment.",
    applications: []
  },
  {
    _id: "seed-8",
    jobName: "Park Attendant",
    company: "Samanala Park",
    category: "Tourism",
    salary: 45000,
    location: "Weligama",
    jobType: "Part-time",
    description: "Assist visitors, maintain park cleanliness, and help ensure a safe and enjoyable environment.",
    applications: []
  },
  {
    _id: "seed-9",
    jobName: "Delivery Rider",
    company: "PickMe",
    category: "Delivery",
    salary: 70000,
    location: "Batticaloa",
    jobType: "Contract",
    description: "Deliver orders safely and on time, follow assigned routes, and provide good customer service.",
    applications: []
  },
  {
    _id: "seed-10",
    jobName: "Office Assistant",
    company: "Commercial Bank",
    category: "Administration",
    salary: 50000,
    location: "Anuradhapura",
    jobType: "Full-time",
    description: "Organize documents, maintain records, assist staff, and support daily office activities.",
    applications: []
  },
  {
    _id: "seed-11",
    jobName: "Hotel Receptionist",
    company: "Jetwing Hotels",
    category: "Hospitality",
    salary: 60000,
    location: "Ella",
    jobType: "Part-time",
    description: "Welcome guests, manage reservations, handle check-ins and check-outs, and provide guest assistance.",
    applications: []
  },
  {
    _id: "seed-12",
    jobName: "Driver",
    company: "Private Transport Company",
    category: "Transport",
    salary: 65000,
    location: "Trincomalee",
    jobType: "Full-time",
    description: "Transport passengers or goods safely, maintain the vehicle, and follow traffic regulations. A valid driving licence is required.",
    applications: []
  },
  {
    _id: "seed-13",
    jobName: "Banking Assistant",
    company: "People's Bank",
    category: "Banking",
    salary: 75000,
    location: "Ratnapura",
    jobType: "Internship",
    description: "Assist customers with banking services, maintain records, and support daily branch operations.",
    applications: []
  },
  {
    _id: "seed-14",
    jobName: "Cleaner",
    company: "City Cleaning Services",
    category: "Cleaning",
    salary: 40000,
    location: "Hambantota",
    jobType: "Part-time",
    description: "Maintain cleanliness and hygiene in offices, buildings, and other assigned areas.",
    applications: []
  },
  {
    _id: "seed-15",
    jobName: "Electrician",
    company: "Lanka Electrical Services",
    category: "Technical",
    salary: 80000,
    location: "Badulla",
    jobType: "Contract",
    description: "Install, inspect, and repair electrical systems while following safety standards. Relevant technical skills are required.",
    applications: []
  }
];

export async function seedDefaultJobs() {
  try {
    if (!isJobsDBReady()) return;
    const Job = getJobModel();

    // Clean up any old records that were saved with a plain string _id
    // (e.g. "seed-1") — those cause Mongoose CastError on findById.
    // Replace them with proper MongoDB ObjectId documents.
    const OLD_SEED_IDS = ["seed-1", "seed-2", "seed-3", "seed-4", "seed-5", "seed-6"];
    for (const oldId of OLD_SEED_IDS) {
      try {
        const stale = await Job.findOne({ _id: oldId });
        if (stale) {
          await Job.deleteOne({ _id: oldId });
          console.log(`[Jobs DB] Removed stale string-ID seed record: ${oldId}`);
        }
      } catch {
        // Ignore cast errors — record simply doesn't exist
      }
    }

    for (const item of DEFAULT_SEED_JOBS) {
      const exists = await Job.findOne({ jobName: item.jobName, company: item.company });
      if (!exists) {
        // Destructure away _id so MongoDB assigns a real ObjectId
        const { _id, ...jobData } = item;
        await Job.create(jobData);
        console.log(`[Jobs DB] Seeded: "${item.jobName}" @ ${item.location}`);
      }
    }
  } catch (err) {
    console.warn("Auto-seeding notice:", err.message);
  }
}

// ── POST /api/jobs ─────────────────────────────────────────────────────────
// Add a new job → saved to "Jobs" database
router.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId;
    const userNic = req.headers["x-user-nic"] || req.body.userNic;
    const userEmail = (req.headers["x-user-email"] || req.body.userEmail || "").trim().toLowerCase();
    const userName = req.headers["x-user-name"] || req.body.userName || "";

    if (!userId && !userNic && !userEmail) {
      return res.status(401).json({ message: "Access Denied: You must be logged in to post a job vacancy." });
    }

    const { jobName, company, category, salary, location, description, jobType } = req.body;

    if (!jobName || salary === undefined || !location) {
      return res.status(400).json({ message: "Job name, salary and location are required" });
    }
    if (!Number.isFinite(Number(salary)) || Number(salary) < 0) {
      return res.status(400).json({ message: "Please enter a valid salary" });
    }

    const jobData = {
      jobName: jobName.trim(),
      company: (company && company.trim()) || "Company not specified",
      category: (category && category.trim()) || "General",
      salary: Number(salary),
      location: location.trim(),
      description: (description && description.trim()) || "",
      jobType: jobType || "Full-time",
      postedBy: userId || userEmail || userNic || "creator",
      postedByEmail: userEmail || "",
      postedByNic: userNic || "",
      postedByName: userName || "",
      applications: []
    };

    if (isJobsDBReady()) {
      const Job = getJobModel();
      const job = await Job.create(jobData);
      console.log(`[Jobs DB] ✅ New job saved: "${job.jobName}" @ ${job.company}`);
      return res.status(201).json({ message: "Job added successfully", job });
    } else {
      const fallbackJob = { _id: "local-" + Date.now(), ...jobData };
      inMemoryJobs.unshift(fallbackJob);
      return res.status(201).json({ message: "Job added (local cache — DB not connected)", job: fallbackJob });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to add job: " + error.message });
  }
});

// ── GET /api/jobs ──────────────────────────────────────────────────────────
// Get all jobs from "Jobs" database
router.get("/", async (req, res) => {
  try {
    if (isJobsDBReady()) {
      const Job = getJobModel();
      // Always run seed/cleanup so stale string-ID records get replaced
      await seedDefaultJobs();
      const jobs = await Job.find().sort({ createdAt: -1 });
      if (jobs && jobs.length > 0) return res.status(200).json(jobs);
    }
    res.status(200).json(DEFAULT_SEED_JOBS);
  } catch (error) {
    console.warn("DB read warning, using seed fallback:", error.message);
    res.status(200).json(DEFAULT_SEED_JOBS);
  }
});

// ── POST /api/jobs/seed ────────────────────────────────────────────────────
router.post("/seed", async (req, res) => {
  try {
    await seedDefaultJobs();
    const Job = getJobModel();
    const allJobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "Default vacancies populated", count: allJobs.length, jobs: allJobs });
  } catch (err) {
    res.status(500).json({ message: "Seed failed: " + err.message });
  }
});

// ── Safe job finder: handles both valid ObjectIds and legacy string IDs ────
async function safeFindJob(Job, id) {
  try {
    // Try standard ObjectId lookup first
    const job = await Job.findById(id);
    if (job) return job;
  } catch (castErr) {
    // Not a valid ObjectId — fall through to string match
  }
  // Fallback: match by jobName+company for old seed-N style IDs (no longer
  // seeded with hardcoded IDs, but kept for backwards compatibility)
  return null;
}

// ── GET /api/jobs/:id ──────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const Job = getJobModel();
    const job = await safeFindJob(Job, req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch job" });
  }
});

// ── POST /api/jobs/:id/apply ───────────────────────────────────────────────
// Apply for a job:
//   1. Embedded in Job document          → Jobs       database
//   2. Standalone Application document   → Job_Seekers database
router.post("/:id/apply", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId;
    const userNic = req.headers["x-user-nic"] || req.body.userNic;

    if (!userId && !userNic) {
      return res.status(401).json({ message: "Access Denied: You must be logged in to apply for this job." });
    }

    const { applicantName, email, telephone, notes, cvFileName, cvData } = req.body;
    if (!applicantName || !email || !telephone) {
      return res.status(400).json({ message: "Applicant name, email and phone number are required" });
    }

    const Job = getJobModel();
    const job = await safeFindJob(Job, req.params.id);
    if (!job) return res.status(404).json({ message: "Job vacancy not found" });

    // ── Duplicate-application guard ────────────────────────────────────────
    // The same user (matched by userId or NIC) cannot apply twice to the
    // same job. This check runs against the Job_Seekers Applications collection.
    if (isSeekersDBReady()) {
      try {
        const Application = getApplicationModel();
        const duplicate = await Application.findOne({
          jobId: req.params.id,
          $or: [
            ...(userId ? [{ applicantUserId: userId }] : []),
            ...(userNic ? [{ applicantNic: userNic }] : []),
          ],
        });
        if (duplicate) {
          return res.status(409).json({
            message: "You have already applied for this job. Each applicant can apply only once per vacancy.",
            alreadyApplied: true,
          });
        }
      } catch (dupCheckErr) {
        // Non-fatal — if the check fails (e.g. collection not yet created),
        // we allow the application through and rely on the frontend guard.
        console.warn("[Jobs] Duplicate check skipped:", dupCheckErr.message);
      }
    }

    if (!Array.isArray(job.applications)) job.applications = [];

    const appData = {
      applicantName: applicantName.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      notes: (notes && notes.trim()) || "",
      cvFileName: (cvFileName && cvFileName.trim()) || "",
      cvData: cvData || ""
    };

    // 1️⃣ Save embedded inside Job → Jobs database
    job.applications.push(appData);
    await job.save();
    console.log(`[Jobs DB]     ✅ Application added → "${job.jobName}" by ${applicantName}`);

    // 2️⃣ Save standalone document → Job_Seekers database
    if (isSeekersDBReady()) {
      try {
        const Application = getApplicationModel();
        await Application.create({
          jobId: job._id.toString(),
          jobName: job.jobName,
          company: job.company || "",
          location: job.location || "",
          ...appData,
          applicantNic: userNic || "",
          applicantUserId: userId || ""
        });
        console.log(`[Job_Seekers] ✅ Application saved for seeker: ${applicantName} → "${job.jobName}"`);
      } catch (seekerErr) {
        console.warn("[Job_Seekers] ⚠️  Could not save application:", seekerErr.message);
      }
    } else {
      console.warn("[Job_Seekers] ⚠️  Not connected — application only saved in Jobs DB.");
    }

    res.status(201).json({
      message: "Application submitted successfully!",
      applicantCount: job.applications.length,
      jobTitle: job.jobName
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit application: " + error.message });
  }
});

// ── DELETE /api/jobs/:id ───────────────────────────────────────────────────
// Delete a job (only by the creator)
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
    const userEmail = (req.headers["x-user-email"] || req.query.userEmail || req.body?.userEmail || "").trim().toLowerCase();
    const userNic = req.headers["x-user-nic"] || req.query.userNic || req.body?.userNic;
    const userRole = req.headers["x-user-role"] || req.query.role;

    if (!userId && !userEmail && !userNic) {
      return res.status(401).json({ message: "Access Denied: You must be logged in to delete vacancies." });
    }

    const checkOwner = (job) => {
      const jBy = (job.postedBy || "").toLowerCase();
      const jEmail = (job.postedByEmail || "").toLowerCase();
      const jNic = (job.postedByNic || "");
      return (
        (jBy && (jBy === (userId || "").toLowerCase() || jBy === (userNic || "").toLowerCase() || jBy === userEmail)) ||
        (jEmail && userEmail && jEmail === userEmail) ||
        (jNic && userNic && jNic === userNic)
      );
    };

    if (isJobsDBReady()) {
      const Job = getJobModel();
      const job = await safeFindJob(Job, req.params.id);
      if (!job) return res.status(404).json({ message: "Job not found" });

      if (!checkOwner(job) && userRole !== "admin") {
        return res.status(403).json({ message: "Access Denied: You can only delete vacancies created by your own account." });
      }

      await Job.findByIdAndDelete(job._id);
      return res.status(200).json({ message: "Job deleted successfully", id: req.params.id });
    } else {
      const idx = inMemoryJobs.findIndex((j) => (j._id || j.id) === req.params.id);
      if (idx === -1) return res.status(404).json({ message: "Job not found" });

      if (!checkOwner(inMemoryJobs[idx]) && userRole !== "admin") {
        return res.status(403).json({ message: "Access Denied: You can only delete vacancies created by your own account." });
      }

      inMemoryJobs.splice(idx, 1);
      return res.status(200).json({ message: "Job deleted (local memory)", id: req.params.id });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to delete job: " + error.message });
  }
});

export default router;