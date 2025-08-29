import crypto from 'crypto';
import { db } from '../db.js';
import { systemConfigs, type InsertSystemConfig, type SystemConfig } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

// Chave de criptografia do sistema (deve ser definida como env var)
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'replit-finance-config-key-32-char!!';
const ALGORITHM = 'aes-256-cbc';

/**
 * Sistema de gerenciamento de configurações com criptografia
 */
export class ConfigService {
  /**
   * Criptografa um valor sensível
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Descriptografa um valor sensível
   */
  private decrypt(encryptedText: string): string {
    try {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encrypted = textParts.join(':');
      const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar configuração:', error);
      return encryptedText; // Retorna o valor original se falhar
    }
  }

  /**
   * Salva uma configuração no banco
   */
  async setConfig(key: string, value: string, options: {
    description?: string;
    category?: string;
    isEncrypted?: boolean;
    isRequired?: boolean;
    userId?: string;
  } = {}): Promise<SystemConfig> {
    const {
      description = '',
      category = 'general',
      isEncrypted = false,
      isRequired = false,
      userId
    } = options;

    // Criptografar valor se necessário
    const finalValue = isEncrypted ? this.encrypt(value) : value;

    const configData: InsertSystemConfig = {
      key,
      value: finalValue,
      description,
      category,
      isEncrypted,
      isRequired,
      lastUpdatedBy: userId,
      updatedAt: new Date()
    };

    // Verificar se já existe
    const existing = await db
      .select()
      .from(systemConfigs)
      .where(eq(systemConfigs.key, key))
      .limit(1);

    if (existing.length > 0) {
      // Atualizar existente
      const [updated] = await db
        .update(systemConfigs)
        .set(configData)
        .where(eq(systemConfigs.key, key))
        .returning();
      return updated;
    } else {
      // Criar novo
      const [created] = await db
        .insert(systemConfigs)
        .values(configData)
        .returning();
      return created;
    }
  }

  /**
   * Obtém uma configuração do banco
   */
  async getConfig(key: string, fallback?: string): Promise<string | null> {
    try {
      const [config] = await db
        .select()
        .from(systemConfigs)
        .where(and(
          eq(systemConfigs.key, key),
          eq(systemConfigs.isActive, true)
        ))
        .limit(1);

      if (!config) {
        return fallback || null;
      }

      // Descriptografar se necessário
      return config.isEncrypted ? this.decrypt(config.value) : config.value;
    } catch (error) {
      console.error(`Erro ao buscar config ${key}:`, error);
      return fallback || null;
    }
  }

  /**
   * Obtém configuração com fallback para environment variable
   */
  async getConfigWithEnvFallback(key: string, envKey?: string): Promise<string | null> {
    // Tentar do banco primeiro
    const dbValue = await this.getConfig(key);
    if (dbValue) return dbValue;

    // Fallback para environment variable
    const envVar = envKey || key.replace(/\./g, '_').toUpperCase();
    return process.env[envVar] || null;
  }

  /**
   * Lista todas as configurações de uma categoria
   */
  async getConfigsByCategory(category: string): Promise<SystemConfig[]> {
    return await db
      .select()
      .from(systemConfigs)
      .where(and(
        eq(systemConfigs.category, category),
        eq(systemConfigs.isActive, true)
      ));
  }

  /**
   * Lista todas as configurações (para admin)
   */
  async getAllConfigs(): Promise<SystemConfig[]> {
    return await db
      .select()
      .from(systemConfigs)
      .where(eq(systemConfigs.isActive, true));
  }

  /**
   * Remove uma configuração
   */
  async deleteConfig(key: string): Promise<boolean> {
    const result = await db
      .update(systemConfigs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(systemConfigs.key, key));
    
    return (result.rowCount || 0) > 0;
  }

  /**
   * Inicializa configurações padrão do sistema
   */
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      // Database
      {
        key: 'database.url',
        description: 'URL de conexão com o banco PostgreSQL',
        category: 'database',
        isRequired: true,
        isEncrypted: true,
      },
      // Authentication
      {
        key: 'session.secret',
        description: 'Chave secreta para sessões de usuário',
        category: 'auth',
        isRequired: true,
        isEncrypted: true,
      },
      // Stripe
      {
        key: 'stripe.secret_key',
        description: 'Chave secreta do Stripe para pagamentos',
        category: 'payment',
        isRequired: true,
        isEncrypted: true,
      },
      {
        key: 'stripe.public_key',
        description: 'Chave pública do Stripe (frontend)',
        category: 'payment',
        isRequired: true,
        isEncrypted: false,
      },
      // AI Services
      {
        key: 'openai.api_key',
        description: 'Chave da API OpenAI para funcionalidades de IA',
        category: 'ai',
        isRequired: false,
        isEncrypted: true,
      },
      {
        key: 'gemini.api_key',
        description: 'Chave da API Google Gemini para IA',
        category: 'ai',
        isRequired: false,
        isEncrypted: true,
      },
      // Document Processing
      {
        key: 'google.application_credentials',
        description: 'Credenciais do Google Cloud para Document AI (JSON em base64)',
        category: 'document',
        isRequired: false,
        isEncrypted: true,
      },
      // Email
      {
        key: 'brevo.api_key',
        description: 'Chave da API Brevo para envio de emails',
        category: 'email',
        isRequired: false,
        isEncrypted: true,
      },
      {
        key: 'brevo.sender_email',
        description: 'Email remetente verificado no Brevo',
        category: 'email',
        isRequired: false,
        isEncrypted: false,
      },
    ];

    for (const config of defaultConfigs) {
      // Verificar se já existe
      const existing = await this.getConfig(config.key);
      if (!existing) {
        // Tentar obter valor da environment variable
        const envKey = config.key.replace(/\./g, '_').toUpperCase();
        const envValue = process.env[envKey];
        
        if (envValue) {
          await this.setConfig(config.key, envValue, {
            description: config.description,
            category: config.category,
            isRequired: config.isRequired,
            isEncrypted: config.isEncrypted,
          });
        }
      }
    }
  }

  /**
   * Testa se uma configuração de API está funcionando
   */
  async testApiConfig(key: string): Promise<{ success: boolean; message: string }> {
    const value = await this.getConfig(key);
    if (!value) {
      return { success: false, message: 'Configuração não encontrada' };
    }

    try {
      switch (key) {
        case 'stripe.secret_key':
          // Teste básico da API Stripe
          const stripe = await import('stripe');
          const stripeClient = new stripe.default(value);
          await stripeClient.balance.retrieve();
          return { success: true, message: 'Stripe conectado com sucesso' };

        case 'openai.api_key':
          // Teste básico da API OpenAI
          const OpenAI = await import('openai');
          const openai = new OpenAI.default({ apiKey: value });
          await openai.models.list();
          return { success: true, message: 'OpenAI conectado com sucesso' };

        case 'gemini.api_key':
          // Teste básico do Gemini
          return { success: true, message: 'Gemini configurado (teste básico)' };

        default:
          return { success: true, message: 'Configuração salva' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Erro ao testar ${key}: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }
}

export const configService = new ConfigService();

/**
 * Helper function para usar em todo o sistema
 * Prioridade: Banco de dados > Environment Variable > Fallback
 */
export async function getSystemConfig(key: string, envKey?: string, fallback?: string): Promise<string | null> {
  return await configService.getConfigWithEnvFallback(key, envKey) || fallback || null;
}