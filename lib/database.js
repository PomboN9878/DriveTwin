// Banco nativo do Node.js (node:sqlite, Node >= 22.13). Sem dependências externas.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Campos de um carro. ethanol_mixed é opcional (carros que não são flex).
export const CAR_FIELDS = [
  "brand", "model", "year", "fuel_type",
  "mass_kg", "power_kw", "drag_coefficient", "frontal_area", "tank_liters",
  "consumption_city", "consumption_road", "consumption_mixed", "ethanol_mixed",
  "co2_grams", "acceleration_seconds",
];
const REQUIRED = CAR_FIELDS.filter((field) => field !== "ethanol_mixed");

// Carro de teste (valores ilustrativos, não são dados oficiais).
export const EXAMPLE_CAR = {
  brand: "Toyota", model: "Corolla 2.0 Flex", year: 2024, fuel_type: "flex",
  mass_kg: 1350, power_kw: 130, drag_coefficient: 0.29, frontal_area: 2.2, tank_liters: 50,
  consumption_city: 11.2, consumption_road: 13.8, consumption_mixed: 12.3, ethanol_mixed: 8.6,
  co2_grams: 135, acceleration_seconds: 9.0,
};

export function createDatabase(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL, model TEXT NOT NULL, year INTEGER NOT NULL,
      fuel_type TEXT NOT NULL DEFAULT 'flex',
      mass_kg REAL NOT NULL, power_kw REAL NOT NULL,
      drag_coefficient REAL NOT NULL, frontal_area REAL NOT NULL, tank_liters REAL NOT NULL,
      consumption_city REAL NOT NULL, consumption_road REAL NOT NULL, consumption_mixed REAL NOT NULL,
      ethanol_mixed REAL,
      co2_grams REAL NOT NULL, acceleration_seconds REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL
    );
  `);
  if (db.prepare("SELECT COUNT(*) AS n FROM cars").get().n === 0) insertCar(db, EXAMPLE_CAR);
  ensureAdmin(db);
  return db;
}

export function insertCar(db, car) {
  for (const field of REQUIRED) {
    if (car[field] === undefined || car[field] === null || car[field] === "") {
      throw new Error(`Campo obrigatório ausente: ${field}`);
    }
  }
  const values = Object.fromEntries(CAR_FIELDS.map((field) => [field, car[field] ?? null]));
  const sql = `INSERT INTO cars (${CAR_FIELDS.join(", ")}) VALUES (${CAR_FIELDS.map((f) => ":" + f).join(", ")})`;
  return Number(db.prepare(sql).run(values).lastInsertRowid);
}

export function listCars(db) {
  return db.prepare("SELECT * FROM cars ORDER BY brand, model").all();
}

// ---- Admin (login básico; área em desenvolvimento) ----
const hashPassword = (password, salt) => scryptSync(password, salt, 64).toString("hex");

function ensureAdmin(db) {
  if (db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n > 0) return;
  const username = process.env.ADMIN_USER ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "drivetwin";
  const salt = randomBytes(16).toString("hex");
  db.prepare("INSERT INTO admin_users (username, salt, hash) VALUES (?, ?, ?)").run(username, salt, hashPassword(password, salt));
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(`[admin] Usuário padrão criado: "${username}" / "drivetwin". Defina ADMIN_USER e ADMIN_PASSWORD antes de publicar.`);
  }
}

export function verifyAdmin(db, username, password) {
  const row = db.prepare("SELECT salt, hash FROM admin_users WHERE username = ?").get(String(username));
  if (!row) return false;
  const expected = Buffer.from(row.hash, "hex");
  const received = Buffer.from(hashPassword(String(password), row.salt), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
