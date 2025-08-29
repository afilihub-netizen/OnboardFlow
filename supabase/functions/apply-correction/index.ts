// deno-lint-ignore-file no-explicit-any
import { getSupabase } from '../_shared/supabaseClient.ts';

Deno.serve(async (req) => {
  try {
    const { client: supabase, jwt } = getSupabase(req);
    const { data: auth } = await supabase.auth.getUser(jwt ?? '');
    const user_id = auth?.user?.id;
    if (!user_id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { pattern_substring, nome_canonico, categoria, cnpj } = await req.json();

    if (!pattern_substring || !nome_canonico) {
      return new Response(JSON.stringify({ error: 'pattern_substring and nome_canonico required' }), { status: 400 });
    }

    console.log(`🔧 [APPLY-CORRECTION] User ${user_id} corrigindo: "${pattern_substring}" → "${nome_canonico}" (${categoria})`);

    // garantir merchant canônico
    const slug = (nome_canonico as string).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

    const { data: msel } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user_id)
      .eq('slug', slug)
      .maybeSingle();

    let merchant_id = msel?.id;
    if (!merchant_id) {
      const { data: mins } = await supabase
        .from('merchants')
        .insert({ user_id, slug, nome: nome_canonico, cnpj: cnpj ?? null })
        .select('id')
        .single();
      merchant_id = mins?.id;
      console.log(`✅ [MERCHANT] Criado novo merchant: ${nome_canonico} (ID: ${merchant_id})`);
    }

    // insere/atualiza regra no dicionário
    await supabase.from('merchant_map').insert({
      user_id,
      pattern_substring,
      merchant_id,
      cnpj: cnpj ?? null,
      categoria: categoria ?? null,
      criado_por: user_id
    });

    console.log(`✅ [CORRECTION] Regra aplicada: "${pattern_substring}" → "${nome_canonico}" (${categoria})`);

    return new Response(JSON.stringify({ ok: true, merchant_id }), { status: 200 });
  } catch (e) {
    console.error(`❌ [APPLY-CORRECTION] Erro:`, e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});