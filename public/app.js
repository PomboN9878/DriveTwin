const tabs = {
  catalogo: {
    icon: "list",
    title: "Uma lista de carros de várias marcas",
    text: "Explore os modelos gravados no SQLite. Cada carro traz ficha técnica e dados de consumo prontos para comparar.",
    bullets: ["Dados carregados por API", "Flex e híbridos", "Ficha técnica completa"],
  },
  simulador: {
    icon: "box",
    title: "Simulador 3D ao lado da lista",
    text: "Selecione um carro e veja a prévia do ambiente 3D. A telemetria muda de acordo com o modelo escolhido.",
    bullets: ["Visualização 3D interativa", "Cidade, estrada e serra", "Telemetria em tempo real"],
  },
  consumo: {
    icon: "fuel",
    title: "Consumo de gasolina em cada percurso",
    text: "Descubra quantos km/l o carro faz na cidade, na estrada e no uso misto — e compare com outro modelo.",
    bullets: ["km/l por tipo de via", "Custo por km rodado", "Autonomia do tanque"],
  },
  relatorios: {
    icon: "chart",
    title: "Compare e escolha com dados",
    text: "Coloque modelos lado a lado e gere um relatório com nota de eficiência, emissões e desempenho.",
    bullets: ["Comparação lado a lado", "Nota de eficiência", "Exportação do resultado"],
  },
};

const brands = ["Toyota", "Volkswagen", "Fiat", "Chevrolet", "Honda", "Hyundai", "Renault", "Jeep", "Ford", "Nissan", "BYD", "Peugeot", "BMW", "Mercedes-Benz"];
const mockContent = document.querySelector("#mock-content");
const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
let cars = [];
let selectedCar;
let activeTab = "simulador";

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;
}

function carSilhouette() {
  return `<svg class="car-silhouette" viewBox="0 0 320 110" fill="none" aria-hidden="true">
    <path d="M20 78 38 54Q52 40 84 38L118 22Q140 12 176 14L214 18Q238 22 256 40L288 48Q304 52 304 66V78M20 78H304M120 40 136 24H196L220 42Z" stroke="#3aa9f8" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="82" cy="80" r="17" fill="#142346" stroke="#3aa9f8" stroke-width="2.5"/><circle cx="82" cy="80" r="6" fill="#3aa9f8"/>
    <circle cx="248" cy="80" r="17" fill="#142346" stroke="#3aa9f8" stroke-width="2.5"/><circle cx="248" cy="80" r="6" fill="#3aa9f8"/>
  </svg>`;
}

function simPanel(car) {
  return `<div class="sim-panel">
    <div class="sim-status"><span>Simulação 3D · Estrada</span><span class="live">ao vivo</span></div>
    ${carSilhouette()}
    <div class="gauges">
      <div><span>Velocidade</span><strong>80 km/h</strong></div>
      <div><span>Consumo</span><strong>${numberFormat.format(car.consumption_road)} km/l</strong></div>
      <div><span>Autonomia</span><strong>${Math.round(car.consumption_road * car.tank_liters)} km</strong></div>
    </div>
  </div>`;
}

function carList(withBars) {
  const max = Math.max(...cars.map((car) => car.consumption_mixed));
  return `<ul class="car-list">${cars.slice(0, 6).map((car) => `
    <li><button class="car-item ${car.id === selectedCar.id ? "selected" : ""}" data-car-id="${car.id}" aria-pressed="${car.id === selectedCar.id}">
      <span class="car-item-top"><span><span class="car-brand">${escapeHtml(car.brand)}</span><span class="car-model">${escapeHtml(car.model)}</span></span><span class="car-kml">${numberFormat.format(car.consumption_mixed)} km/l</span></span>
      ${withBars ? `<span class="consumption-bar"><span style="width:${(car.consumption_mixed / max) * 100}%"></span></span>` : ""}
    </button></li>`).join("")}</ul>`;
}

function consumptionChart() {
  const comparison = cars.find((car) => car.id !== selectedCar.id) ?? selectedCar;
  const rows = [
    ["Cidade", selectedCar.consumption_city, comparison.consumption_city],
    ["Estrada", selectedCar.consumption_road, comparison.consumption_road],
    ["Misto", selectedCar.consumption_mixed, comparison.consumption_mixed],
  ];
  const max = Math.max(...rows.flatMap((row) => [row[1], row[2]]));
  return `<div class="chart-legend"><span><i></i>${escapeHtml(selectedCar.model)}</span><span><i></i>${escapeHtml(comparison.model)}</span></div>
    <div class="bar-chart">${rows.map(([label, a, b]) => `<div class="bar-group"><div class="bars"><i style="height:${(a / max) * 100}%" title="${numberFormat.format(a)} km/l"></i><i style="height:${(b / max) * 100}%" title="${numberFormat.format(b)} km/l"></i></div><span>${label}</span></div>`).join("")}</div>`;
}

function reportTable() {
  const comparison = cars.find((car) => car.id !== selectedCar.id) ?? selectedCar;
  const rows = [
    ["Consumo médio", `${numberFormat.format(selectedCar.consumption_mixed)} km/l`, `${numberFormat.format(comparison.consumption_mixed)} km/l`],
    ["Autonomia", `${Math.round(selectedCar.consumption_mixed * selectedCar.tank_liters)} km`, `${Math.round(comparison.consumption_mixed * comparison.tank_liters)} km`],
    ["CO₂", `${selectedCar.co2_grams} g/km`, `${comparison.co2_grams} g/km`],
    ["0–100 km/h", `${numberFormat.format(selectedCar.acceleration_seconds)} s`, `${numberFormat.format(comparison.acceleration_seconds)} s`],
  ];
  return `<table class="report-table"><thead><tr><th>Métrica</th><th>${escapeHtml(selectedCar.model)}</th><th>${escapeHtml(comparison.model)}</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("")}</tbody></table><div class="efficiency-score"><span>Nota de eficiência</span><strong>A+</strong></div>`;
}

function renderMock() {
  if (!selectedCar) return;
  if (activeTab === "catalogo") mockContent.innerHTML = carList(true);
  if (activeTab === "simulador") mockContent.innerHTML = `<div class="catalog-sim-grid">${carList(false)}${simPanel(selectedCar)}</div>`;
  if (activeTab === "consumo") mockContent.innerHTML = consumptionChart();
  if (activeTab === "relatorios") mockContent.innerHTML = reportTable();
}

function renderTab() {
  const tab = tabs[activeTab];
  document.querySelector("#tab-icon").innerHTML = icon(tab.icon);
  document.querySelector("#tab-title").textContent = tab.title;
  document.querySelector("#tab-text").textContent = tab.text;
  document.querySelector("#tab-bullets").innerHTML = tab.bullets.map((bullet) => `<li>${bullet}</li>`).join("");
  document.querySelectorAll(".tab").forEach((button) => {
    const selected = button.dataset.tab === activeTab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  renderMock();
}

document.querySelectorAll(".tab").forEach((button, index, allButtons) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    renderTab();
  });
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = allButtons[(index + direction + allButtons.length) % allButtons.length];
    next.focus();
    next.click();
  });
});

mockContent.addEventListener("click", (event) => {
  const button = event.target.closest("[data-car-id]");
  if (!button) return;
  selectedCar = cars.find((car) => car.id === Number(button.dataset.carId));
  renderMock();
});

document.querySelector("#brands-list").innerHTML = [...brands, ...brands].map((brand) => `<span>${brand}</span>`).join("");
document.querySelector("#year").textContent = new Date().getFullYear();
renderTab();

try {
  const response = await fetch("/api/cars");
  if (!response.ok) throw new Error("Falha ao carregar o catálogo");
  const payload = await response.json();
  cars = payload.cars;
  selectedCar = cars[0];
  renderMock();
} catch (error) {
  mockContent.innerHTML = `<p class="error-message">Não foi possível carregar os carros. Verifique se o servidor Node.js está rodando.</p>`;
  console.error(error);
}
