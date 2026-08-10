# AgroGestor

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
[![CI](https://github.com/RodrigoPWalter/agrogestor/actions/workflows/ci.yml/badge.svg)](https://github.com/RodrigoPWalter/agrogestor/actions/workflows/ci.yml)



AgroGestor é um sistema de gestão rural familiar desenvolvido para centralizar informações de plantio, custos, estoque, diário da lavoura, chuvas e manutenção de máquinas em uma única aplicação. O projeto nasceu de uma necessidade prática: reduzir registros soltos em caderno, planilhas e mensagens, transformando a rotina da propriedade em dados mais confiáveis para tomada de decisão.

O foco do sistema é ser simples o suficiente para uso no campo e estruturado o bastante para evoluir como uma aplicação real, com API REST, autenticação, banco versionado, frontend responsivo e suporte a instalação como PWA.

## Aplicação publicada

- Frontend: [https://agrogestor-rural.onrender.com](https://agrogestor-rural.onrender.com)
- API (verificação de saúde): [https://agrogestor-api-rodrigowalter.onrender.com/api/v1/health](https://agrogestor-api-rodrigowalter.onrender.com/api/v1/health)

O ambiente público usa Render e PostgreSQL gerenciado. Como o plano gratuito pode suspender serviços sem uso, o primeiro acesso depois de um período parado pode levar alguns segundos. Para reduzir esse impacto, o Dashboard mantém um cache local dos últimos dados carregados e reaproveita as cotações do mercado durante o mesmo dia.

## Funcionalidades principais

- **Autenticação com JWT:** Login protegido, sessão no frontend e envio automático do token nas requisições privadas.
- **Contas com dados isolados:** Cada conta criada pelo administrador possui sua própria propriedade, sem acesso aos plantios, gastos, estoque ou demais registros de outra conta.
- **Controle de Plantios:** Cadastro antecipado da safra com área prevista, talhão, variedade, distância entre linhas, taxa de semeadura em `kg/ha` ou `sementes/ha` e custos desde a preparação do campo.
- **Progresso da Semeadura:** Registro dos hectares e da variedade utilizada em cada etapa, com área restante, percentual, histórico editável e lançamento automático no Diário.
- **Colheita por Etapas:** Registro da área e produção colhidas em cada dia, cálculo de produtividade e atualização automática do fechamento da safra.
- **Histórico de Safras:** Finalização e reativação de plantios, mantendo o histórico de cultivos colhidos.
- **Fechamento de Safra:** Resumo por plantio com custo total, custo por hectare, produção registrada e resultado estimado.
- **Gestão de Gastos:** Separação entre despesas por plantio e custos gerais da propriedade, com totais por categoria e transferência proporcional do custo dos insumos utilizados.
- **Controle de Estoque:** Cadastro de sementes, fertilizantes e defensivos, com entradas, saídas, custo médio, valor do saldo, validade e alerta de estoque baixo.
- **Diário da Lavoura:** Registro de acontecimentos da propriedade com plantio opcional, múltiplos produtos e integração transacional com estoque e custos.
- **Registro de Chuvas:** Controle manual de medições do pluviômetro, com vínculo opcional ao plantio.
- **Máquinas e Manutenções:** Cadastro da frota, horímetro e manutenções preventivas/corretivas, com lançamento automático do custo nos gastos da propriedade.
- **Mercado Agrícola:** Consulta de cotações de soja, milho, trigo e diesel, com histórico recente.
- **PWA:** Manifesto e service worker para instalação pelo navegador no Android e iPhone.
- **Uso em conexão lenta:** Bloqueio de envios repetidos, mensagens específicas de conexão e recuperação de rascunhos de plantios, gastos e atividades do Diário.
- **Acesso protegido:** Login com JWT e alteração de nome, e-mail e senha pelo menu do perfil.

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
├── property
├── quotation
├── rainfall
└── shared
```

O frontend segue uma organização por páginas, componentes reutilizáveis, contexto de autenticação e camada centralizada de API. As chamadas HTTP passam por um cliente comum, responsável por anexar o token e tratar expiração de sessão.

## Rotas principais da API

Todos os endpoints são versionados com o prefixo `/api/v1`.

| Domínio           | Rota base                    |
| ----------------- | ---------------------------- |
| Autenticação      | `/api/v1/auth`               |
| Contas (administrador) | `/api/v1/users`          |
| Visão geral       | `/api/v1/dashboard`          |
| Plantios          | `/api/v1/plantings`          |
| Etapas de plantio | `/api/v1/plantings/{id}/steps` |
| Etapas de colheita | `/api/v1/plantings/{id}/harvest-steps` |
| Gastos            | `/api/v1/expenses`           |
| Estoque           | `/api/v1/inventory/products` |
| Máquinas          | `/api/v1/machines`           |
| Manutenções       | `/api/v1/maintenances`       |
| Diário da lavoura | `/api/v1/field-diary`        |
| Chuvas            | `/api/v1/rainfall`           |
| Cotações          | `/api/v1/commodity-quotes`   |
| Saúde do serviço  | `/api/v1/health`             |

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
LOGIN_MAX_ATTEMPTS=10
LOGIN_WINDOW_MINUTES=15
APP_ADMIN_ENABLED=true
APP_ADMIN_NAME=Administrador
APP_ADMIN_EMAIL=admin@agrogestor.local
APP_ADMIN_PASSWORD=uma-senha-forte
```

Quando a tabela de usuários está vazia, o sistema cria um administrador inicial usando as variáveis `APP_ADMIN_*`. Esse recurso facilita o primeiro acesso em ambiente local ou recém-publicado.

### Frontend

```text
VITE_API_URL=
VITE_API_TIMEOUT_MS=90000
```

Vazio em desenvolvimento local com proxy do Vite. Preenchido em produção para apontar para a API publicada.

## PWA

O frontend possui manifesto, ícones e service worker configurados. Para validar uma versão de produção local:

```powershell
cd frontend
npm.cmd run build
npm.cmd run preview -- --host
```

Em produção, o app pode ser instalado no celular pela opção do navegador “Adicionar à tela inicial” ou “Instalar app”.

Os rascunhos dos formulários de Plantios, Gastos e Diário ficam armazenados somente no aparelho e associados ao usuário autenticado. Eles são removidos depois do salvamento, ao cancelar o formulário ou após sete dias.

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
- O CI executa testes do backend, testes do frontend, build de produção e auditoria das dependências de produção do frontend.
- O CI também sobe um PostgreSQL temporário para validar as migrations e o fluxo transacional entre Diário e Estoque.
- A documentação OpenAPI fica disponível no ambiente local. No perfil de produção ela é desativada para reduzir superfície de exposição e custo de inicialização.
- O repositório ainda não define uma licença de uso. Antes de aceitar contribuições ou liberar reutilização por terceiros, escolha uma licença adequada para o objetivo do projeto.

## Documentação complementar

- [Modelo do banco de dados](docs/DATABASE_MODEL.md)
- [Estrutura de pacotes](docs/PACKAGE_STRUCTURE.md)
- [Decisões arquiteturais](docs/DECISIONS.md)
- [Backup e restauração](docs/BACKUP.md)
- [Política de segurança](SECURITY.md)
- [Changelog](CHANGELOG.md)
