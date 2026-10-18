/**
 * Job.js - Stored in the "Jobs" MongoDB database
 *
 * Uses a lazy getter pattern so the model is always bound to the live
 * connection returned by getJobsConnection(), even though the connection
 * is established asynchronously after this module is imported.
 */
import mongoose from "mongoose";
import { getJobsConnection } from "../db.js";

const applicationSchema = new mongoose.Schema(
  {
    applicantName: { type: String, required: true, trim: true },
    email:         { type: String, required: true, trim: true },
    telephone:     { type: String, required: true, trim: true },
    notes:         { type: String, default: "",    trim: true },
    cvFileName:    { type: String, default: "",    trim: true },
    cvData:        { type: String, default: "" },
    appliedAt:     { type: Date,   default: Date.now }
  },
  { _id: true }
);

const jobSchema = new mongoose.Schema(
  {
    jobName:      { type: String, required: true, trim: true },
    company:      { type: String, default: "Company not specified", trim: true },
    category:     { type: String, default: "General",  trim: true },
    salary:       { type: Number, required: true, min: 0 },
    location:     { type: String, required: true, trim: true },
    description:  { type: String, default: "" },
    jobType:      { type: String, default: "Full-time" },
    postedBy:     { type: String, default: "", trim: true },
    postedByEmail:{ type: String, default: "", trim: true },
    postedByNic:  { type: String, default: "", trim: true },
    postedByName: { type: String, default: "", trim: true },
    applications: [applicationSchema]
  },
  { timestamps: true }
);

/**
 * Returns the Job model bound to the "Jobs" database connection.
 * Call this inside route handlers (after connectDatabases() has resolved).
 */
export function getJobModel() {
  const conn = getJobsConnection();
  if (!conn) throw new Error("Jobs database not connected yet.");
  // Mongoose caches the model per connection, so this is safe to call repeatedly
  return conn.models.Job || conn.model("Job", jobSchema);
}

export default getJobModel;