// ========================================
// CENTRAL DEADLOCK - Dados dos heróis
// Baseado no protótipo "Deadlock BR v3".
// Nomes de habilidades conforme a deadlock.wiki.
// Para editar um herói, mude o texto entre aspas aqui.
//
// IMPORTANTE: os campos "win" (win rate) e "pick" (taxa de escolha) são
// apenas reserva. O site troca eles pelos NÚMEROS REAIS assim que carrega
// o arquivo data/hero-stats.js (gerado sozinho por tools/update-stats.py).
// A "tier" de cada herói também é recalculada com os dados reais.
// ========================================

const ROLES = ["Tanque","Suporte","Carry","Controle","Assassino"];
const DIFF_LABEL = ["","Fácil","Médio","Difícil"];
const HEROES_SOON = [];

// Habilidades traduzidas automaticamente para portugues pelo script
// tools/traduzir-jogo.py (o nome original em ingles fica no campo "name_en").
// Ultima traducao: 31/10/2026 as 07:43
const HEROES_DATA = [
  {
    "name": "Abrams",
    "file": "Abrams.webp",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 1,
    "dominio": 1,
    "tier": "S",
    "desc": "Brigão de linha de frente que aguenta pancada e entra para abrir a luta.",
    "soon": false,
    "win": "50.0",
    "pick": "2.4",
    "hp": 800,
    "spd": 6.4,
    "skills": [
      {
        "key": "1",
        "name": "Sifão de Vida",
        "desc": "Drena a vida de inimigos próximos ao longo do tempo, causando dano espiritual e curando Abrams com parte dele.",
        "cd": 42,
        "passive": 0,
        "name_en": "Siphon Life"
      },
      {
        "key": "2",
        "name": "Investida de Ombro",
        "desc": "Avança puxando os inimigos atingidos e atordoa quem for empurrado contra uma parede.",
        "cd": 33,
        "passive": 0,
        "name_en": "Shoulder Charge"
      },
      {
        "key": "3",
        "name": "Resiliência Infernal",
        "desc": "Dá atributos defensivos extras; ao sofrer dano, ganha regeneração temporária de vida.",
        "cd": null,
        "passive": 1,
        "name_en": "Infernal Resilience"
      },
      {
        "key": "★",
        "name": "Impacto Sísmico",
        "desc": "Salta para o alto e cai, causando dano espiritual e atordoando inimigos na área.",
        "cd": 215,
        "passive": 0,
        "name_en": "Seismic Impact"
      }
    ]
  },
  {
    "name": "Apollo",
    "file": "Apollo.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
    "dominio": 2,
    "tier": "B",
    "desc": "Assassino de mobilidade, bom em encerrar lutas rápido.",
    "soon": false,
    "win": "54.0",
    "pick": "7.4",
    "hp": 770,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Sigilo de Recuo",
        "desc": "Cria um sigilo que explode à frente de Apollo, ferindo e retardando inimigos, enquanto ele salta para trás.",
        "cd": 12,
        "passive": 0,
        "name_en": "Disengaging Sigil"
      },
      {
        "key": "2",
        "name": "Riposte",
        "desc": "Prepara-se para aparar o próximo ataque; ao aparar, fica invulnerável por pouco tempo e avança sobre um herói inimigo, atordoando-o e reduzindo sua resistência a corpo a corpo.",
        "cd": 22,
        "passive": 0,
        "name_en": "Riposte"
      },
      {
        "key": "3",
        "name": "Avanço Impecável",
        "desc": "Faz uma sequência de estocadas perfurantes; segurar a tecla aumenta o dano, e soltar na janela perfeita causa o dano máximo.",
        "cd": 26,
        "passive": 0,
        "name_en": "Flawless Advance"
      },
      {
        "key": "★",
        "name": "Itani Lo Sahn",
        "desc": "Canaliza um corte de longo alcance que retarda os atingidos, impede suas ações e os cura; quando acaba, eles sofrem dano pesado, maior em inimigos com metade da vida.",
        "cd": 145,
        "passive": 0,
        "name_en": "Itani Lo Sahn"
      }
    ]
  },
  {
    "name": "Baba",
    "file": "Baba.webp",
    "arch": "—",
    "role": "Controle",
    "diff": 1,
    "dominio": 1,
    "dif_fonte": "jogo",
    "tier": "B",
    "desc": "Bruxa idosa que lança maldições nos adversários.",
    "soon": false,
    "win": "52.0",
    "pick": "12.4",
    "hp": 780,
    "spd": 6.5,
    "skills": [
      {
        "key": "1",
        "name": "Threadsap",
        "desc": "Lança um fio que segue sua mira e explode ao longo do caminho, causando dano espiritual e roubando Espírito do inimigo.",
        "cd": 26,
        "passive": 0,
        "name_en": "Threadsap"
      },
      {
        "key": "2",
        "name": "Vovó Pernas-Longas",
        "desc": "Estica as pernas do banco, dando velocidade, saltos maiores e resistência a debuffs e a corpo a corpo, com um chute e um golpe no chão.",
        "cd": 30,
        "passive": 0,
        "name_en": "Granny Long Legs"
      },
      {
        "key": "3",
        "name": "Cerveja do Baba",
        "desc": "Joga um bule de chá que cria uma área alternando entre barreira, Silêncio ou queimadura que causa dano espiritual contínuo.",
        "cd": 25,
        "passive": 0,
        "name_en": "Baba's Brew"
      },
      {
        "key": "★",
        "name": "Alimente os Pássaros",
        "desc": "Cobre os alvos de pão, acumulando lentidão; então pombos os bombardeiam com dano espiritual e transformam cada alvo em pombo.",
        "cd": 150,
        "passive": 0,
        "name_en": "Feed The Birds"
      }
    ]
  },
  {
    "name": "Bebop",
    "file": "Bebop.webp",
    "arch": "Lutador",
    "role": "Controle",
    "diff": 1,
    "dominio": 2,
    "tier": "B",
    "desc": "Mistura de pressão à distância com ganchos para puxar alvos.",
    "soon": false,
    "win": "50.0",
    "pick": "6.4",
    "hp": 880,
    "spd": 6.5,
    "skills": [
      {
        "key": "1",
        "name": "Uppercut Explosivo",
        "desc": "Lança inimigos próximos com repulsão e causa dano espiritual e redução de cadência de tiro na área da queda.",
        "cd": 22,
        "passive": 0,
        "name_en": "Exploding Uppercut"
      },
      {
        "key": "2",
        "name": "Bomba pegajosa",
        "desc": "Gruda uma bomba em um alvo próximo que explode após um instante, causando dano espiritual na área.",
        "cd": 18,
        "passive": 0,
        "name_en": "Sticky Bomb"
      },
      {
        "key": "3",
        "name": "Braço Gancho",
        "desc": "Dispara uma mão mecânica que puxa em direção a Bebop o primeiro alvo atingido.",
        "cd": 23,
        "passive": 0,
        "name_en": "Grapple Arm"
      },
      {
        "key": "★",
        "name": "Hiper Feixe",
        "desc": "Canaliza um raio longo que causa dano espiritual contínuo e retarda quem ele toca.",
        "cd": 120,
        "passive": 0,
        "name_en": "Hyper Beam"
      }
    ]
  },
  {
    "name": "Billy",
    "file": "Billy.webp",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 1,
    "dominio": 1,
    "tier": "B",
    "desc": "Lutador de corpo a corpo que gosta de avançar e trocar golpes.",
    "soon": false,
    "win": "48.0",
    "pick": "11.4",
    "hp": 820,
    "spd": 7,
    "skills": [
      {
        "key": "1",
        "name": "Bashdown",
        "desc": "Bate o taco no chão, puxando inimigos para baixo com dano corpo a corpo e uma onda espiritual que os joga para cima.",
        "cd": 35,
        "passive": 0,
        "name_en": "Bashdown"
      },
      {
        "key": "2",
        "name": "Carneiro Ascendente",
        "desc": "Investe de cabeça num inimigo, lançando-o ao ar junto com ele; o tempo de recarga cai pela metade no impacto.",
        "cd": 32,
        "passive": 0,
        "name_en": "Rising Ram"
      },
      {
        "key": "3",
        "name": "Explosão",
        "desc": "Golpes corpo a corpo restauram munição e deixam a vítima Arrebentada; com a habilidade ativa, seus tiros causam mais dano a ela.",
        "cd": 27,
        "passive": 0,
        "name_en": "Blasted"
      },
      {
        "key": "★",
        "name": "Gangue Acorrentada",
        "desc": "Acorrenta inimigos próximos, retarda quem puxa a corrente e depois os puxa até Billy, causando dano espiritual.",
        "cd": 175,
        "passive": 0,
        "name_en": "Chain Gang"
      }
    ]
  },
  {
    "name": "Calico",
    "file": "Calico.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
    "dominio": 2,
    "tier": "B",
    "desc": "Assassina que vive de emboscadas e de aparecer onde ninguém espera.",
    "soon": false,
    "win": "55.0",
    "pick": "5.4",
    "hp": 730,
    "spd": 6.8,
    "skills": [
      {
        "key": "1",
        "name": "Bombas Sombrias",
        "desc": "Lança um conjunto de bombas que explodem após um instante com dano espiritual; inimigos atingidos por várias bombas sofrem dano reduzido.",
        "cd": 14,
        "passive": 0,
        "name_en": "Gloom Bombs"
      },
      {
        "key": "2",
        "name": "Salto Cortante",
        "desc": "Avança e corta todos ao redor em círculo com dano corpo a corpo, curando um pouco se acertar um herói.",
        "cd": 13,
        "passive": 0,
        "name_en": "Leaping Slash"
      },
      {
        "key": "3",
        "name": "Ava",
        "desc": "Vira sombra e possui seu gato, ganhando velocidade que aumenta com o tempo e sumindo do minimapa; sofrer dano de herói zera o bônus.",
        "cd": 30,
        "passive": 0,
        "name_en": "Ava"
      },
      {
        "key": "★",
        "name": "Voltar às Sombras",
        "desc": "Fica intangível nas sombras, ganhando velocidade e causando dano espiritual, e volta depois de um tempo causando dano espiritual de novo.",
        "cd": 115,
        "passive": 0,
        "name_en": "Return to Shadows"
      }
    ]
  },
  {
    "name": "Celeste",
    "file": "Celeste.webp",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 2,
    "dominio": 3,
    "tier": "B",
    "desc": "Mística de apoio, boa para dar fôlego ao time.",
    "soon": false,
    "win": "53.0",
    "pick": "10.4",
    "hp": 690,
    "spd": 6.2,
    "skills": [
      {
        "key": "1",
        "name": "Devoradora de Luz",
        "desc": "Atinge inimigos num cone com luz, fazendo-os sofrer dano espiritual dos ataques dela e dando-lhe roubo de vida espiritual.",
        "cd": 20,
        "passive": 0,
        "name_en": "Light Eater"
      },
      {
        "key": "2",
        "name": "Truque Deslumbrante",
        "desc": "Cria uma barreira protetora que, ao ser destruída, silencia inimigos próximos e causa dano baseado na barreira.",
        "cd": 38,
        "passive": 0,
        "name_en": "Dazzling Trick"
      },
      {
        "key": "3",
        "name": "Adagas Radiantes",
        "desc": "Invoca um raio de luz que explode após um instante, causando dano espiritual na área e acumulando bônus de dano espiritual ao acertar heróis.",
        "cd": 33,
        "passive": 0,
        "name_en": "Radiant Daggers"
      },
      {
        "key": "★",
        "name": "Maravilha Brilhante",
        "desc": "Lança uma esfera de luz que causa dano espiritual e retarda inimigos, depois quica entre alvos próximos priorizando heróis.",
        "cd": 160,
        "passive": 0,
        "name_en": "Shining Wonder"
      }
    ]
  },
  {
    "name": "Deadman Danny",
    "file": "Danny.webp",
    "arch": "—",
    "role": "Carry",
    "diff": 2,
    "dominio": 2,
    "dif_fonte": "jogo",
    "tier": "B",
    "desc": "Personagem imprudente e acrobático, com foco em explosivos.",
    "soon": false,
    "win": "51.0",
    "pick": "4.4",
    "hp": 680,
    "spd": 6.4,
    "skills": [
      {
        "key": "1",
        "name": "Strix Salvo",
        "desc": "Dispara uma linha de mísseis espirituais que se fincam no chão e explodem após um tempo ou ao detectar um inimigo, marcando-o; um tiro carregado num alvo marcado consome a marca para dano extra e lentidão.",
        "cd": 30,
        "passive": 0,
        "name_en": "Strix Salvo"
      },
      {
        "key": "2",
        "name": "Quimera Mk1",
        "desc": "Segure o pulo para voar acumulando calor; no calor máximo, Danny mergulha e explode, ferindo e lançando inimigos, ou se atordoa se não acertar ninguém.",
        "cd": 21,
        "passive": 0,
        "name_en": "Chimera Mk1"
      },
      {
        "key": "3",
        "name": "Combustível de Ejeção",
        "desc": "Borrifa combustível que causa dano contínuo e reduz resistência a balas, depois dispara uma rajada espiritual que empurra Danny para trás.",
        "cd": 22,
        "passive": 0,
        "name_en": "Jettison Fuel"
      },
      {
        "key": "★",
        "name": "Feche o Negócio",
        "desc": "Agarra um inimigo, o ergue e o arremessa; ambos caem sofrendo dano contínuo e o impacto causa dano extra, maior contra inimigos abaixo de 50% de vida.",
        "cd": 135,
        "passive": 0,
        "name_en": "Close The Deal"
      }
    ]
  },
  {
    "name": "Drifter",
    "file": "Drifter.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 1,
    "dominio": 2,
    "tier": "B",
    "desc": "Assassino sinuoso que persegue e pune alvos isolados.",
    "soon": false,
    "win": "49.0",
    "pick": "9.4",
    "hp": 755,
    "spd": 6.9,
    "skills": [
      {
        "key": "1",
        "name": "Dilacerar",
        "desc": "Ataca em cone à frente com dano espiritual e dano corpo a corpo extra a curta distância.",
        "cd": 16,
        "passive": 0,
        "name_en": "Rend"
      },
      {
        "key": "2",
        "name": "Marca do Perseguidor",
        "desc": "Envia uma marca que faz o primeiro alvo atingido sangrar; reativar enquanto ele sangra teleporta Drifter para trás dele.",
        "cd": 26,
        "passive": 0,
        "name_en": "Stalker's Mark"
      },
      {
        "key": "3",
        "name": "Cheiro de Sangue",
        "desc": "Heróis isolados deixam rastro e seus batimentos são ouvidos de longe; Drifter causa dano ampliado neles e matar um por perto dá dano de arma permanente.",
        "cd": null,
        "passive": 1,
        "name_en": "Bloodscent"
      },
      {
        "key": "★",
        "name": "Noite Eterna",
        "desc": "Escurece heróis inimigos próximos, limitando a visão deles e revelando-os brevemente enquanto os trata como isolados, e dá velocidade de corrida extra.",
        "cd": 145,
        "passive": 0,
        "name_en": "Eternal Night"
      }
    ]
  },
  {
    "name": "Dynamo",
    "file": "Dynamo.webp",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 1,
    "dominio": 2,
    "tier": "B",
    "desc": "Curandeiro que segura a equipe e controla o espaço.",
    "soon": false,
    "win": "47.0",
    "pick": "3.4",
    "hp": 880,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Pulso Cinético",
        "desc": "Envia um pulso pelo chão que causa dano espiritual e joga inimigos para o ar.",
        "cd": 26,
        "passive": 0,
        "name_en": "Kinetic Pulse"
      },
      {
        "key": "2",
        "name": "Emaranhamento Quântico",
        "desc": "Teleporta Dynamo a um local alvo, deixando-o intangível por pouco tempo; a versão alternativa leva aliados próximos junto.",
        "cd": 20,
        "passive": 0,
        "name_en": "Quantum Entanglement"
      },
      {
        "key": "3",
        "name": "Aurora rejuvenescedora",
        "desc": "Canaliza uma cura ao longo do tempo para Dynamo e aliados próximos, e ele ainda pode dar dash e atacar corpo a corpo durante o canal.",
        "cd": 48,
        "passive": 0,
        "name_en": "Rejuvenating Aurora"
      },
      {
        "key": "★",
        "name": "Singularidade",
        "desc": "Cria uma singularidade nas mãos que causa dano espiritual contínuo, atordoa e puxa inimigos próximos.",
        "cd": 250,
        "passive": 0,
        "name_en": "Singularity"
      }
    ]
  },
  {
    "name": "Graves",
    "file": "Graves.webp",
    "arch": "Místico",
    "role": "Controle",
    "diff": 1,
    "dominio": 1,
    "tier": "B",
    "desc": "Místico que controla o espaço com habilidades de longa duração.",
    "soon": false,
    "win": "54.0",
    "pick": "8.4",
    "hp": 730,
    "spd": 7,
    "skills": [
      {
        "key": "1",
        "name": "Jarro de Mortos",
        "desc": "Mortes próximas são coletadas num pote, que é lançado para invocar Cabeças-Mortas que causam dano espiritual repetido.",
        "cd": 13,
        "passive": 0,
        "name_en": "Jar of Dead"
      },
      {
        "key": "2",
        "name": "Mãos Agarradoras",
        "desc": "Faz surgir uma linha de mãos agarradoras que invoca um Ghoul e imobiliza inimigos que passam, causando dano espiritual.",
        "cd": 34,
        "passive": 0,
        "name_en": "Grasping Hands"
      },
      {
        "key": "3",
        "name": "Roubo de Essência",
        "desc": "A arma rouba aos poucos o dano de arma e a resistência espiritual dos inimigos, até um máximo por alvo.",
        "cd": null,
        "passive": 1,
        "name_en": "Essence Theft"
      },
      {
        "key": "★",
        "name": "Decreto Emprestado",
        "desc": "Habilidades invocam Ghouls que seguem para a base inimiga, e uma lápide ativa invoca Ghouls ao longo do tempo.",
        "cd": 140,
        "passive": 0,
        "name_en": "Borrowed Decree"
      }
    ]
  },
  {
    "name": "Grey Talon",
    "file": "GreyTalon.webp",
    "arch": "—",
    "role": "Carry",
    "diff": 1,
    "dominio": 2,
    "tier": "A",
    "desc": "Dano à distância preciso, recompensa boa mira.",
    "soon": false,
    "win": "53.0",
    "pick": "2.4",
    "hp": 750,
    "spd": 6.3,
    "skills": [
      {
        "key": "1",
        "name": "Tiro carregado",
        "desc": "Segura uma flecha carregada e a dispara num tiro perfurante.",
        "cd": 17,
        "passive": 0,
        "name_en": "Charged Shot"
      },
      {
        "key": "2",
        "name": "Chuva de Flechas",
        "desc": "Lança-se ao ar e plana, aumentando o dano de arma e o multitiro enquanto estiver no ar.",
        "cd": 35,
        "passive": 0,
        "name_en": "Rain of Arrows"
      },
      {
        "key": "3",
        "name": "Armadilha Espiritual",
        "desc": "Coloca uma armadilha que, armada, amaldiçoa e retarda inimigos no raio e os interrompe, silencia e desarma.",
        "cd": 34,
        "passive": 0,
        "name_en": "Spirit Snare"
      },
      {
        "key": "★",
        "name": "Coruja Guiada",
        "desc": "Após um breve preparo, lança uma coruja espiritual que ele controla e que explode no impacto, ferindo e atordoando inimigos.",
        "cd": 120,
        "passive": 0,
        "name_en": "Guided Owl"
      }
    ]
  },
  {
    "name": "Haze",
    "file": "Haze.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 1,
    "dominio": 2,
    "tier": "A",
    "desc": "Mobilidade e dano rápido para eliminar alvos frágeis.",
    "soon": false,
    "win": "51.0",
    "pick": "7.4",
    "hp": 730,
    "spd": 8.2,
    "skills": [
      {
        "key": "1",
        "name": "Adaga do Sono",
        "desc": "Lança uma adaga que fere e faz o alvo dormir; alvos dormindo acordam pouco depois de sofrer dano.",
        "cd": 30,
        "passive": 0,
        "name_en": "Sleep Dagger"
      },
      {
        "key": "2",
        "name": "Bomba de fumaça",
        "desc": "Some de vista, ficando invisível e ganhando velocidade de corrida; atacar quebra a invisibilidade e inimigos muito próximos ainda a veem.",
        "cd": 33,
        "passive": 0,
        "name_en": "Smoke Bomb"
      },
      {
        "key": "3",
        "name": "Fixação",
        "desc": "Cada tiro acertado num alvo acumula um bônus de dano de bala contra ele, com bônus maior em tiros na cabeça.",
        "cd": null,
        "passive": 1,
        "name_en": "Fixation"
      },
      {
        "key": "★",
        "name": "Dança das Balas",
        "desc": "Entra numa rajada que atira em inimigos próximos com precisão perfeita e dano de bala adicional.",
        "cd": 165,
        "passive": 0,
        "name_en": "Bullet Dance"
      }
    ]
  },
  {
    "name": "Holliday",
    "file": "Holliday.webp",
    "arch": "—",
    "role": "Carry",
    "diff": 2,
    "dominio": 3,
    "tier": "A",
    "desc": "Atiradora de ritmo firme, forte quando domina a distância.",
    "soon": false,
    "win": "49.0",
    "pick": "12.4",
    "hp": 780,
    "spd": 8.2,
    "skills": [
      {
        "key": "1",
        "name": "Barril de pólvora",
        "desc": "Lança um barril que explode após um tempo, causando dano espiritual, incendiando e jogando inimigos para o alto.",
        "cd": 28,
        "passive": 0,
        "name_en": "Powder Keg"
      },
      {
        "key": "2",
        "name": "Trampolim",
        "desc": "Solta uma plataforma que lança heróis ao ar e causa dano espiritual a inimigos próximos quando ela pousa.",
        "cd": 41,
        "passive": 0,
        "name_en": "Bounce Pad"
      },
      {
        "key": "3",
        "name": "Tiro Certeiro",
        "desc": "Tiros na cabeça causam dano de arma extra e aplicam uma lentidão que se dissipa, só quando o efeito não está em recarga.",
        "cd": 20,
        "passive": 0,
        "name_en": "Crackshot"
      },
      {
        "key": "★",
        "name": "Laço Espiritual",
        "desc": "Lança um laço que causa dano espiritual, puxa o alvo até ela e o atordoa.",
        "cd": 130,
        "passive": 0,
        "name_en": "Spirit Lasso"
      }
    ]
  },
  {
    "name": "Infernus",
    "file": "Infernus.webp",
    "arch": "—",
    "role": "Carry",
    "diff": 1,
    "dominio": 1,
    "tier": "A",
    "desc": "Dano contínuo, ótimo para quem está começando.",
    "soon": false,
    "win": "56.0",
    "pick": "6.4",
    "hp": 800,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Napalm",
        "desc": "Cospe uma mistura incendiária que causa dano espiritual, retarda alvos e os cobre de napalm.",
        "cd": 25,
        "passive": 0,
        "name_en": "Napalm"
      },
      {
        "key": "2",
        "name": "Traço Flamejante",
        "desc": "Avança com resistência a lentidão deixando um rastro de fogo que causa dano espiritual contínuo.",
        "cd": 38,
        "passive": 0,
        "name_en": "Flame Dash"
      },
      {
        "key": "3",
        "name": "Pós-queimadura",
        "desc": "Acertos de arma acumulam uma queimadura que causa dano espiritual contínuo.",
        "cd": null,
        "passive": 1,
        "name_en": "Afterburn"
      },
      {
        "key": "★",
        "name": "Combustão Concussiva",
        "desc": "Após um breve atraso, detona causando dano espiritual e atordoando inimigos próximos.",
        "cd": 140,
        "passive": 0,
        "name_en": "Concussive Combustion"
      }
    ]
  },
  {
    "name": "Ivy",
    "file": "Ivy.webp",
    "arch": "—",
    "role": "Suporte",
    "diff": 2,
    "dominio": 2,
    "tier": "B",
    "desc": "Apoio flexível com bom controle de grupo.",
    "soon": false,
    "win": "53.0",
    "pick": "11.4",
    "hp": 755,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Espinhos Enredados",
        "desc": "Cria um canteiro de espinhos que fere e retarda inimigos dentro do raio.",
        "cd": 32,
        "passive": 0,
        "name_en": "Entangling Thorns"
      },
      {
        "key": "2",
        "name": "Ligação Kudzu",
        "desc": "Liga Ivy a um aliado próximo para compartilhar bônus e replicar curas.",
        "cd": 37,
        "passive": 0,
        "name_en": "Kudzu Connection"
      },
      {
        "key": "3",
        "name": "Forma de Pedra",
        "desc": "Vira pedra e bate no chão, ferindo e atordoando inimigos próximos enquanto se cura.",
        "cd": 40,
        "passive": 0,
        "name_en": "Stone Form"
      },
      {
        "key": "★",
        "name": "Queda Aérea",
        "desc": "Ergue um aliado no ar e o derruba para explodir entre inimigos, ou o leva voando para longe do perigo.",
        "cd": 100,
        "passive": 0,
        "name_en": "Air Drop"
      }
    ]
  },
  {
    "name": "Kelvin",
    "file": "Kelvin.webp",
    "arch": "Lutador",
    "role": "Suporte",
    "diff": 1,
    "dominio": 1,
    "tier": "C",
    "desc": "Proteção e cura, bom em manter aliados vivos.",
    "soon": false,
    "win": "51.0",
    "pick": "5.4",
    "hp": 880,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Granada de Gelo",
        "desc": "Lança uma granada que explode em gelo, curando aliados e causando dano espiritual e lentidão a inimigos.",
        "cd": 30,
        "passive": 0,
        "name_en": "Frost Grenade"
      },
      {
        "key": "2",
        "name": "Caminho de Gelo",
        "desc": "Cria uma trilha de gelo flutuante que dá velocidade a Kelvin e aliados, e resistência a lentidão a Kelvin.",
        "cd": 50,
        "passive": 0,
        "name_en": "Ice Path"
      },
      {
        "key": "3",
        "name": "Feixe Ártico",
        "desc": "Dispara um raio congelante que fere e reduz progressivamente a velocidade de movimento e a cadência de tiro quanto mais tempo fica no alvo.",
        "cd": 28,
        "passive": 0,
        "name_en": "Arctic Beam"
      },
      {
        "key": "★",
        "name": "Abrigo Congelado",
        "desc": "Cria uma cúpula de gelo impenetrável em torno de Kelvin ou de um herói alvo, curando aliados dentro e retardando inimigos.",
        "cd": 185,
        "passive": 0,
        "name_en": "Frozen Shelter"
      }
    ]
  },
  {
    "name": "Lady Geist",
    "file": "LadyGeist.webp",
    "arch": "Místico",
    "role": "Carry",
    "diff": 1,
    "dominio": 2,
    "tier": "A",
    "desc": "Troca vida por poder, alto risco e alta recompensa.",
    "soon": false,
    "win": "50.0",
    "pick": "10.4",
    "hp": 880,
    "spd": 6.3,
    "skills": [
      {
        "key": "1",
        "name": "Bomba de Essência",
        "desc": "Gasta parte da própria vida para disparar uma bomba que explode após um breve tempo de armação.",
        "cd": 14,
        "passive": 0,
        "name_en": "Essence Bomb"
      },
      {
        "key": "2",
        "name": "Dreno de Vida",
        "desc": "Prende um inimigo para drenar sua vida ao longo do tempo e curar Geist; também pode transferir vida a um herói aliado.",
        "cd": 34,
        "passive": 0,
        "name_en": "Life Drain"
      },
      {
        "key": "3",
        "name": "Malícia",
        "desc": "Gasta parte da vida para lançar estilhaços de sangue que acumulam lentidão e dano recebido nos inimigos.",
        "cd": 6,
        "passive": 0,
        "name_en": "Malice"
      },
      {
        "key": "★",
        "name": "Troca de Almas",
        "desc": "Troca o nível de vida com um inimigo alvo, respeitando limites mínimos de vida.",
        "cd": 220,
        "passive": 0,
        "name_en": "Soul Exchange"
      }
    ]
  },
  {
    "name": "Lash",
    "file": "Lash.webp",
    "arch": "Assassino",
    "role": "Controle",
    "diff": 2,
    "dominio": 2,
    "tier": "B",
    "desc": "Mobilidade vertical e iniciações de impacto.",
    "soon": false,
    "win": "47.0",
    "pick": "4.4",
    "hp": 780,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Golpe no Solo",
        "desc": "Pisoteia o chão ferindo inimigos num cone à frente e mergulha em direção ao chão se usado no ar.",
        "cd": 21,
        "passive": 0,
        "name_en": "Ground Strike"
      },
      {
        "key": "2",
        "name": "Gancho",
        "desc": "Puxa Lash pelo ar até um alvo e restaura seus pulos aéreos e dashes.",
        "cd": 35,
        "passive": 0,
        "name_en": "Grapple"
      },
      {
        "key": "3",
        "name": "Chicotear",
        "desc": "Chicoteia inimigos à frente e se cura com parte do dano causado.",
        "cd": 26,
        "passive": 0,
        "name_en": "Flog"
      },
      {
        "key": "★",
        "name": "Golpe Mortal",
        "desc": "Prende chicotes em inimigos durante um canal e então os ergue, atordoa e esmaga no chão.",
        "cd": 150,
        "passive": 0,
        "name_en": "Death Slam"
      }
    ]
  },
  {
    "name": "McGinnis",
    "file": "McGinnis.webp",
    "arch": "Místico",
    "role": "Controle",
    "diff": 1,
    "dominio": 1,
    "tier": "S",
    "desc": "Domínio de área com torres e barreiras.",
    "soon": false,
    "win": "57.0",
    "pick": "9.4",
    "hp": 750,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Minitorre",
        "desc": "Instala uma torreta de curta duração que atira em inimigos e causa dano espiritual contínuo.",
        "cd": 18,
        "passive": 0,
        "name_en": "Mini Turret"
      },
      {
        "key": "2",
        "name": "Espectro Medicinal",
        "desc": "Invoca um espírito que cura e restaura stamina de aliados próximos.",
        "cd": 48,
        "passive": 0,
        "name_en": "Medicinal Specter"
      },
      {
        "key": "3",
        "name": "Parede Espectral",
        "desc": "Cria uma parede no terreno que fere e retarda inimigos próximos, e pode ser detonada antes do tempo.",
        "cd": 50,
        "passive": 0,
        "name_en": "Spectral Wall"
      },
      {
        "key": "★",
        "name": "Barragem Pesada",
        "desc": "Dispara foguetes teleguiados numa área alvo por um tempo, retardando McGinnis enquanto dura.",
        "cd": 165,
        "passive": 0,
        "name_en": "Heavy Barrage"
      }
    ]
  },
  {
    "name": "Mina",
    "file": "Mina.webp",
    "arch": "—",
    "role": "Assassino",
    "diff": 2,
    "dominio": 2,
    "tier": "B",
    "desc": "Predadora de ritmo agressivo, forte em perseguições.",
    "soon": false,
    "win": "52.0",
    "pick": "3.4",
    "hp": 660,
    "spd": 6.5,
    "skills": [
      {
        "key": "1",
        "name": "Ancinho",
        "desc": "Corta com o guarda-chuva com dano espiritual que escala com a vida perdida do alvo, curando-a a cada abate.",
        "cd": 16,
        "passive": 0,
        "name_en": "Rake"
      },
      {
        "key": "2",
        "name": "Retiro Sanguíneo",
        "desc": "Vira morcegos por um instante, ficando intangível enquanto voa até um local escolhido, com uma breve janela de reativação.",
        "cd": 32,
        "passive": 0,
        "name_en": "Sanguine Retreat"
      },
      {
        "key": "3",
        "name": "Mordidas de Amor",
        "desc": "Adiciona dano espiritual aos tiros e acumula uma explosão de dano espiritual extra quando causa dano a inimigos com habilidades.",
        "cd": null,
        "passive": 1,
        "name_en": "Love Bites"
      },
      {
        "key": "★",
        "name": "Nox Nostra",
        "desc": "Solta uma nuvem de morcegos teleguiados que causam dano espiritual e Silêncio, com mais morcegos conforme ativa Love Bites em heróis.",
        "cd": 150,
        "passive": 0,
        "name_en": "Nox Nostra"
      }
    ]
  },
  {
    "name": "Mirage",
    "file": "Mirage.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
    "dominio": 2,
    "tier": "A",
    "desc": "Assassino ágil, ótimo para flanquear e sumir da luta.",
    "soon": false,
    "win": "51.0",
    "pick": "8.4",
    "hp": 730,
    "spd": 7,
    "skills": [
      {
        "key": "1",
        "name": "Escaravelhos de Fogo",
        "desc": "Infesta um inimigo com escaravelhos que roubam sua vida e reduzem o dano que ele causa.",
        "cd": 35,
        "passive": 0,
        "name_en": "Fire Scarabs"
      },
      {
        "key": "2",
        "name": "Redemoinho de Poeira",
        "desc": "Vira um redemoinho que avança ferindo, retardando e erguendo inimigos, e depois dá evasão de balas.",
        "cd": 36,
        "passive": 0,
        "name_en": "Dust Devil"
      },
      {
        "key": "3",
        "name": "Marca do Djinn",
        "desc": "Tiros aplicam marcas que causam dano espiritual e revelam o alvo ao expirar ou serem consumidas. Ativa, consome todas as marcas de uma vez.",
        "cd": null,
        "passive": 1,
        "name_en": "Djinn's Mark"
      },
      {
        "key": "★",
        "name": "Viajante",
        "desc": "Teleporta Mirage a um local do minimapa após uma breve espera, interrompida se ele sofrer dano.",
        "cd": 140,
        "passive": 0,
        "name_en": "Traveler"
      }
    ]
  },
  {
    "name": "Mo & Krill",
    "file": "MoKrill.webp",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 1,
    "dominio": 1,
    "tier": "B",
    "desc": "Dupla que gosta de surpreender e prender alvos no corpo a corpo.",
    "soon": false,
    "win": "48.0",
    "pick": "2.4",
    "hp": 930,
    "spd": 8,
    "skills": [
      {
        "key": "1",
        "name": "Desprezo",
        "desc": "Fere inimigos próximos e cura a dupla com base no dano causado, mais contra heróis inimigos.",
        "cd": 13,
        "passive": 0,
        "name_en": "Scorn"
      },
      {
        "key": "2",
        "name": "Escavar",
        "desc": "Viaja sob a terra em velocidade maior com armadura espiritual e de bala, e depois irrompe ferindo, retardando e lançando inimigos ao ar.",
        "cd": 40,
        "passive": 0,
        "name_en": "Burrow"
      },
      {
        "key": "3",
        "name": "Explosão de Areia",
        "desc": "Dispara um jato de areia que desarma e fere inimigos à frente da dupla.",
        "cd": 40,
        "passive": 0,
        "name_en": "Sand Blast"
      },
      {
        "key": "★",
        "name": "Combo",
        "desc": "Segura um alvo no lugar, atordoando e ferindo; ganha vida máxima permanente se ele morrer durante ou logo após o canal.",
        "cd": 150,
        "passive": 0,
        "name_en": "Combo"
      }
    ]
  },
  {
    "name": "Nurse Harrow",
    "file": "NurseHarrow.webp",
    "arch": "—",
    "role": "Suporte",
    "diff": 1,
    "dominio": 1,
    "dif_fonte": "jogo",
    "tier": "B",
    "desc": "Curandeira que drena os inimigos com sanguessugas e mantém o time vivo com cura injetada.",
    "soon": false,
    "win": "55.0",
    "pick": "7.4",
    "hp": 730,
    "spd": 6.8,
    "skills": [
      {
        "key": "1",
        "name": "Terapia de Sanguessugas",
        "desc": "Joga um pote de sanguessugas que grudam nos inimigos, causam dano espiritual contínuo e encurtam a duração dos efeitos bons deles. Depois de se alimentarem, as sanguessugas voltam rastejando e curam você, e cada uma dá regeneração e cadência de tiro permanentes (até 10 acúmulos; você perde 25% deles ao morrer).",
        "cd": 30,
        "passive": 0,
        "name_en": "Leech Therapy"
      },
      {
        "key": "2",
        "name": "Vapores Miseráveis",
        "desc": "Libera um vapor em você ou num aliado: por 4s tudo fica mais rápido e o dano recebido é adiado em espectros. Quando o vapor passa, tudo fica mais lento e os espectros que sobrarem estouram o dano guardado com um extra. Cura recebida apaga os espectros antes de estourar.",
        "cd": 40,
        "passive": 0,
        "name_en": "Wretched Vapors"
      },
      {
        "key": "3",
        "name": "Agulhas de Cura",
        "desc": "Carrega a arma com uma carga cheia de seringas que curam os aliados. Causar dano devolve cargas, e cada sanguessuga coletada repõe cargas aos poucos. Recarregar gasta uma carga; apertar de novo guarda as seringas que sobraram.",
        "cd": null,
        "passive": 0,
        "name_en": "Healing Needles"
      },
      {
        "key": "★",
        "name": "Terrores Espreitados",
        "desc": "Abre a bolsa e solta os horrores que carrega: dano espiritual contínuo nos inimigos à frente. Quem olha para você acumula terror e não pode usar stamina nem habilidades de movimento; no terror máximo, foge de medo. Cada sanguessuga coletada aumenta a duração do medo.",
        "cd": 200,
        "passive": 0,
        "name_en": "Lurking Terrors"
      }
    ]
  },
  {
    "name": "Paige",
    "file": "Paige.webp",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 1,
    "dominio": 1,
    "tier": "B",
    "desc": "Mística que combina apoio e dano com habilidades em área.",
    "soon": false,
    "win": "53.0",
    "pick": "12.4",
    "hp": 650,
    "spd": 7,
    "skills": [
      {
        "key": "1",
        "name": "Conjurar Dragão",
        "desc": "Invoca um dragão no local alvo que voa para a frente causando dano espiritual e deixando um rastro em chamas.",
        "cd": 30,
        "passive": 0,
        "name_en": "Bookwyrm"
      },
      {
        "key": "2",
        "name": "Defenda e Lute!",
        "desc": "Dá a um aliado uma barreira que também aumenta o dano de arma dele enquanto durar.",
        "cd": 30,
        "passive": 0,
        "name_en": "Plot Armor"
      },
      {
        "key": "3",
        "name": "Leitura Cativante",
        "desc": "Marca uma área com magia retardada que retarda inimigos e depois detona causando dano espiritual e imobilizando quem está dentro.",
        "cd": 25,
        "passive": 0,
        "name_en": "Captivating Read"
      },
      {
        "key": "★",
        "name": "Carga de Reunião",
        "desc": "Envia cavaleiros espectrais pela cidade, curando aliados e ferindo inimigos, com ambos os efeitos crescendo com a distância.",
        "cd": 190,
        "passive": 0,
        "name_en": "Rallying Charge"
      }
    ]
  },
  {
    "name": "Paradox",
    "file": "Paradox.webp",
    "arch": "—",
    "role": "Controle",
    "diff": 2,
    "dominio": 3,
    "tier": "B",
    "desc": "Manipula tempo e posição, exige leitura de jogo.",
    "soon": false,
    "win": "51.0",
    "pick": "6.4",
    "hp": 730,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Granada de Pulso",
        "desc": "Lança uma granada que pulsa ao pousar, causando dano espiritual, retardando inimigos e acumulando um amplificador de dano em cada vítima.",
        "cd": 32,
        "passive": 0,
        "name_en": "Pulse Grenade"
      },
      {
        "key": "2",
        "name": "Muralha do Tempo",
        "desc": "Cria uma parede que congela projéteis inimigos, aumenta a velocidade e o dano das balas aliadas e retarda brevemente inimigos que a cruzam.",
        "cd": 25,
        "passive": 0,
        "name_en": "Time Wall"
      },
      {
        "key": "3",
        "name": "Carabina Cinética",
        "desc": "Carrega um único tiro poderoso que causa dano espiritual e aplica Parada no Tempo, com dano escalando do dano de arma.",
        "cd": 28,
        "passive": 0,
        "name_en": "Kinetic Carbine"
      },
      {
        "key": "★",
        "name": "Troca Paradoxal",
        "desc": "Dispara um projétil que troca a posição de Paradox com um herói inimigo, causando dano de troca e dando uma barreira.",
        "cd": 110,
        "passive": 0,
        "name_en": "Paradoxical Swap"
      }
    ]
  },
  {
    "name": "Pocket",
    "file": "Pocket.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 3,
    "dominio": 3,
    "tier": "C",
    "desc": "Emboscadas e reposicionamento esperto.",
    "soon": false,
    "win": "49.0",
    "pick": "11.4",
    "hp": 780,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Barragem",
        "desc": "Canaliza para disparar projéteis espirituais que retardam inimigos ao redor do impacto, com acertos em heróis acumulando um amplificador de dano.",
        "cd": 32,
        "passive": 0,
        "name_en": "Barrage"
      },
      {
        "key": "2",
        "name": "Capa Voadora",
        "desc": "Envia uma capa senciente que fere inimigos pelo caminho, e Pocket pode se teleportar até onde ela está.",
        "cd": 26,
        "passive": 0,
        "name_en": "Flying Cloak"
      },
      {
        "key": "3",
        "name": "Bolsa do Encantador",
        "desc": "Pocket se esconde na mala e causa dano espiritual a inimigos próximos quando termina; qualquer ação o encerra antes.",
        "cd": 17,
        "passive": 0,
        "name_en": "Enchanter's Satchel"
      },
      {
        "key": "★",
        "name": "Aflição",
        "desc": "Causa dano contínuo a inimigos próximos e impede toda cura enquanto ativo.",
        "cd": 170,
        "passive": 0,
        "name_en": "Affliction"
      }
    ]
  },
  {
    "name": "Rat King",
    "file": "RatKing.webp",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 3,
    "dominio": 3,
    "dif_fonte": "jogo",
    "tier": "B",
    "desc": "Lutador escrachado e real, um rato gigante de coroa.",
    "soon": false,
    "win": "47.0",
    "pick": "5.4",
    "hp": 800,
    "spd": 6.8,
    "skills": [
      {
        "key": "1",
        "name": "Granada de Sucata",
        "desc": "Lança uma granada de sucata que detona várias vezes, causando dano de bala e retardando inimigos.",
        "cd": 26,
        "passive": 0,
        "name_en": "Scrap Grenade"
      },
      {
        "key": "2",
        "name": "Enxame de Ratos",
        "desc": "Invoca ratos que grudam nos inimigos, causando dano espiritual contínuo e reduzindo a resistência a balas a cada mordida.",
        "cd": 24,
        "passive": 0,
        "name_en": "Rat Swarm"
      },
      {
        "key": "3",
        "name": "Pragas Reais",
        "desc": "Veste armadura para ganhar uma barreira baseada na vida máxima, podendo rebater balas de volta aos atacantes.",
        "cd": 22,
        "passive": 0,
        "name_en": "Royal Pestments"
      },
      {
        "key": "★",
        "name": "Comande, Ratânia!",
        "desc": "Finca um estandarte que dá velocidade, imunidade a lentidão e redução de dano a aliados próximos, e depois uma pancada fere, lança ao ar e retarda inimigos na área.",
        "cd": 160,
        "passive": 0,
        "name_en": "Rule, Ratannia!"
      }
    ]
  },
  {
    "name": "Rem",
    "file": "Rem.webp",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 1,
    "dominio": 2,
    "tier": "B",
    "desc": "Herói recente do elenco, com perfil de apoio místico.",
    "soon": false,
    "win": "54.0",
    "pick": "10.4",
    "hp": 680,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Arremesso de Travesseiro",
        "desc": "Lança um travesseiro que causa dano espiritual e grande repulsão; acertos reduzem a recarga das suas outras habilidades.",
        "cd": 25,
        "passive": 0,
        "name_en": "Pillow Toss"
      },
      {
        "key": "2",
        "name": "Vem Junto",
        "desc": "Pula até um aliado e tira uma soneca ao lado dele, dando a ambos uma cura imediata baseada na vida perdida, seguida de regeneração.",
        "cd": 40,
        "passive": 0,
        "name_en": "Tag Along"
      },
      {
        "key": "3",
        "name": "Ajudantes do Lil",
        "desc": "Envia ajudantes para coletar caixas, fazer Sacrifícios do Pecador ou seguir heróis ou tropas para dar bônus ou cura.",
        "cd": null,
        "passive": 1,
        "name_en": "Lil Helpers"
      },
      {
        "key": "★",
        "name": "Hora do Cochilo",
        "desc": "Canaliza um olhar através de paredes e pisos que retarda inimigos e depois os faz dormir; ao acordarem, sofrem dano espiritual.",
        "cd": 200,
        "passive": 0,
        "name_en": "Naptime"
      }
    ]
  },
  {
    "name": "Seven",
    "file": "Seven.webp",
    "arch": "Místico",
    "role": "Carry",
    "diff": 1,
    "dominio": 1,
    "tier": "A",
    "desc": "Dano em área elétrico, bom em lutas de equipe.",
    "soon": false,
    "win": "53.0",
    "pick": "4.4",
    "hp": 730,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Bola Relâmpago",
        "desc": "Dispara uma bola de raio em linha reta que fere inimigos no raio, retardando quem atinge e parando no terreno.",
        "cd": 26,
        "passive": 0,
        "name_en": "Lightning Ball"
      },
      {
        "key": "2",
        "name": "Carga Estática",
        "desc": "Marca um herói inimigo e, após um breve atraso, atordoa e fere inimigos na área.",
        "cd": 42,
        "passive": 0,
        "name_en": "Static Charge"
      },
      {
        "key": "3",
        "name": "Surto de Energia",
        "desc": "Cada rajada de arma de Seven adiciona dano de choque ao alvo, que pode saltar para inimigos próximos.",
        "cd": 50,
        "passive": 0,
        "name_en": "Power Surge"
      },
      {
        "key": "★",
        "name": "Nuvem de Tempestade",
        "desc": "Canaliza uma nuvem de tempestade em expansão que fere inimigos no raio, exceto os fora da linha de visão.",
        "cd": 180,
        "passive": 0,
        "name_en": "Storm Cloud"
      }
    ]
  },
  {
    "name": "Shiv",
    "file": "Shiv.webp",
    "arch": "Lutador",
    "role": "Assassino",
    "diff": 2,
    "dominio": 3,
    "tier": "B",
    "desc": "Duelista que cresce conforme acumula acertos.",
    "soon": false,
    "win": "50.0",
    "pick": "9.4",
    "hp": 830,
    "spd": 6.5,
    "skills": [
      {
        "key": "1",
        "name": "Facas serrilhadas",
        "desc": "Lança uma faca que faz o inimigo sangrar; cada acerto extra acumula e renova o sangramento.",
        "cd": 16,
        "passive": 0,
        "name_en": "Serrated Knives"
      },
      {
        "key": "2",
        "name": "Cortar e Picar",
        "desc": "Avança ferindo inimigos pelo caminho e reduzindo a resistência espiritual deles.",
        "cd": 16,
        "passive": 0,
        "name_en": "Slice and Dice"
      },
      {
        "key": "3",
        "name": "Sangramento",
        "desc": "Recebe só parte do dano imediatamente e adia o resto ao longo do tempo; pode ser ativada para limpar parte do dano adiado.",
        "cd": 25,
        "passive": 0,
        "name_en": "Bloodletting"
      },
      {
        "key": "★",
        "name": "Golpe Fatal",
        "desc": "Salta contra o primeiro herói inimigo e o executa se estiver abaixo do limite de vida; senão, o fere.",
        "cd": 145,
        "passive": 0,
        "name_en": "Killing Blow"
      }
    ]
  },
  {
    "name": "Silver",
    "file": "Silver.webp",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 2,
    "dominio": 1,
    "tier": "A",
    "desc": "Lutador feroz, forte em lutas longas e de perto.",
    "soon": false,
    "win": "49.0",
    "pick": "3.4",
    "hp": 830,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Tiro de Impacto",
        "desc": "Recarrega a arma na hora e dá cadência de tiro e dano extras conforme a vida do alvo por alguns tiros, com precisão reduzida.",
        "cd": 25,
        "passive": 0,
        "name_en": "Slam Fire"
      },
      {
        "key": "2",
        "name": "Chute de Partida",
        "desc": "Avança chutando o primeiro inimigo atingido com dano corpo a corpo e o marca; atirar no marcado causa dano espiritual.",
        "cd": 21,
        "passive": 0,
        "name_en": "Boot Kick"
      },
      {
        "key": "3",
        "name": "Bola Enredadora",
        "desc": "Lança uma bola que causa dano espiritual, retarda o alvo e impede habilidades de movimento e uso de stamina.",
        "cd": 23,
        "passive": 0,
        "name_en": "Entangling Bola"
      },
      {
        "key": "★",
        "name": "Maldição Lycan",
        "desc": "Transforma Silver por 15 segundos, dando vida máxima e cadência de tiro contra heróis inimigos e trocando habilidades e arma por versões de lobisomem.",
        "cd": 60,
        "passive": 0,
        "name_en": "Lycan Curse"
      }
    ]
  },
  {
    "name": "Sinclair",
    "file": "Sinclair.webp",
    "arch": "Místico",
    "role": "Controle",
    "diff": 3,
    "dominio": 3,
    "tier": "B",
    "desc": "Místico de truques e ilusões, bom para confundir o inimigo.",
    "soon": false,
    "win": "55.0",
    "pick": "8.4",
    "hp": 730,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Virote Perturbador",
        "desc": "Dispara um raio mágico que causa mais dano quanto mais longe vai; com o Assistente em campo, ele também dispara um raio mais fraco.",
        "cd": 24,
        "passive": 0,
        "name_en": "Vexing Bolt"
      },
      {
        "key": "2",
        "name": "Assistente Espectral",
        "desc": "Invoca um Assistente num local alvo que ataca sempre que você atira; a habilidade 2 troca sua posição com a do Assistente.",
        "cd": 40,
        "passive": 0,
        "name_en": "Spectral Assistant"
      },
      {
        "key": "3",
        "name": "Feitiço do Coelho",
        "desc": "Enfeitiça uma área e transforma todos os inimigos dentro em Coelhos por um tempo limitado.",
        "cd": 26,
        "passive": 0,
        "name_en": "Rabbit Hex"
      },
      {
        "key": "★",
        "name": "Participação do Público",
        "desc": "Copia a suprema de um herói inimigo por um tempo; reativar usa a suprema copiada.",
        "cd": 85,
        "passive": 0,
        "name_en": "Audience Participation"
      }
    ]
  },
  {
    "name": "Solomon",
    "file": "Solomon.webp",
    "arch": "Místico",
    "role": "Controle",
    "diff": 1,
    "dominio": 1,
    "dif_fonte": "jogo",
    "tier": "B",
    "desc": "Estrategista focado, que luta com uma peça de xadrez.",
    "soon": false,
    "win": "53.0",
    "pick": "2.4",
    "hp": 780,
    "spd": 6.7,
    "skills": [
      {
        "key": "1",
        "name": "Posicionar Bispo",
        "desc": "Coloca um bispo que, ao ser movido, retarda e fere inimigos pelo caminho, e suas casas diagonais causam dano extra ao serem pisadas; reativar recolhe todos os bispos.",
        "cd": 12,
        "passive": 0,
        "name_en": "Setup Bishop"
      },
      {
        "key": "2",
        "name": "Cavalo da Ala do Rei",
        "desc": "Transforma um aliado em cavalo, dando stamina extra e barreira; em si mesmo, Solomon vira o rei, com barreira maior e sem stamina.",
        "cd": 25,
        "passive": 0,
        "name_en": "Kingside Knight"
      },
      {
        "key": "3",
        "name": "Bateria de Torre",
        "desc": "Lança um par de torres que ferem e imobilizam inimigos, refletindo nas paredes; reativar as separa em direções perpendiculares.",
        "cd": 33,
        "passive": 0,
        "name_en": "Rook Battery"
      },
      {
        "key": "★",
        "name": "Desenvolver a Rainha",
        "desc": "Invoca uma rainha que cai ferindo a área e depois solta linhas de casas que ferem e atordoam; mover faz ela saltar e reativar a recolhe antes.",
        "cd": 210,
        "passive": 0,
        "name_en": "Develop Queen"
      }
    ]
  },
  {
    "name": "The Doorman",
    "file": "Doorman.webp",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 2,
    "dominio": 3,
    "tier": "B",
    "desc": "Místico de apoio com habilidades de proteção de espaço.",
    "soon": false,
    "win": "51.0",
    "pick": "7.4",
    "hp": 755,
    "spd": 7.9,
    "skills": [
      {
        "key": "1",
        "name": "Tocar a Campainha",
        "desc": "Lança um sino que causa dano espiritual no impacto e explode depois, causando mais dano, retardando inimigos próximos e reduzindo sua precisão.",
        "cd": 18,
        "passive": 0,
        "name_en": "Call Bell"
      },
      {
        "key": "2",
        "name": "Entrada",
        "desc": "Coloca duas portas ligadas que levam jogadores e a maioria dos projéteis de uma para a outra até fecharem.",
        "cd": 45,
        "passive": 0,
        "name_en": "Doorway"
      },
      {
        "key": "3",
        "name": "Carrinho de bagagem",
        "desc": "Envia um carrinho que causa dano espiritual e puxa heróis inimigos pelo caminho.",
        "cd": 30,
        "passive": 0,
        "name_en": "Luggage Cart"
      },
      {
        "key": "★",
        "name": "Hóspede do Hotel",
        "desc": "Manda o corpo de um inimigo para uma estadia no Hotel Baroness e o devolve na saída; não sair a tempo causa dano espiritual extra.",
        "cd": 140,
        "passive": 0,
        "name_en": "Hotel Guest"
      }
    ]
  },
  {
    "name": "Venator",
    "file": "Venator.webp",
    "arch": "—",
    "role": "Carry",
    "diff": 1,
    "dominio": 1,
    "tier": "B",
    "desc": "Caçador de alvos prioritários, preferência por distância.",
    "soon": false,
    "win": "49.0",
    "pick": "12.4",
    "hp": 820,
    "spd": 6.4,
    "skills": [
      {
        "key": "1",
        "name": "Granada Consagrada",
        "desc": "Dispara uma granada quicante que explode, fere e incendeia inimigos, causando dano puro e reduzindo a cura.",
        "cd": 25,
        "passive": 0,
        "name_en": "Consecrating Grenade"
      },
      {
        "key": "2",
        "name": "Tiro no Estômago",
        "desc": "Dispara um tiro de espingarda que fere e empurra inimigos; os perto de uma parede ficam atordoados e sofrem dano extra.",
        "cd": 23,
        "passive": 0,
        "name_en": "Gutshot"
      },
      {
        "key": "3",
        "name": "Armadilha Hexagonal",
        "desc": "Chuta uma armadilha que se arma após um instante e fecha no primeiro herói inimigo que tocar, causando dano espiritual, imobilizando e revelando.",
        "cd": 28,
        "passive": 0,
        "name_en": "Hex-Lined Snap Trap"
      },
      {
        "key": "★",
        "name": "Ira Domini",
        "desc": "Carrega a besta com três estacas de dano pesado, sendo a última abençoada para causar dano puro extra e executar inimigos com pouca vida.",
        "cd": 160,
        "passive": 0,
        "name_en": "Ira Domini"
      }
    ]
  },
  {
    "name": "Victor",
    "file": "Victor.webp",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 2,
    "dominio": 1,
    "tier": "B",
    "desc": "Lutador resistente, forte em segurar a linha de frente.",
    "soon": false,
    "win": "47.0",
    "pick": "6.4",
    "hp": 800,
    "spd": 6.3,
    "skills": [
      {
        "key": "1",
        "name": "Bateria de Dor",
        "desc": "Sofrer dano o carrega; quando cheio, ativá-lo dispara raios de choque que causam dano espiritual uma vez em cada alvo.",
        "cd": 2,
        "passive": 0,
        "name_en": "Pain Battery"
      },
      {
        "key": "2",
        "name": "Partida Rápida",
        "desc": "Eletrocuta Victor com dano espiritual e depois dá regeneração de vida e velocidade extras que se dissipam com o tempo.",
        "cd": 30,
        "passive": 0,
        "name_en": "Jumpstart"
      },
      {
        "key": "3",
        "name": "Aura de Sofrimento",
        "desc": "Canalizada para liberar dor que fere inimigos próximos e o próprio Victor ao longo do tempo, com dano crescente quanto mais tempo canalizar.",
        "cd": 2,
        "passive": 0,
        "name_en": "Aura of Suffering"
      },
      {
        "key": "★",
        "name": "Reanimação Chocante",
        "desc": "Passiva: após sofrer dano letal, Victor libera uma onda retardadora e revive após um breve canal, causando dano espiritual e atordoando inimigos próximos.",
        "cd": 240,
        "passive": 1,
        "name_en": "Shocking Reanimation"
      }
    ]
  },
  {
    "name": "Vindicta",
    "file": "Vindicta.webp",
    "arch": "—",
    "role": "Carry",
    "diff": 2,
    "dominio": 1,
    "tier": "S",
    "desc": "Atiradora de longo alcance, pune erros de posicionamento.",
    "soon": false,
    "win": "57.0",
    "pick": "11.4",
    "hp": 755,
    "spd": 7.9,
    "skills": [
      {
        "key": "1",
        "name": "Estaca",
        "desc": "Lança uma estaca que prende inimigos ao local onde ela cai, limitando o movimento ao comprimento da corrente.",
        "cd": 40,
        "passive": 0,
        "name_en": "Stake"
      },
      {
        "key": "2",
        "name": "Voo",
        "desc": "Salta e voa, dando à arma dano espiritual bônus e maior alcance de itens enquanto está no ar.",
        "cd": 42,
        "passive": 0,
        "name_en": "Flight"
      },
      {
        "key": "3",
        "name": "Corvo Familiar",
        "desc": "Envia um corvo que causa dano de impacto, reduz a resistência a balas e espiritual do alvo e aplica sangramento baseado na vida atual dele.",
        "cd": 32,
        "passive": 0,
        "name_en": "Crow Familiar"
      },
      {
        "key": "★",
        "name": "Assassinar",
        "desc": "Dispara um tiro de sniper de longo alcance com mira que causa dano extra a inimigos abaixo de 50% de vida.",
        "cd": 55,
        "passive": 0,
        "name_en": "Assassinate"
      }
    ]
  },
  {
    "name": "Violet",
    "file": "Violet.webp",
    "arch": "Místico",
    "role": "Carry",
    "diff": 1,
    "dominio": 1,
    "dif_fonte": "jogo",
    "tier": "D",
    "desc": "Artista ágil que pinta a luta: fortalece os próprios tiros, atrapalha os inimigos e ainda retrata os adversários.",
    "soon": false,
    "win": "44.8",
    "pick": "0.1",
    "hp": 710,
    "spd": 6.9,
    "skills": [
      {
        "key": "1",
        "name": "Tinta Viva",
        "desc": "Suas próximas 3 balas ganham vida e podem ser conduzidas durante o trajeto, causando mais dano de bala e dano espiritual em uma pequena área. Cada acerto em herói reduz a recarga de todas as habilidades (e metade da recarga dos itens). No alt-fire, desenha um traço sólido de tinta que bloqueia projéteis e personagens.",
        "cd": 22,
        "passive": 0,
        "name_en": "Living Ink"
      },
      {
        "key": "2",
        "name": "Estado de Fluxo",
        "desc": "Arrasta um pincel que continua avançando e deixa um rastro que dá distância extra de deslize para os aliados e causa lentidão e dano espiritual nos inimigos que atravessa, que aumenta quanto mais longe ele vai. Reative para arremessar o pincel e causar dano em uma área maior.",
        "cd": 23,
        "passive": 0,
        "name_en": "Flow State"
      },
      {
        "key": "3",
        "name": "Natureza Morta",
        "desc": "Escolhe um herói como modelo e causa dano espiritual contínuo enquanto você estiver olhando para ele. Se completar o desenho, o alvo leva dano extra, fica atordoado e deixa cair um esboço: cada esboço coletado dá atributos permanentes.",
        "cd": 35,
        "passive": 0,
        "name_en": "Still Life"
      },
      {
        "key": "★",
        "name": "Paisagem Abstrata",
        "desc": "Cria um círculo de tinta gigante que bloqueia a visão e concede Poder Espiritual aos aliados. Os inimigos dentro ficam revelados e, ao sair, levam dano espiritual, ficam silenciados e desacelerados, o que desfaz a tinta.",
        "cd": 165,
        "passive": 0,
        "name_en": "Abstract Landscape"
      }
    ]
  },
  {
    "name": "Viscous",
    "file": "Viscous.webp",
    "arch": "Místico",
    "role": "Tanque",
    "diff": 1,
    "dominio": 2,
    "tier": "C",
    "desc": "Estilo único, forte em controle de espaço apertado.",
    "soon": false,
    "win": "50.0",
    "pick": "10.4",
    "hp": 790,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Respingo",
        "desc": "Lança uma bola de gosma que causa dano e deixa poças que retardam.",
        "cd": 26,
        "passive": 0,
        "name_en": "Splatter"
      },
      {
        "key": "2",
        "name": "O Cubo",
        "desc": "Envolve um alvo, ele mesmo ou um aliado, num cubo de gosma protetor que bloqueia dano e aumenta a regeneração de vida.",
        "cd": 42,
        "passive": 0,
        "name_en": "The Cube"
      },
      {
        "key": "3",
        "name": "Soco na Poça",
        "desc": "Invoca um punho que lança todos na área ao ar; socar um inimigo também o retarda.",
        "cd": 24,
        "passive": 0,
        "name_en": "Puddle Punch"
      },
      {
        "key": "★",
        "name": "Bola de gosma",
        "desc": "Transforma Viscous numa grande bola quicante que atordoa inimigos no impacto e dá resistência a balas e espiritual.",
        "cd": 130,
        "passive": 0,
        "name_en": "Goo Ball"
      }
    ]
  },
  {
    "name": "Vyper",
    "file": "Vyper.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 1,
    "dominio": 1,
    "tier": "B",
    "desc": "Assassina de mobilidade com foco em causar dano contínuo.",
    "soon": false,
    "win": "48.0",
    "pick": "4.4",
    "hp": 780,
    "spd": 6.9,
    "skills": [
      {
        "key": "1",
        "name": "Adaga Perfurante",
        "desc": "Lança uma adaga que causa dano espiritual e retarda o alvo; acertos repetidos no mesmo alvo acumulam dano e lentidão.",
        "cd": 10,
        "passive": 0,
        "name_en": "Screwjab Dagger"
      },
      {
        "key": "2",
        "name": "Veneno letal",
        "desc": "Injeta veneno num alvo que dispara após um tempo causando dano espiritual, maior quanto menos vida o alvo tiver.",
        "cd": 28,
        "passive": 0,
        "name_en": "Lethal Venom"
      },
      {
        "key": "3",
        "name": "Deslizar",
        "desc": "Aumenta a distância do deslize, deixa Vyper subir ladeiras deslizando e melhora a curva; níveis maiores dão uma barreira ao deslizar.",
        "cd": null,
        "passive": 1,
        "name_en": "Slither"
      },
      {
        "key": "★",
        "name": "Bola Petrificante",
        "desc": "Lança uma bola explosiva que retarda e fere inimigos na área; acertos diretos petrificam o alvo, bloqueando dano e impedindo ações.",
        "cd": 115,
        "passive": 0,
        "name_en": "Petrifying Bola"
      }
    ]
  },
  {
    "name": "Warden",
    "file": "Warden.webp",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 1,
    "dominio": 1,
    "tier": "B",
    "desc": "Presença forte no corpo a corpo e boa para iniciantes.",
    "soon": false,
    "win": "55.0",
    "pick": "9.4",
    "hp": 805,
    "spd": 6.3,
    "skills": [
      {
        "key": "1",
        "name": "Frasco Alquímico",
        "desc": "Lança um frasco que fere e retarda quem atinge, cortando o dano de arma e a velocidade deles.",
        "cd": 12,
        "passive": 0,
        "name_en": "Alchemical Flask"
      },
      {
        "key": "2",
        "name": "Força de vontade",
        "desc": "Dá uma barreira e velocidade extra por 5 segundos.",
        "cd": 40,
        "passive": 0,
        "name_en": "Willpower"
      },
      {
        "key": "3",
        "name": "Palavra Vinculante",
        "desc": "Amaldiçoa um herói inimigo, ferindo e imobilizando se ele não sair da posição inicial dentro do tempo de fuga.",
        "cd": 34,
        "passive": 0,
        "name_en": "Binding Word"
      },
      {
        "key": "★",
        "name": "Última Resistência",
        "desc": "Após 2 segundos de carga, libera pulsos que ferem e curam Warden com base no dano causado, e aumenta muito a resistência a balas e espiritual durante o canal.",
        "cd": 155,
        "passive": 0,
        "name_en": "Last Stand"
      }
    ]
  },
  {
    "name": "Wraith",
    "file": "Wraith.webp",
    "arch": "—",
    "role": "Carry",
    "diff": 1,
    "dominio": 1,
    "tier": "A",
    "desc": "Equilibrado e consistente, ótima porta de entrada.",
    "soon": false,
    "win": "54.0",
    "pick": "3.4",
    "hp": 730,
    "spd": 7.2,
    "skills": [
      {
        "key": "1",
        "name": "Truque de Cartas",
        "desc": "Acertos de arma invocam cartas de naipes aleatórios, que podem ser lançadas em inimigos para dano e um efeito de cada naipe.",
        "cd": 0.6,
        "passive": 0,
        "name_en": "Card Trick"
      },
      {
        "key": "2",
        "name": "Projeção Mental",
        "desc": "Teleporta Wraith a um local alvo num raio de 25 m.",
        "cd": 46,
        "passive": 0,
        "name_en": "Project Mind"
      },
      {
        "key": "3",
        "name": "Fogo Total",
        "desc": "Aumenta temporariamente a cadência de tiro de Wraith e adiciona dano espiritual por bala.",
        "cd": 45,
        "passive": 0,
        "name_en": "Full Auto"
      },
      {
        "key": "★",
        "name": "Telecinese",
        "desc": "Ergue um herói inimigo no ar e o arremessa contra um local alvo, causando dano espiritual e lentidão.",
        "cd": 150,
        "passive": 0,
        "name_en": "Telekinesis"
      }
    ]
  },
  {
    "name": "Yamato",
    "file": "Yamato.webp",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
    "dominio": 2,
    "tier": "B",
    "desc": "Mobilidade e golpes poderosos de curta distância.",
    "soon": false,
    "win": "51.0",
    "pick": "8.4",
    "hp": 730,
    "spd": 8.2,
    "skills": [
      {
        "key": "1",
        "name": "Corte Poderoso",
        "desc": "Canaliza para acumular dano por 1,4 segundo e libera um golpe de espada, ou dispara antes para dano parcial.",
        "cd": 12,
        "passive": 0,
        "name_en": "Power Slash"
      },
      {
        "key": "2",
        "name": "Corte Voador",
        "desc": "Lança um gancho que puxa Yamato até um inimigo, causando dano corpo a corpo e retardando-o na chegada.",
        "cd": 36,
        "passive": 0,
        "name_en": "Flying Slash"
      },
      {
        "key": "3",
        "name": "Corte Carmesim",
        "desc": "Corta inimigos à frente, ferindo-os e reduzindo a cadência de tiro, curando Yamato se acertar heróis inimigos.",
        "cd": 16,
        "passive": 0,
        "name_en": "Crimson Slash"
      },
      {
        "key": "★",
        "name": "Transformação das Sombras",
        "desc": "Após uma breve transformação invencível, as habilidades recarregam e são lançadas mais rápido, com imunidade a status e resistências maiores por um tempo.",
        "cd": 150,
        "passive": 0,
        "name_en": "Shadow Transformation"
      }
    ]
  }
];
