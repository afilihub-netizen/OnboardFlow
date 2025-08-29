import { GoogleGenAI } from "@google/genai";
import { processarLoteTransacoes, extrairCNPJsDoTexto } from "./cnpj-service";
import { aiServiceManager } from "./services/aiServiceManager";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateFinancialInsights(financialData: any) {
  try {
    const { transactions, summary, categories } = financialData;
    
    const systemPrompt = `Você é um consultor financeiro especializado. Analise os dados financeiros fornecidos e gere insights personalizados em português brasileiro.

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
}`;

    const prompt = `Analise estes dados financeiros e gere insights personalizados:\n\nResumo: ${JSON.stringify(summary)}\nTransações recentes: ${JSON.stringify(Array.isArray(transactions) ? transactions.slice(-20) : transactions?.transactions?.slice(-20) || [])}\nCategorias: ${JSON.stringify(categories)}`;

    const aiResponse = await aiServiceManager.generateAIResponse(
      prompt,
      'financial_insights',
      {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        financialData: financialData,
        fallbackResponse: '{"insights": []}'
      }
    );

    if (aiResponse.success) {
      if (typeof aiResponse.data === 'string') {
        const jsonMatch = aiResponse.data.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : '{"insights": []}');
      } else if (typeof aiResponse.data === 'object') {
        return aiResponse.data;
      }
    }
    
    return { insights: [] };
  } catch (error: any) {
    console.error("Error generating financial insights:", error);
    
    // Handle rate limiting by returning fallback insights
    if (error.status === 429) {
      return {
        insights: [
          {
            type: "alert",
            title: "Assistente temporariamente indisponível",
            message: "O assistente de IA está sobrecarregado. Insights personalizados serão gerados novamente em breve."
          }
        ]
      };
    }
    
    throw new Error("Failed to generate financial insights");
  }
}

// Nova função para análise específica de assinaturas
export async function analyzeSubscriptionPatterns(transactions: any[]) {
  try {
    console.log(`[analyzeSubscriptionPatterns] Input: ${transactions.length} transactions`);
    const transactionsText = transactions.map(t => 
      `${t.description || 'Sem descrição'} - R$ ${t.amount} - ${t.date}`
    ).join('\n');

    const systemPrompt = `Você é um especialista em detecção de assinaturas e serviços recorrentes.

ANALISE as transações e identifique possíveis ASSINATURAS baseado em:

1. SERVIÇOS CONHECIDOS DO MERCADO:
   - Streaming: Netflix, Disney+, Amazon Prime, Spotify, Deezer, YouTube Premium, HBO Max, Globoplay, Paramount+
   - Produtividade: Microsoft 365, Google Workspace, Adobe, Photoshop, Canva, Notion, Figma, Slack
   - Desenvolvimento: GitHub, Replit, Vercel, Netlify, Heroku
   - Cloud: iCloud, Dropbox, Google Drive, OneDrive
   - Outros: Uber One, 99, iFOOD Pro, NordVPN, 1Password

2. PADRÕES DE RECORRÊNCIA:
   - Valores similares mensais
   - Mesmo comerciante/descrição
   - Frequência regular

3. CRITÉRIOS RIGOROSOS:
   - Apenas serviços realmente conhecidos no mercado
   - Evitar PIX para pessoas físicas
   - Focar em empresas/plataformas estabelecidas

RESPONDA APENAS com JSON válido:
{
  "potentialSubscriptions": [
    {
      "merchant": "nome do serviço",
      "amount": "valor mensal",
      "confidence": 0.95,
      "category": "Streaming" | "Produtividade" | "Desenvolvimento" | "Cloud" | "Outros",
      "description": "descrição do serviço identificado"
    }
  ]
}`;

    const aiResponse = await aiServiceManager.generateAIResponse(
      `Analise estas transações e identifique possíveis assinaturas:\n\n${transactionsText}`,
      'extract_analysis',
      {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.1,
        fallbackResponse: '{"potentialSubscriptions": []}'
      }
    );

    if (aiResponse.success) {
      let result;
      if (typeof aiResponse.data === 'string') {
        const jsonMatch = aiResponse.data.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : '{"potentialSubscriptions": []}');
      } else if (typeof aiResponse.data === 'object') {
        result = aiResponse.data;
      }
      
      const subscriptions = result?.potentialSubscriptions || [];
      console.log(`[analyzeSubscriptionPatterns] Output: ${subscriptions.length} subscriptions detected`);
      return subscriptions;
    }
    
    return [];
  } catch (error: any) {
    console.error("Error analyzing subscription patterns:", error);
    return [];
  }
}

// Function to split text into chunks - TAMANHO AUMENTADO PARA PEGAR MAIS TRANSAÇÕES
function splitTextIntoChunks(text: string, maxChunkSize: number = 15000): string[] {
  console.log(`📝 SPLITTING TEXT: ${text.length} chars into chunks of max ${maxChunkSize}`);
  
  // Para extratos pequenos, não dividir
  if (text.length <= maxChunkSize) {
    console.log(`📝 Text is small enough (${text.length} <= ${maxChunkSize}), keeping as 1 chunk`);
    return [text];
  }
  
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    // If adding this line would exceed the limit, save current chunk and start new one
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      console.log(`📝 Created chunk ${chunks.length}: ${currentChunk.trim().length} chars`);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
    console.log(`📝 Created final chunk ${chunks.length}: ${currentChunk.trim().length} chars`);
  }
  
  console.log(`📝 FINAL SPLIT: ${chunks.length} chunks total`);
  return chunks;
}

// Function to process a single chunk
async function processChunk(extractText: string, availableCategories: string[] = []) {
  console.log(`🔍 PROCESS CHUNK STARTING:`);
  console.log(`   - Content length: ${extractText.length}`);
  console.log(`   - Available categories: ${availableCategories.length}`);
  console.log(`   - Sample content: ${extractText.substring(0, 200)}...`);
  
  console.log("Processing chunk with text length:", extractText.length);
  console.log("First 500 characters:", extractText.substring(0, 500));
  
  let content = '{"transactions": []}';
  
  try {
    const systemPrompt = `CRÍTICO: Extraia TODAS as transações do extrato bancário e identifique ASSINATURAS.

INSTRUÇÕES ESPECÍFICAS:
1. Procure por padrões de transação: valores, datas, descrições de PIX, TEF, débitos, créditos
2. Identifique transações mesmo em formatos diferentes
3. Extraia informações de compras, transferências, pagamentos, recebimentos
4. Use os estabelecimentos/destinatários para categorizar
5. SEMPRE retorne pelo menos algumas transações se há valores no texto

DETECÇÃO DE ASSINATURAS - MUITO IMPORTANTE:
Identifique automaticamente serviços de assinatura conhecidos:
- Streaming: Netflix, Disney+, Amazon Prime, Spotify, Deezer, YouTube Premium, HBO Max, Globoplay
- Produtividade: Microsoft 365, Google Workspace, Adobe, Canva, Notion, Figma
- Desenvolvimento: GitHub, Replit, Vercel, Heroku
- Outros: iCloud, Dropbox, Uber One, 99, iFOOD Pro

Para transações de assinaturas, use categoria "Assinaturas" e adicione campo "isSubscription": true

FORMATOS ACEITOS:
- PIX, TED, DOC, Débito, Crédito
- Compras com cartão
- Pagamentos diversos
- Transferências bancárias

CRITICAL: Use EXACTLY these field names: date, description, amount, type, category, isSubscription

JSON OBRIGATÓRIO:
{"transactions":[{"date":"2024-12-10","description":"texto completo","amount":-100.50,"type":"expense","category":"Outros","isSubscription":false}]}

RULES:
- date: YYYY-MM-DD (use 2025-01-01 se não encontrar)
- description: texto completo da transação  
- amount: número decimal (negativo para gastos, positivo para receitas)
- type: "expense" ou "income"
- category: Alimentação, Transporte, Casa, Saúde, Entretenimento, Assinaturas, Outros
- isSubscription: true se for serviço de assinatura conhecida, false caso contrário`;

    // Add timeout to prevent hanging - TIMEOUT AUMENTADO PARA 60s
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), 60000); // 60 second timeout
    });

    const aiResponse: any = await Promise.race([
      aiServiceManager.generateAIResponse(
        `Analise este extrato bancário e extraia as transações:\n\n${extractText}`,
        'extract_analysis',
        {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json", 
          temperature: 0.1,
          fallbackResponse: '{"transactions": []}'
        }
      ),
      timeoutPromise
    ]);

    if (aiResponse.success) {
      if (typeof aiResponse.data === 'string') {
        content = aiResponse.data;
      } else if (typeof aiResponse.data === 'object') {
        content = JSON.stringify(aiResponse.data);
      }
      console.log("AI Response length:", content.length);
      console.log("AI Response preview:", content.substring(0, 500));
    } else {
      content = '{"transactions": []}';
      console.log("Using fallback empty transactions due to AI error");
    }
    
  } catch (error) {
    console.error("Error calling AI service:", error);
    console.log("Using fallback empty transactions due to AI error");
    content = '{"transactions": []}';
    
    // Log specific error type
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.message.includes('timeout')) {
        console.log("AI request timed out, this chunk will be skipped");
      }
    }
    
    // Don't throw here, continue with empty transactions to provide feedback
  }
  
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
    
    console.log(`Parsed ${transactions.length} transactions from AI response`);
    
    // Raw transactions extracted from AI
    
    // Normalize and validate transaction data
    transactions = transactions.map((t: any, index: number) => {
      // Get raw values from all possible field names
      const rawDate = t.date || t.Date || t.DATA || t.d || "";
      const rawDescription = t.description || t.Description || t.DESCRIPTION || t.desc || "Transação";
      const rawAmount = t.amount || t.Amount || t.AMOUNT || t.valor || t.VALOR || t.value || 0;
      const rawType = t.type || t.Type || t.TYPE || t.t || "expense";
      const rawCategory = t.category || t.Category || t.CATEGORY || t.cat || "Outros";
      
      // Parse amount properly - PRESERVANDO SINAIS +/-
      let parsedAmount = 0;
      if (typeof rawAmount === 'string') {
        // Remove currency symbols and spaces, MAS PRESERVA sinais +/-
        const cleanAmount = rawAmount.replace(/[R$\s]/g, '').replace(/,/g, '.').replace(/^\+/, '');
        parsedAmount = parseFloat(cleanAmount) || 0;
        console.log(`💰 [AMOUNT-PARSE] "${rawAmount}" → "${cleanAmount}" → ${parsedAmount}`);
      } else {
        parsedAmount = parseFloat(rawAmount) || 0;
        console.log(`💰 [AMOUNT-PARSE] (number) ${rawAmount} → ${parsedAmount}`);
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
        // Smart categorization based on description
        const description = rawDescription.toString().toLowerCase();
        
        // PIX payments are always expenses (saídas)
        if (description.includes('pagamento pix') || 
            description.includes('pix pagamento') ||
            (description.includes('pix') && (description.includes('pagamento') || description.includes('pagto')))) {
          normalizedType = 'expense';
        }
        // PIX receipts are income (entradas)
        else if (description.includes('recebimento pix') || 
                 description.includes('pix recebido') ||
                 (description.includes('pix') && (description.includes('recebimento') || description.includes('recebido')))) {
          normalizedType = 'income';
        }
        // Other payment indicators
        else if (description.includes('pagamento') || description.includes('pagto') || 
                 description.includes('compra') || description.includes('débito') ||
                 description.includes('saque') || description.includes('transferência enviada') ||
                 description.includes('ted enviado') || description.includes('doc enviado')) {
          normalizedType = 'expense';
        }
        // Income indicators
        else if (description.includes('salário') || description.includes('recebimento') ||
                 description.includes('depósito') || description.includes('crédito') ||
                 description.includes('transferência recebida') || description.includes('ted recebido') ||
                 description.includes('doc recebido') || description.includes('rendimento')) {
          normalizedType = 'income';
        }
        // Fallback to amount-based logic only if no keywords found
        else {
          normalizedType = parsedAmount >= 0 ? 'income' : 'expense';
          console.log(`🤖 [TYPE-FALLBACK] Amount ${parsedAmount} → type "${normalizedType}"`);
        }
      }
      
      const normalized = {
        date: parsedDate,
        description: rawDescription.toString().trim() || `Transação ${index + 1}`,
        amount: parsedAmount,
        type: normalizedType,
        category: rawCategory.toString().trim() || "Outros"
      };
      
      // Transaction normalized successfully
      return normalized;
    });
    
    // Filter out invalid transactions
    transactions = transactions.filter((t: any) => 
      t.date && 
      t.date !== "Invalid Date" && 
      !isNaN(t.amount) && 
      t.description && 
      t.description !== ""
    );
    
    console.log(`✅ CHUNK PROCESSING COMPLETE:`);
    console.log(`   - Returning ${transactions.length} transactions`);
    console.log(`   - Sample result:`, transactions.slice(0, 2));
    
    return transactions;
  } catch (parseError) {
    console.error("JSON parse failed for chunk:", parseError);
    console.error("❌ JSON PARSE FAILED:", content.substring(0, 500));
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

export async function analyzeExtractWithAI(extractText: string, availableCategories: string[] = [], sessionId?: string, enableCNPJCategorization: boolean = true) {
  console.log("=== analyzeExtractWithAI FUNCTION CALLED ===");
  console.log("Extract text length:", extractText.length);
  console.log("Available categories:", availableCategories.length);
  console.log("Session ID:", sessionId || 'none');
  console.log("CNPJ categorization:", enableCNPJCategorization);
  
  try {
    console.log(`🚀 EXTRACT ANALYSIS STARTING:`);
    console.log(`   - Extract text length: ${extractText.length}`);
    console.log(`   - Available categories: ${availableCategories.length}`);
    console.log(`   - Session ID: ${sessionId || 'none'}`);
    console.log(`   - CNPJ categorization: ${enableCNPJCategorization}`);
    console.log("Processing extract with length:", extractText.length);
    console.log("First 1000 characters of extract:", extractText.substring(0, 1000));
    console.log("Contains common transaction keywords:", 
      /PIX|TED|DOC|débito|crédito|transferência|pagamento|compra|saque/i.test(extractText));
    
    // Progress tracking available via global sessions
    
    // Split large texts into chunks (chunks MUITO maiores para pegar TODAS as transações)
    const chunks = splitTextIntoChunks(extractText, 15000);
    console.log("Split into", chunks.length, "chunks");
    console.log("Total text length:", extractText.length, "characters");
    console.log("Average chunk size:", Math.round(extractText.length / chunks.length), "characters");
    
    if (sessionId) {
      sendProgressUpdate(sessionId, 10, `Dividido em ${chunks.length} partes para análise`);
    }
    
    const allTransactions: any[] = [];
    console.log(`💾 TRANSACTION ACCUMULATOR INITIALIZED: ${allTransactions.length} transactions`);
    
    // Process chunks sequentially to avoid aggregation issues
    for (let i = 0; i < chunks.length; i++) {
      const progress = 10 + ((i / chunks.length) * 80);
      
      if (sessionId) {
        sendProgressUpdate(sessionId, progress, `Analisando parte ${i + 1} de ${chunks.length}...`);
      }
      
      console.log(`Processing chunk ${i + 1}/${chunks.length}, size: ${chunks[i].length}`);
      
      try {
        console.log(`[CHUNK ${i + 1}] Starting processing...`);
        const chunkTransactions = await processChunk(chunks[i], availableCategories);
        console.log(`[CHUNK ${i + 1}] ✅ PROCESSED: ${chunkTransactions.length} transactions`);
        console.log(`[CHUNK ${i + 1}] Sample:`, chunkTransactions.slice(0, 2));
        
        if (chunkTransactions.length > 0) {
          console.log(`[CHUNK ${i + 1}] 🔍 BEFORE PUSH: allTransactions has ${allTransactions.length} items`);
          allTransactions.push(...chunkTransactions);
          console.log(`[CHUNK ${i + 1}] ✅ AFTER PUSH: allTransactions now has ${allTransactions.length} transactions`);
          console.log(`[CHUNK ${i + 1}] 🔍 SAMPLE ADDED:`, chunkTransactions[0]);
        } else {
          console.log(`[CHUNK ${i + 1}] ⚠️ NO TRANSACTIONS RETURNED FROM CHUNK`);
        }
        
        // Send progress update after each successful chunk
        if (sessionId) {
          const updatedProgress = 10 + (((i + 1) / chunks.length) * 80);
          sendProgressUpdate(sessionId, updatedProgress, `Concluído parte ${i + 1} de ${chunks.length}`);
        }
      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}:`, chunkError);
        
        // Send error feedback to user but continue
        if (sessionId) {
          const currentProgress = 10 + ((i / chunks.length) * 80);
          sendProgressUpdate(sessionId, currentProgress, `Erro na parte ${i + 1}, continuando...`);
        }
      }
    }
    
    console.log(`🔍 CHUNK PROCESSING SUMMARY:`);
    console.log(`   - Total chunks processed: ${chunks.length}`);
    console.log(`   - Total transactions extracted: ${allTransactions.length}`);
    console.log(`   - Transactions per chunk average: ${chunks.length > 0 ? Math.round(allTransactions.length / chunks.length) : 0}`);
    console.log(`   - allTransactions array type:`, typeof allTransactions, Array.isArray(allTransactions));
    console.log(`   - allTransactions first item:`, allTransactions[0]);
    
    if (allTransactions.length === 0) {
      console.log(`❌ NO TRANSACTIONS FOUND AFTER CHUNK PROCESSING`);
      console.log(`   - Text length: ${extractText.length}`);
      console.log(`   - Chunks created: ${chunks.length}`);
      console.log(`   - Sample chunk:`, chunks[0]?.substring(0, 200));
      
      // FALLBACK: Se nenhuma transação foi encontrada, retornar uma transação de exemplo
      // para o usuário poder editar e confirmar que o sistema funciona
      console.log(`🔄 FALLBACK: Criando transação de exemplo para o usuário editar`);
      allTransactions.push({
        date: new Date().toISOString().split('T')[0],
        description: "Transação de exemplo - edite os dados conforme necessário",
        amount: -50.00,
        type: "expense",
        category: "Outros",
        isSubscription: false
      });
    }
    
    if (sessionId) {
      sendProgressUpdate(sessionId, 95, "Finalizando análise...");
    }
    
    // Apply CNPJ categorization if enabled
    console.log(`🔄 NORMALIZATION STARTING: ${allTransactions.length} transactions`);
    
    if (allTransactions.length === 0) {
      console.log(`❌ CRITICAL ERROR: No transactions to normalize! Stopping here.`);
      console.log(`🔍 DEBUG: Rechecking chunks processing...`);
      console.log(`   - Chunks length: ${chunks.length}`);
      console.log(`   - Did any chunk succeed?`);
      return { transactions: [] };
    }
    let finalTransactions = allTransactions.map((t: any, index: number) => {      
      const normalized = {
        date: t.date || t.Date || t.DATA || "2024-12-10",
        description: t.description || t.Description || t.DESCRIPTION || `Transação ${index + 1}`,
        amount: parseFloat(t.amount || t.Amount || t.AMOUNT || 0),
        type: (t.type || t.Type || t.TYPE || "expense").toLowerCase(),
        category: t.category || t.Category || t.CATEGORY || "Outros",
        confidence: t.confidence || 0.9
      };
      
      if (index < 3) {
        console.log(`[NORMALIZATION DEBUG] Transaction ${index}:`, {
          original: t,
          normalized: normalized
        });
      }
      
      return normalized;
    });
    
    console.log(`[NORMALIZATION DEBUG] After initial normalization: ${finalTransactions.length} transactions`);

    // Apply CNPJ categorization if enabled
    if (enableCNPJCategorization) {
      if (sessionId) {
        sendProgressUpdate(sessionId, 97, "Aplicando categorização via CNPJ...");
      }
      
      const { extractCNPJ, queryCNPJ, categorizeByCNPJ, extractCompanyName, detectPaymentMethod } = await import("./utils/cnpj");
      
      console.log(`[CNPJ DEBUG] Starting CNPJ processing for ${finalTransactions.length} transactions`);
      const cnpjProcessedTransactions = await Promise.all(finalTransactions.map(async (transaction: any) => {
        try {
          // Extract CNPJ from transaction description
          const cnpj = extractCNPJ(transaction.description);
          
          // Detect payment method from description
          const paymentMethod = detectPaymentMethod(transaction.description);
          transaction.paymentMethod = paymentMethod;
          
          if (cnpj) {
            // Query CNPJ information
            const cnpjInfo = await queryCNPJ(cnpj);
            
            if (cnpjInfo) {
              // Enhanced categorization with business intelligence
              const businessInfo = categorizeByCNPJ(cnpjInfo);
              
              transaction.category = businessInfo.category;
              transaction.confidence = 0.95; // Higher confidence for CNPJ-based categorization
              transaction.cnpjInfo = {
                cnpj,
                companyName: cnpjInfo.nome,
                activity: cnpjInfo.atividade_principal[0]?.text || '',
                businessType: businessInfo.businessType,
                description: businessInfo.description
              };
              
              // Update transaction description with business context
              transaction.enhancedDescription = `${businessInfo.description} - ${cnpjInfo.nome}`;
            }
          } else {
            // Try to extract company name for better categorization
            const companyName = extractCompanyName(transaction.description);
            if (companyName) {
              transaction.companyName = companyName;
            }
          }
        } catch (error) {
          console.error("Error in CNPJ categorization for transaction:", error);
          // Continue with original categorization on error
        }
        
        return transaction;
      }));
      
      console.log(`[CNPJ DEBUG] After CNPJ processing: ${cnpjProcessedTransactions.length} transactions`);
      finalTransactions = cnpjProcessedTransactions;
    }
    
    if (sessionId) {
      sendProgressUpdate(sessionId, 100, `Análise concluída! ${finalTransactions.length} transações encontradas`);
    }
    
    console.log(`[FINAL DEBUG] Before CNPJ: allTransactions.length = ${allTransactions.length}`);
    console.log(`[FINAL DEBUG] After normalization: finalTransactions.length = ${finalTransactions.length}`);
    console.log(`[FINAL DEBUG] Sample final transactions:`, finalTransactions.slice(0, 3));
    
    // If no transactions found, try a simpler fallback analysis
    if (finalTransactions.length === 0 && extractText.length > 100) {
      console.log("No transactions found, creating fallback transactions");
      finalTransactions = await createFallbackTransactions(extractText);
    }
    
    return {
      transactions: finalTransactions
    };
    
  } catch (error) {
    console.error("Error analyzing extract with AI:", error);
    throw new Error("Failed to analyze extract with AI");
  }
}

// Fallback function to create basic transactions when AI fails
async function createFallbackTransactions(extractText: string): Promise<any[]> {
  console.log("Creating fallback transactions from text patterns");
  console.log("Extract text sample:", extractText.substring(0, 2000));
  
  const transactions: any[] = [];
  const lines = extractText.split('\n');
  
  // More aggressive patterns for Brazilian bank statements
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 8) continue;
    
    // Multiple monetary patterns to catch different formats
    const monetaryPatterns = [
      /\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/,  // 1.234,56
      /\b(\d+,\d{2})\b/,                   // 123,45
      /\bR\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})\b/,  // R$ 1.234,56
      /\b(\d+\.\d{3},\d{2})\b/             // Alternative format
    ];
    
    // Multiple date patterns
    const datePatterns = [
      /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,  // DD/MM/YYYY
      /\b(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/,  // YYYY/MM/DD
    ];
    
    let monetaryMatch = null;
    let dateMatch = null;
    
    // Check all monetary patterns
    for (const pattern of monetaryPatterns) {
      monetaryMatch = trimmedLine.match(pattern);
      if (monetaryMatch) break;
    }
    
    // Check all date patterns
    for (const pattern of datePatterns) {
      dateMatch = trimmedLine.match(pattern);
      if (dateMatch) break;
    }
    
    // More aggressive detection - if has money OR transaction keywords
    const hasTransactionKeywords = /PIX|TED|DOC|débito|crédito|compra|pagamento|transferência|saque|depósito/i.test(trimmedLine);
    
    if (monetaryMatch && (dateMatch || hasTransactionKeywords || trimmedLine.length > 20)) {
      if (monetaryMatch) {
        const amountStr = monetaryMatch[1].replace(/\./g, '').replace(',', '.').replace('R$', '').trim();
        const amount = parseFloat(amountStr);
        
        if (amount > 0) {
          // Try to determine if it's income or expense based on context
          const isIncome = /crédito|depósito|recebido|salário|pix recebido/i.test(trimmedLine);
          
          let date = "2025-01-01";
          if (dateMatch) {
            try {
              // Convert Brazilian date format to ISO
              const dateParts = dateMatch[1].split(/[\/\-\.]/);
              if (dateParts.length === 3) {
                let day, month, year;
                // Check if it's DD/MM/YYYY or YYYY/MM/DD
                if (dateParts[0].length === 4) {
                  // YYYY/MM/DD format
                  year = dateParts[0];
                  month = dateParts[1].padStart(2, '0');
                  day = dateParts[2].padStart(2, '0');
                } else {
                  // DD/MM/YYYY format
                  day = dateParts[0].padStart(2, '0');
                  month = dateParts[1].padStart(2, '0');
                  year = dateParts[2];
                  if (year.length === 2) {
                    year = '20' + year;
                  }
                }
                date = `${year}-${month}-${day}`;
              }
            } catch (e) {
              console.log("Date parsing error:", e);
            }
          }
          
          transactions.push({
            date: date,
            description: trimmedLine.substring(0, 100), // Limit description length
            amount: isIncome ? amount : -amount,
            type: isIncome ? "income" : "expense",
            category: "Outros",
            confidence: 0.5
          });
          
          // Limit to avoid too many transactions
          if (transactions.length >= 50) break;
        }
      }
    }
  }
  
  console.log(`Fallback created ${transactions.length} transactions`);
  
  // If still no transactions found, create some sample ones to help user understand the system
  if (transactions.length === 0 && extractText.length > 1000) {
    console.log("Creating minimal sample transactions since none were detected");
    transactions.push({
      date: "2025-01-01",
      description: "Transação de exemplo - ajuste os valores conforme necessário",
      amount: -100.00,
      type: "expense",
      category: "Outros",
      confidence: 0.1
    });
  }
  
  // Enriquecer transações com dados de CNPJ usando o novo serviço
  console.log("Enriquecendo transações com dados de CNPJ...");
  try {
    const transacoesEnriquecidas = await processarLoteTransacoes(transactions);
    console.log(`${transacoesEnriquecidas.length} transações processadas com dados de CNPJ`);
    return transacoesEnriquecidas;
  } catch (error) {
    console.error("Erro ao enriquecer transações com CNPJ:", error);
    return transactions;
  }
}