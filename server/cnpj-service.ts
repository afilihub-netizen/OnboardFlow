import { LRUCache } from 'lru-cache';

// Cache para evitar consultas repetidas de CNPJ
const cnpjCache = new LRUCache<string, CNPJInfo>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 dias
});

export interface CNPJInfo {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnae: string;
  cnaeDescricao: string;
  situacao: string;
  categoria: string;
  confianca: number;
}

// Mapeamento CNAE para categorias
const CNAE_CATEGORIA_MAP: { [key: string]: string } = {
  // Alimentação e Bebidas
  '4711': 'Alimentação', // Hipermercados e supermercados
  '4712': 'Alimentação', // Minimercados, mercearias e armazéns
  '5611': 'Alimentação', // Restaurantes e similares
  '5612': 'Alimentação', // Serviços de catering
  '5620': 'Alimentação', // Serviços de alimentação para eventos
  '1011': 'Alimentação', // Abate de reses
  '1012': 'Alimentação', // Abate de suínos, aves e outros pequenos animais
  
  // Transporte
  '4922': 'Transporte', // Transporte rodoviário de passageiros, regular, urbano
  '4929': 'Transporte', // Transporte rodoviário coletivo de passageiros
  '4930': 'Transporte', // Transporte rodoviário de carga
  '7319': 'Serviços', // Publicidade
  '5250': 'Transporte', // Atividades relacionadas ao transporte aéreo
  
  // Saúde
  '8610': 'Saúde', // Atividades de atendimento hospitalar
  '8630': 'Saúde', // Atividade médica ambulatorial
  '8640': 'Saúde', // Atividades de serviços de complementação diagnóstica
  '4773': 'Saúde', // Comércio varejista de produtos farmacêuticos
  '8650': 'Saúde', // Atividades de profissionais da área de saúde
  
  // Educação
  '8511': 'Educação', // Educação infantil
  '8512': 'Educação', // Ensino fundamental
  '8513': 'Educação', // Ensino médio
  '8520': 'Educação', // Ensino superior
  '8591': 'Educação', // Ensino de esportes
  '8599': 'Educação', // Outras atividades de ensino
  
  // Serviços
  '6201': 'Serviços', // Desenvolvimento de programas de computador
  '6202': 'Serviços', // Desenvolvimento e licenciamento de programas
  '6311': 'Serviços', // Tratamento de dados
  '7490': 'Serviços', // Outras atividades profissionais
  '8211': 'Serviços', // Serviços combinados de escritório
  '7319': 'Serviços', // Publicidade
  '6421': 'Serviços', // Bancos comerciais
  '6422': 'Serviços', // Bancos múltiplos
  
  // Casa e Moradia
  '4120': 'Casa', // Construção de edifícios
  '4313': 'Casa', // Obras de urbanização
  '4330': 'Casa', // Instalações elétricas
  '4391': 'Casa', // Obras de fundações
  '4399': 'Casa', // Serviços especializados para construção
  '6810': 'Casa', // Compra e venda de imóveis próprios
  '6821': 'Casa', // Corretagem na compra e venda
  '7729': 'Casa', // Aluguel de outros objetos pessoais e domésticos
  
  // Combustível
  '4731': 'Transporte', // Comércio varejista de combustíveis
  '4732': 'Transporte', // Comércio varejista de lubrificantes
  
  // Lazer e Entretenimento
  '5911': 'Lazer', // Atividades de produção cinematográfica
  '5912': 'Lazer', // Atividades de pós-produção cinematográfica
  '9001': 'Lazer', // Artes cênicas, espetáculos e atividades complementares
  '9319': 'Lazer', // Outras atividades esportivas
  '9329': 'Lazer', // Outras atividades de recreação e lazer
  '5914': 'Lazer', // Exibição cinematográfica
  
  // Investimentos
  '6436': 'Investimentos', // Outras sociedades de participação
  '6611': 'Investimentos', // Administração de mercados bursáteis
  '6612': 'Investimentos', // Corretagem de títulos e valores mobiliários
  '6613': 'Investimentos', // Administração de cartões de crédito
  '6619': 'Investimentos', // Outras atividades auxiliares dos serviços financeiros
  
  // Tecnologia
  '6201': 'Serviços', // Desenvolvimento de programas de computador sob encomenda
  '6202': 'Serviços', // Desenvolvimento e licenciamento de programas
  '6203': 'Serviços', // Desenvolvimento e licenciamento de programas não-customizáveis
  '6204': 'Serviços', // Consultoria em tecnologia da informação
  '6209': 'Serviços', // Suporte técnico, manutenção e outros serviços
  
  // Vestuário
  '4781': 'Outros', // Comércio varejista de artigos do vestuário
  '4782': 'Outros', // Comércio varejista de calçados e artigos de viagem
  '1411': 'Outros', // Confecção de roupas íntimas
  '1412': 'Outros', // Confecção de peças do vestuário
};

// APIs disponíveis para consulta CNPJ (em ordem de prioridade)
const CNPJ_APIS = [
  {
    name: 'BrasilAPI',
    url: (cnpj: string) => `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
    parser: (data: any): CNPJInfo | null => {
      if (!data || data.message) return null;
      
      const categoria = mapearCNAEParaCategoria(data.cnae_fiscal);
      
      return {
        cnpj: data.cnpj,
        razaoSocial: data.razao_social || data.nome || '',
        nomeFantasia: data.nome_fantasia,
        cnae: data.cnae_fiscal,
        cnaeDescricao: data.cnae_fiscal_descricao || '',
        situacao: data.situacao_cadastral || 'ATIVA',
        categoria: categoria.categoria,
        confianca: categoria.confianca
      };
    }
  },
  {
    name: 'ReceitaWS',
    url: (cnpj: string) => `https://www.receitaws.com.br/v1/cnpj/${cnpj}`,
    parser: (data: any): CNPJInfo | null => {
      if (!data || data.status === 'ERROR') return null;
      
      const cnaeCodigo = data.atividade_principal?.[0]?.code?.replace(/[^\d]/g, '').substring(0, 4) || '';
      const categoria = mapearCNAEParaCategoria(cnaeCodigo);
      
      return {
        cnpj: data.cnpj,
        razaoSocial: data.nome || '',
        nomeFantasia: data.fantasia,
        cnae: cnaeCodigo,
        cnaeDescricao: data.atividade_principal?.[0]?.text || '',
        situacao: data.situacao || 'ATIVA',
        categoria: categoria.categoria,
        confianca: categoria.confianca
      };
    }
  },
  {
    name: 'CNPJ.ws',
    url: (cnpj: string) => `https://publica.cnpj.ws/cnpj/${cnpj}`,
    parser: (data: any): CNPJInfo | null => {
      if (!data || data.status === 400) return null;
      
      const cnaeCodigo = data.estabelecimento?.atividade_principal?.id?.toString().substring(0, 4) || '';
      const categoria = mapearCNAEParaCategoria(cnaeCodigo);
      
      return {
        cnpj: data.estabelecimento?.cnpj || data.cnpj,
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.estabelecimento?.nome_fantasia,
        cnae: cnaeCodigo,
        cnaeDescricao: data.estabelecimento?.atividade_principal?.descricao || '',
        situacao: data.estabelecimento?.situacao_cadastral || 'ATIVA',
        categoria: categoria.categoria,
        confianca: categoria.confianca
      };
    }
  }
];

// Função para mapear CNAE para categoria
function mapearCNAEParaCategoria(cnae: string): { categoria: string; confianca: number } {
  if (!cnae) return { categoria: 'Outros', confianca: 0.3 };
  
  // Remove formatação e pega apenas os primeiros 4 dígitos
  const cnaeClean = cnae.toString().replace(/[^\d]/g, '').substring(0, 4);
  
  // Busca exata por 4 dígitos
  if (CNAE_CATEGORIA_MAP[cnaeClean]) {
    return { categoria: CNAE_CATEGORIA_MAP[cnaeClean], confianca: 0.9 };
  }
  
  // Busca por 3 dígitos (menos específico)
  const cnae3 = cnaeClean.substring(0, 3);
  for (const [key, categoria] of Object.entries(CNAE_CATEGORIA_MAP)) {
    if (key.startsWith(cnae3)) {
      return { categoria, confianca: 0.7 };
    }
  }
  
  // Busca por 2 dígitos (ainda menos específico)
  const cnae2 = cnaeClean.substring(0, 2);
  for (const [key, categoria] of Object.entries(CNAE_CATEGORIA_MAP)) {
    if (key.startsWith(cnae2)) {
      return { categoria, confianca: 0.5 };
    }
  }
  
  return { categoria: 'Outros', confianca: 0.3 };
}

// Função para normalizar CNPJ
function normalizarCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '');
}

// Função principal para consultar CNPJ
export async function consultarCNPJ(cnpj: string): Promise<CNPJInfo | null> {
  const cnpjLimpo = normalizarCNPJ(cnpj);
  
  // Verifica se está no cache
  const cached = cnpjCache.get(cnpjLimpo);
  if (cached) {
    console.log(`CNPJ ${cnpjLimpo} encontrado no cache`);
    return cached;
  }
  
  // Tenta cada API em ordem de prioridade
  for (const api of CNPJ_APIS) {
    try {
      console.log(`Tentando API ${api.name} para CNPJ ${cnpjLimpo}`);
      
      const response = await fetch(api.url(cnpjLimpo), {
        headers: {
          'User-Agent': 'FinanceFlow/1.0'
        },
        // Timeout de 8 segundos
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
      });
      
      if (!response.ok) {
        console.log(`API ${api.name} retornou status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const resultado = api.parser(data);
      
      if (resultado) {
        console.log(`CNPJ ${cnpjLimpo} encontrado na API ${api.name}: ${resultado.razaoSocial} - ${resultado.categoria}`);
        
        // Salva no cache
        cnpjCache.set(cnpjLimpo, resultado);
        
        return resultado;
      }
      
    } catch (error) {
      console.log(`Erro na API ${api.name} para CNPJ ${cnpjLimpo}:`, error);
      continue;
    }
  }
  
  console.log(`Nenhuma API conseguiu resolver o CNPJ ${cnpjLimpo}`);
  return null;
}

// Função para extrair CNPJs de texto de extrato
export function extrairCNPJsDoTexto(texto: string): string[] {
  // Regex para CNPJ (formato XX.XXX.XXX/XXXX-XX ou apenas números)
  const regexCNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}\-?\d{2}\b/g;
  
  const matches = texto.match(regexCNPJ) || [];
  
  // Normaliza e remove duplicatas
  const cnpjs = [...new Set(matches.map(cnpj => normalizarCNPJ(cnpj)))];
  
  // Filtra CNPJs válidos (14 dígitos)
  return cnpjs.filter(cnpj => cnpj.length === 14);
}

// Função para enriquecer transação com dados do CNPJ
export async function enriquecerTransacaoComCNPJ(transacao: any): Promise<any> {
  // Procura CNPJ na descrição da transação
  const cnpjs = extrairCNPJsDoTexto(transacao.description || '');
  
  if (cnpjs.length === 0) {
    return transacao;
  }
  
  // Usa o primeiro CNPJ encontrado
  const cnpjInfo = await consultarCNPJ(cnpjs[0]);
  
  if (cnpjInfo) {
    return {
      ...transacao,
      category: cnpjInfo.categoria,
      cnpjInfo: {
        cnpj: cnpjInfo.cnpj,
        razaoSocial: cnpjInfo.razaoSocial,
        nomeFantasia: cnpjInfo.nomeFantasia,
        cnae: cnpjInfo.cnae,
        confianca: cnpjInfo.confianca
      },
      // Atualiza a descrição com o nome fantasia se disponível
      description: cnpjInfo.nomeFantasia || cnpjInfo.razaoSocial || transacao.description
    };
  }
  
  return transacao;
}

// Função para processar lote de transações
export async function processarLoteTransacoes(transacoes: any[]): Promise<any[]> {
  const resultados = [];
  
  for (const transacao of transacoes) {
    try {
      const transacaoEnriquecida = await enriquecerTransacaoComCNPJ(transacao);
      resultados.push(transacaoEnriquecida);
      
      // Pequeno delay para não sobrecarregar APIs
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('Erro ao enriquecer transação:', error);
      resultados.push(transacao);
    }
  }
  
  return resultados;
}