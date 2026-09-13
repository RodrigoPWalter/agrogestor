[CmdletBinding()]
param(
    [string]$PostgresBin = 'C:\Program Files\PostgreSQL\17\bin'
)

$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
foreach ($executable in @('initdb.exe', 'pg_ctl.exe', 'createdb.exe')) {
    if (-not (Test-Path -LiteralPath (Join-Path $PostgresBin $executable))) {
        throw "PostgreSQL não encontrado em $PostgresBin. Informe -PostgresBin."
    }
}

# Cada execução ganha um cluster próprio; os serviços e bancos existentes não são usados.
$runDirectory = Join-Path $project ('work\postgres-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $runDirectory | Out-Null
$dataDirectory = Join-Path $runDirectory 'data'
$postgresLog = Join-Path $runDirectory 'postgres.log'
$testLog = Join-Path $runDirectory 'tests.log'
$passwordFile = Join-Path $runDirectory 'init-password.tmp'
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = $listener.LocalEndpoint.Port
$listener.Stop()
$password = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$environment = @{
    DB_URL = "jdbc:postgresql://127.0.0.1:$port/agrogestor_test"
    DB_USERNAME = 'agrogestor'
    DB_PASSWORD = $password
    PGPASSWORD = $password
    PGSSLMODE = 'disable'
    APP_ADMIN_ENABLED = 'true'
    APP_ADMIN_NAME = 'Teste local'
    APP_ADMIN_EMAIL = 'integracao@agrogestor.test'
    APP_ADMIN_PASSWORD = [guid]::NewGuid().ToString('N')
    RUN_DATABASE_TESTS = 'true'
}
$previousEnvironment = @{}
try {
    foreach ($key in $environment.Keys) {
        $previousEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
        [Environment]::SetEnvironmentVariable($key, $environment[$key], 'Process')
    }
    [IO.File]::WriteAllText($passwordFile, $password)
    & (Join-Path $PostgresBin 'initdb.exe') -D $dataDirectory `
        -U agrogestor --auth=scram-sha-256 --pwfile=$passwordFile --encoding=UTF8 --locale=C
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível criar o cluster de teste.' }
    Remove-Item -LiteralPath $passwordFile

    $arguments = @('start', '-D', ('"' + $dataDirectory + '"'), '-l', ('"' + $postgresLog + '"'),
        '-o', ('"-h 127.0.0.1 -p ' + $port + '"'), '-w', '-t', '30')
    $process = Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') `
        -ArgumentList $arguments -WindowStyle Hidden -PassThru
    # Start-Process -Wait aguardaria também o servidor, que precisa continuar ativo.
    if (-not $process.WaitForExit(40000)) { throw 'Tempo excedido ao iniciar o banco de teste.' }
    $process.Refresh()
    if ($process.ExitCode -ne 0) { throw "Não foi possível iniciar o banco. Consulte $postgresLog" }
    & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p $port -U agrogestor -w agrogestor_test
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível criar o banco de teste.' }

    Push-Location $project
    try {
        & .\mvnw.cmd test *> $testLog
        $testExitCode = $LASTEXITCODE
        Get-Content -LiteralPath $testLog -Tail 35
        if ($testExitCode -ne 0) { throw "Testes falharam. Consulte $testLog" }
    } finally {
        Pop-Location
    }
    Write-Output "Validação concluída. Relatório: $testLog"
} finally {
    if (Test-Path -LiteralPath $passwordFile) {
        Remove-Item -LiteralPath $passwordFile
    }
    if (Test-Path -LiteralPath (Join-Path $dataDirectory 'postmaster.pid')) {
        & (Join-Path $PostgresBin 'pg_ctl.exe') stop -D $dataDirectory -m fast -w -t 30
        if ($LASTEXITCODE -ne 0) { Write-Warning "Verifique o encerramento do cluster $dataDirectory" }
    }
    foreach ($key in $previousEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($key, $previousEnvironment[$key], 'Process')
    }
}
