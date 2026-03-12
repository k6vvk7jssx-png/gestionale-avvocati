'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Questo usa la chiave di servizio (service role key) che ha la piena
// potenza di scrittura e ignora l'RLS e i problemi di tipo UUID.
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function salvaProfiloAction(data: {
    regime_fiscale: string;
    expected_irpef_bracket: string;
    sad_face_threshold: number;
}) {
    const { userId } = await auth();
    
    if (!userId) {
        return { error: 'Non autenticato' };
    }

    const supabase = getSupabaseAdmin();

    // Controlla se il profilo esiste già
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

    if (existingProfile) {
        // Aggiorna il profilo esistente
        const { error } = await supabase
            .from('profiles')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) return { error: error.message };
    } else {
        // Crea un nuovo profilo
        const { error } = await supabase
            .from('profiles')
            .insert({
                user_id: userId,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) return { error: error.message };
    }

    return { success: true };
}

export async function getProfiloAction() {
    const { userId } = await auth();
    
    if (!userId) {
        return { error: 'Non autenticato', data: null };
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        return { error: error.message, data: null };
    }

    return { data, error: null };
}
