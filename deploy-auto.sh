#!/bin/bash

# 🚀 Script de Deploy Automático para Vercel
# Este script automatiza o processo de deploy sempre que houver alterações

echo "🔄 Iniciando deploy automático..."

# Verificar se há alterações
if [[ -n $(git status --porcelain) ]]; then
  echo "📝 Alterações detectadas. Fazendo commit..."
  
  # Adicionar todas as alterações
  git add -A
  
  # Commit com timestamp
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "🚀 Auto-deploy: $TIMESTAMP"
  
  # Push para o repositório
  echo "📤 Enviando alterações para o GitHub..."
  git push origin main
  
  echo "✅ Deploy automático concluído!"
  echo "🌐 Seu app será atualizado no Vercel em alguns minutos."
else
  echo "ℹ️  Nenhuma alteração detectada."
fi