# 📱 GUIA DE REDES SOCIAIS — Para Agentes

> **IMPORTANTE:** Este guia é para qualquer agente/IA que trabalhar neste projeto.
> Leia ANTES de fazer qualquer ação em redes sociais.

---

## 🚫 REGRAS INEGOCIÁVEIS

1. **NUNCA** publique conteúdo sem autorização explícita do usuário
2. **NUNCA** exponha tokens, secrets ou chaves em logs, mensagens ou arquivos
3. **NUNCA** desconecte uma rede social sem pedir confirmação
4. **NUNCA** crie apps novos — sempre use os existentes
5. **NUNCA** coloque apps em Live sem autorização do usuário

---

## 📊 STATUS ATUAL DAS REDES

| Rede | Client ID | Client Secret | Conta Conectada | Token | Publicação |
|------|-----------|---------------|-----------------|-------|------------|
| Facebook | ✅ `1589072832596532` | ✅ Na Vercel | ✅ Ademilson Lemos (id:6) | ✅ Criptografado | ⏳ Não testado |
| Instagram | ✅ `920022120747191` | ✅ Na Vercel | ✅ @equipeademilson (id:4) | ✅ Criptografado | ⏳ Não testado |
| YouTube | ✅ Na Vercel | ✅ Na Vercel | ❓ Não confirmado | ❓ | ⏳ Não testado |
| TikTok | ✅ `TIKTOK_CLIENT_KEY` | ❌ Falta | ❌ | ❌ | ❌ |
| Pinterest | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reddit | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 COMO TESTAR CONEXÕES

### Opção 1: Painel Admin (Recomendado)
1. Acesse `equipe-ademilson.vercel.app/admin`
2. Senha: (configurada em `ADMIN_PASSWORD` na Vercel)
3. Vá em **Conectar Redes** (ou Content Engine → Networks)
4. Clique **"Testar Conexão"** na rede desejada

### Opção 2: API direta (para agentes)
```bash
# Listar contas e status
curl -u "admin:SENHA" "https://equipe-ademilson.vercel.app/api/social-accounts?status=true"

# Listar contas detalhado
curl -u "admin:SENHA" "https://equipe-ademilson.vercel.app/api/social-accounts?accounts=true"

# Testar conexão de uma conta (substitua <ID> pelo id da conta)
curl -u "admin:SENHA" -X POST "https://equipe-ademilson.vercel.app/api/social-accounts" \
  -H "Content-Type: application/json" \
  -d '{"action":"test_connection","id":<ID>}'
```

### Opção 3: Script local
```bash
node scripts/test-all-networks.js
```
> **Nota:** O script local não consegue descriptografar tokens (falta `TOKEN_ENCRYPTION_KEY`).
> Use a API da Vercel para testes com tokens reais.

---

## 🔑 ARQUITETURA DE SEGURANÇA

### Tokens
- **Criptografia:** AES-256-GCM
- **Chave:** `TOKEN_ENCRYPTION_KEY` (64 hex chars = 32 bytes)
- **Armazenamento:** Tabela `social_accounts.access_token` (criptografado)
- **Descriptografia:** Apenas no servidor Vercel (não local)
- **Fallback local:** `CRON_SECRET` (apenas para dev)

### Tabelas do Banco
```
social_accounts     → Tokens e dados das contas conectadas
platform_config     → Configuração por plataforma (limites, status)
publication_queue   → Fila de publicações
publication_log     → Histórico de publicações
oauth_nonces        → Nonces CSRF para OAuth
agent_logs          → Logs de todas as ações
```

### OAuth Flow
1. Usuário clica "Conectar" no painel admin
2. Sistema gera nonce e armazena no banco (5 min validade)
3. Usuário é redirecionado para a plataforma
4. Autoriza o App
5. Plataforma redireciona para `/api/social-accounts/callback`
6. Sistema valida nonce, troca code por token, criptografa e salva
7. Registra em `social_accounts` e `agent_logs`

---

## 📝 COMO CONECTAR UMA NOVA REDE

### Passo 1: Verificar credenciais
```bash
# Listar env vars na Vercel
vercel env ls
```

### Passo 2: Gerar OAuth URL
O sistema gera automaticamente via `GET /api/social-accounts?connect=true&platform=<PLATAFORMA>`

### Passo 3: Autorizar
O usuário clica no link e autoriza

### Passo 4: Verificar
```bash
# Verificar se a conta foi criada
node scripts/verify-final.js
```

---

## 🐛 PROBLEMAS COMUNS

### "Nenhuma pagina encontrada" (Facebook)
- **Causa:** App em Development + Página não adicionada como Business Asset
- **Solução:** Developer Console → Configurações → Básico → Páginas de Negócios → Adicionar Página

### Token não descriptografa
- **Causa:** `TOKEN_ENCRYPTION_KEY` não configurada ou incorreta
- **Verificar:** `vercel env ls` → procurar `TOKEN_ENCRYPTION_KEY`
- **Formato:** 64 caracteres hexadecimais (0-9, a-f)

### OAuth callback com erro "invalid_nonce"
- **Causa:** Nonce expirou (5 min) ou já foi usado
- **Solução:** Gerar nova URL OAuth (sistema cria nonce automaticamente)

### Cron process_queue falhando
- **Verificar:** `agent_logs` → último erro
- **Causa comum:** Coluna `next_retry` faltando na tabela `publication_queue`
- **Solução:** `ALTER TABLE publication_queue ADD COLUMN next_retry DATETIME DEFAULT NULL`

---

## 📂 SCRIPTS DISPONÍVEIS

| Script | Comando | O que faz |
|--------|---------|-----------|
| Testar todas as redes | `node scripts/test-all-networks.js` | Testa conexão de todas as contas |
| Verificar estado | `node scripts/check-state.js` | Mostra estado atual do banco |
| Verificar schema | `node scripts/check-schema.js` | Lista colunas de todas as tabelas |
| Corrigir schema | `node scripts/fix-schema.js` | Adiciona colunas faltantes |
| Verificar Facebook | `node scripts/verify-facebook.js` | Verifica conta Facebook específica |
| Verificação final | `node scripts/verify-final.js` | Relatório completo pós-operacao |
| Preparar OAuth FB | `node scripts/prepare-facebook-oauth.js` | Gera URL OAuth com nonce válido |

---

## 🔄 PUBLICAÇÃO AUTOMATIZADA

### Fluxo
1. Conteúdo é criado via `content_engine` ou `campaign`
2. Entrada na `publication_queue` com status `draft`
3. Usuário aprova (muda para `approved`) ou agenda (`scheduled`)
4. Cron `process_queue` (a cada 15 min) processa itens pendentes
5. Publica na plataforma via API
6. Registra resultado em `publication_log`

### Limites Diários
| Plataforma | Limite |
|------------|--------|
| YouTube | 2/dia |
| TikTok | 3/dia |
| Instagram | 3/dia |
| Facebook | 3/dia |
| Pinterest | 5/dia |
| Reddit | 2/dia |

### Modos de Operação
- **test:** Apenas aprova itens para revisão manual
- **autonomous:** Publica automaticamente
- **paused:** Não processa nada

---

*Guia atualizado em: 21/09/2026*
