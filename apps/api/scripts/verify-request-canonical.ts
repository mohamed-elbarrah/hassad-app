import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = [
  join(process.cwd(), "src"),
  join(process.cwd(), "../../packages/shared/src"),
  join(process.cwd(), "../web-v2/src"),
];

const extensions = new Set([".ts", ".tsx"]);
const forbidden = [
  { pattern: /\bprisma\.lead(?:\b|[A-Z])/, label: "Prisma Lead model access" },
  { pattern: /\bleadId\b/, label: "active leadId compatibility field" },
  { pattern: /\blead_id\b/, label: "active lead_id compatibility field" },
  { pattern: /@RequirePermissions\(["'`]admin\.leads\./, label: "legacy admin Lead permission" },
  { pattern: /@RequirePermissions\(["'`]leads\./, label: "legacy Lead permission" },
];

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (extensions.has(path.slice(path.lastIndexOf(".")))) files.push(path);
  }
  return files;
}

async function main() {
  const violations: string[] = [];
  for (const root of roots) {
    try {
      const files = await collectFiles(root);
      for (const file of files) {
        const lines = (await readFile(file, "utf8")).split("\n");
        lines.forEach((line, index) => {
          for (const rule of forbidden) {
            if (rule.pattern.test(line)) {
              violations.push(`${relative(process.cwd(), file)}:${index + 1}: ${rule.label}`);
            }
          }
        });
      }
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
      if (code !== "ENOENT") throw error;
    }
  }

  if (violations.length > 0) {
    console.error("Request-canonical CRM guard failed:");
    console.error(violations.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("Request-canonical CRM guard passed.");
}

void main();
