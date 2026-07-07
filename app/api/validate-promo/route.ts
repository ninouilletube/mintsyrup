import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { code } = await req.json() as { code: string };

  if (!code?.trim()) {
    return NextResponse.json({ valid: false, error: 'Code manquant' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('code, discount, used')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Code invalide' }, { status: 400 });
  }

  if (data.used) {
    return NextResponse.json({ valid: false, error: 'Ce code a déjà été utilisé' }, { status: 400 });
  }

  return NextResponse.json({ valid: true, code: data.code, discount: data.discount });
}
