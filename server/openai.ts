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
          content: `Analise o extrato bancário e extraia TODAS as transações encontradas. Responda APENAS com JSON válido.

Regras:
- Data: YYYY-MM-DD (use 2024 se ano não especificado)
- Amount: número negativo para despesas, positivo para receitas  
- Type: "expense" ou "income"
- Category: uma das categorias: Alimentação, Transporte, Casa, Saúde, Entretenimento, Outros
- Extraia TODAS as transações, sem limite de quantidade

JSON obrigatório:
{"transactions":[{"date":"2024-12-10","description":"PIX João","amount":-100,"type":"expense","category":"Outros"}]}`
        },
        {
          role: "user",
          content: `Analise este extrato bancário e extraia as transações:\n\n${extractText}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.1
    });

    let content = response.choices[0].message.content || '{"transactions": []}';
    console.log("OpenAI response length:", content.length);
    
    // Force clean JSON response - remove any extra formatting
    content = content.trim();
    
    // Remove markdown if present
    if (content.includes('```')) {
      content = content.replace(/```json?/g, '').replace(/```/g, '');
    }
    
    // Ensure it starts and ends properly
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
      console.log("Parsed successfully:", result.transactions?.length || 0, "transactions");
      return result;
    } catch (parseError) {
      console.error("JSON parse failed, returning empty result");
      console.error("Failed content preview:", content.substring(0, 200));
      
      // Last resort: return a safe empty structure
      return { 
        transactions: [
          {
            date: "2024-12-10",
            description: "Análise falhada - adicione manualmente",
            amount: 0,
            type: "expense",
            category: "Outros",
            confidence: 0.5
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error analyzing extract with AI:", error);
    throw new Error("Failed to analyze extract with AI");
  }
}