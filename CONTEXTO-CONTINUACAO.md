# Contexto de Continuação — Equipe Ademilson

**Gerado em:** 2026-09-13
**Objetivo:** Conectar redes sociais ao projeto via OAuth

---

## Estado Atual

### Plataformas Integradas (código pronto)
| Plataforma | Status do Código | OAuth Configurado | Conta Conectada |
|------------|-----------------|-------------------|-----------------|
| YouTube | ✅ Pronto | ❌ Sem GOOGLE_CLIENT_ID | ❌ |
| Instagram | ✅ Pronto | ❌ Sem INSTAGRAM_CLIENT_ID | ❌ |
| Facebook | ✅ Pronto | ✅ Novo Client ID configurado | ⏳ Aguardando autorização |
| TikTok | ✅ Pronto | ❌ Sem TIKTOK_CLIENT_KEY | ❌ |
| Pinterest | ✅ Pronto | ❌ Sem PINTEREST_CLIENT_ID | ❌ |
| Reddit | ✅ Pronto | ❌ Sem REDDIT_CLIENT_ID | ❌ |

### Credenciais Configuradas na Vercel
| Variável | Status |
|----------|--------|
| FACEBOOK_CLIENT_ID | ✅ `1589072832596532` (app "Equipe Ademilson v2") |
| FACEBOOK_CLIENT_SECRET | ✅ Configurado |
| TOKEN_ENCRYPTION_KEY | ✅ Configurado |
| NEXT_PUBLIC_SITE_URL | ✅ `https://equipe-ademilson.vercel.app` |
| ADMIN_PASSWORD | ✅ Alterado (não é mais admin123) |

### Redirect URI (todas as plataformas)
```
https://equipe-ademilson.vercel.app/api/social-accounts/callback
```

---

## Última Ação Realizada

1. ✅ Deploy com novo Client ID do Facebook (`1589072832596532`)
2. ✅ URL OAuth gerada com escopos diretos (sem config_id)
3. ⏳ **Aguardando usuário autorizar o Facebook na URL**

### URL OAuth do Facebook (pendente de autorização)
O usuário precisa abrir a URL gerada pelo endpoint:
```
GET /api/social-accounts?connect=true&platform=facebook
```
E autorizar o app no Facebook.

---

## O Que Fazer Quando o Usuário Autorizar o Facebook

### Passo 1: Verificar se a conta foi conectada
```bash
# Testar se a conta está conectada
$headers = @{Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:<SENHA_NOVA>"))}
Invoke-RestMethod -Uri "https://equipe-ademilson.vercel.app/api/social-accounts?status=true" -Headers $headers
```

### Passo 2: Testar se o token funciona
```bash
# Testar conexão
Invoke-RestMethod -Uri "https://equipe-ademilson.vercel.app/api/social-accounts" -Headers $headers -Method POST -Body '{"action":"test_connection","platform":"facebook"}' -ContentType "application/json"
```

### Passo 3: Verificar se as páginas estão acessíveis
O callback busca páginas em:
```
GET https://graph.facebook.com/v19.0/me/accounts?access_token={token}
```

---

## Instagram — Configuração Pendente

### App Criado
- **Nome:** Equipe Ademilson v2-IG
- **App ID:** `920022120747191`
- **Plataforma:** Meta for Developers

### O Que Precisa Ser Feito
1. Adicionar permissões: `instagram_basic`, `instagram_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_messages`
2. Gerar token de acesso (botão "Gerar tokens de acesso")
3. Configurar URL de callback: `https://equipe-ademilson.vercel.app/api/social-accounts/callback`
4. Criar Configuration no Facebook Login for Business (se necessário)
5. Copiar o Configuration ID (se necessário)
6. Publicar o app (status "Live")

### Variáveis de Ambiente Necessárias
```
INSTAGRAM_CLIENT_ID=920022120747191
INSTAGRAM_CLIENT_SECRET=<chave secreta do painel>
INSTAGRAM_CONFIG_ID=<Configuration ID (se usar Facebook Login for Business)>
```

---

## Facebook Login for Business — Nota

O usuário mencionou que o app pode precisar migrar para **Facebook Login for Business** (config_id em vez de scope). Se o fluxo atual com escopos diretos não funcionar:

1. Criar Configuration em: App Dashboard → Facebook Login for Business → Configurations
2. Copiar o Configuration ID
3. Adicionar variável: `FACEBOOK_CONFIG_ID=<ID>`
4. Atualizar código em `src/app/api/social-accounts/route.ts`:
   - Trocar `scope: config.scopes.join(" ")` por `config_id: process.env.FACEBOOK_CONFIG_ID`
   - Adicionar `override_default_response_type: "true"`

---

## Segurança Implementada

| Fix | Status |
|-----|--------|
| OAuth nonce (state criptográfico) | ✅ Ativo |
| Criptografia AES-256-GCM dos tokens | ✅ Ativo |
| Senha admin trocada | ✅ Nova senha configurada |
| Pinterest Content-Type corrigido | ✅ Ativo |
| Tokens não duplicados no platform_config | ✅ Ativo |
| Idempotência antes de publicar | ✅ Ativo |

---

## Comandos Úteis

```bash
# Ver variáveis de ambiente
vercel env ls

# Ver status das contas conectadas
$headers = @{Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:<SENHA>"))}
Invoke-RestMethod -Uri "https://equipe-ademilson.vercel.app/api/social-accounts?status=true" -Headers $headers

# Gerar URL de conexão para qualquer plataforma
Invoke-RestMethod -Uri "https://equipe-ademilson.vercel.app/api/social-accounts?connect=true&platform=facebook" -Headers $headers

# Forçar deploy
vercel --prod --yes
```

---

## Arquivos Importantes

| Arquivo | Função |
|---------|--------|
| `src/app/api/social-accounts/route.ts` | API principal de redes sociais, geração de URL OAuth |
| `src/app/api/social-accounts/callback/route.ts` | Callback OAuth, troca de code por token |
| `src/lib/db.ts` | Funções do banco (social_accounts, platform_config) |
| `src/lib/crypto.ts` | Criptografia de tokens (AES-256-GCM) |
| `src/app/admin/acquisition/content-engine/page.tsx` | UI do Content Engine com aba "Conectar Redes" |

---

## Plataformas Restantes (para configurar depois)

### Google/YouTube
- Criar projeto em: console.cloud.google.com
- Habilitar: YouTube Data API v3
- Criar: OAuth 2.0 Client ID
- Variáveis: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### TikTok
- Criar app em: developers.tiktok.com
- Habilitar: Login Kit + Video Kit
- Variáveis: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

### Pinterest
- Criar app em: developers.pinterest.com
- Habilitar: Pinterest API v5
- Variáveis: `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`

### Reddit
- Criar app em: reddit.com/prefs/apps
- Tipo: web app
- Variáveis: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`

---

## Email para Todas as Plataformas
```
equipeademilson@gmail.com
```

---

## Prioridade Imediata

1. **URGENTE:** Usuário autorizar o Facebook na URL OAuth
2. **DEPOIS:** Configurar Instagram (app já criado)
3. **DEPOIS:** Configurar YouTube, TikTok, Pinterest, Reddit
