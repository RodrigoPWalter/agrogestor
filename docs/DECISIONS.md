# Decisões arquiteturais

Este arquivo registra escolhas importantes do AgroGestor, incluindo o motivo de cada decisão e o que ainda precisa evoluir. A intenção é deixar explícito o raciocínio por trás do projeto, não vender o sistema como algo mais maduro do que ele realmente é.

## 1. Dados isolados por propriedade

**Decisão:** cada conta pertence a uma propriedade, e as tabelas principais possuem `property_id`. Os services obtêm a propriedade pela identidade autenticada e os repositories filtram os registros por esse contexto.

**Motivo:** o sistema começou atendendo uma única propriedade familiar, mas a criação de contas de teste mostrou que compartilhar todos os dados seria incorreto e inseguro.

**Trade-off:** hoje uma nova conta recebe uma propriedade própria. O modelo ainda não representa equipes com vários usuários trabalhando na mesma propriedade.

**Evolução prevista:** criar associação de membros, convites e permissões por propriedade caso o AgroGestor evolua para uso comercial.

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

## 6. PWA com fila offline

**Decisão:** o AgroGestor guarda no IndexedDB as respostas já consultadas e as alterações feitas sem conexão. A fila volta a enviar os itens quando a API fica disponível.

**Motivo:** o aplicativo precisa continuar útil no campo, onde a conexão pode cair durante um lançamento. Cada operação recebe uma chave de idempotência para que uma repetição não crie o mesmo registro duas vezes.

**Trade-off:** apenas dados abertos anteriormente ficam disponíveis para leitura offline. Limpar os dados do navegador antes da sincronização remove itens que ainda existam somente no aparelho. As chaves confirmadas ficam no servidor por 90 dias, prazo superior ao acesso local máximo de 30 dias.

**Evolução prevista:** adicionar política explícita de resolução para edições concorrentes caso uma mesma propriedade passe a ter vários operadores simultâneos.

## 7. Migrations antigas preservadas

**Decisão:** migrations de funcionalidades pausadas não são apagadas.

**Motivo:** migrations já aplicadas fazem parte do histórico do banco. Removê-las pode quebrar ambientes existentes e dificultar deploys novos a partir de bancos parcialmente migrados.

**Trade-off:** o histórico do banco fica com marcas de decisões antigas, como a tabela `weather_location`.

**Evolução prevista:** criar novas migrations para desativar ou remover estruturas obsoletas quando a decisão for definitiva.

## 8. Segurança em conexões lentas

**Decisão:** os formulários bloqueiam uma segunda execução enquanto o primeiro salvamento está pendente, mantêm rascunhos locais e encaminham operações sem conexão para uma fila persistente.

**Motivo:** no celular, uma conexão instável pode fazer o usuário tocar novamente no botão ou fechar o aplicativo antes de concluir o preenchimento. A trava reduz duplicidades e o rascunho evita redigitação.

**Trade-off:** os rascunhos ainda ficam no `localStorage` e não são sincronizados; a fila de operações usa IndexedDB. Nenhum dos dois armazena senhas, ambos são separados pelo usuário autenticado e os rascunhos expiram em sete dias.

**Evolução prevista:** manter os rascunhos apenas como proteção do preenchimento em andamento e ampliar testes de sincronização conforme novos tipos de lançamento forem adicionados.

## 9. Compra como desembolso e uso como custo da safra

**Decisão:** a compra de um produto continua sendo um gasto da propriedade. Quando parte desse produto é usada em um plantio, o sistema transfere o custo médio proporcional para a safra sem registrar um novo pagamento.

**Motivo:** o dinheiro sai na data da compra, mas o custo produtivo pertence à cultura que consumiu o insumo. Separar essas duas visões evita tanto perder o custo do plantio quanto contar a mesma compra duas vezes.

**Trade-off:** o custo médio ponderado é mais simples e previsível para o uso familiar, mas não identifica exatamente qual lote físico foi consumido. Saldos antigos sem compra valorizada permanecem com custo desconhecido até existir informação suficiente no Diário.

**Evolução prevista:** adicionar lotes de compra e critérios FIFO ou custo específico somente se a rastreabilidade por lote se tornar necessária.
