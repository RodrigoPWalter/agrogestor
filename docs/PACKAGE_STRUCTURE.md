# Estrutura de pacotes

O backend do AgroGestor é organizado por módulos de domínio. A intenção é manter perto os arquivos que mudam juntos: controller, DTOs, entidades, repositories e services de cada parte do sistema.

```text
br.com.agrogestor
├── AgroGestorApplication.java
├── auth
│   ├── config
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── exception
│   ├── repository
│   ├── security
│   └── service
├── config
├── diary
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
├── expense
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
├── inventory
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
├── machine
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
├── planting
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
├── quotation
│   ├── client
│   ├── controller
│   ├── dto
│   └── service
├── rainfall
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
└── shared
    ├── dto
    └── exception
```

## Papel de cada camada

- **Controller:** recebe a requisição HTTP, valida contratos básicos e delega para o service.
- **DTO:** define o contrato público da API. Entidades não são expostas diretamente.
- **Entity:** representa o estado persistido e concentra invariantes simples do domínio.
- **Repository:** isola consultas e operações de persistência.
- **Service:** concentra regras de negócio, transações e integração entre módulos.
- **shared:** guarda apenas recursos realmente comuns, como paginação e tratamento de exceções.

## Convenções do projeto

- Novas funcionalidades devem nascer dentro do módulo de domínio correspondente.
- Operações que atualizam mais de uma tabela devem ficar em services transacionais.
- Integrações externas devem ficar em `client`, deixando o restante da aplicação protegido de detalhes da fonte.
- Mensagens de erro voltadas ao usuário devem ser claras e específicas.
- Migrations do Flyway não devem ser editadas depois de publicadas; crie uma nova migration para evoluir o banco.

## Observações por módulo

- `auth` cuida de login, usuário inicial, JWT e filtros do Spring Security.
- `diary` funciona como central de acontecimentos da propriedade e pode disparar efeitos em estoque, chuva ou manutenção.
- `inventory` controla o saldo dos produtos e impede baixa maior do que a quantidade disponível.
- `planting` concentra o ciclo da safra, incluindo finalização, reativação e fechamento.
- `quotation` lê cotações agrícolas e mantém fallback para evitar falha completa quando a fonte externa oscila.
