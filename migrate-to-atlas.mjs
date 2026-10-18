/**
 * migrate-to-atlas.mjs
 * 
 * Local MongoDB (127.0.0.1:27017/SmartJob) → Atlas (cluster0.v5hkrp3.mongodb.net/SmartJob)
 * 
 * Run: node migrate-to-atlas.mjs
 */

import mongoose from "mongoose";

// ── Connection URIs ──────────────────────────────────────────────────────────
const LOCAL_URI = "mongodb://127.0.0.1:27017/SmartJob";
const ATLAS_URI = "mongodb+srv://Hirunika_Rajapaksha:%40Hiru20030622@cluster0.v5hkrp3.mongodb.net/SmartJob";

// Collections to migrate
const COLLECTIONS = ["jobs", "Job_Seekers", "users"];

// ── Colours for terminal output ───────────────────────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

async function migrate() {
  console.log("\n" + c.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(c.bold("  🚀 SmartJob: Local → Atlas Migration Tool"));
  console.log(c.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") + "\n");

  // ── 1. Connect to LOCAL ────────────────────────────────────────────────────
  console.log(c.cyan("📡 Connecting to LOCAL MongoDB..."));
  let localConn;
  try {
    localConn = await mongoose
      .createConnection(LOCAL_URI, { serverSelectionTimeoutMS: 6000 })
      .asPromise();
    console.log(c.green("✅ Local MongoDB connected!\n"));
  } catch (err) {
    console.error(c.red("❌ Cannot connect to local MongoDB: " + err.message));
    console.log(c.yellow("   Make sure MongoDB is running locally on port 27017.\n"));
    process.exit(1);
  }

  // ── 2. Connect to ATLAS ────────────────────────────────────────────────────
  console.log(c.cyan("📡 Connecting to MongoDB Atlas..."));
  let atlasConn;
  try {
    atlasConn = await mongoose
      .createConnection(ATLAS_URI, { serverSelectionTimeoutMS: 15000 })
      .asPromise();
    console.log(c.green("✅ Atlas connected!\n"));
  } catch (err) {
    console.error(c.red("❌ Cannot connect to Atlas: " + err.message));
    console.log(c.yellow("   Check Atlas Network Access (0.0.0.0/0 must be allowed).\n"));
    await localConn.close();
    process.exit(1);
  }

  // ── 3. Migrate each collection ─────────────────────────────────────────────
  let totalMigrated = 0;

  for (const collectionName of COLLECTIONS) {
    console.log(c.bold(`📦 Migrating collection: ${collectionName}`));

    // Get raw collection handles (no schema needed)
    const localColl = localConn.collection(collectionName);
    const atlasColl = atlasConn.collection(collectionName);

    // Read all documents from local
    let docs;
    try {
      docs = await localColl.find({}).toArray();
    } catch (err) {
      console.log(c.yellow(`   ⚠️  Could not read '${collectionName}' from local: ${err.message}`));
      continue;
    }

    if (docs.length === 0) {
      console.log(c.yellow(`   ⚠️  No documents found in local '${collectionName}' — skipping.\n`));
      continue;
    }

    console.log(c.cyan(`   📄 Found ${docs.length} document(s) in local.`));

    // Check how many already exist in Atlas
    const atlasCount = await atlasColl.countDocuments();
    if (atlasCount > 0) {
      console.log(c.yellow(`   ⚡ Atlas already has ${atlasCount} document(s). Clearing before import...`));
      await atlasColl.deleteMany({});
      console.log(c.yellow(`   🗑️  Cleared Atlas '${collectionName}'.`));
    }

    // Insert all docs into Atlas
    try {
      const result = await atlasColl.insertMany(docs, { ordered: false });
      console.log(c.green(`   ✅ Inserted ${result.insertedCount} document(s) into Atlas '${collectionName}'.\n`));
      totalMigrated += result.insertedCount;
    } catch (err) {
      console.error(c.red(`   ❌ Error inserting into Atlas '${collectionName}': ${err.message}\n`));
    }
  }

  // ── 4. Done ────────────────────────────────────────────────────────────────
  await localConn.close();
  await atlasConn.close();

  console.log(c.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(c.green(c.bold(`  ✅ Migration complete! ${totalMigrated} document(s) moved to Atlas.`)));
  console.log(c.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") + "\n");
}

migrate().catch((err) => {
  console.error(c.red("Fatal error: " + err.message));
  process.exit(1);
});
