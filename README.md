# AgroGestor

O AgroGestor nasceu para juntar em um lugar só as anotações que normalmente ficam
espalhadas entre caderno, planilha e conversa de WhatsApp. A ideia é simples: bater o
olho e saber o que foi plantado, quanto já foi gasto, o que ainda tem no galpão e quando
uma máquina precisa parar para revisão.

O projeto ainda está em evolução, mas já cobre uma rotina razoável de uma propriedade
familiar. Dá para acompanhar uma safra do cadastro até a estimativa de resultado, sem
precisar montar fórmulas toda vez.

## O que dá para fazer hoje

- cadastrar culturas e safras usando `2026` ou `2026/2027`;
- lançar gastos por plantio e acompanhar custo por hectare;
- estimar produção, faturamento e lucro;
- calcular sementes e plantas por metro, por hectare ou a partir do PMS;
- controlar sementes, fertilizantes e defensivos no estoque;
- registrar entradas, saídas, validade e nível mínimo dos produtos;
- cadastrar máquinas, horímetro e histórico de manutenção;
- acompanhar a próxima revisão de cada máquina;
- manter um diário de aplicações, vistorias e trabalhos realizados no campo;
- consultar previsão de chuva e cotações de soja, milho e trigo no painel.

As cotações vêm da Cotricampo. A previsão usa o Open-Meteo e fica configurada para
Campo Novo, no Rio Grande do Sul, quando nenhuma coordenada é informada.

## Rodando no computador

Você vai precisar do Java 21, Node.js 24 e PostgreSQL. Se preferir, o banco pode rodar
com Docker.

```powershell
docker compose up -d
.\mvnw.cmd spring-boot:run
```

Em outro terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Depois abra <http://localhost:5173>. A documentação da API fica em
<http://localhost:8080/swagger-ui.html>.

Sem Docker, crie o banco `agrogestor` e ajuste estas variáveis se os dados locais forem
diferentes:

```text
DB_URL=jdbc:postgresql://localhost:5432/agrogestor
DB_USERNAME=agrogestor
DB_PASSWORD=agrogestor
```

Para mudar a localização da previsão:

```text
WEATHER_LATITUDE=-27.6736
WEATHER_LONGITUDE=-53.8056
WEATHER_LOCATION_NAME=Campo Novo - RS
```

## Organização do projeto

O backend é uma aplicação Spring Boot organizada por módulo. Cada módulo mantém perto
os próprios DTOs, entidades, repositórios, regras e rotas. O PostgreSQL é versionado
com Flyway; o Hibernate apenas valida se as entidades continuam de acordo com o banco.

A interface fica em `frontend` e usa React com Vite. Durante o desenvolvimento, as
chamadas para `/api` são encaminhadas para a aplicação na porta 8080.

Os principais grupos da API são:

| Área | Rota base |
|---|---|
| Plantios | `/api/v1/plantings` |
| Gastos | `/api/v1/expenses` |
| Estoque | `/api/v1/inventory/products` |
| Máquinas | `/api/v1/machines` |
| Manutenções | `/api/v1/maintenances` |
| Diário da lavoura | `/api/v1/field-diary` |
| Estimativa de produção | `/api/v1/production-estimates` |
| Estimativa de semeadura | `/api/v1/seeding-estimates` |
| Clima | `/api/v1/weather/forecast` |
| Cotações | `/api/v1/commodity-quotes` |

## Testes

```powershell
.\mvnw.cmd test
cd frontend
npm.cmd test
```

Antes de abrir uma alteração maior, também vale conferir se a interface fecha o build:

```powershell
npm.cmd run build
```

Há mais detalhes sobre o banco e a divisão dos módulos em
[`docs/DATABASE_MODEL.md`](docs/DATABASE_MODEL.md) e
[`docs/PACKAGE_STRUCTURE.md`](docs/PACKAGE_STRUCTURE.md).

## Próximos passos

O próximo corte deve trazer propriedades e usuários. Isso vai permitir guardar a
localização do clima por fazenda e separar os dados de mais de uma família. Depois disso,
o diário poderá consumir produtos do estoque automaticamente quando uma aplicação for
registrada.
