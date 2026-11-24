// Métricas de eficiência exibidas na plataforma.
export const FUEL_PRICES = { gasolina: 6.2, etanol: 4.3 }; // R$/litro — ajuste conforme necessário

const clamp = (value) => Math.min(1, Math.max(0, value));

// Nota energética: 50% consumo misto, 35% emissões, 15% aceleração. Faixas: A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, E < 35.
export function efficiencyGrade(car) {
  const score = 100 * (
    0.5 * clamp((car.consumption_mixed - 6) / (18 - 6)) +
    0.35 * clamp((220 - car.co2_grams) / (220 - 90)) +
    0.15 * clamp((14 - car.acceleration_seconds) / (14 - 6))
  );
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "E";
  return { score: Math.round(score), grade };
}

export function computeMetrics(car) {
  return {
    kmlCity: car.consumption_city,
    kmlRoad: car.consumption_road,
    kmlMixed: car.consumption_mixed,
    kmlEthanolMixed: car.ethanol_mixed,
    autonomyKm: Math.round(car.consumption_mixed * car.tank_liters),
    co2GramsKm: car.co2_grams,
    costPerKmGasoline: FUEL_PRICES.gasolina / car.consumption_mixed,
    costPerKmEthanol: car.ethanol_mixed ? FUEL_PRICES.etanol / car.ethanol_mixed : null,
    acceleration0to100: car.acceleration_seconds,
    ...efficiencyGrade(car),
  };
}
