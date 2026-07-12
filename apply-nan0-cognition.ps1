param(
  [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path $RepoRoot).Path
$bundle = Split-Path -Parent $MyInvocation.MyCommand.Path
$filesRoot = Join-Path $bundle "files"
$backupRoot = Join-Path $repo ("nan0-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))

function Copy-WithBackup([string]$RelativePath) {
  $source = Join-Path $filesRoot $RelativePath
  $target = Join-Path $repo $RelativePath
  $backup = Join-Path $backupRoot $RelativePath

  if (!(Test-Path $source)) {
    throw "Bundle source missing: $source"
  }

  if (Test-Path $target) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
    Copy-Item $target $backup -Force
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item $source $target -Force
}

Write-Host "Applying Nan0 cognition integration locally..."
Write-Host "Repository: $repo"
Write-Host "Backups:    $backupRoot"

Copy-WithBackup "packages\nan0-runtime\src\kernel\Nan0Kernel.ts"
Copy-WithBackup "packages\stage-ui\src\stores\nan0.ts"

$composerPath = Join-Path $repo "packages\stage-ui\src\composables\use-chat-composer.ts"
if (!(Test-Path $composerPath)) {
  throw "Could not find $composerPath"
}

$composerBackup = Join-Path $backupRoot "packages\stage-ui\src\composables\use-chat-composer.ts"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $composerBackup) | Out-Null
Copy-Item $composerPath $composerBackup -Force

$composer = Get-Content $composerPath -Raw

if ($composer -notmatch "useNan0RuntimeStore") {
  $composer = $composer.Replace(
    "import { useChatSessionStore } from '../stores/chat/session-store'",
    "import { useChatSessionStore } from '../stores/chat/session-store'`r`nimport { useNan0RuntimeStore } from '../stores/nan0'"
  )

  $composer = $composer.Replace(
    "  const chatOrchestrator = useChatOrchestratorStore()",
    "  const chatOrchestrator = useChatOrchestratorStore()`r`n  const nan0Runtime = useNan0RuntimeStore()`r`n  void nan0Runtime.ensureInstalled()"
  )

  Set-Content -Path $composerPath -Value $composer -Encoding utf8
}
else {
  Write-Host "use-chat-composer.ts already contains Nan0 integration; skipping insertion."
}

$stageUiPackagePath = Join-Path $repo "packages\stage-ui\package.json"
if (!(Test-Path $stageUiPackagePath)) {
  throw "Could not find $stageUiPackagePath"
}

$stageUiPackageBackup = Join-Path $backupRoot "packages\stage-ui\package.json"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $stageUiPackageBackup) | Out-Null
Copy-Item $stageUiPackagePath $stageUiPackageBackup -Force

$package = Get-Content $stageUiPackagePath -Raw | ConvertFrom-Json
if (-not $package.dependencies) {
  $package | Add-Member -NotePropertyName dependencies -NotePropertyValue ([ordered]@{})
}
if (-not $package.dependencies.PSObject.Properties.Name.Contains("@proj-airi/nan0-runtime")) {
  $package.dependencies | Add-Member -NotePropertyName "@proj-airi/nan0-runtime" -NotePropertyValue "workspace:*"
  $package | ConvertTo-Json -Depth 100 | Set-Content $stageUiPackagePath -Encoding utf8
}
else {
  Write-Host "stage-ui already depends on nan0-runtime."
}

Write-Host ""
Write-Host "Patch applied locally. Nothing was committed or pushed."
Write-Host ""
Write-Host "Run:"
Write-Host "  pnpm install"
Write-Host "  pnpm --filter @proj-airi/nan0-runtime typecheck"
Write-Host "  pnpm --filter @proj-airi/stage-ui typecheck"
Write-Host "  pnpm dev:tamagotchi"
Write-Host ""
Write-Host "Expected console line:"
Write-Host "  [Nan0] Kernel installed into AIRI chat lifecycle."
