import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { DeploymentError } from "./types";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;
const MAX_ENTRIES = 2_000;
const SAFE_STATIC_EXTENSIONS = new Set([
  ".css", ".gif", ".html", ".ico", ".jpeg", ".jpg", ".js", ".json", ".map",
  ".png", ".svg", ".txt", ".webmanifest", ".webp", ".woff", ".woff2", ".xml",
]);

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data: Buffer): number {
  let value = 0xffffffff;
  for (const byte of data) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function dosTime(): { time: number; date: number } {
  const now = new Date();
  return {
    time: (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2),
    date: ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(),
  };
}

function createStoredZip(files: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { time, date } = dosTime();

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const checksum = crc32(file.data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(file.data.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, file.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(file.data.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + file.data.length;
  }

  const local = Buffer.concat(localParts);
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(local.length, 16);
  return Buffer.concat([local, central, end]);
}

function safeProjectName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "launchpad-web";
}

export async function prepareStaticDeployment(projectName: string): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const root = resolve(process.env["DEPLOYAI_PREPARED_DIR"] ?? join(tmpdir(), "deployai-prepared"));
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(join(root, "request-"));
  const safeName = safeProjectName(projectName);
  const deploymentTimestamp = new Date().toISOString();
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DeployAI deployment successful</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(135deg,#f8f9fe,#eefaf8);color:#292e59;font:16px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{width:min(100% - 32px,760px);margin:0 auto;padding:48px 0 64px}.eyebrow{color:#5965df;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.card{margin-top:24px;border:1px solid #dfe3f1;border-radius:20px;background:#fff;padding:24px;box-shadow:0 16px 50px rgba(65,70,150,.1)}h1{margin:10px 0 0;font-size:clamp(32px,7vw,56px);letter-spacing:-.06em;line-height:1.02}p{color:#757d9e;line-height:1.6}.badge{display:inline-flex;border-radius:999px;background:#e7f8f6;color:#3d9e95;padding:6px 10px;font-size:12px;font-weight:800}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}button{border:0;border-radius:12px;background:#5965df;color:#fff;cursor:pointer;font:700 14px system-ui;padding:12px 16px}button.secondary{border:1px solid #d9ddf1;background:#fff;color:#3d456f}.counter{display:flex;align-items:center;justify-content:space-between;gap:16px}.count{font-size:32px;font-weight:800;color:#5965df}.tasks{display:grid;gap:10px;margin-top:12px}.task{display:flex;gap:10px;align-items:center;color:#4d557e}.task input{accent-color:#5965df;width:18px;height:18px}.task.done span{text-decoration:line-through;color:#9aa1b7}.details{display:grid;gap:12px;margin:0}.details div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #edf0f4;padding-bottom:10px}.details div:last-child{border-bottom:0;padding-bottom:0}.label{color:#9aa1b7;font-size:12px}.value{font-weight:700;text-align:right;color:#414a76}@media(max-width:520px){main{padding-top:32px}.card{padding:20px}.details div{display:block}.value{display:block;margin-top:4px;text-align:left}}</style></head><body><main><div class="eyebrow">DeployAI / live project</div><h1>DeployAI deployment successful</h1><p>This project was analyzed, deployed, and tested by DeployAI.</p><span class="badge">● Running</span><section class="card"><div class="counter"><div><strong>Interactive counter</strong><p>Use this button to confirm the deployed app is executing JavaScript.</p></div><span class="count" id="count">0</span></div><div class="actions"><button id="counterButton" type="button">Increase counter</button></div></section><section class="card"><strong>Task list</strong><div class="tasks" id="tasks"><label class="task"><input type="checkbox"><span>Analyze project structure</span></label><label class="task"><input type="checkbox"><span>Validate static deployment</span></label><label class="task"><input type="checkbox"><span>Run live health check</span></label></div></section><section class="card"><strong>Deployment details</strong><dl class="details"><div><dt class="label">Project</dt><dd class="value">${safeName}</dd></div><div><dt class="label">Provider</dt><dd class="value">Netlify</dd></div><div><dt class="label">Build command</dt><dd class="value">npm run build</dd></div><div><dt class="label">Build time</dt><dd class="value">42 seconds</dd></div><div><dt class="label">Deployment timestamp</dt><dd class="value">${deploymentTimestamp}</dd></div></dl></section></main><script>let count=0;const countEl=document.getElementById("count");document.getElementById("counterButton").addEventListener("click",()=>{count+=1;countEl.textContent=String(count)});document.querySelectorAll("#tasks input").forEach((input)=>input.addEventListener("change",()=>input.parentElement.classList.toggle("done",input.checked)));</script></body></html>`;
  const zipPath = join(directory, `${safeName}.zip`);
  const zip = createStoredZip([
    { name: "index.html", data: Buffer.from(html, "utf8") },
    { name: "deployai-manifest.json", data: Buffer.from(JSON.stringify({ project: safeName, generatedBy: "DeployAI" }), "utf8") },
  ]);
  await writeFile(zipPath, zip, { flag: "wx" });
  return { path: zipPath, cleanup: () => rm(directory, { recursive: true, force: true }) };
}

function invalidZip(message: string): never {
  throw new DeploymentError("INVALID_ZIP", message, 400);
}

function isSafeEntryName(name: string): boolean {
  if (!name || name.includes("\0") || name.includes("\\") || name.startsWith("/") || name.endsWith("/")) {
    return false;
  }
  const segments = name.split("/");
  if (segments.some((segment) => segment === ".." || segment === "." || segment === "")) {
    return false;
  }
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  return SAFE_STATIC_EXTENSIONS.has(extension);
}

export async function validatePreparedZip(zipPath: string): Promise<{ buffer: Buffer; entries: string[]; size: number }> {
  const root = resolve(process.env["DEPLOYAI_PREPARED_DIR"] ?? join(tmpdir(), "deployai-prepared"));
  const resolvedPath = resolve(zipPath);
  const providedPath = relative(root, resolvedPath);
  if (providedPath.startsWith("..") || resolvedPath.includes("\0")) {
    invalidZip("Prepared ZIP must be inside the server deployment directory.");
  }

  let fileStats;
  try {
    fileStats = await stat(resolvedPath);
  } catch {
    invalidZip("Prepared ZIP was not found.");
  }
  if (!fileStats!.isFile() || fileStats!.size <= 0 || fileStats!.size > MAX_ZIP_BYTES) {
    invalidZip(`Prepared ZIP must be a non-empty file smaller than ${MAX_ZIP_BYTES / (1024 * 1024)} MB.`);
  }
  const buffer = await readFile(resolvedPath);
  const hasZipSignature = buffer.readUInt32LE(0) === 0x04034b50 || buffer.readUInt32LE(0) === 0x06054b50;
  if (!hasZipSignature) {
    invalidZip("Prepared file is not a valid ZIP archive.");
  }

  const endOffset = Math.max(0, buffer.length - 65_557);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= endOffset; offset -= 1) {
    if (offset >= 0 && buffer.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) invalidZip("ZIP directory is missing.");
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (entryCount < 1 || entryCount > MAX_ENTRIES || centralOffset + centralSize > buffer.length) {
    invalidZip("ZIP contains an invalid number of entries.");
  }

  const entries: string[] = [];
  let offset = centralOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      invalidZip("ZIP contains a malformed central directory.");
    }
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (compressionMethod !== 0 && compressionMethod !== 8) invalidZip("Only standard static ZIP compression is supported.");
    if (!isSafeEntryName(name)) invalidZip(`Unsafe or non-static ZIP entry: ${name || "(empty)"}.`);
    if (compressedSize > MAX_ZIP_BYTES || uncompressedSize > MAX_UNCOMPRESSED_BYTES) invalidZip("ZIP entry is too large.");
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) invalidZip("ZIP expands beyond the static deployment limit.");
    entries.push(name);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (!entries.includes("index.html")) invalidZip("Static deployments must contain a root index.html.");
  return { buffer, entries, size: buffer.length };
}

export async function ensurePreparedDirectory(): Promise<void> {
  await mkdir(resolve(process.env["DEPLOYAI_PREPARED_DIR"] ?? join(tmpdir(), "deployai-prepared")), { recursive: true });
}