import { fileURLToPath } from "node:url";
import { createDatabase, insertCar, ValidationError } from "../lib/database.js";

const CARS = [
  {
    brand: "Volkswagen",
    model: "Polo 1.0 TSI",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1140,
    power_cv: 116,
    top_speed_kmh: 192,
    tank_l: 52,
    km_l_city: 12.5,
    km_l_road: 15.1,
    km_l_ethanol_city: 8.8,
    km_l_ethanol_road: 10.5,
    co2_g_km: 115,
  },
  {
    brand: "Chevrolet",
    model: "Onix 1.0 Turbo",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1090,
    power_cv: 116,
    top_speed_kmh: 187,
    tank_l: 44,
    km_l_city: 13.5,
    km_l_road: 16.0,
    km_l_ethanol_city: 9.2,
    km_l_ethanol_road: 11.2,
    co2_g_km: 112,
  },
  {
    brand: "Hyundai",
    model: "HB20 1.0",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1000,
    power_cv: 80,
    top_speed_kmh: 161,
    tank_l: 50,
    km_l_city: 13.3,
    km_l_road: 15.4,
    km_l_ethanol_city: 9.6,
    km_l_ethanol_road: 10.9,
    co2_g_km: 108,
  },
  {
    brand: "Fiat",
    model: "Argo 1.0",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1050,
    power_cv: 75,
    top_speed_kmh: 162,
    tank_l: 48,
    km_l_city: 13.4,
    km_l_road: 14.6,
    km_l_ethanol_city: 9.4,
    km_l_ethanol_road: 10.4,
    co2_g_km: 110,
  },
  {
    brand: "Toyota",
    model: "Corolla 2.0",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1390,
    power_cv: 177,
    top_speed_kmh: 205,
    tank_l: 50,
    km_l_city: 11.6,
    km_l_road: 13.9,
    km_l_ethanol_city: 8.0,
    km_l_ethanol_road: 9.7,
    co2_g_km: 145,
  },
  {
    brand: "Honda",
    model: "HR-V 1.5",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1320,
    power_cv: 126,
    top_speed_kmh: 175,
    tank_l: 50,
    km_l_city: 12.7,
    km_l_road: 13.9,
    km_l_ethanol_city: 8.8,
    km_l_ethanol_road: 9.8,
    co2_g_km: 125,
  },
  {
    brand: "Nissan",
    model: "Kicks 1.6",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1130,
    power_cv: 113,
    top_speed_kmh: 175,
    tank_l: 41,
    km_l_city: 11.4,
    km_l_road: 13.7,
    km_l_ethanol_city: 7.8,
    km_l_ethanol_road: 9.6,
    co2_g_km: 128,
  },
  {
    brand: "Renault",
    model: "Kwid 1.0",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 820,
    power_cv: 71,
    top_speed_kmh: 156,
    tank_l: 38,
    km_l_city: 15.3,
    km_l_road: 15.7,
    km_l_ethanol_city: 10.8,
    km_l_ethanol_road: 11.0,
    co2_g_km: 95,
  },
  {
    brand: "Fiat",
    model: "Fastback T200",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1250,
    power_cv: 130,
    top_speed_kmh: 196,
    tank_l: 47,
    km_l_city: 11.9,
    km_l_road: 14.6,
    km_l_ethanol_city: 8.4,
    km_l_ethanol_road: 10.2,
    co2_g_km: 120,
  },
  {
    brand: "Jeep",
    model: "Renegade T270",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1460,
    power_cv: 185,
    top_speed_kmh: 210,
    tank_l: 55,
    km_l_city: 10.4,
    km_l_road: 12.1,
    km_l_ethanol_city: 7.4,
    km_l_ethanol_road: 8.6,
    co2_g_km: 155,
  },
  {
    brand: "BMW",
    model: "320i",
    year: 2024,
    fuel_type: "gasolina",
    mass_kg: 1560,
    power_cv: 184,
    top_speed_kmh: 235,
    tank_l: 59,
    km_l_city: 10.5,
    km_l_road: 14.0,
    km_l_ethanol_city: null,
    km_l_ethanol_road: null,
    co2_g_km: 155,
  },
  {
    brand: "Toyota",
    model: "Yaris 1.5",
    year: 2024,
    fuel_type: "flex",
    mass_kg: 1120,
    power_cv: 110,
    top_speed_kmh: 180,
    tank_l: 45,
    km_l_city: 12.8,
    km_l_road: 14.9,
    km_l_ethanol_city: 8.9,
    km_l_ethanol_road: 10.6,
    co2_g_km: 115,
  },
];

const path =
  process.env.DB_PATH ??
  fileURLToPath(new URL("../data/drivetwin.db", import.meta.url));

const db = createDatabase(path);

let inserted = 0;
let failed = 0;

try {
  for (const car of CARS) {
    try {
      const id = insertCar(db, car);

      console.log(
        `[OK] #${id} - ${car.brand} ${car.model} ${car.year}`
      );

      inserted++;
    } catch (error) {
      if (!(error instanceof ValidationError)) {
        console.error(`[ERRO] ${car.brand} ${car.model}:`, error);
        failed++;
        continue;
      }

      console.error(
        `[VALIDAÇÃO] ${car.brand} ${car.model}: ${error.message}`
      );

      failed++;
    }
  }

  console.log("\n===== RESULTADO =====");
  console.log(`Inseridos: ${inserted}`);
  console.log(`Falharam: ${failed}`);
  console.log(`Total: ${CARS.length}`);
} finally {
  db.close();
}