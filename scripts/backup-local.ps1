[CmdletBinding()]
param(
    [string]$BackupRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'AgroGestor-Backups'),
    [string]$DatabaseHost,
    [int]$DatabasePort = 5432,
    [string]$DatabaseName,
    [string]$DatabaseUser,
    [SecureString]$DatabasePassword,
    [switch]$OnlyDatabase,
    [switch]$SkipDatabase
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$folderName = if ($OnlyDatabase) { "dados_$timestamp" } else { $timestamp }
$backupDirectory = Join-Path $BackupRoot $folderName
$sourceArchive = Join-Path $backupDirectory 'agrogestor-codigo.zip'
$gitBundle = Join-Path $backupDirectory 'agrogestor-historico.bundle'
$databaseDump = Join-Path $backupDirectory 'agrogestor-banco.dump'
$metadataFile = Join-Path $backupDirectory 'informacoes.txt'
$checksumFile = Join-Path $backupDirectory 'checksums.sha256'

function Find-PgDump {
    $command = Get-Command pg_dump -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $knownPaths = @(
        'C:\Program Files\PostgreSQL\18\bin\pg_dump.exe',
        'C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\pg_dump.exe',
        'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe',
        'C:\Program Files\PostgreSQL\17\pgAdmin 4\runtime\pg_dump.exe',
        'C:\Program Files\PostgreSQL\16\bin\pg_dump.exe'
    )

    return $knownPaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Read-RequiredValue {
    param(
        [string]$CurrentValue,
        [string]$Prompt
    )

    if (-not [string]::IsNullOrWhiteSpace($CurrentValue)) {
        return $CurrentValue
    }

    $value = Read-Host $Prompt
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "O valor solicitado em '$Prompt' é obrigatório."
    }

    return $value
}

if ($OnlyDatabase -and $SkipDatabase) {
    throw 'Use somente uma opção: -OnlyDatabase ou -SkipDatabase.'
}

if (-not $OnlyDatabase -and -not (Test-Path -LiteralPath (Join-Path $projectRoot '.git'))) {
    throw 'O script precisa ser executado dentro do repositório Git do AgroGestor.'
}

New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

if (-not $OnlyDatabase) {
    git -C $projectRoot archive --format=zip --output=$sourceArchive HEAD
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível criar o arquivo com o código-fonte.'
    }

    git -C $projectRoot bundle create $gitBundle --all
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível criar o backup do histórico do Git.'
    }
}

$databaseIncluded = $false
if (-not $SkipDatabase) {
    $pgDump = Find-PgDump
    if (-not $pgDump) {
        throw 'pg_dump não foi encontrado. Instale o PostgreSQL ou execute com -SkipDatabase.'
    }

    $DatabaseHost = Read-RequiredValue $DatabaseHost 'Servidor do PostgreSQL'
    $DatabaseName = Read-RequiredValue $DatabaseName 'Nome do banco'
    $DatabaseUser = Read-RequiredValue $DatabaseUser 'Usuário do banco'

    if (-not $DatabasePassword) {
        $DatabasePassword = Read-Host 'Senha do banco' -AsSecureString
    }

    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DatabasePassword)
    try {
        $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
        & $pgDump `
            --host=$DatabaseHost `
            --port=$DatabasePort `
            --username=$DatabaseUser `
            --dbname=$DatabaseName `
            --format=custom `
            --no-owner `
            --no-privileges `
            --file=$databaseDump

        if ($LASTEXITCODE -ne 0) {
            throw 'O PostgreSQL não conseguiu gerar o backup do banco.'
        }

        $databaseIncluded = $true
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}

$databaseStatus = if ($databaseIncluded) { 'incluído' } else { 'não incluído' }
$backupDescription = if ($OnlyDatabase) {
    @"
Tipo: dados do aplicativo
Banco de dados: $databaseStatus

Conteúdo:
- agrogestor-banco.dump: plantios, gastos, estoque, diário e demais dados
- checksums.sha256: assinaturas para verificar a integridade dos arquivos
"@
}
else {
    $commit = git -C $projectRoot rev-parse HEAD
    $branch = git -C $projectRoot branch --show-current
    $remote = git -C $projectRoot remote get-url origin

    @"
Tipo: completo
Branch: $branch
Commit: $commit
Repositório: $remote
Banco de dados: $databaseStatus

Conteúdo:
- agrogestor-codigo.zip: código-fonte no commit informado
- agrogestor-historico.bundle: repositório Git completo, com branches e commits
- agrogestor-banco.dump: dados e estrutura do PostgreSQL, quando incluído
- checksums.sha256: assinaturas para verificar a integridade dos arquivos
"@
}

@"
Backup do AgroGestor
Criado em: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss zzz')
$backupDescription

Consulte docs/BACKUP.md no código-fonte para as instruções de restauração.
"@ | Set-Content -LiteralPath $metadataFile -Encoding utf8

Get-ChildItem -LiteralPath $backupDirectory -File |
    Where-Object { $_.Name -ne 'checksums.sha256' } |
    Get-FileHash -Algorithm SHA256 |
    ForEach-Object { "$($_.Hash.ToLower())  $([IO.Path]::GetFileName($_.Path))" } |
    Set-Content -LiteralPath $checksumFile -Encoding ascii

Write-Host ''
Write-Host 'Backup concluído com sucesso.'
Write-Host "Pasta: $backupDirectory"
Write-Host "Banco de dados: $databaseStatus"
