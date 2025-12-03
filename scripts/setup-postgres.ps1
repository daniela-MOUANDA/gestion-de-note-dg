# Script PowerShell pour configurer PostgreSQL et Prisma
# Usage: .\scripts\setup-postgres.ps1

Write-Host "🚀 Configuration de PostgreSQL et Prisma" -ForegroundColor Cyan
Write-Host ""

# Vérifier si .env existe
if (Test-Path ".env") {
    Write-Host "⚠️  Le fichier .env existe déjà." -ForegroundColor Yellow
    $overwrite = Read-Host "Voulez-vous le remplacer? (o/N)"
    if ($overwrite -ne "o" -and $overwrite -ne "O") {
        Write-Host "❌ Opération annulée." -ForegroundColor Red
        exit
    }
}

# Demander les informations de connexion
Write-Host "📝 Configuration de la base de données PostgreSQL" -ForegroundColor Cyan
Write-Host ""

$dbUser = Read-Host "Nom d'utilisateur PostgreSQL (défaut: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "Mot de passe PostgreSQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbName = Read-Host "Nom de la base de données (défaut: gestion_notes)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "gestion_notes"
}

$dbHost = Read-Host "Hôte PostgreSQL (défaut: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "localhost"
}

$dbPort = Read-Host "Port PostgreSQL (défaut: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "5432"
}

# Générer un JWT_SECRET aléatoire
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Créer le fichier .env
$envContent = @"
# Database
DATABASE_URL="postgresql://$dbUser`:$dbPasswordPlain@$dbHost`:$dbPort/$dbName?schema=public"

# JWT Secret
JWT_SECRET="$jwtSecret"
JWT_EXPIRES_IN="24h"

# API URL (pour le frontend)
VITE_API_URL="http://localhost:3000/api"
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Fichier .env créé" -ForegroundColor Green

# Vérifier si PostgreSQL est accessible
Write-Host ""
Write-Host "🔍 Vérification de la connexion PostgreSQL..." -ForegroundColor Cyan

try {
    $env:PGPASSWORD = $dbPasswordPlain
    $result = & psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connexion PostgreSQL réussie" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Impossible de se connecter à PostgreSQL" -ForegroundColor Yellow
        Write-Host "   Vérifiez que PostgreSQL est démarré et que les identifiants sont corrects" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  psql n'est pas dans le PATH" -ForegroundColor Yellow
    Write-Host "   Vous devrez créer la base de données manuellement" -ForegroundColor Yellow
}

# Instructions pour créer la base de données
Write-Host ""
Write-Host "📋 Instructions suivantes:" -ForegroundColor Cyan
Write-Host "1. Créez la base de données si elle n'existe pas:" -ForegroundColor White
Write-Host "   psql -U $dbUser -h $dbHost" -ForegroundColor Gray
Write-Host "   CREATE DATABASE $dbName;" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Installez les dépendances:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Générez le client Prisma:" -ForegroundColor White
Write-Host "   npm run prisma:generate" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Exécutez les migrations:" -ForegroundColor White
Write-Host "   npm run prisma:migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "5. (Optionnel) Seed la base de données:" -ForegroundColor White
Write-Host "   npm run prisma:seed" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Configuration terminée!" -ForegroundColor Green

