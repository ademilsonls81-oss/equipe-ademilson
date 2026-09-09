# Equipe Ademilson — Renda com Vídeo IA

Plataforma profissional e responsiva para divulgação nacional de oportunidades de participação em projetos de gravação de vídeos em primeira pessoa (POV) utilizados em treinamento de Inteligência Artificial.

## 🚀 Recursos Desenvolvidos

1. **Landing Page Completa e Otimizada**:
   - Hero com CTA claro, badges e mockups visuais modernos em azul escuro e dourado.
   - Seção "Como Funciona" em 4 etapas visuais.
   - Seção "Que tipo de vídeo?" com tarefas cotidianas (POV).
   - Seção "O que você precisa?" detalhando requisitos técnicos com clareza.
   - Seção destacada "É GRATUITO?" reforçando a isenção de taxas (cadastro, participação, saque ou nível).
   - Seção de FAQ (11 perguntas e respostas completas e transparentes).
   - Formulário de cadastro simples com checkbox de aceite de termos e consentimento LGPD.
   - Botões com integração dinâmica ao WhatsApp da equipe.

2. **Sistema de Indicação (Referral System)**:
   - Suporte a links no formato `/entrar?ref=CÓDIGO`.
   - Geração automática de código único por participante cadastrado para compartilhamento.
   - Registro de origem e contagem de indicados no banco de dados.

3. **Painel Administrativo (`/admin`)**:
   - Login com autenticação básica configurável via `.env.local`.
   - Dashboard com estatísticas gerais, cadastros nos últimos 7 dias, distribuição por estado e origem de tráfego.
   - Tabela responsiva com busca rápida por nome, cidade, estado e WhatsApp.
   - Exportação completa em formato CSV dos cadastros realizados.

4. **Analytics e Rastreamento**:
   - Suporte nativo e totalmente configurável para Google Analytics (GA4), Google Tag Manager (GTM) e Meta Pixel via variáveis de ambiente.
   - Eventos integrados: `page_view`, `click_whatsapp`, `form_start`, `form_submit`, `click_como_funciona`, `click_participar`.

5. **SEO & Performance**:
   - Otimizado para buscas sobre *renda com vídeos IA*, *gravar vídeos para IA*, *vídeos POV*, etc.
   - Inclusão de Open Graph, Schema.org (JSON-LD), `sitemap.xml` e `robots.txt` automáticos.

6. **Segurança e LGPD**:
   - Página dedicada de Política de Privacidade (`/privacidade`).
   - Coleta consciente de dados sob consentimento expresso.

---

## 🛠️ Como Configurar e Executar

### Requisitos
- Node.js 18.x ou superior
- NPM ou Yarn

### 1. Instalação de Dependências
Caso vá executar o projeto em uma nova máquina:
```bash
npm install
```

### 2. Configuração de Variáveis de Ambiente
Crie ou altere o arquivo `.env.local` na raiz do projeto:

```env
# WhatsApp oficial da equipe (Com código do país 55 + DDD + número)
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
NEXT_PUBLIC_WHATSAPP_MESSAGE=Olá! Vi sobre a Equipe Ademilson e quero saber mais sobre como participar dos projetos de gravação de vídeos para IA.

# URL principal da aplicação em produção (Sem barra final)
NEXT_PUBLIC_SITE_URL=https://equipadedemilson.com.br

# Analytics (Opcional - deixe em branco se não for utilizar)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789012345

# Credenciais de acesso ao Painel Admin (/admin)
ADMIN_PASSWORD=admin123

# Banco de dados SQLite (caminho onde o banco será criado)
DATABASE_PATH=./data/equipe-ademilson.db
```

### 3. Executando em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.
Para acessar o painel administrativo, vá em `http://localhost:3000/admin`.

### 4. Build e Deploy para Produção

#### Opção A: Vercel / Netlify / Render
Para fazer o deploy em plataformas serverless, certifique-se de configurar as variáveis de ambiente no painel de controle do seu provedor.

#### Opção B: Servidor VPS (Node.js com PM2)
```bash
# Gerar o bundle de produção
npm run build

# Iniciar em produção
npm run start
```

---

## 🔒 Segurança e Avisos Legais

- O Painel Admin pode ser protegido alterando a senha `ADMIN_PASSWORD` no `.env.local`.
- Nenhuma informação de terceiros ou promessas de ganhos garantidos foram incluídas, mantendo a comunicação 100% transparente.
