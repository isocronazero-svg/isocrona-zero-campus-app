import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function samplePdf() {
  const stream = "BT /F1 20 Tf 40 160 Td (Prueba justificante) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 220] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 220] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>",
    "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += (i + 1) + " 0 obj\n" + objects[i] + "\nendobj\n";
  }
  const xref = Buffer.byteLength(pdf);
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) pdf += String(offset).padStart(10, "0") + " 00000 n \n";
  pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return Buffer.from(pdf);
}

test("Android: PDF de dos páginas se renderiza en canvas, navega y permite descargar", async ({ browser }) => {
  const pdf = samplePdf();
  const server = createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end('<meta name="viewport" content="width=device-width, initial-scale=1"><a href="/api/course-finance/courses/test/submissions/test/proof">Ver justificante</a><script type="module">import {installBoardEnhancer} from "/boardEnhancer.js";installBoardEnhancer();</script>');
    } else if (pathname === "/boardEnhancer.js") {
      res.setHeader("Content-Type", "application/javascript");
      res.end(readFileSync(join(root, "public/assets/js/app/admin/boardEnhancer.js")));
    } else if (pathname === "/vendor/pdfjs/pdf.mjs" || pathname === "/vendor/pdfjs/pdf.worker.mjs") {
      res.setHeader("Content-Type", "application/javascript");
      res.end(readFileSync(join(root, "node_modules/pdfjs-dist/build", pathname.split("/").pop())));
    } else if (pathname.endsWith("/proof")) {
      res.setHeader("Content-Type", "application/pdf");
      res.end(pdf);
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:" + port);
    await page.getByText("Ver justificante").click();
    await expect(page.getByRole("status")).toHaveText("Página 1 de 2", { timeout: 20000 });
    await expect(page.locator(".proof-preview-canvas")).toBeVisible();
    expect(await page.locator(".proof-preview-canvas").evaluate(el => el.width > 0 && el.height > 0)).toBe(true);
    await page.getByRole("button", { name: "Página siguiente" }).click();
    await expect(page.getByRole("status")).toHaveText("Página 2 de 2");
    await page.getByRole("button", { name: "Ampliar zoom" }).click();
    await expect(page.getByRole("status")).toHaveText("Página 2 de 2");
    await expect(page.getByText("Descargar justificante")).toBeVisible();
    await expect(page.locator("#proofPreviewDialog iframe")).toHaveCount(0);
  } finally {
    await context.close();
    await new Promise(resolve => server.close(resolve));
  }
});

for (const scenario of [
  { status: 401, message: "Tu sesión ha caducado. Inicia sesión de nuevo." },
  { status: 403, message: "No tienes permiso para consultar este justificante." },
  { status: 404, message: "El archivo no está disponible o no existe. Solicita otro justificante." }
]) {
test(`Tesorería: error ${scenario.status} no ofrece descarga ni vista previa`, async ({ browser }) => {
  const server = createServer((req, res) => {
    if (req.url === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end('<a href="/api/course-finance/courses/test/submissions/test/proof">Ver justificante</a><script type="module">import {installBoardEnhancer} from "/boardEnhancer.js";installBoardEnhancer();</script>');
    } else if (req.url === "/boardEnhancer.js") {
      res.setHeader("Content-Type", "application/javascript");
      res.end(readFileSync(join(root, "public/assets/js/app/admin/boardEnhancer.js")));
    } else if (req.url?.endsWith("/proof")) {
      res.writeHead(scenario.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "forbidden" }));
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.getByText("Ver justificante").click();
    await expect(page.getByText(scenario.message)).toBeVisible();
    await expect(page.getByText("Descargar justificante")).toHaveCount(0);
    await expect(page.locator(".proof-preview-canvas")).toHaveCount(0);
  } finally {
    await context.close();
    await new Promise(resolve => server.close(resolve));
  }
});
}
