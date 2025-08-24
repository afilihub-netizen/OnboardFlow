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

export async function analyzeExtractWithAI(extractText: string, availableCategories: string[] = []) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em análise de extratos bancários. Analise o extrato fornecido e extraia as transações em formato JSON.

IMPORTANTE: Responda APENAS com JSON válido, sem explicações, sem markdown, sem texto adicional.

Instruções:
1. Identifique cada transação individual no extrato
2. Para cada transação, determine:
   - Data (formato YYYY-MM-DD, use 2024 se não especificado)
   - Descrição (simplifique, remova códigos desnecessários)
   - Valor (número, positivo para receitas, negativo para despesas)
   - Tipo ("income" para receitas, "expense" para despesas)
   - Categoria (escolha a mais adequada)
   - Confiança (0.8 a 1.0)

Categorias disponíveis: ${availableCategories.length > 0 ? availableCategories.join(', ') : 'Alimentação, Transporte, Casa, Saúde, Entretenimento, Outros'}

Formato exato da resposta (JSON válido):
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "Descrição da transação",
      "amount": -50.00,
      "type": "expense",
      "category": "Alimentação",
      "confidence": 0.9
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analise este extrato bancário e extraia as transações:\n\n${extractText}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.1
    });

    const content = response.choices[0].message.content || '{"transactions": []}';
    console.log("OpenAI raw response length:", content.length);
    console.log("OpenAI raw response preview:", content.substring(0, 200) + "...");
    
    // Try to clean up the response if it has any formatting issues
    let cleanContent = content.trim();
    
    // Remove any markdown formatting if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to fix common JSON issues
    cleanContent = cleanContent
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .replace(/\n/g, ' ')     // Replace newlines with spaces
      .replace(/\t/g, ' ')     // Replace tabs with spaces
      .replace(/\s+/g, ' ');   // Normalize whitespace
    
    try {
      const result = JSON.parse(cleanContent);
      return result;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", cleanContent.substring(0, 500));
      
      // Try to extract just the transactions array if possible
      try {
        const transactionsMatch = cleanContent.match(/"transactions"\s*:\s*\[(.*?)\]/s);
        if (transactionsMatch) {
          const transactionsStr = `{"transactions": [${transactionsMatch[1]}]}`;
          const result = JSON.parse(transactionsStr);
          return result;
        }
      } catch (secondError) {
        console.error("Second parsing attempt failed:", secondError);
      }
      
      // Return empty result if all parsing attempts fail
      return { transactions: [] };
    }
  } catch (error) {
    console.error("Error analyzing extract with AI:", error);
    throw new Error("Failed to analyze extract with AI");
  }
}