# Estrutura recomendada de pacotes

```text
br.com.agrogestor
├── AgroGestorApplication.java
├── config
│   └── OpenApiConfig.java
├── planting
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
├── production
│   ├── controller
│   ├── dto
│   └── service
├── seeding
│   ├── controller
│   ├── dto
│   └── service
├── expense
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
├── weather
│   ├── client
│   ├── controller
│   ├── dto
│   └── service
└── shared
    ├── dto
    └── exception
```

Cada novo módulo seguirá o mesmo desenho de `planting`. Por exemplo, gastos ficarão em
`expense`, estoque em `inventory` e máquinas em `machine`.

O módulo `production` não possui Entity nem Repository porque a estimativa é um cálculo
instantâneo e não precisa ser armazenada nesta fase.

O módulo `quotation` consulta a fonte externa, transforma os dados em um contrato próprio
e mantém uma cópia temporária para reduzir acessos e continuar exibindo a última cotação
caso a fonte fique momentaneamente indisponível.

- **Controller:** traduz HTTP para chamadas do sistema; não contém regra de negócio.
- **Service:** concentra regras, transações, normalização e coordena repositórios.
- **Repository:** somente acesso aos dados.
- **Entity:** representa a tabela e protege o estado do domínio.
- **DTO:** define o contrato público da API, sem expor a Entity.
- **shared:** código realmente compartilhado, como erros e paginação.

Organizar por módulo deixa tudo que muda junto no mesmo lugar e evita pacotes globais
enormes quando a aplicação crescer.
