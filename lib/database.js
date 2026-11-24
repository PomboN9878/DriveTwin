import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

// Valores ilustrativos para a apresentação; não representam medições oficiais.
const seedCars = [
  ["toyota-corolla-hybrid", "Toyota", "Corolla Hybrid", "Sedã", "Híbrido", 16.8, 18.9, 43, 92, 9.8],
  ["honda-city-exl", "Honda", "City EXL", "Sedã", "Flex", 12.1, 14.6, 44, 121, 10.2],
  ["volkswagen-polo-tsi", "Volkswagen", "Polo TSI", "Hatch", "Flex", 11.5, 14.1, 52, 128, 10.1],
  ["fiat-argo-drive", "Fiat", "Argo Drive", "Hatch", "Flex", 11.2, 13.0, 48, 132, 10.9],
  ["hyundai-hb20-turbo", "Hyundai", "HB20 Turbo", "Hatch", "Flex", 11.0, 13.8, 50, 130, 10.4],
  ["chevrolet-onix-plus", "Chevrolet", "Onix Plus", "Sedã", "Flex", 11.8, 14.4, 44, 125, 10.6],
  ["renault-kwid", "Renault", "Kwid", "Hatch", "Flex", 12.0, 13.5, 38, 129, 12.8],
  ["jeep-compass", "Jeep", "Compass", "SUV", "Flex", 10.2, 12.5, 60, 142, 9.8],
  ["ford-ka", "Ford", "Ka", "Hatch", "Flex", 11.9, 14.2, 50, 124, 10.8],
  ["nissan-versa", "Nissan", "Versa", "Sedã", "Flex", 11.6, 14.0, 41, 126, 10.5],
];

export function createDatabase(databasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL,
      fuel TEXT NOT NULL,
      consumption_city REAL NOT NULL,
      consumption_road REAL NOT NULL,
      tank_liters REAL NOT NULL,
      co2_grams INTEGER NOT NULL,
      acceleration_seconds REAL NOT NULL
    );
  `);

  const insert = db.prepare(`
    INSERT INTO cars (
      slug, brand, model, category, fuel, consumption_city, consumption_road,
      tank_liters, co2_grams, acceleration_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO NOTHING
  `);
  for (const car of seedCars) insert.run(...car);
  return db;
}

export function listCars(db, { brand, fuel } = {}) {
  const conditions = [];
  const params = [];
  if (brand) {
    conditions.push("brand = ?");
    params.push(brand);
  }
  if (fuel) {
    conditions.push("fuel = ?");
    params.push(fuel);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return db.prepare(`
    SELECT id, slug, brand, model, category, fuel,
      consumption_city, consumption_road,
      ROUND((consumption_city + consumption_road) / 2, 1) AS consumption_mixed,
      tank_liters, co2_grams, acceleration_seconds
    FROM cars
    ${where}
    ORDER BY consumption_mixed DESC, brand, model
  `).all(...params);
}
