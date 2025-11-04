-- Migration pour créer la table daily_contributions
-- Cette table stocke les contributions quotidiennes de chaque utilisateur
-- et permet des requêtes optimisées pour les statistiques

-- Créer la table daily_contributions
CREATE TABLE IF NOT EXISTS public.daily_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_daily_contributions_date ON public.daily_contributions(date);
CREATE INDEX IF NOT EXISTS idx_daily_contributions_user_id ON public.daily_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_contributions_user_date ON public.daily_contributions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_contributions_date_count ON public.daily_contributions(date DESC, count DESC);

-- Enable Row Level Security
ALTER TABLE public.daily_contributions ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre à tout le monde de lire les contributions (statistiques publiques)
DROP POLICY IF EXISTS "Daily contributions are viewable by everyone" ON public.daily_contributions;
CREATE POLICY "Daily contributions are viewable by everyone" 
  ON public.daily_contributions
  FOR SELECT
  USING (true);

-- Policy pour permettre l'insertion/mise à jour par le service (via service role)
DROP POLICY IF EXISTS "Service can manage daily contributions" ON public.daily_contributions;
CREATE POLICY "Service can manage daily contributions"
  ON public.daily_contributions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_daily_contributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_daily_contributions_updated_at_trigger ON public.daily_contributions;
CREATE TRIGGER update_daily_contributions_updated_at_trigger
  BEFORE UPDATE ON public.daily_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_contributions_updated_at();

