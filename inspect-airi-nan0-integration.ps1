param(
  [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path $RepoRoot).Path
$out = Join-Path $repo "nan0-integration-map.txt"

function Write-Section([string]$Title) {
  Add-Content -Path $out -Value ""
  Add-Content -Path $out -Value ("=" * 80)
  Add-Content -Path $out -Value $Title
  Add-Content -Path $out -Value ("=" * 80)
}

Set-Content -Path $out -Value "Nan0 AIRI local integration map"
Add-Content -Path $out -Value ("Generated: " + (Get-Date -Format o))
Add-Content -Path $out -Value ("Repo: " + $repo)

Push-Location $repo
try {
  Write-Section "Git status"
  git status -sb 2>&1 | Add-Content $out

  Write-Section "Workspace packages matching AIRI runtime/chat/provider"
  Get-ChildItem -Path @("packages","apps") -Directory -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -match "chat|agent|provider|character|runtime|stage|speech"
    } |
    Select-Object -ExpandProperty FullName |
    Sort-Object |
    Add-Content $out

  $patterns = @(
    "getProviderInstance",
    "useProvidersStore",
    "generateText",
    "streamText",
    "generateSpeech",
    "speech intent",
    "chat orchestrator",
    "sendMessage",
    "dispatchMessage",
    "onMessage",
    "useChat",
    "messages.push",
    "assistantMessage",
    "userMessage"
  )

  foreach ($pattern in $patterns) {
    Write-Section ("Matches: " + $pattern)

    if (Get-Command rg -ErrorAction SilentlyContinue) {
      rg -n --hidden --glob "!node_modules/**" --glob "!dist/**" --glob "!coverage/**" `
        --glob "!**/.git/**" --fixed-strings $pattern apps packages 2>&1 |
        Select-Object -First 200 |
        Add-Content $out
    }
    else {
      Get-ChildItem -Path @("apps","packages") -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in ".ts",".tsx",".vue",".js",".mjs" } |
        Select-String -SimpleMatch $pattern -ErrorAction SilentlyContinue |
        Select-Object -First 200 |
        ForEach-Object {
          "$($_.Path):$($_.LineNumber):$($_.Line.Trim())"
        } |
        Add-Content $out
    }
  }

  Write-Section "Likely stage-tamagotchi entry files"
  Get-ChildItem -Path "apps/stage-tamagotchi" -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -match "main|index|chat|store|provider|orchestr|speech"
    } |
    Select-Object -ExpandProperty FullName |
    Sort-Object |
    Add-Content $out

  Write-Section "Nan0 runtime files"
  Get-ChildItem -Path "packages/nan0-runtime" -Recurse -File -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName |
    Sort-Object |
    Add-Content $out
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "Created: $out"
Write-Host "This script made no source changes."
