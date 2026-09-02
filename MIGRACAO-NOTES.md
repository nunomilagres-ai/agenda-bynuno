# Migração: notes.bynuno.com → agenda.bynuno.com

O Notes foi fundido nesta app. As tabelas (`note_topics`, `notes`,
`note_reminders`) e os endpoints (`/api/notes`, `/api/note-topics`,
`/api/note-reminders`, `/api/ai`) já cá estão.

## Estado

- [x] Esquema e API portados (PR #8).
- [x] Dados copiados da `notes-bynuno-db` para a `agenda-bynuno-db` — feito e
      confirmado em 2026-09-02 (8 temas, 41 notas, 18 lembretes).
- [x] Análise de foto de nota a correr em Cloudflare Workers AI, grátis, sem
      chave a configurar (ver abaixo) — já não usa a Anthropic.
- [ ] Redirecionar `notes.bynuno.com` para cá e arquivar o repositório antigo.

## Porque é que a cópia de dados foi simples

Nas duas apps o `user_id` gravado é o **id do utilizador no byNuno Hub** (ver
`functions/_auth.js`, que era ficheiro igual nos dois repositórios). As linhas
do Notes entraram tal como estavam — sem ids a remapear nem a reconciliar.

Os passos usados (para referência, caso seja preciso repetir nalgum outro
ambiente):

```bash
# Salvaguarda das duas bases de dados, antes de tocar em nada
npx wrangler d1 export agenda-bynuno-db --remote --output backup-agenda-$(date +%F).sql
npx wrangler d1 export notes-bynuno-db  --remote --output backup-notes-$(date +%F).sql

# Exportar só os dados das três tabelas do Notes (sem o esquema: as tabelas já
# existem do lado da Agenda, criadas pelo deploy do schema.sql)
npx wrangler d1 export notes-bynuno-db --remote --no-schema \
  --table note_topics --table notes --table note_reminders \
  --output notes-dados.sql

# Importar na base de dados da Agenda
npx wrangler d1 execute agenda-bynuno-db --remote --file=./notes-dados.sql

# Conferir as contagens (devem bater certo com as do Notes)
npx wrangler d1 execute agenda-bynuno-db --remote --command \
  "SELECT (SELECT COUNT(*) FROM note_topics) AS temas, (SELECT COUNT(*) FROM notes) AS notas, (SELECT COUNT(*) FROM note_reminders) AS lembretes"
```

Se o import falhar a meio, a base de dados fica no estado anterior — o próprio
`wrangler` avisa disso e o export pode ser reaplicado do zero sem risco.

## Análise de foto de nota — Cloudflare Workers AI

`/api/ai` (sugestão de título/conteúdo/tema a partir de uma foto de nota
manuscrita) passou a correr no binding `AI` da própria conta Cloudflare
(`@cf/meta/llama-3.2-11b-vision-instruct`), declarado no `wrangler.toml`. Não
precisa de conta nem chave nova — está incluído em qualquer conta Cloudflare,
com 10.000 Neurons/dia grátis, muito acima do que esta funcionalidade gasta a
uso pessoal.

Isto substitui a versão anterior, que dependia da API paga da Anthropic
(`ANTHROPIC_API_KEY`) — já não é preciso configurar esse segredo.

A qualidade da leitura de letra manuscrita é razoável mas inferior à da
Claude; se um dia isso for um problema real, as alternativas ficam registadas
na conversa que levou a esta escolha (Google Gemini tem tier gratuito com
melhor qualidade, mas exige conta e chave à parte; a Claude é paga mas muito
barata a este ritmo de uso).

## Por fazer

1. Apontar `notes.bynuno.com` para `agenda.bynuno.com` (redirect no painel da
   Cloudflare, no projeto Pages do Notes: *Redirect Rules* → 301 para
   `https://agenda.bynuno.com/notas`).
2. Arquivar o repositório `nunomilagres-ai/notes-bynuno` no GitHub.
3. Só depois disso apagar a `notes-bynuno-db` — mantê-la uns dias é a rede de
   segurança mais barata que há.
