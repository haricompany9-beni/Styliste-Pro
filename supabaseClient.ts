
import { createClient } from '@supabase/supabase-js';

// Identifiants par défaut (Fallback)
const fallbackUrl = 'https://ininbtycfysicutybmdc.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaW5idHljZnlzaWN1dHlibWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzczNzQsImV4cCI6MjA3OTU1MzM3NH0.k1XRrXXWPTsBfVC3dXKZDij30wXtSgW7TMele1TNCVw';

const getSupabaseConfig = () => {
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_ANON_KEY;

  // Nettoyage strict : supprime les guillemets (simples/doubles), les espaces et les retours à la ligne
  const clean = (str: string | undefined) => {
    if (!str) return null;
    const cleaned = str.trim().replace(/['"]/g, '').replace(/\s/g, '');
    if (cleaned === '' || cleaned === 'undefined' || cleaned === 'null' || cleaned.includes('placeholder')) {
      return null;
    }
    return cleaned;
  };

  let url = clean(envUrl);
  let key = clean(envKey);

  // Utilisation du fallback si les variables d'environnement sont absentes ou invalides
  if (!url || !key) {
    url = fallbackUrl;
    key = fallbackKey;
  }

  // Normalisation de l'URL
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  // Suppression du slash final pour éviter les erreurs de concaténation interne
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  return { url, key };
};

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: { 'x-application-name': 'stylistepro' },
  },
});

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return !!url && !!key && url.startsWith('https://');
};
