# 🚀 Sistema de Deploy Automático - Vercel + GitHub

## ✅ **CONFIGURAÇÃO COMPLETA EM 5 PASSOS**

### 1️⃣ **Conectar ao GitHub** (Primeira vez apenas)

```bash
# No terminal do Replit, execute:
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git branch -M main
git push -u origin main
```

### 2️⃣ **Configurar Secrets no GitHub**

1. Vá para **GitHub** → **Settings** → **Secrets and variables** → **Actions**
2. Adicione estas secrets:

```bash
VERCEL_TOKEN=seu_token_vercel_aqui
VERCEL_ORG_ID=seu_org_id_aqui  
VERCEL_PROJECT_ID=seu_project_id_aqui
```

**Como obter os tokens:**
- **VERCEL_TOKEN**: [vercel.com/account/tokens](https://vercel.com/account/tokens)
- **VERCEL_ORG_ID** e **PROJECT_ID**: Execute `vercel link` no projeto

### 3️⃣ **Deploy Inicial no Vercel**

1. Acesse [vercel.com/new](https://vercel.com/new)
2. **Import** seu repositório GitHub
3. **Framework Preset**: "Other"
4. **Build Settings**:
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install && cd client && npm install`

### 4️⃣ **Configurar Environment Variables no Vercel**

Na dashboard do projeto → **Settings** → **Environment Variables**:

```bash
# Obrigatórias
DATABASE_URL=sua_database_url
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...
SESSION_SECRET=sua_chave_secreta_aqui

# Opcionais (melhoram funcionalidade)
OPENAI_API_KEY=sk-...
GOOGLE_APPLICATION_CREDENTIALS=base64_encoded_json
```

### 5️⃣ **Usar Deploy Automático**

Agora toda vez que quiser fazer deploy:

```bash
# Opção 1: Script automático
./deploy-auto.sh

# Opção 2: Manual
git add -A
git commit -m "Atualizações do sistema"
git push origin main
```

## 🔄 **Como Funciona o Sistema Automático**

1. **Você faz alterações** no código no Replit
2. **Executa `./deploy-auto.sh`** ou faz push manual
3. **GitHub Actions** detecta as mudanças 
4. **Deploy automático** acontece no Vercel
5. **App atualizado** em 2-3 minutos ✅

## 🛠️ **Comandos Úteis**

```bash
# Ver status do Git
git status

# Deploy rápido
./deploy-auto.sh

# Verificar logs de deploy
# (acesse GitHub Actions ou Vercel Dashboard)
```

## ✨ **Vantagens do Sistema**

- ✅ **Deploy automático** a cada push
- ✅ **Zero configuração** após setup inicial
- ✅ **Rollback fácil** via Vercel dashboard
- ✅ **Logs detalhados** para debugging
- ✅ **CDN global** para velocidade

## 🔍 **Troubleshooting**

**Erro no GitHub Actions?**
```bash
# Verifique se as secrets estão configuradas
git push origin main --verbose
```

**Erro no Vercel?**
```bash
# Verifique environment variables
# Logs estão em: vercel.com/dashboard
```

**Script não executa?**
```bash
chmod +x deploy-auto.sh
./deploy-auto.sh
```

---

## 📋 **Status Atual**

- ✅ vercel.json configurado
- ✅ GitHub Actions configurado  
- ✅ Script de deploy criado
- ⏳ **Próximo**: Conectar repositório GitHub