
export interface UserProfile {
  id: string;
  shop_name: string;
  owner_full_name?: string;
  logo_url?: string;
  avatar_data?: string;
  shop_logo_data?: string;
  phone?: string;
  address?: string;
  ifu_number?: string;
  payment_methods?: { id: string; network: string; number: string; name?: string }[];
  updated_at?: string;
  subscription_plan?: 'free' | 'basic' | 'pro';
  subscription_cycle?: 'monthly' | 'yearly';
  subscription_end_date?: string;
  is_super_admin?: boolean;
  whatsapp_webhook_url?: string; 
}

export type Permission = 
  | 'manage_clients'
  | 'manage_orders'
  | 'manage_catalog'
  | 'view_finance'
  | 'delete_data'
  | 'manage_team';

export interface TeamMember {
  id: string;
  owner_id: string;
  full_name: string;
  email: string;
  password?: string;
  job_title: string;
  permissions: Permission[];
  avatar_data?: string;
  created_at?: string;
  is_apprentice?: boolean;
  apprentice_data?: {
    tutor_name: string;
    tutor_phone: string;
    start_date: string;
    duration_months: number;
    training_cost: number;
    patron_name?: string;
    payments: { date: string; amount: number }[];
  };
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  measurements: Record<string, string>;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  client_id: string;
  model_name?: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Ready' | 'Delivered';
  price: number;
  total_paid: number;
  payment_ref_code?: string;
  delivery_date?: string;
  payments: { amount: number; date: string }[];
  created_at: string;
  clients?: Client;
  last_notified_at?: string; 
}

export interface CatalogItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
  category: string;
  created_at?: string;
}

export interface SupportTicket {
    id: string;
    user_id: string;
    subject: string;
    message: string;
    status: 'open' | 'resolved' | 'closed';
    created_at: string;
    profiles?: UserProfile;
    unread_count?: number; 
}

export interface SupportReply {
    id: string;
    ticket_id: string;
    sender_id: string;
    message: string;
    is_admin: boolean;
    file_data?: string; 
    file_name?: string;
    created_at: string;
    read_at?: string;
    parent_id?: string;
    reactions?: Record<string, string>; 
}

export type Tab = 'dashboard' | 'clients' | 'orders' | 'finance' | 'catalogue' | 'profile' | 'team' | 'superadmin' | 'support' | 'documentation';

export const MEASUREMENT_LABELS: Record<string, string> = {
  epaule: 'Épaule',
  poitrine: 'Poitrine',
  taille: 'Taille',
  hanches: 'Hanches',
  longueurHaut: 'Long. Haut',
  longueurBas: 'Long. Bas',
  manche: 'Manche',
  tourBras: 'Tour de bras',
  cuisse: 'Cuisse',
  entrejambe: 'Entrejambe'
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_clients: 'Gérer les Clients (Ajout/Modif)',
  manage_orders: 'Gérer les Commandes (Ajout/Modif)',
  manage_catalog: 'Gérer le Catalogue',
  view_finance: 'Voir Finances & Encaisser',
  delete_data: 'Droit de Suppression (Danger)',
  manage_team: 'Gérer l\'Équipe (Admin)'
};

export const SQL_SETUP_SCRIPT = `
-- 0. Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table des Profils
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  shop_name text,
  owner_full_name text,
  phone text,
  address text,
  ifu_number text,
  logo_url text,
  avatar_data text,
  shop_logo_data text,
  payment_methods jsonb DEFAULT '[]',
  subscription_plan text DEFAULT 'free',
  subscription_cycle text DEFAULT 'monthly',
  subscription_end_date timestamp with time zone,
  is_super_admin boolean DEFAULT false,
  whatsapp_webhook_url text,
  updated_at timestamp with time zone DEFAULT now()
);

-- S'assurer que toutes les colonnes existent si la table profil existait déjà
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owner_full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ifu_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_data text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_logo_data text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_cycle text DEFAULT 'monthly';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_webhook_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Table des Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  phone text,
  measurements jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- S'assurer que toutes les colonnes existent si la table clients existait déjà
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS measurements jsonb DEFAULT '{}';

-- Fusionner et migrer les données existantes (nom et prénom) vers 'name' si disponibles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='clients' AND column_name='nom'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='clients' AND column_name='name'
    ) THEN
        UPDATE public.clients 
        SET name = COALESCE(prenom || ' ', '') || nom 
        WHERE name IS NULL OR name = '';
    END IF;
END $$;

-- Remplir 'user_id' à partir de la table 'ateliers' si 'atelier_id' existait
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='clients' AND column_name='atelier_id'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='clients' AND column_name='user_id'
    ) THEN
        UPDATE public.clients c
        SET user_id = a.owner_id
        FROM public.ateliers a
        WHERE c.atelier_id = a.id AND c.user_id IS NULL;
    END IF;
END $$;

-- 3. Table des Commandes
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  model_name text,
  description text,
  status text DEFAULT 'Pending',
  price numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  payment_ref_code text,
  delivery_date date,
  payments jsonb DEFAULT '[]',
  last_notified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- S'assurer que toutes les colonnes existent
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS model_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_paid numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date date;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payments jsonb DEFAULT '[]';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_notified_at timestamp with time zone;

-- 4. Table du Catalogue
CREATE TABLE IF NOT EXISTS public.catalog (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  description text,
  price numeric DEFAULT 0,
  image_url text,
  images text[] DEFAULT '{}',
  category text,
  created_at timestamp with time zone DEFAULT now()
);

-- S'assurer que toutes les colonnes existent
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS category text;

-- 5. Table du Personnel
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text,
  email text,
  password text,
  job_title text,
  permissions text[] DEFAULT '{}',
  avatar_data text,
  is_apprentice boolean DEFAULT false,
  apprentice_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- S'assurer que toutes les colonnes existent
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS avatar_data text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS is_apprentice boolean DEFAULT false;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS apprentice_data jsonb DEFAULT '{}';

-- 6. Table Support (Messages)
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text,
  message text,
  status text DEFAULT 'open',
  created_at timestamp with time zone DEFAULT now()
);

-- S'assurer que toutes les colonnes existent
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';

-- 7. Table Support (Réponses)
CREATE TABLE IF NOT EXISTS public.support_replies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id uuid REFERENCES public.support_messages(id) ON DELETE CASCADE,
  sender_id uuid,
  message text,
  is_admin boolean DEFAULT false,
  file_data text,
  file_name text,
  read_at timestamp with time zone,
  parent_id uuid REFERENCES public.support_replies(id) ON DELETE CASCADE,
  reactions jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- S'assurer que toutes les colonnes existent
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.support_messages(id) ON DELETE CASCADE;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS file_data text;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.support_replies(id) ON DELETE CASCADE;
ALTER TABLE public.support_replies ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';

-- 8. Déclencheur (Trigger) d'inscription de l'utilisateur
-- Cela garantit qu'un profil est créé en toute sécurité même si l'upsert côté client échoue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    shop_name, 
    subscription_plan, 
    subscription_cycle,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'shop_name', 'Mon Atelier'),
    'free',
    'monthly',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    shop_name = COALESCE(EXCLUDED.shop_name, public.profiles.shop_name),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher proprement le déclencheur à la table d'authentification Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';
`;