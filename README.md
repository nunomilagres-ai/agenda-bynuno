# agenda.bynuno.com

Calendário pessoal estilo Outlook: vista mensal, células coloridas por localização (Porto, Lisboa, Vila Real, ...) e eventos correntes.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Cloudflare Pages Functions
- **Base de dados**: Cloudflare D1 (SQLite)
- **Auth**: Cookie partilhado `Domain=.bynuno.com` → valida em `bynuno.com/api/auth/me`

## Conceitos

- **Localizações**: criadas por ti (nome + cor) — Porto, Lisboa, Vila Real, ou outras.
- **Períodos de localização**: marca "estarei em X de A a B" — tinge as células desses dias na grelha, sem criar um evento. Marca-se arrastando sobre os dias na grelha (o intervalo fica logo preenchido, só falta escolher a localização).
- **Eventos**: reuniões/compromissos correntes, opcionalmente associados a uma localização (cor do chip). Podem repetir-se (semanal, quinzenal, de 3 em 3 semanas, mensal, anual) — ver "Recorrência" abaixo.
- **Feriados**: os 13 feriados nacionais obrigatórios (incluindo os móveis, calculados a partir da Páscoa) e o feriado municipal de Santo António (Lisboa e Vila Real) aparecem automaticamente a vermelho na grelha. Fins de semana têm um fundo ligeiramente diferente.
- **Impressão**: botão de imprimir no cabeçalho; a impressão/PDF força sempre o tema claro e esconde os controlos, independentemente do tema do ecrã.

### Recorrência

Um evento recorrente é guardado como uma única linha na base de dados (a primeira
ocorrência); as ocorrências seguintes são calculadas em runtime por
`functions/_recurrence.js`, nunca gravadas. Simplificação assumida: editar ou apagar
qualquer ocorrência edita/apaga a série inteira — não há edição de uma ocorrência
isolada ("só este evento" vs. "todos").

## Deploy (automático)

Publicado automaticamente via GitHub Actions (`.github/workflows/deploy.yml`) a cada
alteração em `master`: cria a base de dados D1 se ainda não existir, corre o schema,
faz build e publica no Cloudflare Pages, incluindo o domínio `agenda.bynuno.com`.

Único passo manual (uma única vez): adicionar o secret `CLOUDFLARE_API_TOKEN` nas
definições do repositório GitHub (Settings → Secrets and variables → Actions).
Token criado em dash.cloudflare.com/profile/api-tokens usando o template
"Edit Cloudflare Workers".

## Setup manual (alternativa/local)

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar base de dados D1
```bash
npx wrangler d1 create agenda-bynuno-db
# Copiar o database_id para wrangler.toml
npx wrangler d1 execute agenda-bynuno-db --file=./schema.sql
```

### 3. Atualizar wrangler.toml
Substituir `REPLACE_WITH_YOUR_D1_DATABASE_ID` pelo ID gerado no passo anterior.

### 4. Desenvolvimento local
```bash
npm run build
npx wrangler pages dev ./dist --d1 DB=<database_id>
```

### 5. Deploy manual
```bash
npm run build
npx wrangler pages deploy ./dist
```

## Estrutura
```
functions/
  _auth.js                    Auth helper (delega ao bynuno.com hub)
  _recurrence.js               Expande eventos recorrentes num intervalo de datas
  [[path]].js                 SPA fallback
  api/
    auth/me.js                GET /api/auth/me
    auth/logout.js            POST /api/auth/logout
    locations/index.js        GET/POST /api/locations
    locations/[id].js         PUT/DELETE /api/locations/:id
    location-periods/index.js GET/POST /api/location-periods
    location-periods/[id].js  PUT/DELETE /api/location-periods/:id
    events/index.js           GET/POST /api/events (expande recorrências no GET)
    events/[id].js            GET/PUT/DELETE /api/events/:id

migrations/                   ALTER TABLE aplicados a cada deploy (tolerantes a já aplicados)

src/
  pages/CalendarPage.jsx      Vista mensal principal
  components/
    MonthGrid.jsx             Grelha mensal (arrastar para marcar localização, feriados, fins de semana)
    EventModal.jsx            Criar/editar evento, incl. recorrência
    LocationSidebar.jsx       Gerir localizações e cores
    LocationPeriodModal.jsx   Marcar/editar período de localização
  lib/
    AuthContext.jsx           Context de autenticação
    api.js                    API client
    dateUtils.js              Helpers de datas + grelha mensal
    holidays.js               Feriados nacionais e municipais (Lisboa, Vila Real)
```

## Funcionalidades (v1)
- Vista mensal estilo Outlook, navegação por mês + "Hoje"
- Localizações com cor personalizável, ilimitadas
- Períodos de localização (multi-dia, marcados arrastando na grelha) que tingem os dias correspondentes
- Eventos com dia inteiro ou hora específica, associáveis a uma localização, com recorrência opcional
- Feriados nacionais e municipais (Lisboa, Vila Real) e fins de semana assinalados na grelha
- Impressão/PDF em tema claro, com um botão dedicado
- Autenticação via byNuno Hub (Google OAuth)

## Próximos passos (fora do âmbito da v1)
- Vista semanal/diária
- Sincronização bidirecional com Microsoft Outlook (Microsoft Graph API — requer App Registration no Azure AD)
- Sincronização com Google Calendar
- Editar/apagar uma única ocorrência de um evento recorrente (hoje afeta sempre a série inteira)
