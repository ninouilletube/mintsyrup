import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export async function getData(key: string) {
  const { data } = await supabase.from('mint_data').select('value').eq('key', key).single();
  return data?.value ?? null;
}

export async function setData(key: string, value: unknown) {
  await supabase.from('mint_data').upsert({ key, value });
}
