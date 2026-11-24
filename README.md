# DriveTwin — Node.js

Versão independente da página de apresentação do DriveTwin, feita com **Node.js, SQLite nativo, HTML, CSS e JavaScript puro**. Não usa React, Vite, Express nem pacotes externos.

## Requisitos

- Node.js **22.5 ou superior** (testado no Node.js 22.23).
- Não é necessário instalar dependências.

## Executar

```bash
npm start
```

Abra **http://localhost:3000**.

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

Para usar outra porta ou outro arquivo de banco:

```bash
PORT=8080 DB_PATH=./data/meus-carros.db npm start
```

## Testes

```bash
npm test
```

## Banco SQLite

O arquivo `data/drivetwin.db` é criado automaticamente na primeira execução, usando o módulo nativo `node:sqlite`. Os dez carros iniciais são inseridos pelo próprio código. Os valores de consumo, emissões e desempenho são **ilustrativos**, não medições oficiais.

## API

- `GET /api/health` — estado do servidor.
- `GET /api/cars` — lista todos os carros.
- `GET /api/cars?brand=Toyota` — filtra por marca.
- `GET /api/cars?fuel=Híbrido` — filtra por combustível.

## Estrutura

```text
server.js           inicialização e encerramento do servidor
lib/app.js          servidor HTTP, arquivos estáticos e API
lib/database.js     criação do SQLite, catálogo e consultas
public/index.html   página de apresentação
public/styles.css   tema azul e branco e layout responsivo
public/app.js       abas e prévias interativas
test/app.test.js    testes do servidor, API e SQLite
```
