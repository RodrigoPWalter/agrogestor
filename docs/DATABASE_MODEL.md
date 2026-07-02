# Banco de dados

Este arquivo é um mapa rápido do banco atual. As migrations continuam sendo a fonte
oficial da estrutura.

## Relações

```mermaid
erDiagram
    PLANTINGS ||--o{ EXPENSES : recebe
    PLANTINGS ||--o{ FIELD_DIARY_ENTRIES : registra
    INVENTORY_PRODUCTS ||--o{ INVENTORY_MOVEMENTS : movimenta
    MACHINES ||--o{ MAINTENANCES : recebe
```

## Tabelas em uso

### `plantings`

Guarda cultura, safra, área, data de plantio, variedade e quantidade de sementes. A
safra aceita um ano (`2026`) ou um intervalo (`2026/2027`).

### `expenses`

Cada gasto pertence a um plantio. O vínculo usa `ON DELETE RESTRICT` para evitar que
uma safra com histórico financeiro seja removida por acidente.

### `inventory_products`

Mantém o saldo atual de sementes, fertilizantes e defensivos. Também guarda unidade,
estoque mínimo e validade. Quantidade e limite mínimo nunca podem ser negativos.

### `inventory_movements`

Registra entradas e saídas. A atualização do saldo e a gravação da movimentação
acontecem na mesma transação.

### `machines`

Guarda marca, modelo, ano e horímetro atual.

### `maintenances`

Registra manutenção preventiva ou corretiva, peças, custo e o horímetro da próxima
revisão. A comparação desse valor com o horímetro da máquina alimenta o alerta da
interface.

### `field_diary_entries`

Cada registro pertence a um plantio e guarda data, tipo de atividade, condição do tempo,
produtos aplicados e observações. O vínculo usa `ON DELETE RESTRICT` para preservar o
histórico da safra.

## Convenções

- IDs usam UUID.
- Dinheiro e quantidades usam `NUMERIC`.
- Datas da operação usam `DATE`.
- Auditoria usa `TIMESTAMPTZ` em UTC.
- Alterações de estrutura entram somente por migration do Flyway.

## Ainda não modelado

Quando autenticação e múltiplas propriedades entrarem no projeto, as tabelas de negócio
receberão um `property_id`. A baixa automática de produtos usados no diário deve ser
implementada quando o cadastro de aplicações estiver mais detalhado.
