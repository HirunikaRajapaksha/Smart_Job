/**
 * removeJobs.mjs — One-time cleanup script
 * Removes the 6 specified jobs from MongoDB by jobName + company.
 */

import mongoose from "mongoose";

const MONGO_URI = "mongodb://127.0.0.1:27017/SmartJob";

const JOBS_TO_REMOVE = [
  { jobName: "Junior Software Engineer",       company: "99X Technology" },
  { jobName: "Full Stack Web Developer",       company: "Sysco LABS Sri Lanka" },
  { jobName: "UI/UX Product Designer",         company: "Calcey Technologies" },
  { jobName: "Senior QA Automation Engineer",  company: "IFS Sri Lanka" },
  { jobName: "Digital Marketing Specialist",   company: "Brandix Lanka" },
  { jobName: "Accounts Executive",             company: "Hemas Holdings" },
];

const jobSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

async function run() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  const conn = await mongoose.createConnection(MONGO_URI, { serverSelectionTimeoutMS: 8000 }).asPromise();
  const Job = conn.model("Job", jobSchema);

  let deleted = 0;
  let notFound = 0;

  for (const { jobName, company } of JOBS_TO_REMOVE) {
    const result = await Job.deleteOne({ jobName, company });
    if (result.deletedCount > 0) {
      console.log(`  Deleted: "${jobName}" @ ${company}`);
      deleted++;
    } else {
      console.log(`  Not found: "${jobName}" @ ${company}`);
      notFound++;
    }
  }

  console.log(`\nDone! Deleted: ${deleted} | Not found: ${notFound}`);
  await conn.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
