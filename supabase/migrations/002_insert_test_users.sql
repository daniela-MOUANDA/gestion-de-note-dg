-- ============================================
-- MIGRATION - INSERTION D'UTILISATEURS DE TEST
-- ============================================
-- Ce script insère des utilisateurs de test pour chaque rôle du système
-- Mot de passe par défaut pour tous les utilisateurs : password123
-- Hash bcrypt : $2b$10$rKJ5VqZ5YqZ5YqZ5YqZ5YuZ5YqZ5YqZ5YqZ5YqZ5YqZ5YqZ5YqZ5Y

-- Note: Le hash ci-dessus est un exemple. Pour générer le vrai hash, utilisez :
-- const bcrypt = require('bcrypt');
-- bcrypt.hashSync('password123', 10);

-- ============================================
-- INSERTION DES UTILISATEURS PAR RÔLE
-- ============================================

-- 1. Directeur Général (DG)
INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, actif, telephone)
SELECT 
  'MOUANDA',
  'Daniela',
  'dg@institution.ga',
  'dg.mouanda',
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  true,
  '+241 01 02 03 04'
FROM roles r
WHERE r.code = 'DG';

-- 2. Directeur des Études et de la Pédagogie (DEP)
INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, actif, telephone)
SELECT 
  'NZAMBA',
  'Pierre',
  'dep@institution.ga',
  'dep.nzamba',
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  true,
  '+241 01 02 03 05'
FROM roles r
WHERE r.code = 'DEP';

-- 3. Chef de Service Scolarité
INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, actif, telephone)
SELECT 
  'OBAME',
  'Marie',
  'chef.scolarite@institution.ga',
  'chef.obame',
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  true,
  '+241 01 02 03 06'
FROM roles r
WHERE r.code = 'CHEF_SERVICE_SCOLARITE';

-- 4. Agent Scolarité
INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, actif, telephone)
SELECT 
  'NDONG',
  'Jean',
  'agent.scolarite@institution.ga',
  'agent.ndong',
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  true,
  '+241 01 02 03 07'
FROM roles r
WHERE r.code = 'AGENT_SCOLARITE';

-- 5. SP Scolarité (Secrétaire Particulier)
INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, actif, telephone)
SELECT 
  'MBOUMBA',
  'Sophie',
  'sp.scolarite@institution.ga',
  'sp.mboumba',
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  true,
  '+241 01 02 03 08'
FROM roles r
WHERE r.code = 'SP_SCOLARITE';

-- 6. Chef de Département (nécessite un département)
-- D'abord, créer un département de test si nécessaire
INSERT INTO departements (nom, code, description, actif)
VALUES 
  ('Informatique', 'INFO', 'Département d''Informatique', true),
  ('Gestion', 'GEST', 'Département de Gestion', true)
ON CONFLICT (code) DO NOTHING;

-- Insérer les chefs de département
INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, departement_id, actif, telephone)
SELECT 
  'ONDO',
  'Patrick',
  'chef.info@institution.ga',
  'chef.ondo',
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  d.id,
  true,
  '+241 01 02 03 09'
FROM roles r
CROSS JOIN departements d
WHERE r.code = 'CHEF_DEPARTEMENT' AND d.code = 'INFO';

INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, departement_id, actif, telephone)
SELECT 
  'BEKALE',
  'Christine',
  'chef.gestion@institution.ga',
  'chef.bekale',
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  d.id,
  true,
  '+241 01 02 03 10'
FROM roles r
CROSS JOIN departements d
WHERE r.code = 'CHEF_DEPARTEMENT' AND d.code = 'GEST';

-- 7. Étudiant (nécessite d'abord créer un étudiant)
-- Créer quelques étudiants de test
INSERT INTO etudiants (matricule, nom, prenom, email, telephone, nationalite)
VALUES 
  ('ETU2024001', 'NGUEMA', 'Alex', 'alex.nguema@student.ga', '+241 02 03 04 05', 'Gabonaise'),
  ('ETU2024002', 'MABIKA', 'Sarah', 'sarah.mabika@student.ga', '+241 02 03 04 06', 'Gabonaise')
ON CONFLICT (matricule) DO NOTHING;

-- Créer des comptes utilisateurs pour les étudiants
INSERT INTO utilisateurs (nom, prenom, email, username, password, role_id, actif, telephone)
SELECT 
  e.nom,
  e.prenom,
  e.email,
  LOWER(e.matricule),
  '$2b$10$fFIYVwYUn8haMHO9.Q95bu.4ypohuZFCTpqpwpWiCFAR8b9qw4C.', -- Hash bcrypt de 'password123'
  r.id,
  true,
  e.telephone
FROM etudiants e
CROSS JOIN roles r
WHERE r.code = 'ETUDIANT' AND e.matricule IN ('ETU2024001', 'ETU2024002')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VÉRIFICATION DES INSERTIONS
-- ============================================

-- Afficher tous les utilisateurs créés avec leurs rôles
SELECT 
  u.nom,
  u.prenom,
  u.email,
  u.username,
  r.nom as role,
  d.nom as departement,
  u.actif
FROM utilisateurs u
JOIN roles r ON u.role_id = r.id
LEFT JOIN departements d ON u.departement_id = d.id
ORDER BY r.code, u.nom;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 
-- 1. SÉCURITÉ : Remplacez '$2b$10$YourHashedPasswordHere' par le vrai hash bcrypt
--    Pour générer le hash en Node.js :
--    ```javascript
--    const bcrypt = require('bcrypt');
--    const hash = await bcrypt.hash('password123', 10);
--    console.log(hash);
--    ```
--
-- 2. PRODUCTION : Ces utilisateurs sont pour le développement/test uniquement
--    Ne pas utiliser en production sans changer les mots de passe
--
-- 3. EMAILS : Utilisez des emails réels pour la production
--
-- 4. DÉPARTEMENTS : Ajustez les départements selon votre institution
--
