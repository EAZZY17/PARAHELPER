# ParaHelper - Start ChromaDB Server (Python 3.12)
# Run this in a separate terminal and keep it open.
# Then run: cd backend && node setupChromaDB.js  (first time only, to seed)

$projectRoot = Split-Path $PSScriptRoot -Parent
$chromaDataPath = Join-Path $projectRoot "chroma_data"

Write-Host "Starting ChromaDB server..." -ForegroundColor Cyan
Write-Host "Data path: $chromaDataPath" -ForegroundColor Gray
Write-Host "Connect at: http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

Set-Location $projectRoot
py -3.12 -c "import sys; sys.argv = ['chroma', 'run', '--path', './chroma_data']; from chromadb.cli.cli import app; app()"
