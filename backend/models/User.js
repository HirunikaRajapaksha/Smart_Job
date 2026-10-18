/**
 * User.js - Stored in the "Job_Seekers" MongoDB database
 */
import mongoose from "mongoose";
import { getSeekersConnection } from "../db.js";

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    address:   { type: String, required: true, trim: true },
    nic:       { type: String, required: true, unique: true, trim: true },
    email:     { type: String, default: "",    trim: true },
    telephone: { type: String, required: true, trim: true },
    password:  { type: String, required: true, select: false }
  },
  { timestamps: true }
);

/**
 * Returns the User model bound to the "Job_Seekers" database connection.
 */
export function getUserModel() {
  const conn = getSeekersConnection();
  if (!conn) throw new Error("Job_Seekers database not connected yet.");
  return conn.models.User || conn.model("User", userSchema);
}

export default getUserModel;