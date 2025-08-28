export const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', icon: 'fas fa-qrcode' },
  { value: 'debit_card', label: 'Cartão de Débito', icon: 'fas fa-credit-card' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: 'fas fa-credit-card' },
  { value: 'cash', label: 'Dinheiro', icon: 'fas fa-money-bill' },
  { value: 'transfer', label: 'Transferência', icon: 'fas fa-exchange-alt' },
  { value: 'other', label: 'Outro', icon: 'fas fa-ellipsis-h' },
] as const;

export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Receita', color: 'text-success' },
  { value: 'expense', label: 'Despesa', color: 'text-destructive' },
] as const;

export const INVESTMENT_TYPES = [
  { value: 'fixed_income', label: 'Renda Fixa', icon: 'fas fa-chart-bar', color: 'blue' },
  { value: 'real_estate_fund', label: 'Fundo Imobiliário', icon: 'fas fa-building', color: 'green' },
  { value: 'stocks', label: 'Ações', icon: 'fas fa-chart-line', color: 'purple' },
  { value: 'crypto', label: 'Criptomoedas', icon: 'fab fa-bitcoin', color: 'orange' },
  { value: 'savings', label: 'Poupança', icon: 'fas fa-piggy-bank', color: 'pink' },
  { value: 'other', label: 'Outros', icon: 'fas fa-coins', color: 'gray' },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: 'Mercado', icon: 'fas fa-shopping-cart', color: '#2563eb' },
  { name: 'Transporte', icon: 'fas fa-car', color: '#dc2626' },
  { name: 'Lazer', icon: 'fas fa-gamepad', color: '#f59e0b' },
  { name: 'Saúde', icon: 'fas fa-heartbeat', color: '#10b981' },
  { name: 'Educação', icon: 'fas fa-graduation-cap', color: '#6366f1' },
  { name: 'Casa', icon: 'fas fa-home', color: '#8b5cf6' },
  { name: 'Trabalho', icon: 'fas fa-briefcase', color: '#059669' },
  { name: 'Investimentos', icon: 'fas fa-chart-pie', color: '#7c3aed' },
  { name: 'Outros', icon: 'fas fa-ellipsis-h', color: '#6b7280' },
] as const;

export const CHART_COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600  
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
] as const;

// Sistema inteligente de ícones para categorias
export const CATEGORY_ICON_MAPPINGS = [
  // Alimentação
  { keywords: ['mercado', 'supermercado', 'compras', 'feira', 'grocery'], icon: 'fas fa-shopping-cart' },
  { keywords: ['restaurante', 'lanche', 'comida', 'alimentação', 'food', 'jantar', 'almoço'], icon: 'fas fa-utensils' },
  { keywords: ['café', 'padaria', 'cafeteria'], icon: 'fas fa-coffee' },
  { keywords: ['pizza', 'delivery'], icon: 'fas fa-pizza-slice' },
  
  // Transporte
  { keywords: ['transporte', 'uber', 'táxi', 'taxi', 'ônibus', 'onibus', 'metro'], icon: 'fas fa-car' },
  { keywords: ['gasolina', 'combustível', 'combustivel', 'posto', 'álcool', 'diesel'], icon: 'fas fa-gas-pump' },
  { keywords: ['estacionamento', 'valet', 'parking'], icon: 'fas fa-parking' },
  { keywords: ['avião', 'aviao', 'viagem', 'passagem', 'voo'], icon: 'fas fa-plane' },
  { keywords: ['bicicleta', 'bike'], icon: 'fas fa-bicycle' },
  
  // Casa e moradia
  { keywords: ['casa', 'moradia', 'lar', 'residência', 'residencia', 'home'], icon: 'fas fa-home' },
  { keywords: ['aluguel', 'rent', 'condomínio', 'condominio'], icon: 'fas fa-building' },
  { keywords: ['água', 'agua', 'water', 'saneamento'], icon: 'fas fa-tint' },
  { keywords: ['luz', 'energia', 'elétrica', 'eletrica', 'electric'], icon: 'fas fa-bolt' },
  { keywords: ['internet', 'wifi', 'telecom', 'telefone'], icon: 'fas fa-wifi' },
  { keywords: ['gás', 'gas'], icon: 'fas fa-fire' },
  
  // Saúde
  { keywords: ['saúde', 'saude', 'médico', 'medico', 'hospital', 'clínica', 'clinica'], icon: 'fas fa-heartbeat' },
  { keywords: ['farmácia', 'farmacia', 'remédio', 'remedio', 'medicamento'], icon: 'fas fa-pills' },
  { keywords: ['dentista', 'odontologia'], icon: 'fas fa-tooth' },
  { keywords: ['academia', 'gym', 'fitness'], icon: 'fas fa-dumbbell' },
  
  // Educação
  { keywords: ['educação', 'educacao', 'escola', 'faculdade', 'universidade', 'curso'], icon: 'fas fa-graduation-cap' },
  { keywords: ['livro', 'livraria', 'material'], icon: 'fas fa-book' },
  
  // Trabalho
  { keywords: ['trabalho', 'escritório', 'escritorio', 'office', 'empresa'], icon: 'fas fa-briefcase' },
  { keywords: ['salário', 'salario', 'salary', 'pagamento', 'renda'], icon: 'fas fa-money-bill-wave' },
  
  // Lazer e entretenimento
  { keywords: ['lazer', 'entretenimento', 'diversão', 'diversao', 'cinema'], icon: 'fas fa-gamepad' },
  { keywords: ['música', 'musica', 'spotify', 'streaming'], icon: 'fas fa-music' },
  { keywords: ['festa', 'bar', 'balada', 'drinks'], icon: 'fas fa-cocktail' },
  { keywords: ['esporte', 'futebol', 'jogo'], icon: 'fas fa-football-ball' },
  
  // Tecnologia
  { keywords: ['tecnologia', 'tech', 'computador', 'software', 'app'], icon: 'fas fa-laptop' },
  { keywords: ['celular', 'telefone', 'phone', 'mobile'], icon: 'fas fa-mobile-alt' },
  
  // Roupas e beleza
  { keywords: ['roupa', 'vestuário', 'vestuario', 'shopping', 'moda'], icon: 'fas fa-tshirt' },
  { keywords: ['beleza', 'cabelo', 'salão', 'salao', 'estética', 'estetica'], icon: 'fas fa-cut' },
  
  // Financeiro
  { keywords: ['investimento', 'investment', 'banco', 'poupança', 'poupanca'], icon: 'fas fa-chart-pie' },
  { keywords: ['empréstimo', 'emprestimo', 'financiamento', 'loan'], icon: 'fas fa-hand-holding-usd' },
  { keywords: ['cartão', 'cartao', 'credit', 'débito', 'debito'], icon: 'fas fa-credit-card' },
  
  // Pets
  { keywords: ['pet', 'animal', 'cachorro', 'gato', 'veterinário', 'veterinario'], icon: 'fas fa-paw' },
  
  // Impostos e taxas
  { keywords: ['imposto', 'taxa', 'governo', 'receita', 'iptu', 'ipva'], icon: 'fas fa-file-invoice-dollar' },
  
  // Seguros
  { keywords: ['seguro', 'insurance', 'proteção', 'protecao'], icon: 'fas fa-shield-alt' },
  
  // Doações e presentes
  { keywords: ['presente', 'gift', 'doação', 'doacao', 'caridade'], icon: 'fas fa-gift' },
] as const;

// Lista de serviços de assinatura conhecidos
export const KNOWN_SUBSCRIPTION_SERVICES = [
  // Streaming de Música
  'spotify', 'deezer', 'amazon music', 'youtube music', 'apple music', 'tidal',
  
  // Streaming de Vídeo
  'netflix', 'amazon prime', 'disney', 'disney+', 'disney plus', 'hbo max', 'hbo', 'globoplay', 
  'paramount', 'paramount+', 'apple tv', 'apple tv+', 'crunchyroll', 'youtube premium',
  
  // Design e Criatividade
  'canva', 'adobe', 'photoshop', 'illustrator', 'creative cloud', 'figma', 'sketch',
  
  // Produtividade e Desenvolvimento
  'microsoft 365', 'office 365', 'google workspace', 'notion', 'trello', 'asana', 'slack',
  'github', 'replit', 'vercel', 'netlify', 'heroku',
  
  // Educação
  'coursera', 'udemy', 'skillshare', 'duolingo', 'linkedin learning',
  
  // Fitness e Saúde
  'gym', 'academia', 'smartfit', 'nike run club', 'strava',
  
  // Outros Serviços Populares
  'icloud', 'dropbox', 'google drive', 'onedrive', 'evernote', 'lastpass', 'dashlane',
  '1password', 'nordvpn', 'expressvpn', 'uber', 'uber one', '99', 'ifood', 'rappi'
] as const;

// Função para verificar se um serviço é uma assinatura conhecida
export function isKnownSubscriptionService(merchantName: string): boolean {
  const name = merchantName.toLowerCase().trim();
  
  // Verifica se algum serviço conhecido está contido no nome do comerciante
  return KNOWN_SUBSCRIPTION_SERVICES.some(service => 
    name.includes(service) || service.includes(name)
  );
}

// Função para obter ícone baseado no nome da categoria
export function getIconForCategory(categoryName: string): string {
  const name = categoryName.toLowerCase().trim();
  
  // Procura por correspondência exata primeiro
  for (const mapping of CATEGORY_ICON_MAPPINGS) {
    if (mapping.keywords.some(keyword => name === keyword)) {
      return mapping.icon;
    }
  }
  
  // Depois procura por correspondência parcial
  for (const mapping of CATEGORY_ICON_MAPPINGS) {
    if (mapping.keywords.some(keyword => name.includes(keyword))) {
      return mapping.icon;
    }
  }
  
  // Ícone padrão se não encontrar correspondência
  return 'fas fa-tag';
}
