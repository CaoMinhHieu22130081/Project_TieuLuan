$ErrorActionPreference = 'Stop'
$port = 8000

$processIds = @()
try {
    $processIds = Get-NetTCPConnection -LocalPort $port -State Listen | Select-Object -ExpandProperty OwningProcess -Unique
} catch {
    $processIds = @()
}

foreach ($processId in $processIds) {
    Write-Host "Stopping process on port $port (PID $processId)"
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Set-Location $PSScriptRoot
$env:AI_MODULE_PORT = "$port"
& "$PSScriptRoot\.venv\Scripts\python.exe" "$PSScriptRoot\run_server.py"
