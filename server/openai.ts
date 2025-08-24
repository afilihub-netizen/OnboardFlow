import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateFinancialInsights(financialData: any) {
  try {
    const { transactions, summary, categories } = financialData;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um consultor financeiro especializado. Analise os dados financeiros fornecidos e gere insights personalizados em português brasileiro.

Instruções:
1. Analise as transações, resumo financeiro e categorias
2. Identifique padrões, oportunidades de economia e alertas importantes
3. Gere 3 insights máximo, priorizando os mais relevantes
4. Use linguagem clara e objetiva
5. Inclua valores específicos quando relevante

Tipos de insight:
- opportunity: oportunidades de economia ou melhoria
- investment: sugestões de investimento ou aumento de poupança
- alert: alertas sobre gastos excessivos ou padrões preocupantes

Responda APENAS com JSON válido no formato:
{
  "insights": [
    {
      "type": "opportunity" | "investment" | "alert",
      "title": "Título do insight",
      "message": "Mensagem detalhada com valores específicos"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analise estes dados financeiros e gere insights personalizados:\n\nResumo: ${JSON.stringify(summary)}\nTransações recentes: ${JSON.stringify(transactions?.slice(-20) || [])}\nCategorias: ${JSON.stringify(categories)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
    return result;
  } catch (error) {
    console.error("Error generating financial insights:", error);
    throw new Error("Failed to generate financial insights");
  }
}

// Function to split text into chunks
function splitTextIntoChunks(text: string, maxChunkSize: number = 6000): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    // If adding this line would exceed the limit, save current chunk and start new one
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Function to process a single chunk
async function processChunk(extractText: string, availableCategories: string[] = []) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `CRÍTICO: Extraia TODAS as transações do extrato bancário, sem limites ou exceções.

INSTRUÇÕES DETALHADAS:
1. Processe LINHA POR LINHA do texto completo
2. Identifique TODAS as transações (podem ser 10, 50, 100, 200+ transações)
3. Extraia informações PRECISAS de origem/destino dos valores
4. Categorize baseado no estabelecimento/descrição real

FORMATO JSON OBRIGATÓRIO (campos exatos):
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "texto completo da transação",
      "amount": -100.50,
      "type": "expense",
      "category": "Alimentação"
    }
  ]
}

REGRAS DOS CAMPOS:
- "date": sempre minúsculo, formato YYYY-MM-DD (use 2024 se ano ausente)
- "description": texto COMPLETO (PIX João Silva, COMPRA SUPERMERCADO ABC, etc)
- "amount": número com decimais, negativo para saídas, positivo para entradas
- "type": sempre "expense" ou "income" (minúsculo)
- "category": uma opção: Alimentação, Transporte, Casa, Saúde, Entretenimento, Outros

EXEMPLO COMPLETO:
{"transactions":[{"date":"2024-12-10","description":"PIX ENVIADO João Silva","amount":-150.00,"type":"expense","category":"Outros"},{"date":"2024-12-10","description":"SALÁRIO EMPRESA XYZ","amount":3000.00,"type":"income","category":"Outros"}]}`
      },
      {
        role: "user",
        content: `Analise este extrato bancário e extraia as transações:\n\n${extractText}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 8000,
    temperature: 0.1
  });

  let content = response.choices[0].message.content || '{"transactions": []}';
  
  // Clean up the response
  content = content.trim();
  
  if (content.includes('```')) {
    content = content.replace(/```json?/g, '').replace(/```/g, '');
  }
  
  if (!content.startsWith('{')) {
    const startIndex = content.indexOf('{');
    if (startIndex > -1) {
      content = content.substring(startIndex);
    }
  }
  
  if (!content.endsWith('}')) {
    const endIndex = content.lastIndexOf('}');
    if (endIndex > -1) {
      content = content.substring(0, endIndex + 1);
    }
  }
  
  try {
    const result = JSON.parse(content);
    let transactions = result.transactions || [];
    
    console.log("Raw transactions before normalization:", transactions.slice(0, 2));
    
    // Normalize and validate transaction data
    transactions = transactions.map((t: any, index: number) => {
      // Get raw values from all possible field names
      const rawDate = t.date || t.Date || t.DATA || t.d || "";
      const rawDescription = t.description || t.Description || t.DESCRIPTION || t.desc || "Transação";
      const rawAmount = t.amount || t.Amount || t.AMOUNT || t.valor || t.VALOR || t.value || 0;
      const rawType = t.type || t.Type || t.TYPE || t.t || "expense";
      const rawCategory = t.category || t.Category || t.CATEGORY || t.cat || "Outros";
      
      // Parse amount properly
      let parsedAmount = 0;
      if (typeof rawAmount === 'string') {
        // Remove currency symbols and spaces
        const cleanAmount = rawAmount.replace(/[R$\s,]/g, '').replace(',', '.');
        parsedAmount = parseFloat(cleanAmount) || 0;
      } else {
        parsedAmount = parseFloat(rawAmount) || 0;
      }
      
      // Parse date properly
      let parsedDate = "2024-12-10";
      if (rawDate && rawDate !== "") {
        const dateStr = rawDate.toString().trim();
        
        // Try different date formats
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          parsedDate = dateStr;
        } else if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let day = parts[0].padStart(2, '0');
            let month = parts[1].padStart(2, '0');
            let year = parts[2];
            
            // Handle different date formats (DD/MM/YYYY or MM/DD/YYYY)
            if (parts[2].length === 4) {
              year = parts[2];
            } else if (parts[2].length === 2) {
              year = '20' + parts[2];
            }
            
            // Assume DD/MM/YYYY format for Brazil
            if (parseInt(day) > 12) {
              parsedDate = `${year}-${month}-${day}`;
            } else {
              parsedDate = `${year}-${month}-${day}`;
            }
          }
        } else if (dateStr.includes('-')) {
          // Already in some ISO format, try to fix
          parsedDate = dateStr.length >= 10 ? dateStr.substring(0, 10) : "2024-12-10";
        }
      }
      
      // Normalize type
      let normalizedType = rawType.toString().toLowerCase();
      if (!['income', 'expense'].includes(normalizedType)) {
        normalizedType = parsedAmount >= 0 ? 'income' : 'expense';
      }
      
      const normalized = {
        date: parsedDate,
        description: rawDescription.toString().trim() || `Transação ${index + 1}`,
        amount: parsedAmount,
        type: normalizedType,
        category: rawCategory.toString().trim() || "Outros"
      };
      
      console.log(`Transaction ${index + 1} normalized:`, normalized);
      return normalized;
    });
    
    // Filter out invalid transactions
    transactions = transactions.filter(t => 
      t.date && 
      t.date !== "Invalid Date" && 
      !isNaN(t.amount) && 
      t.description && 
      t.description !== ""
    );
    
    console.log(`Chunk parsed: ${transactions.length} valid transactions extracted and normalized`);
    return transactions;
  } catch (parseError) {
    console.error("JSON parse failed for chunk:", parseError);
    console.error("Content that failed:", content.substring(0, 500));
    return [];
  }
}

// Global progress sessions map
let globalProgressSessions = new Map<string, any>();

// Function to set progress sessions (called from routes)
export function setProgressSessions(sessions: Map<string, any>) {
  globalProgressSessions = sessions;
}

// Function to send progress updates
function sendProgressUpdate(sessionId: string, progress: number, message: string) {
  const res = globalProgressSessions.get(sessionId);
  if (res && !res.destroyed) {
    try {
      res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
      console.log(`Progress sent: ${progress}% - ${message}`);
    } catch (error) {
      console.error("Error sending progress update:", error);
    }
  }
}

export async function analyzeExtractWithAI(extractText: string, availableCategories: string[] = [], sessionId?: string) {
  try {
    console.log("Processing extract with length:", extractText.length);
    
    // Progress tracking available via global sessions
    
    // Split large texts into chunks
    const chunks = splitTextIntoChunks(extractText, 6000);
    console.log("Split into", chunks.length, "chunks");
    
    if (sessionId) {
      sendProgressUpdate(sessionId, 10, `Dividido em ${chunks.length} partes para análise`);
    }
    
    const allTransactions: any[] = [];
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const progress = 10 + ((i / chunks.length) * 80);
      
      if (sessionId) {
        sendProgressUpdate(sessionId, progress, `Analisando parte ${i + 1} de ${chunks.length}...`);
      }
      
      console.log(`Processing chunk ${i + 1}/${chunks.length}, size: ${chunks[i].length}`);
      
      try {
        const chunkTransactions = await processChunk(chunks[i], availableCategories);
        allTransactions.push(...chunkTransactions);
        console.log(`Chunk ${i + 1} processed: ${chunkTransactions.length} transactions`);
      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}:`, chunkError);
        // Continue with other chunks even if one fails
      }
    }
    
    if (sessionId) {
      sendProgressUpdate(sessionId, 95, "Finalizando análise...");
    }
    
    console.log("Total transactions found:", allTransactions.length);
    
    if (sessionId) {
      sendProgressUpdate(sessionId, 100, `Análise concluída! ${allTransactions.length} transações encontradas`);
    }
    
    return {
      transactions: allTransactions
    };
    
  } catch (error) {
    console.error("Error analyzing extract with AI:", error);
    throw new Error("Failed to analyze extract with AI");
  }
}