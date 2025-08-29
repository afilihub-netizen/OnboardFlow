// mapa mínimo (expanda conforme sua base)
export const CNAE_TO_CATEGORY: Array<{ cnaePrefix: string; categoria: string }> = [
  { cnaePrefix: '47.11', categoria: 'Alimentação' }, // comércio varejista de supermercado
  { cnaePrefix: '47.29', categoria: 'Alimentação' },
  { cnaePrefix: '47.30', categoria: 'Transporte' },                // lojas de conveniência podem variar
  { cnaePrefix: '47.32', categoria: 'Saúde' }, // Farmácia
  { cnaePrefix: '49.39', categoria: 'Transporte' }, // Transporte > Apps/Outros
  { cnaePrefix: '47.30-1', categoria: 'Transporte' }, // Combustível
  { cnaePrefix: '61.',   categoria: 'Serviços' }, // Telefonia/Internet
  { cnaePrefix: '64.',   categoria: 'Serviços Financeiros' },
  { cnaePrefix: '82.20', categoria: 'Serviços' },                  // call centers/telemarketing
  
  // Expansão para casos brasileiros mais específicos
  { cnaePrefix: '47.71', categoria: 'Saúde' }, // Farmácias e perfumarias
  { cnaePrefix: '56.1', categoria: 'Alimentação' }, // Restaurantes
  { cnaePrefix: '47.61', categoria: 'Compras' }, // Livros, jornais, revistas
  { cnaePrefix: '47.42', categoria: 'Compras' }, // Material de construção
  { cnaePrefix: '68.', categoria: 'Casa' }, // Atividades imobiliárias
  { cnaePrefix: '85.', categoria: 'Educação' }, // Educação
  { cnaePrefix: '86.', categoria: 'Saúde' }, // Atividades de atenção à saúde humana
  { cnaePrefix: '62.', categoria: 'Serviços' }, // Atividades dos serviços de tecnologia da informação
];

export function categoryFromCNAE(cnae: string | null | undefined): string | null {
  if (!cnae) return null;
  const hit = CNAE_TO_CATEGORY.find(m => cnae.startsWith(m.cnaePrefix));
  return hit ? hit.categoria : null;
}