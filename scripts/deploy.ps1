# =============================================================================
# eligibil.org — Multi-platform deploy script
#
# Usage:
#   .\scripts\deploy.ps1 gcp        # Google Cloud Run
#   .\scripts\deploy.ps1 railway    # Railway
#   .\scripts\deploy.ps1 render     # Render (manual after first time)
#   .\scripts\deploy.ps1 fly        # Fly.io
#   .\scripts\deploy.ps1 all        # Deploy to all configured platforms
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('gcp', 'railway', 'render', 'fly', 'all')]
    [string]$Platform
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

function Deploy-GCP {
    Write-Host "==========================================="
    Write-Host " Google Cloud Run"
    Write-Host "==========================================="
    if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
        Write-Error "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
        return
    }
    & "$PSScriptRoot\deploy-cloudrun.ps1"
}

function Deploy-Railway {
    Write-Host "==========================================="
    Write-Host " Railway"
    Write-Host "==========================================="
    if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Railway CLI..."
        npm install -g @railway/cli
    }
    Write-Host "Login (browser opens)..."
    railway login
    Write-Host "Linking to project..."
    railway link
    Write-Host "Pushing env vars from .env (skip empty values)..."
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            $key = $parts[0].Trim()
            $val = $parts[1].Trim() -replace '^["'']|["'']$', ''
            if ($val) { railway variables set "$key=$val" 2>$null }
        }
    }
    Write-Host "Deploying..."
    railway up --detach
    Write-Host "Done. Open: https://railway.app/dashboard"
}

function Deploy-Render {
    Write-Host "==========================================="
    Write-Host " Render"
    Write-Host "==========================================="
    Write-Host "Render uses Blueprint (render.yaml) auto-deploy via GitHub."
    Write-Host ""
    Write-Host "First time setup (5 min):"
    Write-Host "  1. https://dashboard.render.com/blueprints"
    Write-Host "  2. Click 'New Blueprint'"
    Write-Host "  3. Connect duediligenceonemd/eligibil"
    Write-Host "  4. Render reads render.yaml automatically"
    Write-Host "  5. Fill env vars marked 'sync: false'"
    Write-Host ""
    Write-Host "After setup: every git push to master auto-deploys."
    Write-Host "Trigger manual deploy:"
    Write-Host "  git commit --allow-empty -m 'trigger render' && git push"
}

function Deploy-Fly {
    Write-Host "==========================================="
    Write-Host " Fly.io"
    Write-Host "==========================================="
    if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
        Write-Host "Installing flyctl..."
        Invoke-WebRequest -Uri "https://fly.io/install.ps1" -UseBasicParsing | Invoke-Expression
        $env:Path += ";$HOME\.fly\bin"
    }
    Write-Host "Login..."
    flyctl auth login
    Write-Host "First-time launch (or skip if already exists)..."
    flyctl launch --copy-config --no-deploy --yes 2>$null
    Write-Host "Setting secrets from .env..."
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            $key = $parts[0].Trim()
            $val = $parts[1].Trim() -replace '^["'']|["'']$', ''
            # Don't set NODE_ENV/PORT — already in fly.toml
            if ($val -and $key -notin @('NODE_ENV', 'PORT')) {
                flyctl secrets set "$key=$val" --stage 2>$null
            }
        }
    }
    Write-Host "Deploying..."
    flyctl deploy
}

switch ($Platform) {
    'gcp'     { Deploy-GCP }
    'railway' { Deploy-Railway }
    'render'  { Deploy-Render }
    'fly'     { Deploy-Fly }
    'all'     {
        Deploy-GCP
        Deploy-Railway
        Deploy-Render
        Deploy-Fly
    }
}

Write-Host ""
Write-Host "✓ Deploy script complete"
