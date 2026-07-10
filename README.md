# AgroGestor

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

![Screenshot do Sistema](link_da_imagem_aqui)

AgroGestor é um sistema de gestão rural familiar desenvolvido para centralizar informações de plantio, custos, estoque, diário da lavoura, chuvas e manutenção de máquinas em uma única aplicação. O projeto nasceu de uma necessidade prática: reduzir registros soltos em caderno, planilhas e mensagens, transformando a rotina da propriedade em dados mais confiáveis para tomada de decisão.

O foco do sistema é ser simples o suficiente para uso no campo e estruturado o bastante para evoluir como uma aplicação real, com API REST, autenticação, banco versionado, frontend responsivo e suporte a instalação como PWA.

## Aplicação publicada

- Frontend: [https://agrogestor-rodrigowalter.onrender.com](https://agrogestor-rodrigowalter.onrender.com)
- API/Swagger: [https://agrogestor-api-rodrigowalter.onrender.com/swagger-ui.html](https://agrogestor-api-rodrigowalter.onrender.com/swagger-ui.html)

O ambiente público usa Render e PostgreSQL gerenciado. Como o plano gratuito pode suspender serviços sem uso, o primeiro acesso depois de um período parado pode levar alguns segundos. Para reduzir esse impacto, o Dashboard mantém um cache local dos últimos dados carregados e reaproveita as cotações do mercado durante o mesmo dia.

## Funcionalidades principais

- **Autenticação com JWT:** Login protegido, sessão no frontend e envio automático do token nas requisições privadas.
- **Controle de Plantios:** Cadastro de culturas, safras, área plantada, variedade, data de plantio e status da safra.
- **Histórico de Safras:** Finalização e reativação de plantios, mantendo o histórico de cultivos colhidos.
- **Fechamento de Safra:** Resumo por plantio com custo total, custo por hectare, produção registrada e resultado estimado.
- **Gestão de Gastos:** Lançamento de despesas por plantio, cálculo de totais e visão consolidada dos custos.
- **Controle de Estoque:** Cadastro de sementes, fertilizantes e defensivos, com entradas, saídas, validade e alerta de estoque baixo.
- **Diário da Lavoura:** Registro de acontecimentos da propriedade com plantio opcional, múltiplos produtos e integração com estoque.
- **Registro de Chuvas:** Controle manual de medições do pluviômetro, com vínculo opcional ao plantio.
- **Máquinas e Manutenções:** Cadastro da frota, horímetro, manutenções preventivas/corretivas e custos.
- **Mercado Agrícola:** Consulta de cotações de soja, milho, trigo e diesel, com histórico recente.
- **PWA:** Manifesto, service worker e tela de instruções para instalação no Android e iPhone.

## Stack

### Frontend

- React 19
- React Router
- Vite 8
- Vite Plugin PWA
- Vitest e Testing Library
- CSS responsivo com foco em uso mobile

### Backend

- Java 21
- Spring Boot 3.5
- Spring Web
- Spring Security
- Spring Data JPA
- Bean Validation
- Flyway
- SpringDoc OpenAPI
- Jsoup para leitura das cotações agrícolas

### Infraestrutura

- PostgreSQL
- Docker Compose para banco local
- Dockerfile para deploy da API
- Render para publicação do frontend e backend
- Neon/PostgreSQL gerenciado no ambiente publicado

## Arquitetura

O backend é organizado por módulos de domínio. Cada módulo mantém seus próprios controllers, DTOs, entidades, repositories e services, evitando pacotes genéricos grandes demais e facilitando a evolução das regras de negócio.

```text
br.com.agrogestor
├── auth
├── diary
├── expense
├── inventory
├── machine
├── planting
├── quotation
├── rainfall
└── shared
```

O frontend segue uma organização por páginas, componentes reutilizáveis, contexto de autenticação e camada centralizada de API. As chamadas HTTP passam por um cliente comum, responsável por anexar o token e tratar expiração de sessão.

## Rotas principais da API

Todos os endpoints são versionados com o prefixo `/api/v1`.

| Domínio | Rota base |
|---|---|
| Autenticação | `/api/v1/auth` |
| Plantios | `/api/v1/plantings` |
| Gastos | `/api/v1/expenses` |
| Estoque | `/api/v1/inventory/products` |
| Máquinas | `/api/v1/machines` |
| Manutenções | `/api/v1/maintenances` |
| Diário da lavoura | `/api/v1/field-diary` |
| Chuvas | `/api/v1/rainfall` |
| Cotações | `/api/v1/commodity-quotes` |

## Executando localmente

### Pré-requisitos

- Java 21
- Node.js 24 ou superior
- Docker e Docker Compose

### 1. Subir o banco

Na raiz do projeto:

```powershell
docker compose up -d
```

### 2. Iniciar a API

```powershell
.\mvnw.cmd spring-boot:run
```

A API ficará disponível em:

- [http://localhost:8080](http://localhost:8080)
- [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

As migrations do Flyway são executadas automaticamente na inicialização.

### 3. Iniciar o frontend

Em outro terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

A interface ficará disponível em [http://localhost:5173](http://localhost:5173).

Durante o desenvolvimento, o Vite encaminha as chamadas iniciadas por `/api` para o backend local. Para apontar o frontend para uma API publicada, copie `frontend/.env.example` para `frontend/.env.local` e configure:

```text
VITE_API_URL=https://api.exemplo.com
```

Não use barra no final da URL.

## Variáveis de ambiente

### Backend

```text
DB_URL=jdbc:postgresql://localhost:5432/agrogestor
DB_USERNAME=agrogestor
DB_PASSWORD=agrogestor
JWT_SECRET=uma-chave-com-pelo-menos-32-caracteres
JWT_EXPIRATION_MINUTES=480
JWT_ISSUER=https://agrogestor.local
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
APP_ADMIN_ENABLED=true
APP_ADMIN_NAME=Administrador
APP_ADMIN_EMAIL=admin@agrogestor.local
APP_ADMIN_PASSWORD=uma-senha-forte
```

Quando a tabela de usuários está vazia, o sistema cria um administrador inicial usando as variáveis `APP_ADMIN_*`. Esse recurso facilita o primeiro acesso em ambiente local ou recém-publicado.

### Frontend

```text
VITE_API_URL=
```

Vazio em desenvolvimento local com proxy do Vite. Preenchido em produção para apontar para a API publicada.

## PWA

O frontend possui manifesto, ícones e service worker configurados. Para validar uma versão de produção local:

```powershell
cd frontend
npm.cmd run build
npm.cmd run preview -- --host
```

Em produção, o app pode ser instalado no celular pela opção do navegador “Adicionar à tela inicial” ou “Instalar app”. A tela **Instalar** dentro do AgroGestor traz instruções rápidas para Android e iPhone.

## Testes

Backend:

```powershell
.\mvnw.cmd test
```

Frontend:

```powershell
cd frontend
npm.cmd test
npm.cmd run build
```

## Observações técnicas

- As migrations antigas de clima foram preservadas por compatibilidade com bancos já criados, mas a previsão do tempo não faz parte do fluxo atual da aplicação.
- O módulo de cotações consulta a Cotricampo e mantém fallback/cache no backend; o frontend também evita recarregar as cotações mais de uma vez por dia.
- O projeto evita expor entidades diretamente na API, usando DTOs para entrada e saída.
- Serviços que alteram mais de uma tabela usam transações para preservar consistência.

## Documentação complementar

- [Modelo do banco de dados](docs/DATABASE_MODEL.md)
- [Estrutura de pacotes](docs/PACKAGE_STRUCTURE.md)


