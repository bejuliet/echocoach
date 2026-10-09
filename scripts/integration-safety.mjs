import fs from "node:fs";
import path from "node:path";

const TEST_WORKTREE = "/Users/julietwei/Projects/EchoCoach-Stage2-Integration";
const FORBIDDEN_WORKTREES = [
  "/Users/julietwei/Projects/EchoCoach",
  "/Users/julietwei/Projects/EchoCoach-Stage2",
];

function fail(message) {
  throw new Error(`Integration safety preflight failed: ${message}`);
}

function parseEnv(filePath) {
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return values;
}

function canonical(filePath) {
  return fs.realpathSync(filePath);
}

function canonicalRequired(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} is missing`);
  try {
    return canonical(filePath);
  } catch {
    fail(`${label} cannot be canonicalized`);
  }
}

export async function verifyIntegrationTarget() {
  const cwd = canonicalRequired(process.cwd(), "current worktree");
  if (cwd !== TEST_WORKTREE) {
    fail(`run from ${TEST_WORKTREE}, not ${cwd}`);
  }
  if (FORBIDDEN_WORKTREES.includes(cwd)) {
    fail("the development or Stage 1 worktree is not an integration target");
  }

  const envPath = path.join(cwd, ".env.local");
  const localDir = path.join(cwd, ".convex", "local", "default");
  const configPath = path.join(localDir, "config.json");
  if (!fs.existsSync(envPath)) fail(".env.local is missing");
  if (!fs.existsSync(configPath)) fail("dedicated local Convex config is missing");

  const env = parseEnv(envPath);
  if (!env.CONVEX_DEPLOYMENT?.startsWith("local:")) {
    fail("CONVEX_DEPLOYMENT is not explicitly local");
  }
  const url = env.NEXT_PUBLIC_CONVEX_URL;
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    fail("NEXT_PUBLIC_CONVEX_URL is invalid");
  }
  if (parsedUrl.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(parsedUrl.hostname)) {
    fail("NEXT_PUBLIC_CONVEX_URL is not loopback HTTP");
  }
  if (env.CONVEX_DEPLOY_KEY || env.CONVEX_DEPLOYMENT_TOKEN) {
    fail("cloud deployment credentials are present in the integration environment");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!Number.isInteger(config.ports?.cloud)) fail("local cloud port is missing");
  if (Number(url.split(":").pop()) !== config.ports.cloud) {
    fail("URL port does not match the dedicated local config");
  }
  const integrationStorage = canonicalRequired(localDir, "integration storage");
  const stage1Storage = canonicalRequired(
    path.join("/Users/julietwei/Projects/EchoCoach", ".convex", "local", "default"),
    "Stage 1 storage",
  );
  const stage2Storage = canonicalRequired(
    path.join("/Users/julietwei/Projects/EchoCoach-Stage2", ".convex", "local", "default"),
    "Stage 2 development storage",
  );
  if (integrationStorage === stage1Storage || integrationStorage === stage2Storage) {
    fail("integration storage aliases a development storage path");
  }

  let response;
  try {
    response = await fetch(`${url.replace(/\/$/, "")}/instance_name`);
  } catch {
    fail("dedicated local backend is unreachable");
  }
  if (!response.ok) fail(`local backend identity request returned ${response.status}`);
  const instanceName = (await response.text()).trim().replace(/^"|"$/g, "");
  if (!instanceName || instanceName !== config.deploymentName) {
    fail("backend identity does not match the dedicated local config");
  }

  return { url, worktree: cwd, storage: integrationStorage, deploymentName: instanceName };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const target = await verifyIntegrationTarget();
    console.log(`Verified dedicated local integration target: ${target.deploymentName}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Integration safety preflight failed");
    process.exitCode = 1;
  }
}
