// deno-lint-ignore-file no-explicit-any
import { getSupabase } from '../_shared/supabaseClient.ts';
import { classifyRowWithSupabase, type RawBankRow } from '../_shared/classifier.ts';

Deno.serve(async (req) => {
  try {
    const { client: supabase, jwt } = getSupabase(req);
    // exige auth do cliente (JWT)
    const { data: auth } = await supabase.auth.getUser(jwt ?? '');
    const user_id = auth?.user?.id;
    if (!user_id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await req.json();
    const rows: RawBankRow[] = body?.rows ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'rows empty' }), { status: 400 });
    }

    console.log(`🚀 [CLASSIFY-IMPORT] Iniciando classificação de ${rows.length} transações para user ${user_id}`);

    // carrega dicionário do usuário
    const { data: dictRows } = await supabase
      .from('merchant_map')
      .select('pattern_substring, cnpj, categoria, confianca, merchant_id, merchants!inner(nome)')
      .eq('merchant_map.user_id', user_id);

    const dict = (dictRows ?? []).map((r: any) => ({
      pattern_substring: r.pattern_substring,
      merchant_canonico: r.merchants?.nome ?? '',
      cnpj: r.cnpj,
      categoria: r.categoria,
      confianca: r.confianca ?? 0.99
    }));

    console.log(`📚 [DICT] Carregado dicionário com ${dict.length} entradas`);

    // classifica
    const normalized = [];
    for (const r of rows) {
      const n = await classifyRowWithSupabase(r, user_id, dict, supabase);
      normalized.push(n);
    }

    // upsert merchants faltantes (pelo slug)
    for (const n of normalized) {
      const { data: m } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user_id)
        .eq('slug', n.merchant_slug)
        .maybeSingle();

      let merchant_id = m?.id;
      if (!merchant_id) {
        const { data: ins } = await supabase
          .from('merchants')
          .insert({
            user_id, slug: n.merchant_slug, nome: n.nome_canonico, cnpj: n.cnpj ?? null
          })
          .select('id')
          .single();
        merchant_id = ins?.id;
      }

      // insere transação
      await supabase.from('transactions').insert({
        user_id,
        data: n.data,
        descricao_raw: n.descricao_raw,
        merchant_raw: n.merchant_raw,
        merchant_norm: n.merchant_norm,
        merchant_slug: n.merchant_slug,
        merchant_id,
        tipo: n.tipo,
        natureza: n.natureza,
        valor: n.valor,
        categoria: n.categoria,
        cnpj: n.cnpj,
        confidence: n.confidence,
        fontes: n.fontes.join('>')
      });
    }

    console.log(`✅ [CLASSIFY-IMPORT] Processamento concluído: ${normalized.length} transações inseridas`);

    return new Response(JSON.stringify({ inserted: normalized.length, processed: normalized }), { status: 200 });
  } catch (e) {
    console.error(`❌ [CLASSIFY-IMPORT] Erro:`, e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});