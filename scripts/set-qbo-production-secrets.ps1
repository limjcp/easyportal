# Set QuickBooks Production secrets on the linked Supabase project.
# Run from repo root after copying Production keys from developer.intuit.com.
#
# PowerShell:
#   $env:INTUIT_CLIENT_ID = "your-production-client-id"
#   $env:INTUIT_CLIENT_SECRET = "your-production-client-secret"
#   .\scripts\set-qbo-production-secrets.ps1
#
# Also add this Redirect URI under Production keys in Intuit Developer Portal:
#   https://ihwuwgnezzhxgvauftzu.supabase.co/functions/v1/qbo-oauth-callback

$ErrorActionPreference = "Stop"

if (-not $env:INTUIT_CLIENT_ID) {
  throw "Set INTUIT_CLIENT_ID to your Production tab Client ID from developer.intuit.com"
}
if (-not $env:INTUIT_CLIENT_SECRET) {
  throw "Set INTUIT_CLIENT_SECRET to your Production tab Client Secret from developer.intuit.com"
}

$redirectUrl = "https://ihwuwgnezzhxgvauftzu.supabase.co/functions/v1/qbo-oauth-callback"

Write-Host "Setting QuickBooks production secrets..."
supabase secrets set "INTUIT_CLIENT_ID=$env:INTUIT_CLIENT_ID"
supabase secrets set "INTUIT_CLIENT_SECRET=$env:INTUIT_CLIENT_SECRET"
supabase secrets set "INTUIT_REDIRECT_URL=$redirectUrl"
supabase secrets set "INTUIT_ENV=production"

Write-Host "Deploying QBO edge functions..."
supabase functions deploy qbo-oauth-start qbo-oauth-callback qbo-sync --use-api --dns-resolver https

Write-Host ""
Write-Host "Done. Before your client connects:"
Write-Host "  1. In Intuit Developer Portal, confirm Production redirect URI matches:"
Write-Host "     $redirectUrl"
Write-Host "  2. If external users cannot authorize, complete Intuit production app review."
Write-Host "  3. Client: Disconnect (if needed) -> Connect -> Sync balances & invoices"
