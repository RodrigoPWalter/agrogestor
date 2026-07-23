# Decisões arquiteturais

Este arquivo registra escolhas importantes do AgroGestor, incluindo o motivo de cada decisão e o que ainda precisa evoluir. A intenção é deixar explícito o raciocínio por trás do projeto, não vender o sistema como algo mais maduro do que ele realmente é.

## 1. Aplicação inicialmente focada em uma propriedade

**Decisão:** o MVP foi construído para uma propriedade familiar específica, sem `property_id` nas tabelas de negócio.

**Motivo:** o primeiro objetivo é validar o fluxo real de uso: plantio, gastos, estoque, diário, chuvas, manutenção e fechamento de safra. Para esse cenário, adicionar multiempresa desde o início aumentaria bastante a complexidade.

**Trade-off:** a tabela de usuários já existe, mas os dados ainda não são isolados por usuário ou propriedade. Portanto, o sistema não está pronto para virar SaaS multiusuário sem uma migração estrutural.

**Evolução prevista:** criar `properties`, vincular usuários a propriedades e incluir `property_id` nas tabelas principais. A partir disso, todos os repositories devem filtrar pelo contexto autenticado.

## 2. JWT simples no frontend

**Decisão:** o frontend mantém o token JWT no armazenamento local do navegador.

**Motivo:** simplifica o PWA e evita uma configuração mais complexa de cookies, domínio, SameSite e HTTPS entre frontend e API durante o MVP.

**Trade-off:** `localStorage` é mais exposto caso algum XSS seja introduzido. Por isso o app deve evitar renderização de HTML externo, manter dependências atualizadas e evoluir para uma política de segurança mais rígida.

**Evolução prevista:** avaliar cookies `HttpOnly` em produção, refresh token, revogação de sessão e política de Content Security Policy.

## 3. Diário como ponto de integração

**Decisão:** o Diário da Lavoura pode gerar efeitos em outros módulos, como estoque, chuva, manutenção e gastos.

**Motivo:** no uso real, o produtor tende a registrar acontecimentos como uma anotação rápida. Se a compra de produto ou o uso de insumo exigirem telas separadas, a chance de abandono aumenta.

**Trade-off:** o `FieldDiaryService` ficou grande e conhece vários módulos. Para o MVP isso reduziu atrito de implementação, mas o serviço precisa ser dividido antes de crescer mais.

**Evolução prevista:** extrair orquestradores menores, como `DiaryStockHandler`, `DiaryRainfallHandler`, `DiaryMaintenanceHandler` e `DiaryExpenseHandler`.

## 4. Estoque com baixa transacional

**Decisão:** movimentações de estoque usam transação e lock pessimista ao carregar o produto.

**Motivo:** duas baixas simultâneas do mesmo produto não podem gerar saldo incorreto. O lock evita que requisições concorrentes atualizem a mesma quantidade ao mesmo tempo.

**Trade-off:** pode haver pequena perda de concorrência em produtos muito movimentados. Para uma propriedade familiar, consistência é mais importante do que throughput.

**Evolução prevista:** manter o lock enquanto o sistema for relacional simples. Caso o volume cresça, avaliar uma estratégia de ledger de estoque mais completa.

## 5. Cotações via fonte externa

**Decisão:** as cotações são lidas da página pública da Cotricampo.

**Motivo:** é uma fonte regional conhecida pelo usuário do sistema e entrega mais valor prático do que uma cotação genérica nacional.

**Trade-off:** parser de HTML é frágil. Se o site mudar a estrutura da página, a integração pode falhar.

**Evolução prevista:** trocar por API oficial se a cooperativa disponibilizar uma, ou permitir lançamento manual das cotações.

## 6. PWA online-first

**Decisão:** o AgroGestor é instalável como PWA, mas ainda não é offline-first.

**Motivo:** o primeiro passo foi permitir instalação no celular e melhorar a experiência de abertura. Sincronização offline com fila local exige cuidado para não duplicar lançamentos ou corromper estoque.

**Trade-off:** o usuário consegue abrir o app e ver parte dos dados salvos, mas ainda depende da API para gravar informações.

**Evolução prevista:** implementar IndexedDB, fila de operações pendentes, resolução de conflitos e indicador claro de sincronização.

## 7. Migrations antigas preservadas

**Decisão:** migrations de funcionalidades pausadas não são apagadas.

**Motivo:** migrations já aplicadas fazem parte do histórico do banco. Removê-las pode quebrar ambientes existentes e dificultar deploys novos a partir de bancos parcialmente migrados.

**Trade-off:** o histórico do banco fica com marcas de decisões antigas, como a tabela `weather_location`.

**Evolução prevista:** criar novas migrations para desativar ou remover estruturas obsoletas quando a decisão for definitiva.
