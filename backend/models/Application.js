/**
 * Application.js - Stored in the "SmartJob" MongoDB database
 *
 * Every job application is saved here as a standalone document so that
 * MongoDB Compass shows all apply details under:
 *   SmartJob → Job_Seekers collection
 *
 * NOTE: The third argument "Job_Seekers" explicitly sets the MongoDB
 * collection name so Compass shows data in the existing Job_Seekers collection.
 */
import mongoose from "mongoose";
import { getSeekersConnection } from "../db.js";

const applicationSchema = new mongoose.Schema(
  {
    // Job reference
    jobId:    { type: String, required: true, trim: true },
    jobName:  { type: String, required: true, trim: true },
    company:  { type: String, default: "",    trim: true },
    location: { type: String, default: "",    trim: true },

    // Applicant details
    applicantName: { type: String, required: true, trim: true },
    email:         { type: String, required: true, trim: true },
    telephone:     { type: String, required: true, trim: true },
    notes:         { type: String, default: "",    trim: true },
    cvFileName:    { type: String, default: "",    trim: true },
    cvData:        { type: String, default: "" },

    // Logged-in user reference
    applicantNic:    { type: String, default: "", trim: true },
    applicantUserId: { type: String, default: "", trim: true },

    appliedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

/**
 * Returns the Application model bound to the SmartJob database connection.
 * The collection name is explicitly set to "Job_Seekers" so MongoDB Compass
 * shows the data in the existing Job_Seekers collection.
 */
export function getApplicationModel() {
  const conn = getSeekersConnection();
  if (!conn) throw new Error("SmartJob database not connected yet.");
  // Third argument forces Mongoose to use the "Job_Seekers" collection
  // instead of auto-generating "applications"
  return conn.models.Application || conn.model("Application", applicationSchema, "Job_Seekers");
}

export default getApplicationModel;
