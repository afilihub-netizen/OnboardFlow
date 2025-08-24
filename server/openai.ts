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
        content: `CRÍTICO: Extraia TODAS as transações do extrato, sem exceção. Não pare em 10 ou qualquer outro número.

Analise LINHA POR LINHA e encontre CADA transação individual. Responda APENAS com JSON válido.

REGRAS OBRIGATÓRIAS:
- Processar TODO o texto fornecido
- Extrair TODAS as transações, podem ser 5, 50, 100 ou mais
- Data: YYYY-MM-DD (use 2024 se ano não especificado)
- Amount: número negativo para despesas, positivo para receitas
- Type: "expense" ou "income" 
- Category: Alimentação, Transporte, Casa, Saúde, Entretenimento, Outros

EXEMPLO: Se há 50 transações no texto, retorne 50 transações no JSON.

JSON: {"transactions":[...TODAS as transações encontradas...]}`
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
    const transactions = result.transactions || [];
    console.log(`Chunk parsed: ${transactions.length} transactions extracted`);
    return transactions;
  } catch (parseError) {
    console.error("JSON parse failed for chunk:", parseError);
    return [];
  }
}

export async function analyzeExtractWithAI(extractText: string, availableCategories: string[] = []) {
  try {
    console.log("Processing extract with length:", extractText.length);
    
    // Split large texts into chunks
    const chunks = splitTextIntoChunks(extractText, 6000);
    console.log("Split into", chunks.length, "chunks");
    
    const allTransactions: any[] = [];
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
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
    
    console.log("Total transactions found:", allTransactions.length);
    
    return {
      transactions: allTransactions
    };
    
  } catch (error) {
    console.error("Error analyzing extract with AI:", error);
    throw new Error("Failed to analyze extract with AI");
  }
}