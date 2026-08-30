# Regras de design — byNuno

Este ficheiro é a fonte da verdade do design system partilhado por todas as apps byNuno
(Agenda, LEGO, Notes, Cashly, PIM, Hub, Condo). Qualquer IA a trabalhar em qualquer uma
destas apps deve seguir estas regras. Este ficheiro deve ser copiado (e adaptado apenas
no que for específico da app) para o `CLAUDE.md` de cada repositório.

## Tema: escuro por omissão, claro disponível

Segue o tema do sistema operativo/browser do utilizador — **não** há alternador manual.
Implementado com `prefers-color-scheme`: os tokens em `:root` são os valores **escuros**
(o omisso, quando o SO não indica preferência ou prefere escuro); um bloco
`@media (prefers-color-scheme: light)` sobrepõe os valores claros.

```css
:root {
  --bg: #0B0C0E;
  --surface: #17181C;
  --surface-2: #1D1F24;
  --border: #2A2C32;
  --text: #F1F1EF;
  --text-2: #A6A8AE;
  --text-3: #6C6E76;
  --accent: #7098EE;
  --accent-solid: #2E5FCB;   /* fixo nos dois temas — usar em botões de fundo cheio com texto branco */
  --accent-soft: #1C2740;
  --accent-ink: #C6D6FA;
  --danger: #F87171;
  --danger-soft: rgba(248, 113, 113, 0.14);
  --overlay: rgba(0, 0, 0, 0.5);
  --shadow: rgba(0, 0, 0, 0.3);
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #F5F7FB;
    --surface: #FFFFFF;
    --surface-2: #EEF1F8;
    --border: #E2E6EF;
    --text: #131A2A;
    --text-2: #4B5567;
    --text-3: #8A93A6;
    --accent: #2E5FCB;
    --accent-solid: #2E5FCB;
    --accent-soft: #EAF0FC;
    --accent-ink: #1D3D87;
    --danger: #DC2626;
    --danger-soft: rgba(220, 38, 38, 0.08);
    --overlay: rgba(19, 26, 42, 0.35);
    --shadow: rgba(19, 26, 42, 0.08);
  }
}
```

**Regra de uso**: nunca usar cores fixas (`#FFFFFF`, `#131A2A`, etc.) diretamente em
componentes — usar sempre `var(--token)`. É o que garante que a app muda de tema sem
tocar em cada componente.

`--accent-solid` existe porque `--accent` no tema escuro é mais claro (para contraste
sobre fundo escuro) e não garante contraste suficiente com texto branco por cima; usar
`--accent-solid` sempre que o botão tiver fundo cheio de cor e texto branco.

## Tipografia

**Inter** em todo o lado (já usada no LEGO, Notes e Agenda) — via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```
```css
body { font-family: 'Inter', system-ui, sans-serif; }
```

## Paleta

Minimal, estilo Apple: poucos tons, contraste subtil para indicar estado/ação. Sem
paletas "arco-íris" (várias cores vivas lado a lado sem hierarquia). Cores de destaque
(localizações, categorias, etc. escolhidas pelo utilizador) são a exceção — essas são
dados, não tema.

## Padrões de interface

- **Grelhas e cartões consistentes**: `rounded-lg`/`rounded-xl`, bordas subtis
  (`var(--border)`), sem sombras pesadas.
- **Notificações em lista vertical** (padrão de telemóvel), não em grelha.
- **Modais**: fundo `var(--overlay)` a cobrir o ecrã, painel `var(--surface)` com
  `var(--border)`, animação `fade-in` de 0.18s.
- **meta theme-color**: definir os dois, escuro por omissão e claro via media query:
  ```html
  <meta name="theme-color" content="#0B0C0E" />
  <meta name="theme-color" content="#F5F7FB" media="(prefers-color-scheme: light)" />
  ```

## Estado de adoção

| App | Estado |
|---|---|
| Agenda | ✅ Aplicado (30 ago) |
| LEGO | ⏳ Por fazer — piloto: corrigir tamanho inconsistente das imagens dos sets |
| Notes | ⏳ Por fazer |
| Cashly | ⏳ Por fazer — atualmente com paleta "arco-íris", a substituir |
| PIM | ⏳ Por fazer |
| Hub (bynuno.com) | ⏳ Por fazer |
