-- Migration pour ajouter les champs "Open to work", "Open for partner" et langages
-- Ajouter les colonnes à la table profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS open_for_partner BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Index pour faciliter la recherche des utilisateurs open to work
CREATE INDEX IF NOT EXISTS idx_profiles_open_to_work ON public.profiles(open_to_work) WHERE open_to_work = true;

-- Index pour faciliter la recherche des utilisateurs open for partner
CREATE INDEX IF NOT EXISTS idx_profiles_open_for_partner ON public.profiles(open_for_partner) WHERE open_for_partner = true;

-- Commentaires pour documentation
COMMENT ON COLUMN public.profiles.open_to_work IS 'Indicates if the user is open to work opportunities';
COMMENT ON COLUMN public.profiles.open_for_partner IS 'Indicates if the user is open for business partnerships';
COMMENT ON COLUMN public.profiles.languages IS 'Array of programming languages/technologies the user masters';

