import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uploadRoot = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
const contentTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function uploadPath(segments: string[]) {
  const filePath = path.resolve(uploadRoot, ...segments);
  const relativePath = path.relative(uploadRoot, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

async function serveUpload(segments: string[], includeBody: boolean) {
  const filePath = uploadPath(segments);
  if (!filePath) return new Response("Not found", { status: 404 });

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return new Response("Not found", { status: 404 });

    const extension = path.extname(filePath).toLowerCase();
    const headers = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(fileStat.size),
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    });

    if (!includeBody) return new Response(null, { headers });

    const file = await readFile(filePath);
    return new Response(file, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  return serveUpload(segments, true);
}

export async function HEAD(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  return serveUpload(segments, false);
}
