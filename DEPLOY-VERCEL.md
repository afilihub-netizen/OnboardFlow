# 🚀 Deploy FinanceFlow na Vercel

## Pré-requisitos

1. **Conta Vercel**: Crie em [vercel.com](https://vercel.com)
2. **Repositório Git**: Código deve estar no GitHub/GitLab/Bitbucket
3. **Chaves Stripe**: Obtenha em [dashboard.stripe.com](https://dashboard.stripe.com/apikeys)

## 📋 Passo a Passo

### 1. Preparar Repositório
```bash
# Adicionar arquivos necessários ao Git
git add vercel.json api/ client/package.json .env.example
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Conectar na Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique **"Add New Project"**
3. **Import Git Repository**: Selecione seu repositório
4. **Framework Preset**: Selecione "Other"
5. **Build and Output Settings**:
   - Build Command: `npm run vercel-build`
   - Output Directory: `client/dist`
   - Install Command: `npm install`

### 3. Configurar Database

1. Na dashboard do projeto na Vercel:
2. Vá em **Storage** → **Browse Marketplace**
3. Selecione **Neon** (PostgreSQL serverless)
4. Clique **Add Integration**
5. A variável `DATABASE_URL` será criada automaticamente

### 4. Configurar Environment Variables

Na dashboard Vercel → **Settings** → **Environment Variables**:

```bash
# Obrigatórias
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...
SESSION_SECRET=generate-random-string-here

# Opcionais (melhoram funcionalidade)
GOOGLE_APPLICATION_CREDENTIALS=base64-encoded-service-account-json
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...
```

### 5. Deploy

1. Clique **"Deploy"** na Vercel
2. Aguarde o build (3-5 minutos)
3. Teste em: `https://seu-projeto.vercel.app`

## 🔧 Configurações Especiais

### Stripe Webhooks
Após deploy, configure webhook na Stripe:
- **URL**: `https://seu-projeto.vercel.app/api/stripe/webhook`
- **Eventos**: `invoice.payment_succeeded`, `customer.subscription.deleted`

### Database Schema
Execute uma vez após deploy:
```bash
# Localmente ou via Neon console
npm run db:push
```

### Google Document AI (Opcional)
1. Crie projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Ative Document AI API
3. Crie Service Account
4. Baixe JSON key
5. Encode em Base64: `base64 -i service-account.json`
6. Cole no environment variable `GOOGLE_APPLICATION_CREDENTIALS`

## 🎯 URLs Finais

- **App**: `https://seu-projeto.vercel.app`
- **API**: `https://seu-projeto.vercel.app/api/health`
- **Assinaturas**: `https://seu-projeto.vercel.app/subscription`

## 🔍 Troubleshooting

### Erro 500 na API
- Verifique environment variables
- Teste database connection
- Veja logs na Vercel dashboard

### Erro de Build
- Confirme `client/package.json` existe
- Verifique sintaxe do `vercel.json`
- Logs estão na aba **Functions**

### Stripe não funciona
- Confirme keys públicas e privadas
- Teste com Stripe test keys primeiro
- Configure webhooks corretamente

## 📊 Limitações Vercel

- **Hobby Plan**: 100GB bandwidth/mês
- **Serverless Functions**: 10s timeout
- **Database**: Via marketplace (Neon gratuito: 0.5GB)
- **File Upload**: 4.5MB por request

Para projetos grandes, considere upgrade para Pro ($20/mês).