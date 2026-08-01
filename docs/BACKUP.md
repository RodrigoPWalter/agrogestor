# Backup e restauração

O backup local do AgroGestor guarda três partes independentes:

- o código-fonte do commit atual;
- todo o histórico do Git, inclusive branches e commits;
- a estrutura e os dados do PostgreSQL.

Os arquivos são criados, por padrão, em `Documentos\AgroGestor-Backups`. Cada execução usa uma pasta com data e horário, portanto um backup anterior não é sobrescrito.

## Criar um backup somente dos dados

Este é o modo recomendado para a rotina do AgroGestor, porque o código já permanece no GitHub. O arquivo gerado contém plantios, gastos, estoque, diário, chuvas, máquinas, manutenções e usuários.

No Windows, abra `scripts\fazer-backup-dados.cmd` com dois cliques e informe a senha do banco quando solicitado. O atalho criado na Área de Trabalho executa esse mesmo arquivo.

No PowerShell, a partir da raiz do projeto:

```powershell
.\scripts\backup-local.ps1 `
  -OnlyDatabase `
  -DatabaseHost "servidor-do-banco" `
  -DatabaseName "nome-do-banco" `
  -DatabaseUser "usuario-do-banco"
```

As pastas desse modo começam com `dados_`, facilitando a identificação.

## Criar um backup completo

No PowerShell, a partir da raiz do projeto:

```powershell
.\scripts\backup-local.ps1 `
  -DatabaseHost "servidor-do-banco" `
  -DatabaseName "nome-do-banco" `
  -DatabaseUser "usuario-do-banco"
```

O script solicita a senha do banco de forma oculta. Ela é usada somente pelo processo do `pg_dump` e não é salva no projeto nem no backup.

A conexão com o Neon exige SSL. Depois de criar o arquivo, o script também usa o `pg_restore` para conferir se o catálogo do backup pode ser lido antes de informar sucesso.

Para copiar apenas o código e o histórico do Git:

```powershell
.\scripts\backup-local.ps1 -SkipDatabase
```

## Verificar a integridade

Entre na pasta do backup e compare as assinaturas:

```powershell
Get-Content .\checksums.sha256
Get-FileHash .\agrogestor-codigo.zip -Algorithm SHA256
Get-FileHash .\agrogestor-historico.bundle -Algorithm SHA256
Get-FileHash .\agrogestor-banco.dump -Algorithm SHA256
```

## Restaurar o código e o histórico

O arquivo `.bundle` funciona como uma cópia portátil do repositório:

```powershell
git clone .\agrogestor-historico.bundle agrogestor-restaurado
cd .\agrogestor-restaurado
git remote set-url origin https://github.com/RodrigoPWalter/agrogestor.git
```

Se o objetivo for apenas consultar os arquivos, basta extrair `agrogestor-codigo.zip`.

## Restaurar o banco PostgreSQL

Crie primeiro um banco vazio. Depois execute:

```powershell
pg_restore `
  --host="servidor-do-banco" `
  --port=5432 `
  --username="usuario-do-banco" `
  --dbname="nome-do-banco" `
  --clean `
  --if-exists `
  --no-owner `
  .\agrogestor-banco.dump
```

`--clean` substitui objetos existentes. Antes de usá-lo em um banco que já contenha dados, confirme que o arquivo de backup está correto e mantenha uma cópia do banco atual.

## Frequência recomendada

Crie um backup completo:

- antes de alterações grandes ou atualizações do banco;
- depois de registrar uma quantidade importante de dados;
- pelo menos uma vez por mês durante o uso normal.

O backup no mesmo computador protege contra exclusões no GitHub ou falhas na hospedagem. Para proteção contra defeito ou perda do computador, copie periodicamente a pasta `AgroGestor-Backups` para um pendrive ou armazenamento em nuvem.
