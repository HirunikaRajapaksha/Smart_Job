import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env FIRST — before any other imports read process.env
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

import express from "express";
import cors from "cors";

import { connectDatabases, isJobsDBReady, isSeekersDBReady, getJobsConnection, getSeekersConnection } from "./db.js";
import userRoutes from "./routes/userRoutes.js";
import jobRoutes, { seedDefaultJobs } from "./routes/jobRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);

// ── Health & status endpoints ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "SmartJob Backend API",
    databases: {
      Jobs: isJobsDBReady() ? "connected" : "connecting/disconnected",
      Job_Seekers: isSeekersDBReady() ? "connected" : "connecting/disconnected"
    },
    endpoints: {
      jobs: "/api/jobs",
      users: "/api/users",
      health: "/api/health"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    databases: {
      Jobs: isJobsDBReady() ? "connected" : "disconnected",
      Job_Seekers: isSeekersDBReady() ? "connected" : "disconnected"
    },
    timestamp: new Date().toISOString()
  });
});

// ── Debug endpoint: shows raw readyState for diagnosing DB issues ─────────
app.get("/api/debug", (req, res) => {
  const jobsConn    = getJobsConnection();
  const seekersConn = getSeekersConnection();
  res.json({
    Jobs: {
      readyState: jobsConn    ? jobsConn.readyState    : "null (not initialised)",
      ready: isJobsDBReady()
    },
    Job_Seekers: {
      readyState: seekersConn ? seekersConn.readyState : "null (not initialised)",
      ready: isSeekersDBReady()
    },
    message: "readyState 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting"
  });
});

// ── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Start Express first so client connections are never refused
app.listen(PORT, () => {
  console.log(`\n🚀 SmartJob Backend running on port ${PORT}`);
  console.log(`   Jobs DB      → ${process.env.MONGO_JOBS_URI}`);
  console.log(`   Seekers DB   → ${process.env.MONGO_SEEKERS_URI}\n`);
});

// Connect to both MongoDB databases
connectDatabases().then(async () => {
  // After both databases are connected, seed default jobs if needed
  try {
    await seedDefaultJobs();
  } catch (seedErr) {
    console.warn("Notice during initial database seeding:", seedErr.message);
  }
});