// Métricas de eficiência exibidas na plataforma. Tudo é calculado a partir dos dados do carro.
import { FUEL_PRICES, mixedKmL, accel0to100 } from "../public/js/simulation.js";

const clamp = (value) => Math.min(1, Math.max(0, value));

// Nota energética: 50% consumo misto, 35% emissões, 15% aceleração. Faixas: A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, E < 35.
export function efficiencyGrade({ kmlMixed, co2, acceleration }) {
  const score = 100 * (
    0.5 * clamp((kmlMixed - 6) / (18 - 6)) +
    0.35 * clamp((220 - co2) / (220 - 90)) +
    0.15 * clamp((14 - (acceleration ?? 14)) / (14 - 6))
  );
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "E";
  return { score: Math.round(score), grade };
}

export function computeMetrics(car) {
  const kmlMixed = mixedKmL(car.km_l_city, car.km_l_road);
  const flex = car.fuel_type === "flex";
  const ethanolMixed = flex ? mixedKmL(car.km_l_ethanol_city, car.km_l_ethanol_road) : null;
  const acceleration = accel0to100(car);
  return {
    kmlCity: car.km_l_city,
    kmlRoad: car.km_l_road,
    kmlMixed,
    ethanol: flex ? { city: car.km_l_ethanol_city, road: car.km_l_ethanol_road, mixed: ethanolMixed } : null,
    autonomyKm: Math.round(kmlMixed * car.tank_l),
    autonomyEthanolKm: flex ? Math.round(ethanolMixed * car.tank_l) : null,
    co2GramsKm: car.co2_g_km,
    costPerKmGasoline: FUEL_PRICES.gasolina / kmlMixed,
    costPerKmEthanol: flex ? FUEL_PRICES.etanol / ethanolMixed : null,
    acceleration0to100: acceleration,
    topSpeedKmh: car.top_speed_kmh,
    ...efficiencyGrade({ kmlMixed, co2: car.co2_g_km, acceleration }),
  };
}
