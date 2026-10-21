# 🎮 Central Deadlock

Portal da comunidade brasileira de **Deadlock**, com identidade visual inspirada no **dlbr.gg** (barra lateral, tema escuro, verde-limão) e uma **logo própria** (emblema art déco feito por nós, em SVG).

---

## 📁 Estrutura

```
meu-fansite/
├── index.html
├── guia-iniciante.html      # Guia "Começando no Deadlock" — GERADO sozinho
├── style.css
├── heroes-data.js           # Ficha dos heróis (nomes, atributos, habilidades)
├── script.js
├── pwa.js                   # Liga o "app instalável" nas páginas geradas
├── tema.js                  # Botão de tema claro/escuro (canto direito superior)
├── manifest.webmanifest     # Faz o site virar "app" no celular
├── sw.js                    # Guarda o site no navegador (abre mais rápido)
├── sitemap.xml              # Mapa do site para o Google - GERADO sozinho
├── 404.html                 # Página de "endereço não existe" - GERADO sozinho
├── robots.txt               # Regras para os buscadores
├── atualizar-noticias.bat   # 2 cliques = notícias + estatísticas + páginas
├── postar-no-discord.bat    # 2 cliques aqui = posta as novidades no Discord
├── atualizar-tudo.bat       # 2 cliques = notícias + estatísticas + Discord
├── README.md
├── heroi/                   # 1 página por herói (ajuda o Google) — GERADO sozinho
├── item/                    # 1 página por item da loja — GERADO sozinho
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
│   ├── hero-analytics.js    # Ordem das habilidades, duplas e rota — GERADO sozinho
│   ├── elos.js              # Brasões de elo oficiais + jogadores por elo — GERADO sozinho
│   ├── guias.js             # O guia de cada herói, em português — GERADO sozinho
│   ├── builds.js            # As builds mais usadas de cada herói — GERADO sozinho
│   ├── esports.js           # Torneios e resultados reais (Liquipedia) — GERADO sozinho
│   ├── top-jogadores.js     # Os melhores jogadores de cada herói, por região — GERADO sozinho
│   ├── traducao-cache.json  # Memória das traduções das notícias — GERADO sozinho
│   ├── traducao-jogo.json   # Memória das traduções do jogo — GERADO sozinho
│   ├── discord-posted.json  # O que o bot já postou — GERADO sozinho
│   └── atualizacoes.log     # Registro das execuções automáticas (fora do Git)
├── tools/
│   ├── update-news.py       # Baixa e TRADUZ as notícias do Steam (texto completo)
│   ├── update-stats.py      # Baixa as estatísticas reais dos heróis
│   ├── update-game-data.py  # Baixa itens, builds, contadores, ban, ranking, etiquetas e história dos heróis
│   ├── update-analytics.py  # Baixa a ordem das habilidades, as melhores duplas e os confrontos de rota
│   ├── update-elos.py       # Baixa os brasões de elo e quantos jogadores há em cada elo
│   ├── baixar-artes.py      # Baixa as artes dos heróis (carta, capa, letreiro e ícones das habilidades)
│   ├── traduzir-jogo.py     # Traduz o nome das habilidades em heroes-data.js
│   ├── gerar-paginas.py     # Cria as páginas de cada herói/notícia + sitemap
│   ├── gerar-guias.py       # Escreve o guia de cada herói (com os números reais)
│   ├── gerar-builds.py      # Escreve as builds mais usadas de cada herói
│   ├── update-esports.py    # Busca os torneios e resultados reais (Liquipedia)
│   ├── update-top-jogadores.py # Busca os melhores jogadores de cada herói (1x por dia)
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
> 📦 A **carta** é gravada em **WebP** (o navegador mostra igual e o arquivo pesa ~85% menos que o PNG antigo: as 44 cartas juntas caíram de 4,9 MB para 0,69 MB). O script também **atualiza sozinho** o campo `"file"` de cada herói no `heroes-data.js` e apaga as cartas antigas que ninguém mais usa. Se a biblioteca **Pillow** não estiver instalada, ele mantém o formato original.
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
- **Acessibilidade**: o texto secundário (datas, legendas, rodapé) tem contraste de **pelo menos 4,5:1** nos dois temas — o mínimo recomendado para leitura confortável. O mapa também usa **padrão de linha** além da cor, para quem tem daltonismo.

> **Por que não usamos a logo oficial?** O símbolo do jogo é marca registrada da Valve. Em fan site, o mais seguro é usar uma identidade **própria e original** — foi o que fizemos.

---

## 📑 Menu (seções)

**Deadlock:** Home · Heróis · Comparar · Counters · Notícias · Guias · **Começando** · Builds · Itens do Jogo · Patch Notes · Glossário · Mapa · Minha Mira
**Comunidade:** Esports · Ranking · **Jogador** · Favoritos · Eventos · Quiz · Meu Perfil · Nosso Discord · Wiki do Deadlock

### Abas novas

- **Comparar** — escolha dois heróis e veja tier, vida, velocidade, win rate e pick rate lado a lado (o melhor valor fica destacado). Botões de **trocar** e **aleatório**.
- **Counters** — escolha o seu herói e veja, de um lado, **contra quem ele ganha** e, do outro, **com quem ele precisa tomar cuidado**. São os **6 melhores e os 6 piores confrontos** de verdade (win rate real com pelo menos 400 partidas contra cada inimigo), com barra comparativa e o número de partidas. O último herói escolhido fica salvo. Botão **Sortear herói** para descobrir um novo.
- **Builds** — **as builds mais usadas de cada um dos 42 heróis**, na **ordem real de compra** dos itens, com o **win rate e o número de partidas** de cada build. Tem busca e filtro por função, e clicar em um item mostra o preço e o efeito. (Antes eram só 5 builds escritas à mão.)
- **Itens do Jogo** - **todos os itens reais da loja** (armas, vitalidade e espírito), com preço, tier, efeito e o **win rate de verdade** de cada item. Tem busca e filtro por tipo — e **cada item tem página própria** (clique no item e depois em **Página do item**).
- **Mapa** — **mapa esquemático do jogo** (não é o mapa oficial): desenho próprio em SVG montado a partir do mapa real, na posição do minimapa do time Âmbar — as **3 rotas de verdade** (**York/amarela**, **Broadway/azul** no meio e **Greenwich/verde**), as **duas bases** (Âmbar embaixo, Safira em cima), **Guardians e Walkers** marcados em cada rota, o **Midboss** no centro (no esgoto, embaixo da Broadway) e os **4 distritos** da selva (**Praça**, **Teatro**, **Lote Assombrado** e **Chinatown**). Clique (ou use **Tab + Enter**) em qualquer área para ver a explicação e **2 dicas** no painel. Cada rota tem também um **padrão de linha** próprio — York **pontilhada**, Broadway **contínua** e Greenwich **tracejada** — para quem tem daltonismo saber qual é qual mesmo sem distinguir as cores. Abaixo do mapa, o cartão **Confrontos de rota — dados reais** mostra os piores duelos de rota do momento (números de verdade da deadlock-api.com).
- **Tema claro / escuro** — botão no **canto direito superior** (em todas as páginas, inclusive nas de herói, item e notícia): troca a cor do site na hora e **fica salvo** no navegador. Se você nunca mexeu, o site segue o tema do seu sistema.
- **Eventos** — **só datas reais**: os **próximos torneios** (que vêm do Esports) com **contagem regressiva** ("é hoje", "faltam 5 dias") e as **últimas atualizações do jogo** (data real do Steam, clique para ler). Botão **Lembrar** salvo no navegador. (Antes eram 5 eventos inventados.)
- **Páginas dos heróis** — no fim de cada uma há atalhos para as abas **Guias**, **Builds**, **Ranking** e **Itens** do site.
- **Quiz** — "qual herói combina com você?"; ao final, sugere 3 heróis e abre a ficha do campeão.
- **Ranking** — o **ranking real do jogo**, com os 50 melhores jogadores de cada região (América do Sul, América do Norte, Europa, Ásia e Oceania). **Clique em um jogador** para ver a posição dele, os heróis mais jogados e **buscar o perfil de verdade no Steam** (o site mostra as partidas reais daquela conta). Abaixo da tabela aparece o **brasão de elo oficial** (todo mundo no ranking já chegou no elo mais alto, o Eternus).
- **Minha Mira** — cole o código da sua mira (`DL.…`, que aparece em Configurações › Mira no jogo) e o site **desenha a mira em tamanho grande** e explica cada ajuste (barrinhas, ponto, cores, contorno) em português. Nada fica guardado.
- **Começando** — guia em português para a primeira partida (o básico, funções, almas, itens, objetivos e erros comuns), com atalhos para o resto do site.
- **Elos de verdade** (dentro de Estatísticas) — os **brasões oficiais** de cada elo e **quantos jogadores de verdade** estão em cada um hoje (dado real da API).
- **Busca global (Ctrl + K)** — acha **herói, item, notícia, guia, build, tela e termo do glossário** num lugar só. Abre com **Ctrl + K** (⌘ + K no Mac) ou pelo botão de lupa do menu, e funciona de qualquer tela. Nas páginas de herói e de notícia existe o link **Buscar no site**. Use ↑ ↓ para escolher e Enter para abrir.
- **Glossário** — mais de 50 termos do Deadlock explicados, separados por assunto e com busca.
- **Home** — banner com a notícia mais recente, "Últimas notícias" (oficiais do Steam), "Meta de hoje" (com números reais), **Movimento da semana** (quem mais subiu e quem mais caiu de win rate nos últimos 7 dias, comparando a última semana fechada com a anterior — dado real do `data/hero-history.js`) e **atalhos** para as ferramentas do site (Comparar, Itens, Minha Mira, Glossário, Esports e Ranking).

### Esports (torneios de verdade)

Os torneios e resultados vêm da **[Liquipedia](https://liquipedia.net/deadlock/Portal:Tournaments)** — a fonte pública de esports do Deadlock (o jogo **não tem** uma API de torneios). O script `tools/update-esports.py` lê a página de torneios e grava o arquivo `data/esports.js` com:

- **Próximos torneios** — nome, logo, data, premiação, região e quantos times;
- **Resultados recentes** — quem foi **campeão** e **vice**, com o prêmio e a data.

Cada torneio tem uma **letra de tier** (S, A, B, C ou D) e um botão que abre a página do torneio na Liquipedia. Nada é inventado: os **logos são os oficiais** de cada torneio, e o conteúdo da Liquipedia é usado com o crédito + licença (**CC BY-SA 3.0**) no rodapé da aba e no rodapé do site.

> 🙏 **Uma visita por dia:** a Liquipedia é mantida por voluntários e pede poucas visitas. Por isso o `update-esports.py` só busca **uma vez por dia** (ele olha a data que ficou gravada no `data/esports.js`; o robô do GitHub roda de hora em hora, mas nas outras vezes ele para antes de visitar). Quando **você** roda o `atualizar-tudo.bat`, ele usa `--forcar` e busca na hora. Se a busca falhar, o arquivo antigo é mantido — nunca apagamos os torneios.
>
> 👑 O **top de jogadores de cada herói** (`tools/update-top-jogadores.py` → `data/top-jogadores.js`) também é buscado **1x por dia**: são 215 consultas (43 heróis × 5 regiões), feitas em paralelo em ~25 segundos, e a lista muda devagar. O `atualizar-tudo.bat` também usa `--forcar` nele. Se a busca falhar, o arquivo antigo é mantido.

### Heróis (44)

A aba de heróis usa **estandartes** (bandeirinhas) no estilo do protótipo que você enviou:

- 44 heróis com as **artes reais** (`assets/heroes`, em **WebP** — leves e nítidas)
- **Busca** por nome, **filtro por função** (Tanque, Suporte, Carry, Controle, Assassino) e **ordenação** (A→Z, Z→A, tier, win rate, favoritos)
- **Estrela ★** em cada estandarte para favoritar (o herói aparece na aba **Favoritos** e no perfil; a aba mostra o total, como **Favoritos (14)**)
- **Clique em qualquer herói** para abrir a ficha completa, com abas:
  - **Visão geral** — papel, arquétipo, dificuldade, tier, atributos, win rate, pick rate, KDA, **taxa de banimento**, o **histórico de win rate** (gráfico semana a semana) e os **melhores jogadores daquele herói** em cada região (ranking do próprio jogo)
  - **Habilidades** — as 4 habilidades com descrição e recarga; o nome aparece **em português** e o original em inglês fica logo abaixo, em cinza
  - **Build** — **as 3 builds mais usadas** por quem joga de verdade com aquele herói, com o win rate de cada uma e os itens (clique para ver o item)
  - **Confrontos** — **contra quem o herói realmente ganha e contra quem perde**, com a porcentagem e o número de partidas. Cada inimigo é clicável
- No fim da ficha tem o botão **Página completa**, que abre a página própria do herói (boa para compartilhar no grupo e para o Google achar)
- A **página completa** de cada herói traz, além da ficha:
  - **Dificuldade para aprender** e **Dificuldade para masterizar** — as duas notas juntas, com barrinhas coloridas (verde = fácil, amarelo = médio, vermelho = difícil)
  - **O que upar primeiro** — a ordem das habilidades **nível por nível**, do jeito que os jogadores mais usam em partidas reais (com a % de cada nível)
  - **Melhores duplas** — com quem aquele herói mais ganha e com quem não combina (partidas reais)
  - **Rota (lane)** — contra quem ele ganha ou perde a rota e por quantas almas de diferença
  - **Top jogadores** — os **melhores jogadores daquele herói em cada região** (Europa, América do Norte, América do Sul, Ásia e Oceania), direto do ranking do jogo
- **Nurse Harrow** foi lançada em **20/10/2026** e já está com a ficha completa: as 4 habilidades reais (Terapia de Sanguessugas, Vapores Miseráveis, Agulhas de Cura e Terrores Espreitados, a suprema) e os atributos reais (730 de vida, 6,8 m/s)
- Ela continua marcada como **"Em breve"** só até a API do jogo ter partidas suficientes dela. Quando chegar a **300 partidas**, o próprio robô **libera o herói sozinho**: tira o nome da lista `HEROES_SOON`, troca `"soon": true` por `false` no `heroes-data.js` e a página dela é publicada. Você não precisa fazer nada
- **Violet** foi lançada em **16/10/2026** e já está completa, com as 4 habilidades reais (Tinta Viva, Estado de Fluxo, Natureza Morta e Paisagem Abstrata) e os atributos reais (710 de vida, 6,9 m/s)

> Os textos/atributos dos heróis ficam em **`heroes-data.js`** — é só editar o texto entre aspas que a ficha atualiza.
>
> Cada herói tem duas notas de dificuldade: **`diff`** (para aprender) e **`dominio`** (para masterizar), de 1 a 3.
> Elas são as notas do **dlbr.gg** (é uma avaliação deles, não do jogo). Nos poucos heróis que ainda não têm a nota
> lá, o site usa a **complexidade oficial do jogo** (o herói ganha o campo `dif_fonte: "jogo"`).
> Essa informação de origem **não aparece mais na página** — ela fica só aqui, para você saber de onde veio cada número.
>
> Para adicionar um herói novo, escreva o nome das habilidades **em inglês** (como está na deadlock.wiki) e rode `python tools/traduzir-jogo.py`: ele traduz sozinho e guarda o original no campo `name_en`.

---

## 🚀 Começando (guia para iniciantes)

O menu tem a aba **Começando** (dentro do próprio site, sem sair da página): um guia curto para a primeira partida,
dividido em **5 passos** que você pode marcar como concluídos — o progresso fica salvo no navegador (com barra de %).
Cada passo tem um botão que leva direto para a parte do site que ele explica:

1. **Escolha um herói fácil** — mostra 4 heróis de dificuldade **Fácil** (arte e papel reais); clique para abrir a ficha.
2. **Copie uma build pronta** — leva para **Builds**.
3. **Entenda as almas e os itens** — leva para **Itens** e para o **Glossário**.
4. **Conheça o mapa** — leva para a aba **Mapa**.
5. **Jogue a primeira partida** — leva para os **Guias** e para o botão de baixar o jogo.

Abaixo dos passos vêm quatro cartões de consulta rápida (**O que é Deadlock**, **Funções do time**, **Objetivos do mapa**
e **Erros comuns**) e um botão final "Escolher meu herói".

> O texto dos passos e dos cartões fica no **`index.html`** (é só editar o texto entre as tags).
> A versão em página única continua existindo em `guia-iniciante.html` (gerada por `tools/gerar-paginas.py`, com o texto na
> lista `SECOES_GUIA`) — é o link discreto no fim da aba, útil para **compartilhar** e para o Google.

---

## 💎 Itens (173 páginas próprias)

Cada item da loja tem uma **página própria** em `item/<nome-em-ingles>.html`, gerada por `tools/gerar-paginas.py`:

- nome, nome original em inglês, tipo (**Arma**, **Vitalidade** ou **Espírito**), tier, custo em almas, se é **item ativo**
- **win rate real** e o número de **compras registradas** (deadlock-api.com)
- a **descrição do efeito** que o jogo mostra na loja
- **em quais heróis ele aparece** nas builds mais usadas, com link para o guia de cada um

Para abrir: clique em qualquer item na aba **Itens do Jogo** (ou na build de um herói) e depois em **Página do item**.
As 173 páginas entram no `sitemap.xml` — é conteúdo que o Google consegue achar.

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
| **Builds** | 5 builds genéricas escritas à mão | as **builds mais usadas de cada um dos 42 heróis**, na ordem real de compra, com win rate e partidas de cada uma |
| **Confrontos** | exemplo | win rate real contra **cada inimigo** |
| **Ranking** | exemplo | **top 50 real** de 5 regiões — e **clicar no jogador** mostra os heróis dele e busca o perfil no Steam |
| **Esports** | partidas inventadas (FURIA 3 x 1 LOUD) | **torneios e resultados reais** (Liquipedia): próximos torneios, campeões, vice, prêmios e os **logos oficiais** |
| **Home** | 3 artigos de exemplo ("Patch Notes…", "Suba de ranque…") | **só conteúdo real**: notícia mais nova no banner, últimas notícias do Steam e **atalhos** para as ferramentas |
| **Taxa de banimento** | não existia | % real + posição entre os mais banidos |
| **Elos de verdade** | não existia | brasões oficiais do jogo + quantos jogadores há em cada elo |
| **Minha Mira** | não existia | cole o código da sua mira (`DL.…`) e o site desenha ela e explica cada ajuste |
| **Instalar o app** | não existia | botão que instala o site como app no celular e no computador |
| **Busca global** | não existia | **Ctrl + K** acha herói, item, notícia, guia, build, tela e termo do glossário num lugar só |
| **Guias** | só 3 guias escritos à mão | **um guia para cada um dos 43 heróis**, montado sozinho com os números reais das partidas, com filtro por nome/papel/tier |
| **Painel do Steam** (em Meu Perfil) | não existia | digite o seu nick e veja **as suas partidas de verdade**: win rate, KDA, elo, heróis mais jogados e os últimos 20 jogos |
| **Aba Jogador** | não existia | procure **qualquer jogador** pelo nome, pelo link do perfil ou pelo ID e veja o perfil completo: elo, win rate de todo o histórico, KDA, 6 heróis mais jogados e as últimas 15 partidas |
| **Cartão do herói** | não existia | um botão na ficha do herói gera um **cartão em imagem (1080×1350)** com nome, tier, win rate, pick rate e a build mais usada — pronto para WhatsApp, Discord ou Instagram |

### De onde sai cada arquivo

| Arquivo | Script | O que tem dentro |
|---|---|---|
| `data/hero-stats.js` | `tools/update-stats.py` | win rate, pick rate, KDA e tier de cada herói |
| `data/game-data.js` | `tools/update-game-data.py` | itens da loja, builds, contadores, banimento e ranking |
| `data/hero-history.js` | `tools/update-game-data.py` | win rate semana a semana (usado nos gráficos) |
| `data/hero-extra.js` | `tools/update-game-data.py` | etiquetas, dificuldade, cor e história de cada herói (usado nas páginas dos heróis) |
| `data/hero-analytics.js` | `tools/update-analytics.py` | ordem das habilidades, melhores duplas e confrontos de rota (usado nas páginas dos heróis) |
| `data/elos.js` | `tools/update-elos.py` | brasões de elo oficiais + quantos jogadores há em cada elo (usado na aba Estatísticas e no Ranking) |
| `data/guias.js` | `tools/gerar-guias.py` | o guia de cada um dos 43 heróis, já escrito em português e com os números reais (usado na aba Guias e na busca) |
| `data/builds.js` | `tools/gerar-builds.py` | as builds mais usadas de cada um dos 42 heróis, na ordem real de compra, com win rate e partidas. Guarda só o **id** de cada item (o nome, o preço e o ícone vêm da loja que o site já tem) — assim o arquivo fica leve (67 KB em vez de 237 KB) e a página abre mais rápido (usado na aba Builds e na busca) |
| `data/esports.js` | `tools/update-esports.py` | torneios de Deadlock e resultados recentes, com logos, datas, prêmios e campeões (fonte: Liquipedia). Também alimenta a aba **Eventos** (próximos torneios + contagem regressiva) |

> 💡 Se o site ficar sem internet por muito tempo, ele simplesmente continua mostrando os últimos números baixados.
>
> ⚠️ Os nomes das builds vêm de jogadores. Se algum nome for ofensivo, o script troca por "Build da comunidade" sozinho.

---

## 🎮 Aba Jogador (perfil de qualquer jogador)

A aba **Jogador** (no menu, embaixo de Ranking) procura **qualquer conta** e mostra o perfil completo, na hora:

1. Digite **o nome na Steam**, cole **o link do perfil** (`steamcommunity.com/profiles/...`) ou o **ID da conta**.
2. Se aparecerem vários jogadores com o mesmo nome, o site lista todos (foto + partidas nos últimos 30 dias) — clique no seu.
3. O perfil mostra: **elo atual** (brasão oficial), **win rate de todo o histórico**, win rate das últimas 20, **KDA médio**, abates por partida, os **6 heróis mais jogados** (com win rate e KDA de cada um) e as **últimas 15 partidas** (herói, resultado, K/D/A, duração e quando foi).
4. O último ID buscado fica guardado **no seu navegador** e volta sozinho quando você abre a aba de novo.

Clique em qualquer herói da lista para abrir a ficha dele. O botão **Atualizar** busca as partidas de novo.

> 🔒 O site **não tem login, senha nem servidor**: a busca vai direto do seu navegador para a **deadlock-api.com**, que só devolve o que já é público no perfil do jogador. Nada é guardado fora do seu computador.
>
> 💡 Em **Meu Perfil** existe um resumo rápido do seu próprio perfil (com busca por nick). O botão **"Abrir na aba Jogador"** leva esse jogador para a aba completa.

---

## 🖼️ Cartão do herói (imagem para compartilhar)

Na ficha de qualquer herói, o botão **"Baixar cartão"** monta um **cartão em imagem, 1080×1350** (o tamanho que o Instagram, o WhatsApp e o Discord gostam), com:

- a arte do herói (a mesma capa da página dele)
- nome, papel, arquétipo e **tier**
- **win rate**, **pick rate** e o **número de partidas analisadas**
- a **build mais usada** naquele momento
- o endereço do site e a fonte dos números

Dá para **baixar o PNG** ou usar o botão **Compartilhar** (no celular ele abre o menu do próprio aparelho). O cartão é desenhado no seu navegador, com as imagens que já estão no site — então **funciona até sem internet**.

---

## 📱 O site virou um "app" (PWA)

Agora dá para **instalar a Central Deadlock no celular ou no PC**, igual a um aplicativo — com ícone próprio, tela cheia e sem a barra do navegador:

- **Celular (Android/Chrome):** menu ⋮ → **Instalar aplicativo**
- **Celular (iPhone/Safari):** botão **Compartilhar** → **Adicionar à Tela de Início**
- **PC (Chrome/Edge):** ícone de **instalar** (uma telinha com uma seta) na barra de endereço

Os arquivos que fazem isso: `manifest.webmanifest` (nome, ícone, cores), `sw.js` (uma cópia do site guardada no navegador, para abrir rápido) e os ícones em `assets/brand/icon-*.png`.

> **Notícia nunca fica velha:** o `sw.js` foi feito para sempre **buscar as notícias na internet primeiro** e usar a cópia guardada só quando a internet falha.
>
> **Aviso de nova versão:** quando você publica uma mudança, quem já tem o site instalado vê um avisinho **"Nova versão do site disponível!"** com o botão **Atualizar agora** — assim ninguém fica preso numa versão antiga. Isso é automático (está no `script.js` e no `pwa.js`).
>
> Para gerar os ícones de novo (se algum dia mudar a logo): `python tools/make-icons.py` (precisa da biblioteca Pillow).

---

## 🔎 Aparecer no Google

- **`sitemap.xml`** — a lista de páginas para os buscadores (gerada sozinha, com **229 endereços** hoje: Home, 43 heróis, 173 itens, 10 notícias, o guia para iniciantes e a página 404 fica de fora)
- **`robots.txt`** — libera a leitura e aponta para o sitemap
- **`heroi/<nome>.html`** — **uma página para cada herói** (43 no total), no **estilo do dlbr.gg**: um **banner grande** com a arte de fundo do jogo **e o personagem recortado** por cima, o **nome desenhado**, as **etiquetas do jogo** (Tanque, Lutador, Cabeça-Dura…) e os **ícones das 4 habilidades** na cor do herói; abaixo vem o conteúdo em **duas colunas** — o texto e as habilidades à esquerda e os quadros **Papel**, **Dificuldade** e **Resumo** (tier, vida, velocidade, banimento) à direita. Tem ainda a **História** oficial do personagem, os números reais, as builds e os confrontos. É o que aparece quando alguém pesquisa "Abrams Deadlock build"
  - 💡 **Passe o mouse (ou toque) no ícone de uma habilidade** no banner: abre uma caixinha com o **nome em português e inglês**, as etiquetas (**Suprema**, **Passiva**, **Recarga**) e a **descrição completa** — sem precisar rolar a página.

> A **cor de cada herói** vem do próprio jogo (`data/hero-extra.js`) e pinta as etiquetas, a linha do banner e a barra de dificuldade. Se a cor for muito escura, o site clareia sozinho o que precisa e escolhe a cor do texto, para nada ficar ilegível.
- **`noticia/<id>.html`** — **uma página para cada notícia**, com o resumo em português e o texto original
- **`item/<nome>.html`** — **uma página para cada item** da loja (preço, efeito, win rate real e em quais heróis ele aparece)
- **`guia-iniciante.html`** — o guia **Começando no Deadlock**, para quem está na primeira partida
- **`404.html`** — a página que aparece quando alguém abre um **endereço que não existe** (o GitHub usa ela sozinho). Tem a cara do site, o **404** em verde, atalhos para Heróis/Guias/Builds/Itens/Notícias e um botão para voltar. Ela não usa JavaScript, então funciona sempre — e os endereços dela são absolutos (tag `<base>`), porque ela pode aparecer em qualquer profundidade (ex.: `/heroi/nao-existe.html`). Ela fica **fora** do sitemap e com `noindex`.

Essas páginas são geradas pelo `tools/gerar-paginas.py` (o robô do GitHub roda sozinho, todo dia). Os cards de notícia do site apontam para elas com links de verdade — quem clica abre a janela bonita aqui; os buscadores leem o texto completo.

Para o Google achar o site mais rápido: entre no **[Google Search Console](https://search.google.com/search-console)**, adicione a propriedade `https://hypedz.github.io/central-deadlock/` e envie o `sitemap.xml`. Não é obrigatório — o Google acha sozinho com o tempo.

---

## 📰 Conteúdo clicável (Notícias / Guias / Esports)

Todos os cards da Home, Notícias, Guias, Builds e Esports são **clicáveis** e abrem uma **janela com o texto completo**.

Nada de conteúdo inventado no site: as notícias são **oficiais do Steam**, os guias e as builds são montados sozinhos com os **números reais das partidas**, e os torneios são **reais (Liquipedia)**. Os únicos blocos escritos à mão no `script.js` são `NEWS` (notícias de reserva, caso o robô ainda não tenha rodado) e `GUIA_EXEMPLO` / `BUILD_EXEMPLO` (planos B, que não aparecem quando os arquivos gerados existem).

---

## 🛠️ Builds — as mais usadas de cada herói (42)

A aba **Builds** mostra as **builds mais usadas de cada um dos 42 heróis que já receberam dados**, na **ordem real de compra** dos itens, com o **win rate** e o **número de partidas** de cada build. Nada foi escrito à mão: o script `tools/gerar-builds.py` monta tudo com os dados das partidas e escreve o arquivo `data/builds.js`.

Cada build traz:

- **O nome** que a comunidade deu à build (nomes ofensivos são trocados sozinhos por "Build da comunidade")
- **O win rate real** e **quantas partidas** foram jogadas com ela
- **Os itens na ordem certa de compra** — clique em um item para ver o preço, o tipo e o efeito
- Um botão, no fim, que abre a **página completa do herói**

**Para achar rápido:** use a caixa de busca (nome, papel ou tier) ou os botões de papel (Tanque, Suporte, Carry, Controle, Assassino). As builds também aparecem na **busca global (Ctrl + K)**.

Para atualizar as builds com os números de hoje:

```powershell
python tools/gerar-builds.py
```

---

## 📚 Guias — um para cada herói (43)

A aba **Guias** tem **um guia para cada um dos 43 heróis** (antes eram só 3). Nada foi escrito à mão: cada guia é montado sozinho, com os **números reais das partidas**, pelo script `tools/gerar-guias.py`, que escreve o arquivo `data/guias.js`.

Cada guia traz:

- **Como o herói está hoje** — win rate, pick rate, KDA e a posição dele no elenco (tudo real)
- **O papel dele** na partida
- **O que upar primeiro** — a ordem das habilidades usada nas partidas de verdade
- **Com quem jogar** — as melhores duplas e as combinações que derrubam o win rate
- **Na rota** — contra quem ele sofre e contra quem ele vai bem (com a diferença de almas)
- Um botão, no fim, que abre a **página completa do herói** (atributos, builds e histórico)

**Para achar rápido:** use a caixa de busca (nome, papel ou tier) ou os botões de papel (**Tanque, Suporte, Carry, Controle, Assassino**). Os guias também aparecem na **busca global (Ctrl + K)**.

Para atualizar os guias com os números de hoje:

```powershell
python tools/gerar-guias.py
```

(o robô do GitHub roda isso sozinho, todo dia, depois de atualizar as estatísticas)

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

O destaque da Home é a **notícia mais recente** (a capa/foto dela vira o fundo, com um degradê escuro para o texto ficar legível). Se o robô ainda não tiver buscado nenhuma notícia, aparece um aviso neutro com a capa do jogo (`assets/brand/library_hero.jpg`).

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

- **Identidade** — apelido, pronomes, status, bio, título, região, **disponibilidade** (ex.: "depois das 20h") e a opção **"Estou procurando time"** (mostra um selo **LFG** no perfil e no cartão); redes **Discord, Twitch, YouTube, X (Twitter), Instagram, TikTok e Steam**, em duas colunas
- **Jogo** — heróis principais (**até 6**), que aparecem como estandartes no cartão
- **Avatar** — caixa de foto com **Trocar / Reajustar / Remover**, forma (círculo, hexágono, hexágono deitado, octógono, losango, pentágono, escudo, estrela…) e moldura (dourada, neon, cor de destaque, dupla)
- **Cartão** — 8 temas de banner, **13 padrões** (nenhum, grade, pontos, pontos grandes, listras, listras verticais, xadrez, losangos, zigue-zague, raios, anéis, brilho e granulado), cores personalizadas **ou** uma **imagem própria** — e o padrão escolhido aparece igualzinho no PNG baixado
- **Site** — cor de **destaque no site inteiro** (8 cores prontas + **qualquer outra cor**; o texto em cima da cor muda sozinho para continuar legível), **fundo do site** (padrão, **arte de um herói** escolhido ou **cor sólida**), **menu lateral enxuto** (desmarque as abas que você não usa; Home e Meu Perfil ficam sempre), **cartões de herói** (5 formatos: **estandarte, cartão, quadrado, redondo e lista**; **tamanho compacto/padrão/grande** nos formatos com arte e o que aparece embaixo: papel, tier, win rate, pick rate, partidas, KDA e dificuldade), **tamanho do texto** (Pequeno, Padrão ou Grande — vale para o site inteiro), tema escuro/claro, idioma e modo compacto
  - Dica: o tema também tem um **botão no canto direito superior** (em todas as páginas do site), que troca a cor na hora e salva a escolha — é o mesmo ajuste desta aba.
- **Conquistas** — nível, XP, atividade e 8 conquistas que evoluem conforme você usa o site
- **Dados** — salvar, redefinir, **exportar** e **importar** o perfil (arquivo `.json`)

Extras: **Surpreenda-me** (sorteia um visual), **Baixar cartão** (gera um PNG do cartão em **3 tamanhos**: paisagem 1000×600, **story 1080×1920** e **banner 1500×500** para Discord), **Copiar link** (link com o cartão dentro), **Compartilhar** (no celular abre o menu do aparelho — WhatsApp, Discord… — e no computador copia o link) e **Copiar texto** (resumo em texto). A aba **Site** também muda a cor do site todo na hora, sem recarregar. Tudo salvo no navegador (**localStorage**) e atualizado em tempo real. No celular, tudo cabe na largura da tela.

3. **Meu painel do Steam (no fim da aba)** — digite o seu **nick do Steam** e o site mostra **as suas partidas de verdade**: win rate pessoal, KDA médio, elo atual (com o brasão oficial), os heróis que você mais joga e os **últimos 20 jogos** (vitória/derrota, K/D/A, duração e data). Se aparecerem vários jogadores com o mesmo nome, é só escolher o seu. O jogador escolhido fica salvo no navegador e volta sozinho na próxima visita; os botões **Atualizar** e **Trocar jogador** ficam ao lado do nome. Os números vêm do serviço público **deadlock-api.com** — nada é enviado para lugar nenhum.

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
- **Funciona sem internet** — o `sw.js` guarda as páginas, as imagens, **as fontes e os ícones** no navegador; quando a conexão cai aparece uma barrinha avisando que o site está mostrando o que já foi baixado.
- **Acessibilidade** — link "Pular para o conteúdo" (aparece ao apertar **Tab**), contorno de foco visível no teclado, `alt` em todas as imagens e respeito a "reduzir animações" do sistema.
- **Compartilhar** — botões **Compartilhar** no perfil (grande e editor) e na ficha do herói: no celular abrem o menu do aparelho, no computador copiam o link.
- **Tamanho do texto** — Pequeno / Padrão / Grande em **Meu Perfil → Site**; muda o site inteiro na hora.
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
