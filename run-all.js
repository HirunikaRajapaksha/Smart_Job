import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === "win32";

// Add default Node.js locations to PATH if missing on Windows
if (isWindows) {
  const defaultPaths = [
    "C:\\Program Files\\nodejs",
    process.env.APPDATA ? path.join(process.env.APPDATA, "npm") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs", "node") : null,
    "C:\\Program Files (x86)\\nodejs"
  ].filter(Boolean);

  const currentPath = process.env.PATH || "";
  process.env.PATH = `${defaultPaths.join(";")};${currentPath}`;
}

const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\n=======================================================");
console.log("🚀 Starting SmartJob AI (Backend + Frontend)...");
console.log("=======================================================\n");

// 1. Start Backend Server (Express + MongoDB)
const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(__dirname, "backend"),
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: process.env,
});

backend.stdout.on("data", (data) => {
  const text = data.toString().trim();
  if (text) console.log(`\x1b[36m[BACKEND]\x1b[0m ${text}`);
});

backend.stderr.on("data", (data) => {
  const text = data.toString().trim();
  if (text) console.error(`\x1b[31m[BACKEND ERROR]\x1b[0m ${text}`);
});

// 2. Start Frontend Server (React + Vite)
const client = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(__dirname, "client"),
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: process.env,
});

client.stdout.on("data", (data) => {
  const text = data.toString().trim();
  if (text) console.log(`\x1b[35m[CLIENT]\x1b[0m ${text}`);
});

client.stderr.on("data", (data) => {
  const text = data.toString().trim();
  if (text) console.error(`\x1b[31m[CLIENT ERROR]\x1b[0m ${text}`);
});

// Handle termination
function cleanup() {
  console.log("\n🛑 Stopping all SmartJob AI servers...");
  try {
    if (backend.pid) process.kill(backend.pid);
  } catch {}
  try {
    if (client.pid) process.kill(client.pid);
  } catch {}
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
