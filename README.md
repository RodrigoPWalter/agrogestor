# AgroGestor

![Screenshot do Sistema](link_da_imagem_aqui)

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

## Visão Geral

O AgroGestor é uma plataforma de gestão rural desenvolvida para centralizar informações
operacionais, financeiras e agronômicas de propriedades familiares. O sistema integra o
planejamento das safras, o controle de custos, o estoque de insumos, o diário de
atividades, a manutenção de máquinas e dados externos relevantes em uma única aplicação.

Sua motivação é prática: substituir registros dispersos por informações estruturadas e
confiáveis, acessíveis durante o planejamento e a execução das atividades no campo.

## Funcionalidades Principais

- **Controle de Plantios:** Registro de culturas, safras, áreas, variedades, sementes e
  datas de plantio, com separação entre cultivos ativos e histórico de colheitas.
- **Gestão de Gastos:** Lançamento de despesas por plantio, consolidação de custos e
  cálculo do custo por hectare.
- **Estimativas Agrícolas:** Projeções de produção, faturamento e lucro, além de cálculos
  de semeadura por metro, hectare e peso de mil sementes.
- **Controle de Estoque:** Cadastro de sementes, fertilizantes e defensivos, com
  movimentações de entrada e saída, validade, unidade de medida e alertas de estoque
  mínimo.
- **Diário da Lavoura:** Histórico de atividades por plantio, com suporte a múltiplos
  produtos e baixa automática dos insumos aplicados no estoque.
- **Máquinas e Manutenções:** Cadastro de maquinário, controle de horímetro, custos de
  manutenção e acompanhamento das próximas revisões.
- **Registro Pluviométrico:** Lançamento manual das chuvas medidas na propriedade e
  acompanhamento do volume acumulado.
- **Previsão do Tempo:** Consulta meteorológica por cidade selecionada, com previsão de
  chuva, temperatura e alertas climáticos.
- **Mercado Agrícola:** Cotações de soja, milho, trigo e Diesel, incluindo histórico de
  variação dos preços.

## Stack Tecnológica

### Frontend

- React 19
- React Router
- Vite 8
- Vitest e Testing Library
- CSS responsivo e Lucide Icons

### Backend

- Java 21
- Spring Boot 3.5
- Spring Web
- Spring Data JPA
- Bean Validation
- SpringDoc OpenAPI
- Jsoup para integração com cotações

### Infraestrutura e Persistência

- PostgreSQL
- Flyway para versionamento do banco de dados
- Docker Compose para o ambiente local
- Maven Wrapper e npm
- Open-Meteo para dados meteorológicos
- Cotricampo como fonte das cotações agrícolas

## Executando o Projeto Localmente

### Pré-requisitos

- Java 21
- Node.js 24 ou superior
- Docker e Docker Compose, ou uma instalação local do PostgreSQL

### Banco de Dados e Backend

Na raiz do projeto, inicie o PostgreSQL e a API:

```powershell
docker compose up -d
.\mvnw.cmd spring-boot:run
```

As migrações do Flyway são executadas automaticamente durante a inicialização.

### Frontend

Em outro terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

A interface estará disponível em <http://localhost:5173> e a documentação interativa da
API em <http://localhost:8080/swagger-ui.html>.

### Configuração sem Docker

Crie um banco chamado `agrogestor` e configure as variáveis de ambiente:

```text
DB_URL=jdbc:postgresql://localhost:5432/agrogestor
DB_USERNAME=agrogestor
DB_PASSWORD=agrogestor
```

Quando nenhuma localização tiver sido escolhida pela interface, a previsão do tempo
utiliza os seguintes valores de configuração:

```text
WEATHER_LATITUDE=-27.6736
WEATHER_LONGITUDE=-53.8056
WEATHER_LOCATION_NAME=Campo Novo - RS
```

## Arquitetura da API

O backend adota uma arquitetura modular orientada aos domínios do sistema. Cada módulo
concentra seus controllers, DTOs, entidades, repositories e services, reduzindo o
acoplamento entre regras de negócio. Os recursos HTTP seguem o padrão REST e são
versionados pelo prefixo `/api/v1`.

| Domínio | Rota base |
|---|---|
| Plantios | `/api/v1/plantings` |
| Gastos | `/api/v1/expenses` |
| Estoque | `/api/v1/inventory/products` |
| Máquinas | `/api/v1/machines` |
| Manutenções | `/api/v1/maintenances` |
| Diário da lavoura | `/api/v1/field-diary` |
| Chuvas | `/api/v1/rainfall` |
| Estimativa de produção | `/api/v1/production-estimates` |
| Estimativa de semeadura | `/api/v1/seeding-estimates` |
| Clima | `/api/v1/weather` |
| Cotações | `/api/v1/commodity-quotes` |

O PostgreSQL é a fonte de verdade da aplicação. O Flyway controla a evolução do schema,
enquanto o Hibernate valida a compatibilidade entre as entidades e a estrutura do banco.
Durante o desenvolvimento, o Vite encaminha as requisições iniciadas por `/api` para o
backend na porta `8080`.

## Testes e Validação

Execute os testes automatizados do backend:

```powershell
.\mvnw.cmd test
```

Execute os testes e a compilação de produção do frontend:

```powershell
cd frontend
npm.cmd test
npm.cmd run build
```

## Documentação Complementar

- [Modelo do banco de dados](docs/DATABASE_MODEL.md)
- [Estrutura de pacotes](docs/PACKAGE_STRUCTURE.md)

## Evolução do Projeto

Os próximos ciclos de desenvolvimento devem incluir autenticação, usuários e suporte a
múltiplas propriedades. Essa evolução permitirá isolar os dados por organização,
associar configurações climáticas a cada fazenda e preparar a aplicação para implantação
em ambientes compartilhados.
