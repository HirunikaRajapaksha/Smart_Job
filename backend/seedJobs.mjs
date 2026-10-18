/**
 * seedJobs.mjs  — One-time seed script
 * Inserts the 15 default Sri Lankan job listings into MongoDB Atlas.
 * Skips any job that already exists (matched by jobName + company).
 * Run: node backend/seedJobs.mjs
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env from backend folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_JOBS_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_JOBS_URI not found in .env file!");
  process.exit(1);
}

console.log("🔗 Connecting to MongoDB Atlas...");

const SEED_JOBS = [
  {
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

const applicationSchema = new mongoose.Schema(
  {
    applicantName: { type: String, required: true, trim: true },
    email:         { type: String, required: true, trim: true },
    telephone:     { type: String, required: true, trim: true },
    notes:         { type: String, default: "", trim: true },
    cvFileName:    { type: String, default: "", trim: true },
    cvData:        { type: String, default: "" },
    appliedAt:     { type: Date,   default: Date.now }
  },
  { _id: true }
);

const jobSchema = new mongoose.Schema(
  {
    jobName:       { type: String, required: true, trim: true },
    company:       { type: String, default: "Company not specified", trim: true },
    category:      { type: String, default: "General", trim: true },
    salary:        { type: Number, required: true, min: 0 },
    location:      { type: String, required: true, trim: true },
    description:   { type: String, default: "" },
    jobType:       { type: String, default: "Full-time" },
    postedBy:      { type: String, default: "", trim: true },
    postedByEmail: { type: String, default: "", trim: true },
    postedByNic:   { type: String, default: "", trim: true },
    postedByName:  { type: String, default: "", trim: true },
    applications:  [applicationSchema]
  },
  { timestamps: true }
);

async function run() {
  console.log("✅ Connecting to MongoDB Atlas:", MONGO_URI.replace(/:([^@]+)@/, ":****@"));
  const conn = await mongoose.createConnection(MONGO_URI, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const Job = conn.model("Job", jobSchema);

  let inserted = 0;
  let skipped  = 0;

  for (const item of SEED_JOBS) {
    const exists = await Job.findOne({ jobName: item.jobName, company: item.company });
    if (exists) {
      console.log(`  Skipped (already exists): "${item.jobName}" @ ${item.company}`);
      skipped++;
    } else {
      await Job.create(item);
      console.log(`  Inserted: "${item.jobName}" @ ${item.location}`);
      inserted++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted} | Skipped: ${skipped}`);
  await conn.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
