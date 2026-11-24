// Inserção manual de carros no banco.  Uso:  npm run insert
// 1) Edite o objeto NEW_CAR abaixo.  2) Rode o comando.
// Os mesmos dados e as mesmas regras do cadastro pelo painel /admin (ambos usam lib/database.js).
// Consumo misto, autonomia, custo por km e 0–100 km/h não precisam ser informados: são calculados.
import { fileURLToPath } from "node:url";
import { createDatabase, insertCar, ValidationError } from "../lib/database.js";

const NEW_CAR = {
  brand: "Marca",
  model: "Modelo",
  year: 2024,
  fuel_type: "flex",            // flex | gasolina

  // Simulação
  mass_kg: 1300,                // massa (kg)
  power_cv: 120,                // potência (cv)
  top_speed_kmh: 185,           // velocidade máxima (km/h)

  // Consumo e emissões
  tank_l: 50,                   // tanque (litros)
  km_l_city: 10.0,              // gasolina, cidade (km/l)
  km_l_road: 12.5,              // gasolina, estrada (km/l)
  km_l_ethanol_city: 7.0,       // etanol, cidade (km/l) — use null se fuel_type for "gasolina"
  km_l_ethanol_road: 8.8,       // etanol, estrada (km/l) — use null se fuel_type for "gasolina"
  co2_g_km: 150,                // emissões (g CO₂/km)
};

const path = process.env.DB_PATH ?? fileURLToPath(new URL("../data/drivetwin.db", import.meta.url));
const db = createDatabase(path);
try {
  const id = insertCar(db, NEW_CAR);
  console.log(`Carro inserido com id ${id}: ${NEW_CAR.brand} ${NEW_CAR.model} ${NEW_CAR.year}`);
} catch (error) {
  if (!(error instanceof ValidationError)) throw error;
  console.error(`Não foi possível inserir: ${error.message}`);
  process.exitCode = 1;
} finally {
  db.close();
}
