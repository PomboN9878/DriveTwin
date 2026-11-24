# DriveTwin
Requer Node.js >= 22.13 (usa `node:sqlite`, sem dependências).

    npm start                      # http://localhost:3000
    npm run insert                 # insere o carro definido em scripts/insert-car.js

## Páginas
- `/` apresentação e métricas
- `/catalogo` catálogo, métricas por carro, simulador 3D e comparação de eficiência
- `/admin` login do administrador: cadastrar, editar e excluir veículos (somente admin)

Admin: defina `ADMIN_USER` e `ADMIN_PASSWORD` antes do primeiro start (padrão: admin / drivetwin).
Coloque a imagem do hero em `public/assets/hero-car.jpg`.

## Como funciona
**Banco (`cars`)** guarda só o que a simulação e as métricas usam:
`brand, model, year, fuel_type (flex|gasolina)`, `mass_kg, power_cv, top_speed_kmh`, `tank_l, km_l_city, km_l_road, km_l_ethanol_city, km_l_ethanol_road, co2_g_km`.
Consumo misto, autonomia, custo por km, 0–100 km/h e nota A–E são calculados (nada disso fica no banco).
Os dados são validados em `lib/database.js` (usado pelo painel e pelo `insert-car`). Bancos da versão anterior são convertidos
automaticamente no primeiro start (backup na tabela `cars_legacy`).

**Simulação (`public/js/simulation.js`)** — o mesmo código roda no servidor (métricas) e no navegador (simulador):
- massa, potência e velocidade máxima definem a aceleração (0–100 km/h) e o tempo do percurso;
- percurso de 3 km: cidade (para a cada quadra), estrada (110 km/h) ou misto (55% cidade + 45% estrada);
- consumo vem dos km/l do catálogo e sobe com mais pessoas a bordo (~1% a cada 45 kg).

Preços dos combustíveis: `FUEL_PRICES` em `public/js/simulation.js`.
