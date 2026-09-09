# CONTEXTO DO PROJETO — Equipe Ademilson
## Última atualização: 2026-09-08

---

## 📋 RESUMO DO PROJETO

**Equipe Ademilson** é um site de divulgação de projetos de gravação de vídeos em primeira pessoa (POV) para treinamento de Inteligência Artificial.

- **URL Produção:** https://equipe-ademilson.com.br
- **URL Vercel:** https://equipe-ademilson.vercel.app/
- **URL Local:** http://localhost:3000
- **Repositório:** https://github.com/ademilsonls81-oss/equipe-ademilson
- **Stack:** Next.js 16, TypeScript, SQLite, Tailwind CSS
- **Plataforma:** Vercel (deploy automático via GitHub)

---

## 🏗️ O QUE JÁ FOI FEITO

### Site Principal
- [x] Página inicial completa (Hero, Como Funciona, Requisitos, FAQ, Formulário)
- [x] Seção "Modelos de Celulares Aprovados" com abas (iOS, Pixel, Samsung)
- [x] Formulário de cadastro com validação
- [x] Painel administrativo (`/admin`)
- [x] Botão flutuante do WhatsApp
- [x] SEO completo (meta tags, OG, Schema.org)
- [x] Sistema de indicação com códigos únicos
- [x] Exportação CSV no admin

### Redes Sociais
- [x] Botões WhatsApp apontam para o grupo: `https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2`
- [x] Kit de Marca (`/kit-de-marca`) — bios, cores, templates, usernames
- [x] Assistente de Configuração (`/assistente-configuracao`) — passo a passo

---

## 📊 CHECKLIST — Implantação de Presença Digital

### FASE 1 — Infraestrutura Base ✅
- [x] Criar arquivo CREDENCIAIS-OFICIAIS.md (template de senhas)
- [x] Definir domínio: equipadedemilson.com.br
- [ ] Criar e-mail oficial da marca (ex: equipe.ademilson@dominio.com)
- [ ] Criar senha mestra e gerenciador de senhas

### FASE 2 — Kit de Marca ✅
- [x] Criar página `/kit-de-marca`
- [x] Definir paleta de cores (azul #1e40af + dourado #f59e0b)
- [x] Criar bios para Instagram, TikTok, YouTube, Facebook
- [x] Criar templates de posts (Apresentação, Celulares, Como Funciona)
- [x] Listar usernames sugeridos
- [ ] Criar/variações de logo (ícone, horizontal, vertical)
- [ ] Criar banner para YouTube (2560x1440)
- [ ] Criar imagem de capa para Facebook (820x312)
- [ ] Criar foto de perfil (400x400)

### FASE 3 — Assistente de Configuração ✅
- [x] Criar página `/assistente-configuracao`
- [x] Criar passo a passo para Instagram Profissional
- [x] Criar passo a passo para Página Facebook
- [x] Criar passo a passo para Conta TikTok
- [x] Criar passo a passo para Canal YouTube
- [x] Criar checklist interativo com progresso

### FASE 4 — Contas Oficiais (criação manual pelo usuário)
- [ ] Criar e-mail oficial da marca
- [ ] Criar Instagram: @equipeademilson (ou variante)
- [ ] Configurar como Conta Profissional
- [ ] Criar Página no Facebook: Equipe Ademilson
- [ ] Criar conta TikTok: @equipeademilson
- [ ] Criar canal YouTube: Equipe Ademilson
- [ ] Configurar foto de perfil em todas as plataformas
- [ ] Configurar bio em todas as plataformas
- [ ] Link do grupo WhatsApp na bio de cada plataforma

### FASE 5 — Conexão via OAuth/API
- [ ] Implementar conexão Instagram via Meta Business API
- [ ] Implementar conexão Facebook via Meta Graph API
- [ ] Implementar conexão TikTok via TikTok Marketing API
- [ ] Implementar conexão YouTube via Google OAuth2
- [ ] Criar painel de status de cada conexão
- [ ] Testar fluxo de autenticação

### FASE 6 — Central de Divulgação (publicação automática)
- [ ] Criar página `/central-divulgacao`
- [ ] Criar sistema de upload de vídeos/imagens
- [ ] Criar agendador de publicações
- [ ] Implementar publicação automática em cada plataforma
- [ ] Criar sistema de cross-posting

### FASE 7 — Conteúdo Inicial
- [ ] Criar 5 posts de apresentação
- [ ] Criar 3 reels/street de exemplo
- [ ] Agendar primeira semana de conteúdo

### FASE 8 — Métricas e Monitoramento
- [ ] Criar dashboard de métricas unificado
- [ ] Conectar APIs de analytics de cada plataforma
- [ ] Criar relatório semanal automático

### FASE 9 — Automação Avançada
- [ ] Criar respostas automáticas no WhatsApp Business
- [ ] Implementar chatbot de primeiros contatos
- [ ] Integrar com sistema de cadastro existente

### FASE 10 — Validação Final
- [ ] Testar publicação em todas as plataformas
- [ ] Verificar links de todos os perfis
- [ ] Testar fluxo completo
- [ ] Documentar processos
- [ ] Treinar usuário no painel

---

## 🔗 LINKS IMPORTANTES

| Recurso | URL |
|---------|-----|
| Site principal | https://equipe-ademilson.com.br |
| Vercel | https://equipe-ademilson.vercel.app/ |
| Admin | https://equipe-ademilson.com.br/admin |
| Kit de Marca | https://equipe-ademilson.com.br/kit-de-marca |
| Assistente | https://equipe-ademilson.com.br/assistente-configuracao |
| GitHub | https://github.com/ademilsonls81-oss/equipe-ademilson |
| Grupo WhatsApp | https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2 |

---

## 🔐 CREDENCIAIS

- **Admin:** `/admin` → senha: `admin123` (definida em `.env.local`)
- **Banco:** SQLite em `./data/equipe-ademilson.db`
- **GitHub:** repo privado com deploy automático na Vercel

---

## ⚠️ IMPORTANTE

1. **NÃO commitar** o arquivo `CREDENCIAIS-OFICIAIS.md` no GitHub
2. **Variáveis de ambiente** na Vercel precisam ser configuradas no painel da Vercel
3. O `.env.local` NÃO é deployado na Vercel
4. O WhatsApp link já está hardcoded nos componentes (não depende de env var)

---

## 🎯 PRÓXIMO PASSO QUANDO CONTINUARMOS

1. Ler este arquivo de contexto
2. Perguntar ao usuário: "Quer continuar de onde paramos? Estamos na Fase 4 — criar as contas oficiais"
3. Se sim, orientar a usar o Assistente de Configuração para criar cada conta
4. Depois implementar a Fase 5 (conexão OAuth)

---

## 📁 ESTRUTURA DO PROJETO

```
equipe-ademilson/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Página principal
│   │   ├── admin/page.tsx        # Painel administrativo
│   │   ├── kit-de-marca/         # Kit de Marca (NOVO)
│   │   ├── assistente-configuracao/ # Assistente (NOVO)
│   │   ├── api/                  # APIs backend
│   │   └── privacidade/          # Política de privacidade
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── WhatsAppButton.tsx
│   │   └── FAQ.tsx
│   └── lib/
│       ├── db.ts                 # Banco SQLite
│       ├── auth.ts               # Autenticação
│       └── utils.ts              # Utilitários
├── data/                         # Banco de dados
├── public/                       # Assets estáticos
├── CHECKLIST-MIDIA.md            # Checklist de mídia
├── CREDENCIAIS-OFICIAIS.md       # Credenciais (NÃO commitar)
└── package.json
```
