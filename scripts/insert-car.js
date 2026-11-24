// Inserção manual de carros no banco.  Uso:  npm run insert
// 1) Edite o objeto NEW_CAR abaixo.  2) Rode o comando.  Campos obrigatórios: todos, exceto ethanol_mixed.
import { fileURLToPath } from "node:url";
import { createDatabase, insertCar } from "../lib/database.js";

const NEW_CAR = {
  brand: "Marca",
  model: "Modelo",
  year: 2024,
  fuel_type: "flex",          // flex | gasolina | etanol
  mass_kg: 1300,
  power_kw: 100,
  drag_coefficient: 0.30,
  frontal_area: 2.2,          // m²
  tank_liters: 50,
  consumption_city: 10.0,     // km/l (gasolina)
  consumption_road: 12.5,
  consumption_mixed: 11.0,
  ethanol_mixed: 7.5,         // km/l — use null se não for flex
  co2_grams: 150,             // g CO₂/km
  acceleration_seconds: 10.5, // 0–100 km/h
};

const path = process.env.DB_PATH ?? fileURLToPath(new URL("../data/drivetwin.db", import.meta.url));
const db = createDatabase(path);
const id = insertCar(db, NEW_CAR);
console.log(`Carro inserido com id ${id}: ${NEW_CAR.brand} ${NEW_CAR.model}`);
db.close();
