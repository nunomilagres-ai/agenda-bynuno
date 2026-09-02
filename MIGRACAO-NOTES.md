# Migração: notes.bynuno.com → agenda.bynuno.com

O Notes foi fundido nesta app. As tabelas (`note_topics`, `notes`,
`note_reminders`) e os endpoints (`/api/notes`, `/api/note-topics`,
`/api/note-reminders`, `/api/ai`) já cá estão — o deploy cria as tabelas
sozinho ao correr o `schema.sql`.

Falta **copiar os dados** da base de dados do Notes para a da Agenda. Isto é um
passo manual e único, porque são duas bases de dados D1 distintas e nenhuma
consegue ler a outra por SQL.

## Porque é que isto é simples

Nas duas apps o `user_id` gravado é o **id do utilizador no byNuno Hub** (ver
`functions/_auth.js`, que era ficheiro igual nos dois repositórios). As linhas do
Notes entram por isso tal como estão — não há ids a remapear nem a reconciliar.

Não há choque de nomes de tabelas: a Agenda tem `users`, `locations`,
`location_periods`, `events`, `event_exceptions`; o Notes traz `note_topics`,
`notes`, `note_reminders`.

## Passos

Correr localmente, com o `wrangler` autenticado na conta Cloudflare (`npx
wrangler login`):

```bash
# 1. Salvaguarda das duas bases de dados, antes de tocar em nada
npx wrangler d1 export agenda-bynuno-db --remote --output backup-agenda-$(date +%F).sql
npx wrangler d1 export notes-bynuno-db  --remote --output backup-notes-$(date +%F).sql

# 2. Exportar só os dados das três tabelas do Notes (sem o esquema:
#    as tabelas já foram criadas do lado da Agenda pelo deploy)
npx wrangler d1 export notes-bynuno-db --remote --no-schema \
  --table note_topics --table notes --table note_reminders \
  --output notes-dados.sql

# 3. Importar na base de dados da Agenda
npx wrangler d1 execute agenda-bynuno-db --remote --file=./notes-dados.sql

# 4. Conferir as contagens (devem bater certo com as do Notes)
npx wrangler d1 execute agenda-bynuno-db --remote --command \
  "SELECT (SELECT COUNT(*) FROM note_topics) AS temas, (SELECT COUNT(*) FROM notes) AS notas, (SELECT COUNT(*) FROM note_reminders) AS lembretes"
```

Se o passo 3 falhar a meio, a base de dados fica num estado parcial: apagar as
três tabelas (`DELETE FROM note_reminders; DELETE FROM notes; DELETE FROM
note_topics;`) e repetir — o export é sempre um ficheiro de `INSERT`s completo,
por isso pode ser reaplicado do zero.

## Segredo a configurar

O `/api/ai` (sugestão de conteúdo a partir de foto de nota manuscrita) precisa
da chave que estava no projeto do Notes:

```bash
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name agenda-bynuno
```

Sem ela, tudo o resto funciona — só essa funcionalidade devolve erro 500 a
dizer que a chave não está configurada.

## Depois de confirmado

1. Apontar `notes.bynuno.com` para `agenda.bynuno.com` (redirect no painel da
   Cloudflare, no projeto Pages do Notes: *Redirect Rules* → 301 para
   `https://agenda.bynuno.com/notas`).
2. Arquivar o repositório `nunomilagres-ai/notes-bynuno` no GitHub.
3. Só depois disso apagar a `notes-bynuno-db` — mantê-la uns dias é a rede de
   segurança mais barata que há.
