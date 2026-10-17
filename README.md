# 🎮 Central Deadlock

Portal da comunidade brasileira de **Deadlock**, com identidade visual inspirada no **dlbr.gg** (barra lateral, tema escuro, verde-limão) e uma **logo própria** (emblema art déco feito por nós, em SVG).

---

## 📁 Estrutura

```
meu-fansite/
├── index.html
├── style.css
├── heroes-data.js           # Ficha dos heróis (nomes, atributos, habilidades)
├── script.js
├── manifest.webmanifest     # Faz o site virar "app" no celular
├── sw.js                    # Guarda o site no navegador (abre mais rápido)
├── sitemap.xml              # Mapa do site para o Google — GERADO sozinho
├── robots.txt               # Regras para os buscadores
├── atualizar-noticias.bat   # 2 cliques = notícias + estatísticas + páginas
├── postar-no-discord.bat    # 2 cliques aqui = posta as novidades no Discord
├── atualizar-tudo.bat       # 2 cliques = notícias + estatísticas + Discord
├── README.md
├── heroi/                   # 1 página por herói (ajuda o Google) — GERADO sozinho
├── noticia/                 # 1 página por notícia — GERADO sozinho
├── .github/workflows/       # Robôs do GitHub (veja "Publicar o site")
│   ├── publicar-site.yml    # Coloca o site no ar
│   └── noticias.yml         # Notícias + estatísticas + Discord, todo dia
├── data/
│   ├── steam-news.js        # Notícias do Steam (traduzidas) — GERADO sozinho
│   ├── hero-stats.js        # Win rate / pick / KDA reais — GERADO sozinho
│   ├── game-data.js         # Itens, builds, contadores, ranking — GERADO sozinho
│   ├── hero-extra.js        # Etiquetas, dificuldade, cor e história de cada herói — GERADO sozinho
│   ├── hero-history.js      # Win rate semana a semana — GERADO sozinho
│   ├── traducao-cache.json  # Memória das traduções das notícias — GERADO sozinho
│   ├── traducao-jogo.json   # Memória das traduções do jogo — GERADO sozinho
│   ├── discord-posted.json  # O que o bot já postou — GERADO sozinho
│   └── atualizacoes.log     # Registro das execuções automáticas (fora do Git)
├── tools/
│   ├── update-news.py       # Baixa e TRADUZ as notícias do Steam (texto completo)
│   ├── update-stats.py      # Baixa as estatísticas reais dos heróis
│   ├── update-game-data.py  # Baixa itens, builds, contadores, ban, ranking, etiquetas e história dos heróis
│   ├── baixar-artes.py      # Baixa as artes dos heróis (carta, capa, letreiro e ícones das habilidades)
│   ├── traduzir-jogo.py     # Traduz o nome das habilidades em heroes-data.js
│   ├── gerar-paginas.py     # Cria as páginas de cada herói/notícia + sitemap
│   ├── discord-post.py      # Posta no Discord
│   ├── make-share.py        # Gera a imagem de compartilhamento
│   ├── make-icons.py        # Gera os ícones do app (celular/PC)
│   └── checar-segredos.py   # Trava que impede vazar o webhook no Git
└── assets/
    ├── brand/
    │   ├── favicon.svg        # Ícone da aba do navegador
    │   ├── icon-192.png       # Ícone do app (celular)
    │   ├── icon-512.png       # Ícone do app (grande)
    │   ├── icon-maskable-512.png # Ícone do app (Android recorta)
    │   ├── share.jpg          # Imagem que aparece ao compartilhar o link
    │   ├── library_hero.jpg   # Capa usada no banner da Home
    │   ├── deadlock-cover.jpg # Capa vertical (reserva)
    │   └── deadlock-header.jpg # Banner horizontal (reserva)
    └── heroes/                # 44 artes dos heróis (cartas 280x380)
    ├── capas/                 # 43 banners prontos do topo das páginas dos heróis
    ├── nomes/                 # 44 nomes desenhados (o letreiro de cada herói)
    └── habilidades/           # 170 ícones das habilidades
```

> ⚙️ **Arquivos marcados como "GERADO sozinho" não devem ser editados na mão** — a próxima atualização automática apaga a mudança.
>
> 🖼️ Para atualizar as artes dos heróis (ou pegar a de um herói novo): `python tools/baixar-artes.py`. Ele baixa as quatro coisas de uma vez: a **carta** (`assets/heroes`), o **banner** (`assets/capas`), o **letreiro** com o nome (`assets/nomes`) e os **ícones das habilidades** (`assets/habilidades`).
>
> 🧩 O **banner** não é uma imagem solta: o programa junta a **arte de fundo do jogo** com o **personagem recortado** e grava um arquivo só (1920x600, bem leve). Quem monta isso é a biblioteca **Pillow** — se ela não estiver instalada, rode `pip install pillow` antes. Assim o personagem aparece de verdade e a imagem fica nítida.
>
> Para refazer todos os banners do zero (por exemplo, se você mudou o tamanho deles), use `python tools/baixar-artes.py --forcar`.

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

**Deadlock:** Home · Heróis · Comparar · Notícias · Guias · Builds · Itens do Jogo · Patch Notes · Glossário · Mapa
**Comunidade:** Esports · Ranking · Favoritos · Eventos · Quiz · Meu Perfil · Nosso Discord · Wiki do Deadlock

### Abas novas

- **Comparar** — escolha dois heróis e veja tier, vida, velocidade, win rate e pick rate lado a lado (o melhor valor fica destacado). Botões de **trocar** e **aleatório**.
- **Builds** — **as builds que a comunidade mais usa no jogo**, com o **win rate real** de cada uma e os itens da build (clique em um item para ver o preço e o efeito).
- **Itens do Jogo** — **todos os itens reais da loja** (armas, vitalidade e espírito), com preço, tier, efeito e o **win rate de verdade** de cada item. Tem busca e filtro por tipo.
- **Mapa** — esquema **ilustrativo** (não é o mapa oficial) com rotas, bases e Midboss clicáveis.
- **Eventos** — calendário da comunidade com botão **Lembrar** (salvo no navegador).
- **Quiz** — "qual herói combina com você?"; ao final, sugere 3 heróis e abre a ficha do campeão.
- **Ranking** — o **ranking real do jogo**, com os 50 melhores jogadores de cada região (América do Sul, América do Norte, Europa, Ásia e Oceania).
- **Glossário** — mais de 50 termos do Deadlock explicados, separados por assunto e com busca.
- **Home** — banner com a notícia mais recente, "Últimas notícias", "Meta de hoje" (com números reais) e atalhos para explorar o site.

### Logos dos times (Esports)

Cada time tem um **badge próprio** (feito por nós, não são logos oficiais) com as cores do time. Ficam nos cards de partida e na janela de detalhes.

### Heróis (44)

A aba de heróis usa **estandartes** (bandeirinhas) no estilo do protótipo que você enviou:

- 44 heróis com as **artes reais** (`assets/heroes`), incluindo **Abrams** (PNG)
- **Busca** por nome, **filtro por função** (Tanque, Suporte, Carry, Controle, Assassino) e **ordenação** (A→Z, Z→A, tier, win rate, favoritos)
- **Estrela ★** em cada estandarte para favoritar (aparece na aba **Favoritos** e no perfil)
- **Clique em qualquer herói** para abrir a ficha completa, com abas:
  - **Visão geral** — papel, arquétipo, dificuldade, tier, atributos, win rate, pick rate, KDA, **taxa de banimento** e o **histórico de win rate** (gráfico semana a semana)
  - **Habilidades** — as 4 habilidades com descrição e recarga; o nome aparece **em português** e o original em inglês fica logo abaixo, em cinza
  - **Build** — **as 3 builds mais usadas** por quem joga de verdade com aquele herói, com o win rate de cada uma e os itens (clique para ver o item)
  - **Confrontos** — **contra quem o herói realmente ganha e contra quem perde**, com a porcentagem e o número de partidas. Cada inimigo é clicável
- No fim da ficha tem o botão **Página completa**, que abre a página própria do herói (boa para compartilhar no grupo e para o Google achar)
- A **página completa** de cada herói traz, além da ficha:
  - **Dificuldade para aprender** e **Dificuldade para masterizar** — as duas notas juntas, com barrinhas coloridas (verde = fácil, amarelo = médio, vermelho = difícil)
  - **O que upar primeiro** — a ordem das habilidades **nível por nível**, do jeito que os jogadores mais usam em partidas reais (com a % de cada nível)
  - **Melhores duplas** — com quem aquele herói mais ganha e com quem não combina (partidas reais)
  - **Rota (lane)** — contra quem ele ganha ou perde a rota e por quantas almas de diferença
- **The Doorman** aparece normalmente; só **Nurse Harrow** está marcada como **"Em breve"** (ela ainda está em pré-lançamento no jogo — a própria API oficial diz isso)
- **Violet** foi lançada em **16/10/2026** e já está completa, com as 4 habilidades reais (Tinta Viva, Estado de Fluxo, Natureza Morta e Paisagem Abstrata) e os atributos reais (710 de vida, 6,9 m/s)

> Os textos/atributos dos heróis ficam em **`heroes-data.js`** — é só editar o texto entre aspas que a ficha atualiza.
>
> Cada herói tem duas notas de dificuldade: **`diff`** (para aprender) e **`dominio`** (para masterizar), de 1 a 3.
> Elas são as notas do **dlbr.gg** (é uma avaliação deles, não do jogo). Nos poucos heróis que ainda não têm a nota
> lá, o site usa a **complexidade oficial do jogo** e escreve isso embaixo da nota (o herói ganha o campo `dif_fonte: "jogo"`).
>
> Para adicionar um herói novo, escreva o nome das habilidades **em inglês** (como está na deadlock.wiki) e rode `python tools/traduzir-jogo.py`: ele traduz sozinho e guarda o original no campo `name_en`.

---

## 📊 Estatísticas reais (números de verdade)

A aba **Estatísticas** mostra **win rate, pick rate e KDA reais**, calculados sobre **milhões de partidas** — nada de número inventado.

De onde vêm os dados? Do projeto público e gratuito **[deadlock-api.com](https://deadlock-api.com)**, que lê as próprias partidas do jogo. Os scripts baixam tudo e gravam os arquivos da pasta `data/`.

O que isso muda no site:

| Onde | Antes | Agora |
|---|---|---|
| Aba **Estatísticas** | não existia | tabela completa, com barras e 5 destaques |
| **Win rate / pick rate** dos heróis | exemplo | **números reais** |
| **Tier** (S a D) | exemplo | **calculada** pelos dados reais |
| Ordenar heróis por "Melhor tier" / "Maior win rate" | exemplo | real |
| Ficha do herói | "Estatísticas (exemplo)" | "Estatísticas reais" + nº de partidas, posição e banimento |
| **Histórico de win rate** | não existia | gráfico com **58 semanas** de partidas reais |
| **Itens da loja** | lista de exemplo | **173 itens reais**, com preço, efeito e win rate |
| **Builds** | sugestão genérica | **as builds mais usadas**, com win rate de cada uma |
| **Confrontos** | exemplo | win rate real contra **cada inimigo** |
| **Ranking** | exemplo | **top 50 real** de 5 regiões |
| **Taxa de banimento** | não existia | % real + posição entre os mais banidos |

### De onde sai cada arquivo

| Arquivo | Script | O que tem dentro |
|---|---|---|
| `data/hero-stats.js` | `tools/update-stats.py` | win rate, pick rate, KDA e tier de cada herói |
| `data/game-data.js` | `tools/update-game-data.py` | itens da loja, builds, contadores, banimento e ranking |
| `data/hero-history.js` | `tools/update-game-data.py` | win rate semana a semana (usado nos gráficos) |
| `data/hero-extra.js` | `tools/update-game-data.py` | etiquetas, dificuldade, cor e história de cada herói (usado nas páginas dos heróis) |
| `data/hero-analytics.js` | `tools/update-analytics.py` | ordem das habilidades, melhores duplas e confrontos de rota (usado nas páginas dos heróis) |

> 💡 Se o site ficar sem internet por muito tempo, ele simplesmente continua mostrando os últimos números baixados.
>
> ⚠️ Os nomes das builds vêm de jogadores. Se algum nome for ofensivo, o script troca por "Build da comunidade" sozinho.

---

## 📱 O site virou um "app" (PWA)

Agora dá para **instalar a Central Deadlock no celular ou no PC**, igual a um aplicativo — com ícone próprio, tela cheia e sem a barra do navegador:

- **Celular (Android/Chrome):** menu ⋮ → **Instalar aplicativo**
- **Celular (iPhone/Safari):** botão **Compartilhar** → **Adicionar à Tela de Início**
- **PC (Chrome/Edge):** ícone de **instalar** (uma telinha com uma seta) na barra de endereço

Os arquivos que fazem isso: `manifest.webmanifest` (nome, ícone, cores), `sw.js` (uma cópia do site guardada no navegador, para abrir rápido) e os ícones em `assets/brand/icon-*.png`.

> **Notícia nunca fica velha:** o `sw.js` foi feito para sempre **buscar as notícias na internet primeiro** e usar a cópia guardada só quando a internet falha.
>
> Para gerar os ícones de novo (se algum dia mudar a logo): `python tools/make-icons.py` (precisa da biblioteca Pillow).

---

## 🔎 Aparecer no Google

- **`sitemap.xml`** — a lista de páginas para os buscadores (gerada sozinha, com **56 endereços** hoje)
- **`robots.txt`** — libera a leitura e aponta para o sitemap
- **`heroi/<nome>.html`** — **uma página para cada herói** (43 no total), no **estilo do dlbr.gg**: um **banner grande** com a arte de fundo do jogo **e o personagem recortado** por cima, o **nome desenhado**, as **etiquetas do jogo** (Tanque, Lutador, Cabeça-Dura…) e os **ícones das 4 habilidades** na cor do herói; abaixo vem o conteúdo em **duas colunas** — o texto e as habilidades à esquerda e os quadros **Papel**, **Dificuldade** e **Resumo** (tier, vida, velocidade, banimento) à direita. Tem ainda a **História** oficial do personagem, os números reais, as builds e os confrontos. É o que aparece quando alguém pesquisa "Abrams Deadlock build"
  - 💡 **Passe o mouse (ou toque) no ícone de uma habilidade** no banner: abre uma caixinha com o **nome em português e inglês**, as etiquetas (**Suprema**, **Passiva**, **Recarga**) e a **descrição completa** — sem precisar rolar a página.

> A **cor de cada herói** vem do próprio jogo (`data/hero-extra.js`) e pinta as etiquetas, a linha do banner e a barra de dificuldade. Se a cor for muito escura, o site clareia sozinho o que precisa e escolhe a cor do texto, para nada ficar ilegível.
- **`noticia/<id>.html`** — **uma página para cada notícia**, com o resumo em português e o texto original

Essas páginas são geradas pelo `tools/gerar-paginas.py` (o robô do GitHub roda sozinho, todo dia). Os cards de notícia do site apontam para elas com links de verdade — quem clica abre a janela bonita aqui; os buscadores leem o texto completo.

Para o Google achar o site mais rápido: entre no **[Google Search Console](https://search.google.com/search-console)**, adicione a propriedade `https://hypedz.github.io/central-deadlock/` e envie o `sitemap.xml`. Não é obrigatório — o Google acha sozinho com o tempo.

---

## 📰 Conteúdo clicável (Notícias / Guias / Esports)

Todos os cards da Home, Notícias, Guias e Esports agora são **clicáveis** e abrem uma **janela com o texto completo**. Para editar as matérias, procure no `script.js` os blocos `FEATURED`, `NEWS`, `GUIDES` e `MATCHES`.

---

## 📡 Notícias automáticas do Steam

As abas **Notícias** e **Patch Notes** puxam as publicações **oficiais do Deadlock** direto da Steam (App `1422450`). Nada de escrever na mão!

**Como funciona:**

1. O script `tools/update-news.py` conversa com a API da Steam e salva tudo em `data/steam-news.js`.
2. Ele **traduz o título e o resumo para português** (tradutor gratuito do Google, sem precisar de chave) e usa a **imagem oficial** que a Valve publicou em cada notícia. Cada tradução fica guardada em `data/traducao-cache.json`, então nunca é traduzida duas vezes.
3. O site lê esse arquivo e monta os cards sozinho — inclusive escolhendo a **arte do herói** citado na notícia, se a notícia não tiver imagem própria.
4. Se você rodar o site pelo GitHub, o robô `.github/workflows/noticias.yml` faz isso **todo dia às 9h (horário de Brasília)** e salva no repositório.

**Para atualizar na mão (no seu PC):**

- Dê **dois cliques** em `atualizar-noticias.bat` (precisa ter o Python instalado), **ou**
- Rode no terminal: `python tools/update-news.py`

> **Importante:** o arquivo `data/steam-news.js` é **gerado automaticamente** — não edite ele na mão, porque a próxima atualização apaga suas mudanças. Para editar notícias manualmente, use o bloco `NEWS` no `script.js` (ele é o plano B quando o arquivo do Steam não existe).

> 🌎 **Sobre a tradução:** a Valve publica tudo **em inglês**. O site mostra o **título e o resumo traduzidos** (com um selinho 🇧🇷 **PT**) e, ao abrir a notícia, guarda o **texto original em inglês** logo abaixo — assim ninguém perde nenhum detalhe e dá para conferir na fonte.
>
> Se a tradução falhar (internet fora, por exemplo), o card simplesmente mostra o texto original. **Nada quebra.**
>
> Para economizar tempo, só as **25 notícias mais novas** são traduzidas a cada rodada. Se quiser atualizar sem traduzir: `python tools/update-news.py --sem-traducao`.

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

> ✅ **Já está funcionando.** O bot roda **sozinho no GitHub, todo dia às 09:00**, sem depender do seu PC (veja *"Automático no GitHub"* mais abaixo). O passo a passo acima é só para entender como ele foi montado — ou para refazer tudo em outro servidor.

### Como usar

**No dia a dia você não precisa fazer nada.** Se quiser postar na hora:

- Dê **dois cliques** em `atualizar-tudo.bat` (atualiza as notícias **e** posta), **ou**
- Rode no terminal: `python tools/discord-post.py`

| Comando | O que faz |
|---|---|
| `python tools/discord-post.py` | Posta o que ainda não foi postado (até 3 por vez) |
| `python tools/discord-post.py --teste` | Manda uma mensagem de teste em cada canal configurado |
| `python tools/discord-post.py --tudo` | Posta as 10 mais recentes de uma vez |
| `python tools/discord-post.py --dry-run` | **Não envia nada** — só mostra o que iria para qual canal |

O bot guarda o que já foi postado em `data/discord-posted.json`, então **ele nunca repete** a mesma notícia. O `atualizar-tudo.bat` também **avisa o GitHub** do que já foi postado, para os dois nunca postarem a mesma coisa duas vezes.

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

### ✅ Automático no GitHub (24h, sem ligar o PC) — já configurado

O robô `.github/workflows/noticias.yml` roda **todo dia às 09:00 (horário de Brasília)** no próprio GitHub: busca as notícias no Steam (e traduz), atualiza as estatísticas reais, posta o que for novo no Discord e manda o site se republicar. **Não depende do seu PC estar ligado.**

Para isso, as URLs ficam guardadas como *secrets* (chaves criptografadas) do repositório:

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Nome: `DISCORD_WEBHOOK` — Valor: a URL do canal **#novidades**
4. Crie outro secret chamado `DISCORD_WEBHOOK_PATCHES` — Valor: a URL do **#patch-notes**
5. (Opcional) Crie outro secret chamado `DISCORD_CARGO` com o ID do cargo

> 🔒 *Secrets* são criptografados: depois de salvos, **ninguém consegue ler de volta** (nem você). É o lugar certo para esse tipo de senha.

**Quer testar?** Aba **Actions** → **Notícias do Steam + Discord** → **Run workflow** → marque a caixinha *"Mandar uma mensagem de TESTE"* → **Run workflow**. Deve chegar uma mensagem de teste em cada canal.

> 💡 **Por que a tarefa do Windows ficou desligada?** Porque os dois postavam a mesma notícia duas vezes (cada um tem sua própria lista do que já postou). Agora o **GitHub é o dono** do envio automático. A tarefa continua ali, caso você queira religar (`schtasks /change /tn "Central Deadlock - Noticias e Discord" /enable`), mas **não ligue as duas ao mesmo tempo**.

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
- **Avatar** — caixa de foto com **Trocar / Reajustar / Remover**, forma (círculo, hexágono, hexágono deitado, octógono, losango, pentágono, escudo, estrela…) e moldura (dourada, neon, cor de destaque, dupla)
- **Cartão** — 8 temas de banner, **13 padrões** (nenhum, grade, pontos, pontos grandes, listras, listras verticais, xadrez, losangos, zigue-zague, raios, anéis, brilho e granulado), cores personalizadas **ou** uma **imagem própria** — e o padrão escolhido aparece igualzinho no PNG baixado
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
- **App instalável** — dá para instalar no celular/PC, com ícone próprio (`manifest.webmanifest` + `sw.js`).
- **Google** — `sitemap.xml` + `robots.txt`.
- **Notícias traduzidas** — títulos e resumos em português, com o original em inglês preservado.
- **Estatísticas reais** — win rate, pick rate, KDA e tier list vindos de milhões de partidas.
- **Duas notas de dificuldade** por herói (para aprender e para masterizar), no estilo do dlbr.gg.

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

O site **já está no ar**:

# 🎮 https://hypedz.github.io/central-deadlock/

Ele fica no repositório [Hypedz/central-deadlock](https://github.com/Hypedz/central-deadlock), e o GitHub cuida de tudo — você **não precisa mexer em nenhuma tela de configuração**.

### Como funciona

| Robô (`.github/workflows/`) | Quando roda | O que faz |
|---|---|---|
| **`publicar-site.yml`** | A cada envio na branch `main` | Coloca o site no ar (ligou o GitHub Pages sozinho na primeira vez) |
| **`noticias.yml`** | Todo dia às 09:00 (Brasília) | Busca as notícias no Steam, traduz, atualiza as estatísticas/itens/builds/ranking, gera as páginas, posta no Discord e republica o site |

### Para atualizar o site depois de mexer nos arquivos

```
git add -A
git commit -m "minha mudanca"
git push
```

Pronto — em **1 ou 2 minutos** o site publicado já mostra a mudança. (O `git push` também já ficou salvo, não pede login de novo.)

### Para forçar uma republicação na hora

Abra a aba **Actions** no GitHub → **Publicar o site** → **Run workflow**.

### Se quiser usar outro hospedador

Também dá para arrastar a pasta `meu-fansite` compactada em [app.netlify.com/drop](https://app.netlify.com/drop) — o site sobe na hora. Mas aí você perde as automações dos robôs.


---

## ⚠️ Aviso legal

Fan site independente, feito por fãs. **Não é oficial da Valve Corporation** e não tem vínculo com ela nem com o dlbr.gg. **Deadlock e suas artes pertencem à Valve.** Mantemos este aviso no rodapé do site.
