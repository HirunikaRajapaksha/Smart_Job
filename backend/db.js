import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

// Ensure .env is loaded even if this module is imported before server.js calls dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

/**
 * db.js - Dual MongoDB connection manager
 *
 * Jobs        → "Jobs"        database  (job listings)
 * Job_Seekers → "Job_Seekers" database  (users + applications)
 *
 * Each database is managed independently so one failure does NOT
 * block or prevent the other from connecting.
 */

// Live connection instances
let jobsConnection    = null;
let seekersConnection = null;

// Independent connecting flags per DB
let isConnectingJobs    = false;
let isConnectingSeekers = false;

// ── Connect Jobs DB ────────────────────────────────────────────────────────
async function connectJobsDB() {
  if (isConnectingJobs) return;
  const uri = process.env.MONGO_JOBS_URI;
  if (!uri) {
    console.warn("⚠️  MONGO_JOBS_URI not set — Jobs DB disabled.");
    return;
  }
  if (jobsConnection && jobsConnection.readyState === 1) return;

  isConnectingJobs = true;
  try {
    jobsConnection = await mongoose
      .createConnection(uri, { serverSelectionTimeoutMS: 8000 })
      .asPromise();

    jobsConnection.on("disconnected", () => {
      console.warn("⚠️  Jobs DB disconnected. Reconnecting in 5s…");
      jobsConnection   = null;
      isConnectingJobs = false;
      setTimeout(connectJobsDB, 5000);
    });
    jobsConnection.on("error", (e) =>
      console.warn("⚠️  Jobs DB error:", e.message)
    );

    console.log("✅ Connected to Jobs database        →  " + uri);
  } catch (err) {
    console.warn("⚠️  Jobs DB connection error:", err.message);
    console.log("   Jobs DB retrying in 8 seconds…");
    jobsConnection = null;
    setTimeout(connectJobsDB, 8000);
  } finally {
    isConnectingJobs = false;
  }
}

// ── Connect Job_Seekers DB ─────────────────────────────────────────────────
async function connectSeekersDB() {
  if (isConnectingSeekers) return;
  const uri = process.env.MONGO_SEEKERS_URI;
  if (!uri) {
    console.warn("⚠️  MONGO_SEEKERS_URI not set — Job_Seekers DB disabled.");
    return;
  }
  if (seekersConnection && seekersConnection.readyState === 1) return;

  isConnectingSeekers = true;
  try {
    seekersConnection = await mongoose
      .createConnection(uri, { serverSelectionTimeoutMS: 8000 })
      .asPromise();

    seekersConnection.on("disconnected", () => {
      console.warn("⚠️  Job_Seekers DB disconnected. Reconnecting in 5s…");
      seekersConnection   = null;
      isConnectingSeekers = false;
      setTimeout(connectSeekersDB, 5000);
    });
    seekersConnection.on("error", (e) =>
      console.warn("⚠️  Job_Seekers DB error:", e.message)
    );

    console.log("✅ Connected to Job_Seekers database →  " + uri);
  } catch (err) {
    console.warn("⚠️  Job_Seekers DB connection error:", err.message);
    console.log("   Job_Seekers DB retrying in 8 seconds…");
    seekersConnection = null;
    setTimeout(connectSeekersDB, 8000);
  } finally {
    isConnectingSeekers = false;
  }
}

/**
 * Connect both databases independently.
 * Each DB retries on its own — one failure does NOT affect the other.
 */
export async function connectDatabases() {
  // Run both connections in parallel; they are fully independent
  await Promise.allSettled([
    connectJobsDB(),
    connectSeekersDB(),
  ]);

  // Log final status
  console.log(
    `\n📊 Database Status:\n` +
    `   Jobs DB        → ${isJobsDBReady()    ? "✅ Connected" : "❌ Not connected"}\n` +
    `   Job_Seekers DB → ${isSeekersDBReady() ? "✅ Connected" : "❌ Not connected"}\n`
  );
}

/** Returns the live Jobs connection (or null if not yet connected). */
export function getJobsConnection()    { return jobsConnection; }

/** Returns the live Job_Seekers connection (or null if not yet connected). */
export function getSeekersConnection() { return seekersConnection; }

export function isJobsDBReady()    { return !!(jobsConnection    && jobsConnection.readyState    === 1); }
export function isSeekersDBReady() { return !!(seekersConnection && seekersConnection.readyState === 1); }
