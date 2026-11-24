import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { listCars } from "./database.js";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function json(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function methodNotAllowed(response) {
  response.writeHead(405, { allow: "GET, HEAD", "content-type": "text/plain; charset=utf-8" });
  response.end("Método não permitido");
}

export function createApp({ db }) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);

      if (pathname === "/api/health") {
        if (request.method !== "GET") return methodNotAllowed(response);
        return json(response, 200, { status: "ok", service: "DriveTwin" });
      }

      if (pathname === "/api/cars") {
        if (request.method !== "GET") return methodNotAllowed(response);
        const cars = listCars(db, {
          brand: url.searchParams.get("brand") || undefined,
          fuel: url.searchParams.get("fuel") || undefined,
        });
        return json(response, 200, { cars, illustrative: true });
      }

      if (pathname.startsWith("/api/")) {
        return json(response, 404, { error: "Endpoint não encontrado" });
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        return methodNotAllowed(response);
      }

      const requestedPath = pathname === "/" ? "/index.html" : pathname;
      if (requestedPath.includes("\0")) {
        response.writeHead(400);
        return response.end("Caminho inválido");
      }
      const publicRoot = resolve(publicDirectory);
      const filePath = resolve(publicRoot, `.${requestedPath}`);
      if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${sep}`)) {
        response.writeHead(403);
        return response.end("Acesso negado");
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
        "cache-control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600",
      });
      return response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      if (error?.code === "ENOENT") {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        return response.end("Arquivo não encontrado");
      }
      console.error(error);
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      return response.end("Erro interno");
    }
  });
}
