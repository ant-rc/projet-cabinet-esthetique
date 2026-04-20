// Supabase Edge Function: create-patient
//
// Creates a patient auth user + profile if the email does not already exist.
// Sends a password reset email so the patient can set their password and log in.
//
// Deploy:
//   supabase functions deploy create-patient --no-verify-jwt
//
// Required secrets (already set for Supabase):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Request body:
//   { email: string, firstName: string, lastName: string, phone?: string }
//
// Response:
//   { userId: string, created: boolean }  // created=false if patient already existed

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

// @ts-expect-error external module (Deno)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // @ts-expect-error Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  // @ts-expect-error Deno global
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json() as {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    const email = (body.email ?? '').trim().toLowerCase();
    const firstName = (body.firstName ?? '').trim();
    const lastName = (body.lastName ?? '').trim();
    const phone = (body.phone ?? '').trim() || null;

    if (!email || !firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Check if an auth user already exists with this email
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ userId: existing[0].id, created: false }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Generate a random secure password (user will reset it via email)
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();

    // Create auth user with email confirmed (skip email verification)
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone ?? '',
      },
    });

    if (authError || !authUser.user) {
      return new Response(JSON.stringify({ error: authError?.message ?? 'Failed to create auth user' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const userId = authUser.user.id;

    // Ensure users table row exists (trigger handle_new_user should create it, but we ensure it)
    await admin.from('users').upsert(
      { id: userId, email, role: 'client' },
      { onConflict: 'id' },
    );

    // Ensure profile row exists
    await admin.from('profiles').upsert(
      { user_id: userId, first_name: firstName, last_name: lastName, phone },
      { onConflict: 'user_id' },
    );

    // Send password reset email so the patient can set their own password
    await admin.auth.resetPasswordForEmail(email);

    return new Response(JSON.stringify({ userId, created: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
