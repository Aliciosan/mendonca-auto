import { createClient } from '@supabase/supabase-js';

// Essas variáveis serão preenchidas pelo Vercel depois
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);