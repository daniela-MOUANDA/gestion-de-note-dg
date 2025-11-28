# Script PowerShell pour ajouter les champs photo, telephone et adresse à la table utilisateurs
# Usage: .\scripts\add-user-fields.ps1

Write-Host "🔧 Ajout des champs manquants à la table utilisateurs" -ForegroundColor Cyan
Write-Host ""

# Demander les informations de connexion
$dbUser = Read-Host "Nom d'utilisateur PostgreSQL (défaut: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "Mot de passe PostgreSQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbName = Read-Host "Nom de la base de données (défaut: GestionNotes)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "GestionNotes"
}

$dbHost = Read-Host "Hôte PostgreSQL (défaut: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "localhost"
}

$dbPort = Read-Host "Port PostgreSQL (défaut: 5433)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "5433"
}

# Script SQL
$sqlScript = @"
-- Ajouter le champ photo si il n'existe pas
DO `$`$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'photo'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN photo VARCHAR(255);
        RAISE NOTICE 'Champ photo ajouté avec succès';
    ELSE
        RAISE NOTICE 'Le champ photo existe déjà';
    END IF;
END `$`$;

-- Ajouter le champ telephone si il n'existe pas
DO `$`$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'telephone'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN telephone VARCHAR(50);
        RAISE NOTICE 'Champ telephone ajouté avec succès';
    ELSE
        RAISE NOTICE 'Le champ telephone existe déjà';
    END IF;
END `$`$;

-- Ajouter le champ adresse si il n'existe pas
DO `$`$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'adresse'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN adresse VARCHAR(255);
        RAISE NOTICE 'Champ adresse ajouté avec succès';
    ELSE
        RAISE NOTICE 'Le champ adresse existe déjà';
    END IF;
END `$`$;

-- Vérifier les champs ajoutés
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
AND column_name IN ('photo', 'telephone', 'adresse')
ORDER BY column_name;
"@

# Sauvegarder le script SQL dans un fichier temporaire
$tempFile = [System.IO.Path]::GetTempFileName()
$sqlScript | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host ""
Write-Host "📝 Exécution du script SQL..." -ForegroundColor Yellow

# Exécuter le script via psql
$env:PGPASSWORD = $dbPasswordPlain
try {
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Les champs ont été ajoutés avec succès !" -ForegroundColor Green
        Write-Host ""
        Write-Host "Résultat:" -ForegroundColor Cyan
        $result | Write-Host
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'exécution du script" -ForegroundColor Red
        $result | Write-Host
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erreur: psql n'est pas trouvé dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solution alternative:" -ForegroundColor Yellow
    Write-Host "1. Ouvrez pgAdmin ou un autre client PostgreSQL" -ForegroundColor White
    Write-Host "2. Connectez-vous à la base de données '$dbName'" -ForegroundColor White
    Write-Host "3. Exécutez le script SQL depuis: scripts/add_user_fields.sql" -ForegroundColor White
} finally {
    # Nettoyer
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""

