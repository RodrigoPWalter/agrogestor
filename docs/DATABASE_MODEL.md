# Modelo do banco de dados

Este arquivo resume o banco atual do AgroGestor. As migrations em `src/main/resources/db/migration` continuam sendo a fonte oficial da estrutura.

## Relações principais

```mermaid
erDiagram
    PLANTINGS ||--o{ EXPENSES : recebe
    PLANTINGS ||--o{ PLANTING_STEPS : executado_em
    PLANTINGS ||--o{ HARVEST_STEPS : colhido_em
    PLANTINGS ||--o{ FIELD_DIARY_ENTRIES : pode_referenciar
    PLANTING_STEPS o|--o| FIELD_DIARY_ENTRIES : registra
    HARVEST_STEPS o|--o| FIELD_DIARY_ENTRIES : registra
    PLANTINGS ||--o{ RAINFALL_MEASUREMENTS : pode_referenciar
    FIELD_DIARY_ENTRIES ||--o{ FIELD_DIARY_PRODUCTS : registra
    INVENTORY_PRODUCTS ||--o{ FIELD_DIARY_PRODUCTS : utilizado_em
    INVENTORY_PRODUCTS ||--o{ INVENTORY_MOVEMENTS : movimenta
    MACHINES ||--o{ MAINTENANCES : recebe
```

## Tabelas em uso

### `usuarios`

Armazena nome, e-mail normalizado, hash da senha e perfil de acesso. O e-mail possui unicidade sem diferenciar letras maiúsculas e minúsculas.

### `plantings`

Guarda cultura, safra, talhão, área total prevista, distância entre linhas em centímetros, data de início, variedade da semente, taxa de semeadura e status. A taxa é registrada por hectare com uma unidade explícita: quilogramas por hectare (`KILOGRAMS_PER_HECTARE`) ou sementes por hectare (`SEEDS_PER_HECTARE`). A medida em quilogramas aceita decimais; a medida em sementes exige um número inteiro. A safra aceita um ano (`2026`) ou um intervalo (`2026/2027`).

A distância entre linhas é opcional para preservar os cadastros anteriores e atender culturas com diferentes configurações de semeadura.

A unidade da taxa de semeadura permanece nula somente nos registros criados antes dessa padronização. Ao editar um desses registros, o usuário deve escolher a unidade correta, pois não é seguro deduzi-la apenas pela cultura ou pelo valor antigo.

A coluna física `seed_quantity` foi mantida por compatibilidade com versões anteriores, mas a aplicação a expõe como `seedRate`, pois o valor representa uma taxa por hectare nos novos cadastros.

O campo de status separa plantios ativos de plantios colhidos, permitindo manter histórico sem apagar dados financeiros ou operacionais.

### `planting_steps`

Registra cada etapa executada da semeadura com data, hectares plantados, variedade utilizada, horários e observações. Um mesmo plantio pode, portanto, ter variedades diferentes em etapas distintas. A soma das etapas determina a área efetivamente plantada, a área restante e o percentual de progresso, sem encerrar o ciclo da cultura quando atingir 100%.

A variedade informada no cadastro do plantio funciona como planejamento e sugestão para novas etapas. Os registros anteriores à inclusão desse campo foram preenchidos automaticamente com essa variedade planejada.

Cada nova etapa pode manter o identificador do lançamento criado automaticamente no Diário. Esse vínculo permite editar ou excluir o registro relacionado sem gerar duplicidades.

### `harvest_steps`

Registra a colheita realizada em cada dia com área, quantidade produzida, unidade, variedade, horários e observações. A soma das áreas é limitada à área efetivamente plantada, não à área inicialmente prevista.

As quantidades podem ser informadas em sacas de 60 kg, quilogramas ou toneladas. O fechamento converte essas unidades para sacas de 60 kg antes de calcular a receita estimada, enquanto o detalhe do plantio apresenta a produtividade média em sacas por hectare.

Cada etapa cria um lançamento de colheita no Diário dentro da mesma transação. Edições e exclusões atualizam o lançamento relacionado, evitando duplicidade. A safra somente pode ser enviada ao histórico depois que toda a área plantada estiver colhida.

### `expenses`

Registra gastos financeiros ligados a um plantio. O vínculo usa restrição para evitar exclusão acidental de uma safra com histórico de custos.

### `inventory_products`

Mantém o saldo atual de sementes, fertilizantes, defensivos e outros insumos. Também guarda unidade de medida, estoque mínimo e validade. Quantidade e limite mínimo não podem ser negativos.

### `inventory_movements`

Registra entradas e saídas do estoque. A atualização do saldo e a criação da movimentação acontecem dentro da mesma transação.

### `field_diary_entries`

Centraliza acontecimentos da propriedade. O plantio é opcional para registros gerais, como compra de produto, chuva, manutenção ou observação. Para colheita, o frontend e o service exigem plantio selecionado.

Essa tabela também guarda data, tipo de atividade, condição do tempo, descrição e observações.

### `field_diary_products`

Relaciona uma atividade do diário aos produtos do estoque. É usada principalmente para registros de uso de produto, permitindo baixar automaticamente a quantidade aplicada.

### `rainfall_measurements`

Guarda medições manuais de chuva em milímetros. O registro pode ser geral da propriedade ou vinculado a um plantio.

### `machines`

Armazena marca, modelo, ano e horímetro atual da máquina.

### `maintenances`

Registra manutenção preventiva ou corretiva, peças trocadas, custo e horímetro previsto para a próxima revisão.

### `weather_location`

Tabela mantida por compatibilidade com migrations antigas. O módulo de previsão do tempo está pausado e a aplicação não consulta essa tabela no fluxo atual.

## Convenções

- IDs usam UUID.
- Valores financeiros e quantidades usam `NUMERIC`.
- Datas operacionais usam `DATE`.
- Datas de auditoria usam `TIMESTAMPTZ`.
- Mudanças estruturais entram somente por novas migrations do Flyway.
- Migrations já aplicadas não devem ser reescritas ou removidas.
- Consultas de plantios ativos, gastos por safra e Diário por plantio usam índices compostos compatíveis com a ordenação apresentada no aplicativo.

## Próximas evoluções de banco

- Adicionar `property_id` para suportar múltiplas propriedades.
- Criar tabelas de backup/exportação, caso o sistema evolua para uso local/offline.
- Persistir relatórios de fechamento de safra quando houver necessidade de auditoria histórica.
