-- Coordinateurs pédagogiques : comptes distincts du chef, même département, traçabilité (cree_par_utilisateur_id)

ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS cree_par_utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_utilisateurs_cree_par ON utilisateurs(cree_par_utilisateur_id);

INSERT INTO roles (code, nom, description, route_dashboard)
VALUES (
  'COORD_PEDAGOGIQUE',
  'Coordinateur pédagogique',
  'Assistant du chef de département : mêmes accès opérationnels avec un compte personnel (audit, sessions distinctes).',
  '/chef/departement/dashboard'
)
ON CONFLICT (code) DO NOTHING;
