# Script PowerShell pour créer la base de données PostgreSQL
# Utilisation: .\scripts\create-db.ps1

Write-Host "🔧 Création de la base de données PostgreSQL..." -ForegroundColor Cyan

# Demander le mot de passe PostgreSQL
$password = Read-Host "Entrez le mot de passe PostgreSQL (ou appuyez sur Entrée pour utiliser '0000')" -AsSecureString
if ($password.Length -eq 0) {
    $passwordPlain = "0000"
} else {
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    $passwordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host "`n📝 Instructions pour créer la base de données :" -ForegroundColor Yellow
Write-Host "1. Ouvrez un terminal PowerShell" -ForegroundColor White
Write-Host "2. Exécutez : psql -U postgres" -ForegroundColor White
Write-Host "3. Entrez votre mot de passe PostgreSQL" -ForegroundColor White
Write-Host "4. Exécutez : CREATE DATABASE `"GestionNotes`";" -ForegroundColor White
Write-Host "5. Exécutez : \q pour quitter" -ForegroundColor White

Write-Host "`n💡 Alternative : Utilisez pgAdmin pour créer la base de données graphiquement" -ForegroundColor Cyan

Write-Host "`n✅ Une fois la base créée, exécutez :" -ForegroundColor Green
Write-Host "   npm run prisma:migrate" -ForegroundColor White

