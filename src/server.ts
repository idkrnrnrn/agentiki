import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  demoCandidateSignals,
  demoVacancy,
  extractPdfTextFromBase64,
  prepareScreeningQuestions,
  rankCandidate,
  rankScreenedCandidate
} from "./ml/index.ts";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(rootDir, "public");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      return sendJson(res, 400, { error: "Bad request" });
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname === "/api/vacancy" && req.method === "GET") {
      return sendJson(res, 200, demoVacancy);
    }

    if (url.pathname === "/api/demo" && req.method === "POST") {
      return sendJson(res, 200, {
        vacancy: demoVacancy,
        signals: demoCandidateSignals,
        rankResult: rankCandidate(demoVacancy, demoCandidateSignals)
      });
    }

    if (url.pathname === "/api/prepare-screening" && req.method === "POST") {
      const body = await readJsonBody(req);
      const pdfText = body.pdfText
        ? String(body.pdfText)
        : await extractPdfTextFromBase64(String(body.pdfBase64 ?? ""));

      if (!pdfText.trim()) {
        return sendJson(res, 400, { error: "Не удалось извлечь текст из PDF" });
      }

      const result = await prepareScreeningQuestions({
        vacancy: body.vacancy,
        pdfText
      });

      return sendJson(res, 200, {
        ...result,
        pdfTextPreview: pdfText.slice(0, 1000)
      });
    }

    if (url.pathname === "/api/rank-candidate" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await rankScreenedCandidate({
        vacancy: body.vacancy,
        profile: body.profile,
        questions: body.questions,
        answers: body.answers
      });

      return sendJson(res, 200, result);
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error("Request failed", error);
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
});

server.listen(port, host, () => {
  console.log(`AI screening MVP is running on http://${host}:${port}`);
});

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 15 * 1024 * 1024) {
      throw new Error("Payload is too large");
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(pathname: string, res: ServerResponse) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    return sendText(res, 403, "Forbidden", "text/plain");
  }

  try {
    const file = await readFile(filePath);
    return sendBuffer(res, 200, file, contentType(filePath));
  } catch {
    return sendText(res, 404, "Not found", "text/plain");
  }
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  return sendText(res, status, JSON.stringify(payload), "application/json; charset=utf-8");
}

function sendBuffer(res: ServerResponse, status: number, payload: Buffer, type: string) {
  res.writeHead(status, { "content-type": type });
  res.end(payload);
}

function sendText(res: ServerResponse, status: number, payload: string, type: string) {
  res.writeHead(status, { "content-type": type });
  res.end(payload);
}

function contentType(filePath: string): string {
  const ext = extname(filePath);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}
