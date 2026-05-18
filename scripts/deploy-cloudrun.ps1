# =============================================================================
# eligibil.org — Cloud Run Deploy Script (Windows PowerShell)
#
# Usage:
#   .\scripts\deploy-cloudrun.ps1
#
# What it does:
#   1. Reads .env and converts to Cloud Run env vars (excludes secrets)
#   2. Builds Docker image via Cloud Build (no local Docker needed)
#   3. Deploys to Cloud Run in europe-west1
#   4. Returns the public URL
# =============================================================================

param(
    [string]$Service = "eligibil",
    [string]$Region  = "europe-west1",
    [string]$Project = ""
)

$ErrorActionPreference = "Stop"

# Use active project if not specified
if (-not $Project) {
    $Project = (gcloud config get-value project 2>$null).Trim()
}

Write-Host "==========================================="
Write-Host " eligibil.org - Cloud Run Deploy"
Write-Host "==========================================="
Write-Host "Project: $Project"
Write-Host "Region:  $Region"
Write-Host "Service: $Service"
Write-Host ""

# -----------------------------------------------------------------------------
# Read .env and build a temporary YAML env-vars file
# Avoid PowerShell escaping issues with --set-env-vars delimiters.
# -----------------------------------------------------------------------------
if (-not (Test-Path ".env")) {
    Write-Error ".env file not found. Copy .env.example to .env first."
    exit 1
}

$envVars = @{}
Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line -split "=", 2
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        # Strip surrounding quotes
        $val = $val -replace '^["'']|["'']$', ''
        # Skip empty values
        if ($val) {
            if ($key -notin @('PORT', 'K_SERVICE', 'K_REVISION', 'K_CONFIGURATION')) {
                $envVars[$key] = $val
            }
        }
    }
}

if ($envVars.ContainsKey('SUPABASE_SERVICE_KEY')) {
    $key = [string]$envVars['SUPABASE_SERVICE_KEY']
    if ($key.StartsWith('sb_publishable_') -or $key.StartsWith('sb_anon_')) {
        Write-Error "SUPABASE_SERVICE_KEY din .env este o cheie publishable/anon, nu service role. Oprește deploy-ul și înlocuiește cheia."
        exit 1
    }
}

$tempEnvFile = Join-Path $env:TEMP "eligibil-cloudrun-env.yaml"
$yamlLines = @()
foreach ($key in $envVars.Keys) {
    $escaped = $envVars[$key].Replace("'", "''")
    $yamlLines += "${key}: '${escaped}'"
}
Set-Content -Path $tempEnvFile -Value ($yamlLines -join [Environment]::NewLine) -Encoding UTF8

Write-Host "Loaded $($envVars.Count) environment variables from .env"
Write-Host ""

# -----------------------------------------------------------------------------
# Deploy
# -----------------------------------------------------------------------------
Write-Host "Building & deploying (this takes 2-5 minutes)..."
Write-Host ""

gcloud run deploy $Service `
    --source . `
    --project $Project `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --concurrency 80 `
    --timeout 300 `
    --env-vars-file $tempEnvFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deploy failed"
    exit $LASTEXITCODE
}

# -----------------------------------------------------------------------------
# Show URL
# -----------------------------------------------------------------------------
$url = (gcloud run services describe $Service --region $Region --format="value(status.url)").Trim()
Write-Host ""
Write-Host "==========================================="
Write-Host " DEPLOYED"
Write-Host "==========================================="
Write-Host "URL: $url"
Write-Host ""
Write-Host "Next:"
Write-Host "  - Test: $url/api/grants"
Write-Host "  - Map custom domain (eligibil.org) when DNS is ready:"
Write-Host "      gcloud run domain-mappings create --service=$Service --domain=eligibil.org --region=$Region"

Remove-Item -LiteralPath $tempEnvFile -ErrorAction SilentlyContinue
