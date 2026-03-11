-- =============================================
-- SCHÉMA SUPABASE POUR L'APPLICATION MODULES
-- =============================================
-- Exécute ce script dans l'éditeur SQL de Supabase:
-- https://supabase.com/dashboard/project/[ton-projet]/sql/new

-- 1. Créer la table modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    type VARCHAR(50) NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'interaction', 'quiz', 'info', 'experience')),
    status VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('actif', 'brouillon', 'archive')),
    ordre INTEGER DEFAULT 0,
    duree_estimee INTEGER DEFAULT 5,
    zone_id VARCHAR(100),
    contenu JSONB DEFAULT '{}',
    position JSONB DEFAULT NULL, -- {x: number, y: number} en pourcentage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_ordre ON public.modules(ordre);
CREATE INDEX IF NOT EXISTS idx_modules_type ON public.modules(type);

-- 3. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Activer Row Level Security (RLS)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 6. Politique de lecture publique (tout le monde peut lire)
DROP POLICY IF EXISTS "Modules are viewable by everyone" ON public.modules;
CREATE POLICY "Modules are viewable by everyone"
    ON public.modules
    FOR SELECT
    USING (true);

-- 7. Politique d'écriture pour les utilisateurs authentifiés uniquement
DROP POLICY IF EXISTS "Authenticated users can insert modules" ON public.modules;
CREATE POLICY "Authenticated users can insert modules"
    ON public.modules
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update modules" ON public.modules;
CREATE POLICY "Authenticated users can update modules"
    ON public.modules
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete modules" ON public.modules;
CREATE POLICY "Authenticated users can delete modules"
    ON public.modules
    FOR DELETE
    TO authenticated
    USING (true);

-- 8. Ajouter la colonne position si elle n'existe pas (pour mise à jour)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'position') THEN
        ALTER TABLE public.modules ADD COLUMN position JSONB DEFAULT NULL;
    END IF;
END $$;

-- 9. Insérer les modules de démonstration
INSERT INTO public.modules (id, nom, description, type, status, ordre, duree_estimee, zone_id, contenu, position)
VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Accueil & Introduction', 
     'Présentation de l''expérience Enchanted Tools et introduction aux robots Mirokaï.', 
     'video', 'actif', 1, 3, 'mirokai-experience',
     '{"mediaUrl": "/videos/intro.mp4", "texte": "Bienvenue dans la forêt enchantée...", "instructions": ["Regardez la vidéo d''introduction", "Familiarisez-vous avec l''espace"]}'::jsonb,
     '{"x": 25, "y": 30}'::jsonb),
    
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Rencontre avec Mirokaï',
     'Première interaction avec le robot Mirokaï. Découvrez ses capacités expressives.',
     'interaction', 'actif', 2, 5, 'mirokai-experience',
     '{"texte": "Approchez-vous doucement de Mirokaï...", "instructions": ["Laissez Mirokaï vous observer", "Répondez à ses expressions", "Initiez un geste de salutation"]}'::jsonb,
     '{"x": 30, "y": 45}'::jsonb),
    
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Démonstration Spoon',
     'Observez les robots Spoon en action dans leur mission de service.',
     'experience', 'actif', 3, 4, 'spoon',
     '{"texte": "Les robots Spoon sont conçus pour l''assistance...", "instructions": ["Observez le ballet des robots", "Notez leur coordination", "Demandez une livraison test"]}'::jsonb,
     '{"x": 55, "y": 40}'::jsonb),
    
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Quiz Robotique',
     'Testez vos connaissances sur la robotique et l''IA après votre visite.',
     'quiz', 'actif', 4, 3, NULL,
     '{"texte": "Répondez aux questions pour valider votre parcours...", "instructions": ["5 questions à choix multiples", "Obtenez votre badge visiteur"]}'::jsonb,
     NULL),
    
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Les Coulisses',
     'Découvrez en exclusivité la régie et le centre de contrôle.',
     'info', 'brouillon', 5, 6, 'regie',
     '{"mediaUrl": "/videos/coulisses.mp4", "texte": "Plongez dans les coulisses de notre centre...", "instructions": ["Visite guidée", "Questions-réponses avec l''équipe"]}'::jsonb,
     '{"x": 14, "y": 68}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    position = EXCLUDED.position;

-- =============================================
-- TABLE MINI-JEUX
-- =============================================

-- 10. Créer la table mini_games
CREATE TABLE IF NOT EXISTS public.mini_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    type VARCHAR(50) NOT NULL DEFAULT 'quiz_flash' CHECK (type IN ('memory', 'puzzle', 'quiz_flash', 'drag_drop', 'find_difference', 'sequence')),
    status VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('actif', 'brouillon', 'archive')),
    after_module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    ordre INTEGER DEFAULT 1,
    duree_estimee INTEGER DEFAULT 2,
    contenu JSONB DEFAULT '{}',
    recompense JSONB DEFAULT '{"points": 10, "message": "Bravo !"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Index pour les mini-jeux
CREATE INDEX IF NOT EXISTS idx_mini_games_status ON public.mini_games(status);
CREATE INDEX IF NOT EXISTS idx_mini_games_after_module ON public.mini_games(after_module_id);

-- 12. Trigger pour updated_at des mini-jeux
DROP TRIGGER IF EXISTS update_mini_games_updated_at ON public.mini_games;
CREATE TRIGGER update_mini_games_updated_at
    BEFORE UPDATE ON public.mini_games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. RLS pour mini_games
ALTER TABLE public.mini_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mini games are viewable by everyone" ON public.mini_games;
CREATE POLICY "Mini games are viewable by everyone"
    ON public.mini_games
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert mini games" ON public.mini_games;
CREATE POLICY "Authenticated users can insert mini games"
    ON public.mini_games
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update mini games" ON public.mini_games;
CREATE POLICY "Authenticated users can update mini games"
    ON public.mini_games
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete mini games" ON public.mini_games;
CREATE POLICY "Authenticated users can delete mini games"
    ON public.mini_games
    FOR DELETE
    TO authenticated
    USING (true);

-- 14. Mini-jeux de démonstration
INSERT INTO public.mini_games (nom, description, type, status, after_module_id, ordre, duree_estimee, contenu, recompense)
VALUES 
    ('Quiz Express Mirokaï', 
     'Testez vos connaissances sur Mirokaï !', 
     'quiz_flash', 'actif', 
     (SELECT id FROM public.modules WHERE nom LIKE '%Rencontre%' LIMIT 1), 
     1, 2,
     '{"questions": [{"question": "Quel est le nom du robot expressif ?", "options": ["Spoon", "Mirokaï", "Nao", "Pepper"], "correctIndex": 1}], "timeLimit": 30}'::jsonb,
     '{"points": 15, "message": "Excellent ! Tu connais bien Mirokaï !", "badge": "mirokai_fan"}'::jsonb),
    
    ('Memory Robots', 
     'Retrouve les paires de robots !', 
     'memory', 'brouillon', 
     (SELECT id FROM public.modules WHERE nom LIKE '%Spoon%' LIMIT 1), 
     1, 3,
     '{"pairs": [{"id": "1", "content": "Mirokaï"}, {"id": "2", "content": "Spoon"}], "difficulty": "easy"}'::jsonb,
     '{"points": 20, "message": "Super mémoire !"}'::jsonb)
ON CONFLICT DO NOTHING;

-- =============================================
-- TABLE SETTINGS (Configuration de l'app)
-- =============================================

-- 15. Créer la table settings
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    journey_background_url TEXT DEFAULT NULL,
    journey_background_type VARCHAR(20) DEFAULT 'generated' CHECK (journey_background_type IN ('image', 'generated')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Trigger pour updated_at des settings
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 17. RLS pour settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.settings;
CREATE POLICY "Settings are viewable by everyone"
    ON public.settings
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.settings;
CREATE POLICY "Authenticated users can update settings"
    ON public.settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.settings;
CREATE POLICY "Authenticated users can insert settings"
    ON public.settings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 18. Insérer les settings par défaut
INSERT INTO public.settings (id, journey_background_url, journey_background_type)
VALUES ('main', '/parcours-example.png', 'image')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE BUCKET pour les images
-- =============================================
-- Note: Exécuter ceci dans la console Supabase ou via l'interface:
-- 1. Aller dans Storage > Create new bucket
-- 2. Nom: "journey-backgrounds"
-- 3. Public bucket: OUI
-- =============================================

-- =============================================
-- CONFIGURATION DE L'AUTHENTIFICATION
-- =============================================
-- Va dans Authentication > Providers et active "Email"
-- Désactive "Confirm email" pour les tests
-- 
-- Crée un utilisateur admin manuellement:
-- 1. Va dans Authentication > Users
-- 2. Clique "Add user"
-- 3. Entre: admin@enchanted.tools / ton-mot-de-passe
-- =============================================
