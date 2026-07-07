import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(req: Request) {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('cookie') ?? '';

  // Récupère l'utilisateur via le cookie de session
  const { data: { user }, error } = await adminSupabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );

  if (error || !user) {
    // Fallback : lit le JWT depuis le cookie
    const cookie = req.headers.get('cookie') ?? '';
    const match = cookie.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (!match) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const token = decodeURIComponent(match[1]);
    let accessToken: string;
    try { accessToken = JSON.parse(token)[0]; } catch { return NextResponse.json({ error: 'Token invalide' }, { status: 401 }); }
    const { data: { user: u }, error: e } = await adminSupabase.auth.getUser(accessToken);
    if (e || !u) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    await adminSupabase.from('profiles').delete().eq('id', u.id);
    await adminSupabase.auth.admin.deleteUser(u.id);
    return NextResponse.json({ ok: true });
  }

  await adminSupabase.from('profiles').delete().eq('id', user.id);
  await adminSupabase.auth.admin.deleteUser(user.id);
  return NextResponse.json({ ok: true });
}
