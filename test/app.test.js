import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createApp } from "../lib/app.js";
import { createDatabase } from "../lib/database.js";

let baseUrl;
let db;
let server;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "drivetwin-test-"));
  db = createDatabase(join(temporaryDirectory, "test.db"));
  server = createApp({ db });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("a página inicial é servida em HTML", async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /DriveTwin/);
});

test("o SQLite fornece os dez carros iniciais", async () => {
  const response = await fetch(`${baseUrl}/api/cars`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.cars.length, 10);
  assert.equal(payload.illustrative, true);
});

test("o filtro por marca retorna somente o modelo escolhido", async () => {
  const response = await fetch(`${baseUrl}/api/cars?brand=Toyota`);
  const payload = await response.json();
  assert.equal(payload.cars.length, 1);
  assert.equal(payload.cars[0].model, "Corolla Hybrid");
});

test("o filtro por combustível retorna somente híbridos", async () => {
  const response = await fetch(`${baseUrl}/api/cars?fuel=${encodeURIComponent("Híbrido")}`);
  const payload = await response.json();
  assert.equal(payload.cars.length, 1);
  assert.equal(payload.cars[0].fuel, "Híbrido");
});

test("arquivos inexistentes retornam 404", async () => {
  const response = await fetch(`${baseUrl}/nao-existe.js`);
  assert.equal(response.status, 404);
});
