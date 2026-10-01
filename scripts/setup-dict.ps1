# Sudachi Small 사전 및 sudachi-wasm333 vendoring 스크립트
# 사용: PowerShell에서 프로젝트 루트 기준 실행
#   .\scripts\setup-dict.ps1

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$libDir = Join-Path $root 'lib\sudachi'
$resourceDir = Join-Path $libDir 'resources'
# Chrome 확장 루트는 `_`로 시작하는 폴더명을 허용하지 않음 → `-tmp-dict` 사용
$tmpDir = Join-Path $root '-tmp-dict'
$zipPath = Join-Path $tmpDir 'small.zip'
$dictUrl = 'http://sudachi.s3-website-ap-northeast-1.amazonaws.com/sudachidict/sudachi-dictionary-20250129-small.zip'

New-Item -ItemType Directory -Force -Path $resourceDir | Out-Null
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

Write-Host 'Sudachi Small 사전 다운로드 중…'
Invoke-WebRequest -Uri $dictUrl -OutFile $zipPath

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entry = $zip.Entries | Where-Object { $_.Name -eq 'system_small.dic' }
if (-not $entry) {
  throw 'system_small.dic 항목을 zip에서 찾을 수 없습니다.'
}

$outPath = Join-Path $resourceDir 'system.dic'
$stream = $entry.Open()
$file = [System.IO.File]::Create($outPath)
$stream.CopyTo($file)
$file.Close()
$stream.Close()
$zip.Dispose()

Write-Host "사전 추출 완료: $outPath"

if (-not (Test-Path (Join-Path $libDir 'sudachi.js'))) {
  Write-Host 'sudachi-wasm333 설치 중…'
  Push-Location $root
  npm install sudachi-wasm333@1.0.3 --no-save | Out-Null
  Copy-Item (Join-Path $root 'node_modules\sudachi-wasm333\sudachi.js') (Join-Path $libDir 'sudachi.js')
  Pop-Location
  Write-Host 'sudachi.js 복사 완료'
}

Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue

Write-Host 'setup-dict 완료. chrome://extensions 에서 확장을 새로고침하세요.'
