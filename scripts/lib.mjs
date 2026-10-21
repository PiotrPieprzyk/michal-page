// Small helpers shared by the setup scripts.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const ENV_FILE = path.join(ROOT, ".env");

/** Runs a command, streaming output. Returns stdout when `capture` is set. */
export function run(cmd, args, { cwd = ROOT, capture = false, env = {}, allowFail = false } = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  if (res.status !== 0 && !allowFail) {
    console.error(`\n✖ ${cmd} ${args.join(" ")} failed (exit ${res.status})`);
    process.exit(res.status ?? 1);
  }
  return capture ? (res.stdout ?? "").trim() : res.status === 0;
}

/** Sets KEY=value in a dotenv file (adds or replaces the line). */
export function setEnv(key, value, file = ENV_FILE) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split(/\r?\n/) : [];
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (idx >= 0) lines[idx] = `${key}=${value}`;
  else lines.splice(lines.length && lines.at(-1) === "" ? lines.length - 1 : lines.length, 0, `${key}=${value}`);
  fs.writeFileSync(file, lines.join("\n").replace(/\n*$/, "\n"));
  process.env[key] = value;
}

export async function ask(question, fallback = "") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(fallback ? `${question} [${fallback}]: ` : `${question}: `)).trim();
  rl.close();
  return answer || fallback;
}

export function step(title) {
  console.log(`\n━━ ${title}`);
}
