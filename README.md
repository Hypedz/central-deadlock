# 🎮 Central Deadlock

Portal da comunidade brasileira de **Deadlock**, com identidade visual inspirada no **dlbr.gg** (barra lateral, tema escuro, verde-limão) e uma **logo própria** (emblema art déco feito por nós, em SVG).

---

## 📁 Estrutura

```
meu-fansite/
├── index.html
├── style.css
├── heroes-data.js   # Dados dos heróis (nomes, atributos, habilidades)
├── script.js
├── README.md
└── assets/
    ├── brand/
    │   ├── library_hero.jpg     # Capa usada no banner da Home
    │   ├── deadlock-cover.jpg   # Capa vertical (reserva)
    │   └── deadlock-header.jpg  # Banner horizontal (reserva)
    └── heroes/                  # 44 artes dos heróis (PNG)
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

## ▶️ Visualizar

Abra o `index.html` no navegador, ou rode um servidor local:
```
python -m http.server 8123 --directory "C:\Users\User\Documents\Projeto Padrão\meu-fansite"
```
e acesse `http://localhost:8123`.

---

## 🚀 Publicar

- **GitHub Pages:** envie todos os arquivos (incluindo `assets/`), ative em Settings → Pages.
- **Netlify Drop:** arraste a pasta compactada em [app.netlify.com/drop](https://app.netlify.com/drop).

---

## ⚠️ Aviso legal

Fan site independente, feito por fãs. **Não é oficial da Valve Corporation** e não tem vínculo com ela nem com o dlbr.gg. **Deadlock e suas artes pertencem à Valve.** Mantemos este aviso no rodapé do site.
