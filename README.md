# 🎮 Central Deadlock

Portal da comunidade brasileira de **Deadlock**, com identidade visual inspirada no **dlbr.gg** (barra lateral, tema escuro, verde-limão) e uma **logo própria** (emblema art déco feito por nós, em SVG).

---

## 📁 Estrutura

```
meu-fansite/
├── index.html
├── style.css
├── heroes-data.js           # Dados dos heróis (nomes, atributos, habilidades)
├── script.js
├── atualizar-noticias.bat   # 2 cliques aqui = busca as notícias do Steam
├── postar-no-discord.bat    # 2 cliques aqui = posta as novidades no Discord
├── README.md
├── .github/workflows/       # Robô que atualiza as notícias todo dia (no GitHub)
├── data/
│   ├── steam-news.js        # Notícias do Steam — GERADO automaticamente
│   └── discord-posted.json  # O que o bot já postou (GERADO automaticamente)
├── tools/
│   ├── update-news.py       # Script que baixa as notícias
│   ├── discord-post.py      # Script que posta no Discord
│   └── make-share.py        # Gera a imagem de compartilhamento
└── assets/
    ├── brand/
    │   ├── favicon.svg        # Ícone da aba do navegador
    │   ├── share.jpg          # Imagem que aparece ao compartilhar o link
    │   ├── library_hero.jpg   # Capa usada no banner da Home
    │   ├── deadlock-cover.jpg # Capa vertical (reserva)
    │   └── deadlock-header.jpg # Banner horizontal (reserva)
    └── heroes/                # 44 artes dos heróis (PNG)
```

---

## 🎨 Identidade visual

- **Barra lateral** com grupos "Deadlock" e "Comunidade"
- Item ativo em **verde-limão** (`#b6f24a`)
- Fundo escuro com **marca d'água** do emblema próprio
- **Logo própria** — um emblema **octogonal (art déco)** com chifres/crânio, que remete ao clima do Deadlock e ao estilo de site de fã (badge). Fica em SVG dentro do `index.html` e é usada na barra lateral, no topo do celular e como marca d'água
- Botão **BAIXAR DEADLOCK** e chip de usuário
- Fontes: Poppins (títulos), Inter (texto), Titan One (nomes dos heróis)

> **Por que não usamos a logo oficial?** O símbolo do jogo é marca registrada da Valve. Em fan site, o mais seguro é usar uma identidade **própria e original** — foi o que fizemos.

---

## 📑 Menu (seções)

**Deadlock:** Home · Heróis · Comparar · Tier List · Notícias · Guias · Builds · Itens do Jogo · Patch Notes · Glossário · Mapa
**Comunidade:** Esports · Ranking · Favoritos · Eventos · Quiz · Meu Perfil · Nosso Discord · Wiki do Deadlock

### Abas novas

- **Comparar** — escolha dois heróis e veja tier, vida, velocidade, win rate e pick rate lado a lado (o melhor valor fica destacado). Botões de **trocar** e **aleatório**.
- **Tier List** — heróis agrupados por tier (S a D) em estandartes; clique para abrir a ficha.
- **Builds** — sugestão de itens por função (Tanque, Suporte, Carry, Assassino, Controle); clique para ver a lista.
- **Mapa** — esquema **ilustrativo** (não é o mapa oficial) com rotas, bases e Midboss clicáveis.
- **Eventos** — calendário da comunidade com botão **Lembrar** (salvo no navegador).
- **Quiz** — "qual herói combina com você?"; ao final, sugere 3 heróis e abre a ficha do campeão.

### Logos dos times (Esports)

Cada time tem um **badge próprio** (feito por nós, não são logos oficiais) com as cores do time. Ficam nos cards de partida e na janela de detalhes.

### Heróis (44)

A aba de heróis usa **estandartes** (bandeirinhas) no estilo do protótipo que você enviou:

- 44 heróis com as **artes reais** (`assets/heroes`), incluindo **Abrams** (PNG)
- **Busca** por nome, **filtro por função** (Tanque, Suporte, Carry, Controle, Assassino) e **ordenação** (A→Z, Z→A, tier, win rate, favoritos)
- **Estrela ★** em cada estandarte para favoritar (aparece na aba **Favoritos** e no perfil)
- **Clique em qualquer herói** para abrir a ficha completa, com abas:
  - **Visão geral** — papel, arquétipo, dificuldade, tier, atributos e estatísticas
  - **Habilidades** — as 4 habilidades com descrição e recarga
  - **Build** — sugestão de itens
  - **Confrontos** — contra quem vai bem e contra quem sofre
- **The Doorman**, **Nurse Harrow** e **Violet** aparecem marcados como **"Em breve"**

> Os textos/atributos dos heróis ficam em **`heroes-data.js`** — é só editar o texto entre aspas que a ficha atualiza.

---

## 📰 Conteúdo clicável (Notícias / Guias / Esports)

Todos os cards da Home, Notícias, Guias e Esports agora são **clicáveis** e abrem uma **janela com o texto completo**. Para editar as matérias, procure no `script.js` os blocos `FEATURED`, `NEWS`, `GUIDES` e `MATCHES`.

---

## 📡 Notícias automáticas do Steam

As abas **Notícias** e **Patch Notes** puxam as publicações **oficiais do Deadlock** direto da Steam (App `1422450`). Nada de escrever na mão!

**Como funciona:**

1. O script `tools/update-news.py` conversa com a API da Steam e salva tudo em `data/steam-news.js`.
2. O site lê esse arquivo e monta os cards sozinho — inclusive escolhendo a **arte do herói** citado na notícia.
3. Se você rodar o site pelo GitHub, o robô `.github/workflows/noticias.yml` faz isso **todo dia às 9h (horário de Brasília)** e salva no repositório.

**Para atualizar na mão (no seu PC):**

- Dê **dois cliques** em `atualizar-noticias.bat` (precisa ter o Python instalado), **ou**
- Rode no terminal: `python tools/update-news.py`

> **Importante:** o arquivo `data/steam-news.js` é **gerado automaticamente** — não edite ele na mão, porque a próxima atualização apaga suas mudanças. Para editar notícias manualmente, use o bloco `NEWS` no `script.js` (ele é o plano B quando o arquivo do Steam não existe).
>
> Os textos oficiais da Valve são publicados **em inglês** — o site mostra o original e o botão "Ver no Steam" leva para a publicação completa.

---

## 🤖 Bot do Discord (postar notícias automaticamente)

Esse bot pega as mesmas notícias do Steam e **posta nos canais do seu servidor** — cada patch e cada novidade oficial, com o título, o resumo, a imagem e o link. Você não precisa fazer nada depois de configurar.

### Onde cada coisa é postada

O bot **separa sozinho**, porque as duas coisas têm pesos diferentes:

| Canal | O que chega lá |
|---|---|
| **`#patch-notes`** | Só **atualizações do jogo** (patch notes) — as que mudam o jogo, com aviso do cargo |
| **`#novidades`** | **Notícias e novidades** — skins, eventos, destaque de herói, "noite de jogatina" |

Pode ligar só um canal, se preferir — nesse caso **tudo cai nele**.

### Como funciona (a parte técnica, em 3 linhas)

Usamos um **webhook** do Discord. É um "endereço secreto" do canal: qualquer coisa que você mandar para lá aparece como mensagem. Ele já vem com **nome e foto próprios** (chamamos de "Central Deadlock"), então no canal ele aparece **igual a um bot normal** — só que **não precisa de programa rodando 24 horas**, nem de servidor, nem de convidar o bot. É de graça e funciona para sempre.

### Passo a passo (só uma vez)

**1. Crie um webhook em cada canal que vai receber as notícias:**

- Clique com o **botão direito no canal** → **Editar canal**
- Vá em **Integrações** → **Webhooks** → **Novo webhook**
- Dê o nome **Central Deadlock** (e uma foto, se quiser) → **Copiar URL do webhook**
- Repita no outro canal

**2. Rode o bot uma vez** — ele **cria o arquivo `discord-webhook.txt`** com as instruções dentro e avisa que falta preencher:

```
python tools/discord-post.py
```

**3. Abra o `discord-webhook.txt` e cole as URLs** (a URL pura, sem `< >` e sem aspas):

```
patches  = https://discord.com/api/webhooks/NUMEROS-LONGOS/CODIGO-SECRETO
noticias = https://discord.com/api/webhooks/NUMEROS-LONGOS/CODIGO-SECRETO
```

> 🚨 **NUNCA escreva a URL de verdade neste README** (nem em qualquer outro arquivo do site). O README **vai para o GitHub**, e quem tiver a URL consegue postar no seu canal. O lugar certo é **só** o `discord-webhook.txt`, que o Git ignora de propósito.

> 💡 Só quer um canal? Apague uma das linhas — o bot manda tudo para a que sobrou.

**4. Confira** rodando `python tools/discord-post.py --teste` (deve chegar uma mensagem em cada canal).

> **Privacidade:** quem tiver essa URL pode postar no seu canal. Por isso ela fica no arquivo `discord-webhook.txt`, que está no `.gitignore` — **ela nunca vai para o GitHub**. Se vazar, basta apagar o webhook no Discord e criar outro.
>
> 🔒 **Trava automática:** o projeto tem um verificador (`tools/checar-segredos.py`) que roda **antes de cada commit** e **bloqueia o salvamento** se encontrar uma URL de webhook em algum arquivo que iria para o GitHub. Se um dia você clonar o projeto em outro PC, ative a trava uma vez com:
>
> ```
> git config core.hooksPath .githooks
> ```

### Como usar

- Dê **dois cliques** em `postar-no-discord.bat`, **ou**
- Rode no terminal: `python tools/discord-post.py`

| Comando | O que faz |
|---|---|
| `python tools/discord-post.py` | Posta o que ainda não foi postado (até 3 por vez) |
| `python tools/discord-post.py --teste` | Manda uma mensagem de teste em cada canal configurado |
| `python tools/discord-post.py --tudo` | Posta as 10 mais recentes de uma vez |
| `python tools/discord-post.py --dry-run` | **Não envia nada** — só mostra o que iria para qual canal |

O bot guarda o que já foi postado em `data/discord-posted.json`, então **ele nunca repete** a mesma notícia.

### Se aparecer um erro

| Mensagem | O que fazer |
|---|---|
| "A URL do webhook NÃO está certa" ou `HTTP 404` / `HTTP 405` | A URL está incompleta ou veio com sujeira junto (geralmente um `< >` em volta). Abra o `discord-webhook.txt` e cole a URL pura, sem `< >` e sem aspas |
| `HTTP 401` / `HTTP 403` | O webhook foi apagado, ou você não tem permissão naquele canal. Crie outro webhook |
| "Nada novo para postar. Tudo em dia!" | **Isso é boa notícia** — quer dizer que está funcionando e não há nada novo desde a última vez |

### Avise um cargo quando sair patch (opcional)

Quer que o bot marque o cargo **@Patch Notes** quando sair atualização? Adicione esta linha ao `discord-webhook.txt` (ative o *Modo desenvolvedor* no Discord, clique com o botão direito no cargo → **Copiar ID do cargo**):

```
cargo = 987654321098765432
```

O aviso só aparece nos **patches** — nas notícias comuns, não marca ninguém.

### Automático no GitHub (sem ligar o PC)

Se o site estiver publicado pelo GitHub, o robô diário já posta sozinho. Para ligar:

1. No repositório, vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Nome: `DISCORD_WEBHOOK` — Valor: a URL do canal **#novidades**
4. Crie outro secret chamado `DISCORD_WEBHOOK_PATCHES` — Valor: a URL do **#patch-notes**
5. (Opcional) Crie outro secret chamado `DISCORD_CARGO` com o ID do cargo

Pronto! Todo dia às 9h (horário de Brasília), se sair novidade, ela aparece no seu Discord.

---

## 🖼️ Banner da Home

O destaque da Home usa a **capa do jogo** (`assets/brand/library_hero.jpg`) como imagem de fundo, com um degradê escuro para o texto ficar legível.

---

## ⚠️ Botão "Baixar Deadlock"

Como o jogo está em **playtest fechado (por convite)**, o botão **não** leva direto para baixar. Ele abre um **pop-up** explicando que o acesso é por convite e oferece:
- Ver na Steam
- Entrar no **Discord** — https://discord.gg/esy3uJAbkd

---

## 👤 Perfil (customizações funcionais)

Baseado no protótipo DLBR que você enviou. A aba **Meu Perfil** tem duas partes:

1. **Perfil grande (topo)** — banner grande, **avatar grande**, nome, tags, status e os botões **Editar perfil**, **Copiar link** e **Baixar cartão**. Embaixo vêm os cards **Sobre**, **Heróis principais**, **Nível/XP**, **Atividade** e **Conquistas** — igual à página de perfil do protótipo.
2. **Editor (abaixo)** — o cartão de pré-visualização fica fixo à esquerda (com os botões Alterar foto, Surpreenda-me, Baixar, Copiar link e Copiar texto) e, à direita, as **abas arredondadas com ícones**:

- **Identidade** — apelido, pronomes, status, bio, título, região e redes (Discord, Twitch, YouTube), em duas colunas
- **Jogo** — heróis principais (até 3), que aparecem como estandartes no cartão
- **Avatar** — caixa de foto com **Trocar / Reajustar / Remover**, forma (círculo, hexágono, octógono, losango, escudo, estrela) e moldura (dourada, neon, cor de destaque, dupla)
- **Cartão** — 8 temas de banner, 4 padrões (grade, pontos, listras), cores personalizadas **ou** uma **imagem própria**
- **Site** — cor de destaque (recolore o site inteiro), tema escuro/claro, idioma e modo compacto
- **Conquistas** — nível, XP, atividade e 8 conquistas que evoluem conforme você usa o site
- **Dados** — salvar, redefinir, **exportar** e **importar** o perfil (arquivo `.json`)

Extras: **Surpreenda-me** (sorteia um visual), **Baixar cartão** (gera um PNG do cartão), **Copiar link** (link com o cartão dentro) e **Copiar texto** (resumo em texto). Tudo salvo no navegador (**localStorage**) e atualizado em tempo real. No celular, tudo cabe na largura da tela.

---

## ▶️ Visualizar no seu PC

Dê **dois cliques** em `index.html` — funciona direto, sem instalar nada.

Para testar como se fosse um site de verdade (recomendado):
```
python -m http.server 8123 --directory "C:\Users\User\Documents\Projeto Padrão\meu-fansite"
```
e acesse `http://localhost:8123`.

---

## 🔎 Detalhes que já estão prontos

- **Favicon** (`assets/brand/favicon.svg`) — o emblema aparece na aba do navegador.
- **Compartilhamento** — ao colar o link no Discord/WhatsApp aparece um cartão com imagem (`assets/brand/share.jpg`).
- **Botão "voltar ao topo"** — aparece no canto quando você rola a página.
- **`theme-color`** — a barra do navegador no celular fica na cor do site.

---

## 💾 Backup (Git)

O site já tem **histórico de versões**. Sempre que terminar uma mudança importante:

```powershell
cd "C:\Users\User\Documents\Projeto Padrão\meu-fansite"
git add -A
git commit -m "descreva o que voce mudou"
```

- Ver o histórico: `git log --oneline`
- Desfazer mudanças não salvas: `git checkout -- .`

---

## 🚀 Publicar o site (de graça)

Depois de publicado, qualquer pessoa acessa por um **link de verdade**.

### Jeito mais fácil: GitHub Desktop

1. Crie uma conta em [github.com](https://github.com).
2. Instale o [GitHub Desktop](https://desktop.github.com/) e faça login.
3. **File → Add local repository** e escolha a pasta `meu-fansite` (ele já detecta o Git configurado).
4. Clique em **Publish repository**, deixe **público** e confirme.
5. No site do GitHub, abra o repositório e vá em **Settings → Pages**.
6. Em *Branch*, escolha **main** e **/ (root)** → **Save**.
7. Em 1 ou 2 minutos o site estará no ar em: `https://SEU-USUARIO.github.io/central-deadlock/`

### Alternativa: Netlify

Arraste a pasta `meu-fansite` compactada em [app.netlify.com/drop](https://app.netlify.com/drop) — o site sobe na hora.

### ⚠️ Depois de publicar, faça esta troca

No `index.html`, procure por `SEU-USUARIO` (aparece **4 vezes**, nas linhas de compartilhamento) e troque pelo seu usuário do GitHub. Assim o cartão com imagem aparece quando alguém colar o link.

> **Bônus:** publicado no GitHub, o robô `.github/workflows/noticias.yml` atualiza as notícias do Steam **todo dia sozinho** — sem você fazer nada.


---

## ⚠️ Aviso legal

Fan site independente, feito por fãs. **Não é oficial da Valve Corporation** e não tem vínculo com ela nem com o dlbr.gg. **Deadlock e suas artes pertencem à Valve.** Mantemos este aviso no rodapé do site.
