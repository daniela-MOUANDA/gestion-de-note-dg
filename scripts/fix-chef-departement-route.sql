-- Script pour corriger la route du dashboard pour CHEF_DEPARTEMENT
-- Ce script vérifie et corrige la routeDashboard dans la table roles

-- Vérifier la route actuelle
SELECT code, nom, "routeDashboard" 
FROM roles 
WHERE code = 'CHEF_DEPARTEMENT';

-- Corriger la route si elle est incorrecte
UPDATE roles 
SET "routeDashboard" = '/chef/departement/dashboard'
WHERE code = 'CHEF_DEPARTEMENT' 
  AND ("routeDashboard" IS NULL OR "routeDashboard" != '/chef/departement/dashboard');

-- Vérifier après correction
SELECT code, nom, "routeDashboard" 
FROM roles 
WHERE code = 'CHEF_DEPARTEMENT';

