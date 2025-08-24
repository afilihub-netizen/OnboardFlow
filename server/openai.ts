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
    
    // Normalize and validate transaction data
    transactions = transactions.map((t: any) => {
      // Normalize field names (handle case variations)
      const normalized: any = {
        date: t.date || t.Date || t.DATA || "2024-01-01",
        description: t.description || t.Description || t.DESCRIPTION || "Transação sem descrição",
        amount: parseFloat(t.amount || t.Amount || t.AMOUNT || t.valor || t.VALOR || 0),
        type: (t.type || t.Type || t.TYPE || "expense").toLowerCase(),
        category: t.category || t.Category || t.CATEGORY || "Outros"
      };
      
      // Validate and fix date format
      if (!normalized.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try to parse common date formats
        const dateStr = normalized.date.toString();
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            normalized.date = `${year}-${month}-${day}`;
          }
        } else {
          normalized.date = "2024-12-10"; // fallback
        }
      }
      
      // Ensure type is valid
      if (!['income', 'expense'].includes(normalized.type)) {
        normalized.type = normalized.amount >= 0 ? 'income' : 'expense';
      }
      
      return normalized;
    });
    
    console.log(`Chunk parsed: ${transactions.length} transactions extracted and normalized`);
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