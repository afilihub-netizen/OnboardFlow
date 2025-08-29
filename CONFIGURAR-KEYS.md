# 🔑 **CONFIGURAÇÃO DE CHAVES DE API - SISTEMA FUNCIONANDO!**

## ✅ **STATUS: SISTEMA OPERACIONAL**
Todas as funcionalidades do sistema estão funcionando perfeitamente! As configurações podem ser gerenciadas de duas formas:

### 🎯 **MÉTODO 1: INTERFACE WEB** (Recomendado)
1. **Acesse**: `/settings` no sistema
2. **Configure** todas as chaves diretamente pela interface
3. **Teste** conexões com um clique
4. **Salve** com criptografia automática

### 🎯 **MÉTODO 2: VARIÁVEIS DE AMBIENTE** (Tradicional)
Adicione essas variáveis no seu ambiente:

```bash
# 🗄️ BANCO DE DADOS (Obrigatório)
DATABASE_URL=postgresql://user:password@host:port/database

# 🔒 SESSÃO (Obrigatório)
SESSION_SECRET=sua-chave-secreta-super-aleatoria

# 💳 STRIPE (Obrigatório para pagamentos)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# 🤖 IA (Opcional - melhora muito a experiência)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=sua_chave_gemini

# 📄 DOCUMENTOS (Opcional - OCR avançado)
GOOGLE_APPLICATION_CREDENTIALS=base64_do_service_account_json

# 📧 EMAIL (Opcional - notificações)
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=seu@email.com
```

## 🚀 **COMO OBTER CADA CHAVE:**

### 💳 **STRIPE** 
1. Vá para [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. **STRIPE_SECRET_KEY**: Copie "Secret key" (sk_test_...)
3. **VITE_STRIPE_PUBLIC_KEY**: Copie "Publishable key" (pk_test_...)

### 🤖 **OPENAI**
1. Vá para [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Clique "Create new secret key"
3. **OPENAI_API_KEY**: Copie a chave (sk-...)

### 🧠 **GEMINI (Google)**
1. Vá para [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Clique "Create API Key"
3. **GEMINI_API_KEY**: Copie a chave

### 📄 **GOOGLE DOCUMENT AI** (Opcional)
1. Vá para [console.cloud.google.com](https://console.cloud.google.com)
2. Crie projeto → Ative "Document AI API"
3. Crie Service Account → Baixe JSON
4. **GOOGLE_APPLICATION_CREDENTIALS**: Converta JSON para base64:
   ```bash
   base64 -i service-account.json
   ```

### 📧 **BREVO** (Ex-SendinBlue)
1. Vá para [app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
2. **BREVO_API_KEY**: Copie "API Key" (xkeysib-...)
3. **BREVO_SENDER_EMAIL**: Use um email verificado na sua conta

## 🎯 **RECURSOS DISPONÍVEIS:**

| Funcionalidade | Sem Chaves | Com Chaves Básicas | Com Todas |
|----------------|------------|-------------------|-----------|
| ✅ Transações | ✓ | ✓ | ✓ |
| ✅ Categorização | Manual | Manual | **Automática** |
| ✅ PDF Import | ✓ | ✓ | **Melhorado** |
| ✅ Insights IA | - | **Limitado** | **Completo** |
| ✅ Pagamentos | - | ✓ | ✓ |
| ✅ Notificações | - | - | ✓ |

## 🔧 **CONFIGURAÇÃO RÁPIDA:**

**Para uso básico** (mínimo necessário):
```bash
DATABASE_URL=sua_database_url
SESSION_SECRET=uma-chave-aleatoria-aqui
```

**Para uso completo** (recomendado):
```bash
DATABASE_URL=sua_database_url
SESSION_SECRET=uma-chave-aleatoria-aqui
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
OPENAI_API_KEY=sk-...
```

## 📱 **TESTE O SISTEMA:**

1. **Faça login** no sistema
2. **Importe um PDF** para testar extração
3. **Acesse `/settings`** para configurar chaves
4. **Teste conexões** com o botão "Testar"

---

**💡 DICA**: O sistema funciona perfeitamente mesmo sem todas as chaves. Configure apenas o que precisar e adicione outras posteriormente conforme a necessidade!