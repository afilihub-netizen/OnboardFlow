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

Instruções:
1. Identifique cada transação individual
2. Para cada transação, determine:
   - Data (formato YYYY-MM-DD)
   - Descrição (limpe e simplifique)
   - Valor (número positivo ou negativo)
   - Tipo (income para receitas, expense para despesas)
   - Categoria (baseada na descrição)
   - Confiança (0-1, baseado na clareza da informação)

Categorias disponíveis: ${availableCategories.join(', ')}

Se uma transação não se encaixar nas categorias disponíveis, sugira uma categoria apropriada.

Formato de resposta obrigatório - responda APENAS com JSON válido:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "income" | "expense",
      "category": "string",
      "confidence": number
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
      max_tokens: 4000,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || '{"transactions": []}');
    return result;
  } catch (error) {
    console.error("Error analyzing extract with AI:", error);
    throw new Error("Failed to analyze extract with AI");
  }
}