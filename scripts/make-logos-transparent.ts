import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Rgb = { r: number; g: number; b: number };

function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? "flood";
  const bg = args.find((a) => a.startsWith("--bg="))?.split("=")[1] ?? "auto";
  const tolerance = Number(args.find((a) => a.startsWith("--tolerance="))?.split("=")[1] ?? "18");
  const files = args.filter((a) => !a.startsWith("--"));
  return { mode, bg, tolerance, files };
}

function colorMatches(r: number, g: number, b: number, target: Rgb, tolerance: number): boolean {
  return (
    Math.abs(r - target.r) <= tolerance &&
    Math.abs(g - target.g) <= tolerance &&
    Math.abs(b - target.b) <= tolerance
  );
}

function sampleCornerColors(data: Buffer, width: number, height: number): Rgb[] {
  const idx = (x: number, y: number) => (y * width + x) * 4;
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ] as const;

  return corners.map(([x, y]) => {
    const i = idx(x, y);
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  });
}

function pickBackgroundColor(corners: Rgb[], preferred?: string): Rgb {
  if (preferred === "white") return { r: 255, g: 255, b: 255 };
  if (preferred === "black") return { r: 0, g: 0, b: 0 };

  const key = (c: Rgb) => `${c.r},${c.g},${c.b}`;
  const counts = new Map<string, { color: Rgb; count: number }>();
  for (const corner of corners) {
    const k = key(corner);
    const existing = counts.get(k);
    if (existing) existing.count += 1;
    else counts.set(k, { color: corner, count: 1 });
  }

  let best = corners[0];
  let bestCount = 0;
  for (const { color, count } of counts.values()) {
    if (count > bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}

function floodFillFromEdges(
  data: Buffer,
  width: number,
  height: number,
  bg: Rgb,
  tolerance: number,
) {
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const idx = (x: number, y: number) => y * width + x;
  const pixelOffset = (x: number, y: number) => idx(x, y) * 4;

  const tryEnqueue = (x: number, y: number) => {
    const i = idx(x, y);
    if (visited[i]) return;
    const o = pixelOffset(x, y);
    const a = data[o + 3];
    if (a === 0) return;
    if (!colorMatches(data[o], data[o + 1], data[o + 2], bg, tolerance)) return;
    visited[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x += 1) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop()!;
    const x = i % width;
    const y = (i - x) / width;
    const o = i * 4;
    data[o + 3] = 0;

    if (x > 0) tryEnqueue(x - 1, y);
    if (x < width - 1) tryEnqueue(x + 1, y);
    if (y > 0) tryEnqueue(x, y - 1);
    if (y < height - 1) tryEnqueue(x, y + 1);
  }
}

async function floodFillTransparent(inputPath: string, bgPreference: string, tolerance: number) {
  const input = readFileSync(inputPath);
  let image = sharp(input);
  let meta = await image.metadata();
  let width = meta.width!;
  let height = meta.height!;
  let { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const passes =
    bgPreference === "both"
      ? (["white", "black"] as const)
      : ([bgPreference === "auto" ? "auto" : bgPreference] as const);

  for (const pass of passes) {
    const corners = sampleCornerColors(data, width, height);
    const bg = pickBackgroundColor(corners, pass === "auto" ? undefined : pass);
    floodFillFromEdges(data, width, height, bg, tolerance);
  }

  const ext = path.extname(inputPath).toLowerCase();
  const pipeline = sharp(data, { raw: { width, height, channels: info.channels } });

  if (ext === ".ico") {
    const pngBuffer = await pipeline.png().toBuffer();
    writeFileSync(inputPath, pngBuffer);
    return;
  }

  const output = await pipeline.png().toBuffer();
  writeFileSync(inputPath, output);
}

async function main() {
  const { mode, bg, tolerance, files } = parseArgs();
  if (files.length === 0) {
    console.error("Usage: bun run scripts/make-logos-transparent.ts [--bg=auto|white|black|both] [--tolerance=18] <files...>");
    process.exit(1);
  }

  if (mode !== "flood") {
    console.error("Only flood mode is supported.");
    process.exit(1);
  }

  for (const file of files) {
    const resolved = path.resolve(file);
    console.log(`Processing ${resolved} (bg=${bg}, tolerance=${tolerance})`);
    await floodFillTransparent(resolved, bg, tolerance);
    console.log(`  done`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
