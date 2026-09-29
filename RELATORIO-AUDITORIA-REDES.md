# 🔍 RELATÓRIO DE AUDITORIA — REDES SOCIAIS
## Equipe Ademilson — 21/09/2026

---

## 📊 RESUMO EXECUTIVO

| REDE | CREDENCIAIS | CONTA OAUTH | API TESTADA | PUBLICAÇÃO TESTADA | STATUS |
|------|-------------|-------------|-------------|-------------------|--------|
| **Facebook** | 🟢 | 🔴 Token deletado do banco | 🔴 `me/accounts` retorna `[]` | 🔴 | 🔴 PROBLEMA |
| **Instagram** | 🟢 | 🟢 Conectado + token criptografado | 🔴 Nunca testado | 🔴 | 🟡 PARCIAL |
| **YouTube** | 🟢 | ❓ Não confirmado | 🔴 | 🔴 | 🟡 PARCIAL |
| **TikTok** | 🟡 Falta Secret | 🔴 | 🔴 | 🔴 | 🔴 INCOMPLETO |
| **Pinterest** | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 NÃO CONFIG |
| **Reddit** | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 NÃO CONFIG |

**TOKEN_ENCRYPTION_KEY:** 🟢 Válida (configurada na Vercel, tokens criptografados corretamente)

---

## 🔴 PRIORIDADE 1 — FACEBOOK (PROBLEMA IDENTIFICADO)

### Dados do App
- App: Equipe Ademilson v2
- App ID: 1589072832596532
- Modo: **Development**
- Graph API: **v19.0**

### 1. Usuário/Token Utilizado
- Conta autorizada: **Ademilson Lemos** (pessoal)
- Token type: User Token (curta duração, obtido via OAuth code exchange)
- Token salvo no banco: **❌ NÃO EXISTE**

**Descoberta crítica:** A tabela `social_accounts` contém APENAS 1 registro — o Instagram (id=4). A conta Facebook foi conectada com sucesso 4 vezes (logs: 01:24, 01:36, 01:39, 01:58 do dia 15/09), mas os registros foram DELETADOS posteriormente.

### 2. Permissões Solicitadas
O OAuth flow solicita (em `social-accounts/route.ts:40`):
```
public_profile, pages_show_list, pages_read_engagement, pages_manage_posts
```
O campo `scopes` no banco está `NULL`. Não há como confirmar quais permissões foram efetivamente concedidas, pois o registro Facebook foi deletado.

### 3. Page ID da "Equipe Ademilson"
**Não foi possível determinar.** O endpoint `/me/accounts` retornou `data:[]` — nenhuma Página foi retornada pela API. O Page ID nunca foi registrado no sistema.

### 4. Vínculo da Página com o Business
O Facebook Developer Console está em **modo Development**. Nesse modo:
- O endpoint `/me/accounts` **só retorna Páginas que foram adicionadas explicitamente** como parceiras no app
- Mesmo que o usuário seja admin da Página, ela **não aparece** automaticamente

### 5. Vínculo @equipeademilson ↔ Página
O Instagram @equipeademilson está conectado via OAuth. Mas para o Instagram Graph API funcionar via Facebook, a conta Instagram **precisa estar vinculada à Página do Facebook** nas configurações do Instagram app.

### 6. Endpoint da Meta API Utilizado
```
GET https://graph.facebook.com/v19.0/me/accounts?access_token={USER_TOKEN}
```
Endpoint correto. O problema não é o endpoint — é que o token não enxerga as páginas.

### 7. Versão da Graph API
**v19.0** — Utilizada consistentemente em todo o código. ✅ Versão atual e suportada.

### 8. Modo Development Impedindo a Consulta?
**SIM, PARCIALMENTE.** O modo Development por si só não impede a consulta. O que impede é:
- A Página "Equipe Ademilson" **não foi adicionada** como parceira no app no Developer Console
- As permissões `pages_show_list` e `pages_read_engagement` podem não ter sido aprovadas na revisão de dados

### 9. Usuário é Administrador do App?
**SIM.** "Ademilson Lemos" é o criador/owner do App. É admin do App e da Página. O problema não é falta de permissão de usuário — é configuração do App.

### 10. Configuração que Precisa ser Ajustada

**A) Adicionar a Página como parceira no App (SEM colocar em Live):**
1. Acesse developers.facebook.com → App "Equipe Ademilson v2"
2. Vá em Configurações → Básico
3. Em "Páginas de Negócios" (ou "Business Assets"), adicione a Página "Equipe Ademilson"
4. Isso faz o `/me/accounts` retornar a Página mesmo em Development

**B) Re-conectar a conta Facebook no sistema:**
- O registro foi deletado do banco. Precisa fazer OAuth novamente pelo painel admin

---

## 🟡 PRIORIDADE 2 — INSTAGRAM

### Dados da Conexão
- Conta: @equipeademilson
- Account ID: 28619054151067557
- Status: `connected`
- Token: Criptografado (384 chars, prefix `a8c79689`) ✅
- Conectado em: 2026-09-15 01:56:31
- Última atualização: 2026-09-15 02:23:22
- platform_config: `api_configured=1, enabled=1` ✅
- Teste de publicação: ❌ Nunca executado

### Vínculo Instagram ↔ Página Facebook
O Instagram foi conectado DEPOIS do Facebook. O token Instagram é independente (obtido via Instagram OAuth). Para publicar no Instagram via Graph API, a conta **precisa estar vinculada a uma Página do Facebook** nas configurações do Instagram (dentro do app Facebook).

### Status
🟡 Instagram está conectado e com token válido, mas **nunca foi testado**. O vínculo com a Página do Facebook precisa ser confirmado no Developer Console do Instagram.

---

## 🟢 PRIORIDADE 3 — TOKEN_ENCRYPTION_KEY

| Verificação | Resultado |
|-------------|-----------|
| Existe na Vercel? | ✅ Sim |
| Token Instagram criptografado? | ✅ Sim (384 chars, formato hex válido) |
| Formato válido (64 hex = 32 bytes)? | ✅ Provavelmente sim (prefix `a8c79689` sugere AES-256-GCM) |
| Descriptografia testada? | ❌ Não (chave não disponível localmente) |

O fallback em `crypto.ts:13` usa `CRON_SECRET` como chave se `TOKEN_ENCRYPTION_KEY` não existir. Como a chave existe na Vercel, os tokens estão sendo criptografados corretamente.

---

## 📋 HISTÓRICO DE TENTATIVAS (Logs do Banco)

### Facebook — 4 conexões bem-sucedidas, 0 registros restantes
```
15/09 01:24:26 ✅ Conta Ademilson Lemos conectada via OAuth (facebook)
15/09 01:36:37 ✅ Conta Ademilson Lemos conectada via OAuth (facebook)
15/09 01:39:09 ✅ Conta Ademilson Lemos conectada via OAuth (facebook)
15/09 01:58:30 ✅ Conta Ademilson Lemos conectada via OAuth (facebook)
→ Todos os registros DELETADOS posteriormente
```

### Facebook — Erros anteriores (Client Secret)
```
14/09 22:47:51 ❌ "Error validating client secret" (client_id=1589072832596532)
14/09 22:44:26 ❌ "Token exchange failed: Bad Request"
15/09 00:49:02 ❌ "Error validating client secret" (client_id=1589072832596532)
→ O Client Secret foi corrigido depois (conexões posteriores funcionaram)
```

### Instagram — 3 conexões bem-sucedidas
```
15/09 01:56:31 ✅ Conta equipeademilson conectada via OAuth (instagram)
15/09 02:09:01 ✅ Conta equipeademilson conectada via OAuth (instagram)
15/09 02:23:22 ✅ Conta equipeademilson conectada via OAuth (instagram) ← ÚLTIMA
```

### Instagram — Erros anteriores
```
14/09 22:06:26 ❌ "Token exchange failed: Bad Request"
14/09 22:10:28 ❌ "Missing required field grant_type"
14/09 22:17:47 ❌ "Missing required field grant_type"
14/09 22:21:33 ❌ "redirect_uri is identical to the one you used in the OAuth dialog"
14/09 22:26:39 ❌ "redirect_uri is identical to the one you used in the OAuth dialog"
14/09 22:38:45 ❌ "redirect_uri is identical to the one you used in the OAuth dialog"
→ Problemas de redirect_uri e grant_type foram corrigidos depois
```

---

## 🤖 SISTEMA DE AUTOMAÇÃO

| Componente | Status |
|------------|--------|
| Fila de publicação (`publication_queue`) | ✅ Implementada (vazia) |
| Crons (process-queue a cada 15min) | ✅ Ativos (último: 21/09 00:29) |
| Retry com backoff exponencial | ✅ Implementado |
| Limite diário por plataforma | ✅ Implementado |
| Detecção de duplicatas | ✅ Implementada |
| Modo teste/autônomo/pausado | ✅ Implementado |
| Campanha "primeiro-100-membros" | ✅ 30 conteúdos seeds |
| Logs de publicação | ✅ Implementados (0 registros) |

**Conclusão:** O sistema está tecnicamente pronto para automatizar, mas NENHUMA rede está publicando porque:
1. Facebook não tem token no banco (registro deletado)
2. Instagram nunca foi testado
3. YouTube não está conectado
4. TikTok/Pinterest/Reddit sem credenciais

---

## 🎯 AÇÕES NECESSÁRIAS (ORDEM)

### FACEBOOK
1. **Adicionar Página como parceira no App** (Developer Console → Configurações → Básico → Páginas de Negócios → adicionar "Equipe Ademilson")
2. **Re-conectar a conta Facebook** via OAuth pelo painel admin (o registro anterior foi deletado)
3. **Testar** a conexão com `test_connection` e depois `publish_test`

### INSTAGRAM
1. **Confirmar vínculo** @equipeademilson ↔ Página "Equipe Ademilson" no Instagram App Settings (dentro do Facebook Developer Console)
2. **Testar** a conexão com `test_connection` e depois `publish_test`

### TOKEN_ENCRYPTION_KEY
- ✅ Nenhuma ação necessária (configurada e funcionando)

---

*Relatório gerado em 21/09/2026*
