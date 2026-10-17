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
const HEROES_SOON = ["Nurse Harrow"];

const HEROES_DATA = [
  {
    "name": "Abrams",
    "file": "Abrams.png",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 2,
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
        "name": "Siphon Life",
        "desc": "Drena a vida de inimigos próximos ao longo do tempo, causando dano espiritual e curando Abrams com parte dele.",
        "cd": 42,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Shoulder Charge",
        "desc": "Avança puxando os inimigos atingidos e atordoa quem for empurrado contra uma parede.",
        "cd": 33,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Infernal Resilience",
        "desc": "Dá atributos defensivos extras; ao sofrer dano, ganha regeneração temporária de vida.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Seismic Impact",
        "desc": "Salta para o alto e cai, causando dano espiritual e atordoando inimigos na área.",
        "cd": 215,
        "passive": 0
      }
    ]
  },
  {
    "name": "Apollo",
    "file": "Apollo.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
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
        "name": "Disengaging Sigil",
        "desc": "Cria um sigilo que explode à frente de Apollo, ferindo e retardando inimigos, enquanto ele salta para trás.",
        "cd": 12,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Riposte",
        "desc": "Prepara-se para aparar o próximo ataque; ao aparar, fica invulnerável por pouco tempo e avança sobre um herói inimigo, atordoando-o e reduzindo sua resistência a corpo a corpo.",
        "cd": 22,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Flawless Advance",
        "desc": "Faz uma sequência de estocadas perfurantes; segurar a tecla aumenta o dano, e soltar na janela perfeita causa o dano máximo.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Itani Lo Sahn",
        "desc": "Canaliza um corte de longo alcance que retarda os atingidos, impede suas ações e os cura; quando acaba, eles sofrem dano pesado, maior em inimigos com metade da vida.",
        "cd": 145,
        "passive": 0
      }
    ]
  },
  {
    "name": "Baba",
    "file": "Baba.png",
    "arch": "—",
    "role": "Controle",
    "diff": 3,
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
        "passive": 0
      },
      {
        "key": "2",
        "name": "Granny Long Legs",
        "desc": "Estica as pernas do banco, dando velocidade, saltos maiores e resistência a debuffs e a corpo a corpo, com um chute e um golpe no chão.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Baba's Brew",
        "desc": "Joga um bule de chá que cria uma área alternando entre barreira, Silêncio ou queimadura que causa dano espiritual contínuo.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Feed The Birds",
        "desc": "Cobre os alvos de pão, acumulando lentidão; então pombos os bombardeiam com dano espiritual e transformam cada alvo em pombo.",
        "cd": 150,
        "passive": 0
      }
    ]
  },
  {
    "name": "Bebop",
    "file": "Bebop.png",
    "arch": "Lutador",
    "role": "Controle",
    "diff": 3,
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
        "name": "Exploding Uppercut",
        "desc": "Lança inimigos próximos com repulsão e causa dano espiritual e redução de cadência de tiro na área da queda.",
        "cd": 22,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Sticky Bomb",
        "desc": "Gruda uma bomba em um alvo próximo que explode após um instante, causando dano espiritual na área.",
        "cd": 18,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Grapple Arm",
        "desc": "Dispara uma mão mecânica que puxa em direção a Bebop o primeiro alvo atingido.",
        "cd": 23,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Hyper Beam",
        "desc": "Canaliza um raio longo que causa dano espiritual contínuo e retarda quem ele toca.",
        "cd": 120,
        "passive": 0
      }
    ]
  },
  {
    "name": "Billy",
    "file": "Billy.png",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 1,
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
        "passive": 0
      },
      {
        "key": "2",
        "name": "Rising Ram",
        "desc": "Investe de cabeça num inimigo, lançando-o ao ar junto com ele; o tempo de recarga cai pela metade no impacto.",
        "cd": 32,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Blasted",
        "desc": "Golpes corpo a corpo restauram munição e deixam a vítima Arrebentada; com a habilidade ativa, seus tiros causam mais dano a ela.",
        "cd": 27,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Chain Gang",
        "desc": "Acorrenta inimigos próximos, retarda quem puxa a corrente e depois os puxa até Billy, causando dano espiritual.",
        "cd": 175,
        "passive": 0
      }
    ]
  },
  {
    "name": "Calico",
    "file": "Calico.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 3,
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
        "name": "Gloom Bombs",
        "desc": "Lança um conjunto de bombas que explodem após um instante com dano espiritual; inimigos atingidos por várias bombas sofrem dano reduzido.",
        "cd": 14,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Leaping Slash",
        "desc": "Avança e corta todos ao redor em círculo com dano corpo a corpo, curando um pouco se acertar um herói.",
        "cd": 13,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Ava",
        "desc": "Vira sombra e possui seu gato, ganhando velocidade que aumenta com o tempo e sumindo do minimapa; sofrer dano de herói zera o bônus.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Return to Shadows",
        "desc": "Fica intangível nas sombras, ganhando velocidade e causando dano espiritual, e volta depois de um tempo causando dano espiritual de novo.",
        "cd": 115,
        "passive": 0
      }
    ]
  },
  {
    "name": "Celeste",
    "file": "Celeste.png",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 2,
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
        "name": "Light Eater",
        "desc": "Atinge inimigos num cone com luz, fazendo-os sofrer dano espiritual dos ataques dela e dando-lhe roubo de vida espiritual.",
        "cd": 20,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Dazzling Trick",
        "desc": "Cria uma barreira protetora que, ao ser destruída, silencia inimigos próximos e causa dano baseado na barreira.",
        "cd": 38,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Radiant Daggers",
        "desc": "Invoca um raio de luz que explode após um instante, causando dano espiritual na área e acumulando bônus de dano espiritual ao acertar heróis.",
        "cd": 33,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Shining Wonder",
        "desc": "Lança uma esfera de luz que causa dano espiritual e retarda inimigos, depois quica entre alvos próximos priorizando heróis.",
        "cd": 160,
        "passive": 0
      }
    ]
  },
  {
    "name": "Deadman Danny",
    "file": "Danny.png",
    "arch": "—",
    "role": "Carry",
    "diff": 3,
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
        "passive": 0
      },
      {
        "key": "2",
        "name": "Chimera Mk1",
        "desc": "Segure o pulo para voar acumulando calor; no calor máximo, Danny mergulha e explode, ferindo e lançando inimigos, ou se atordoa se não acertar ninguém.",
        "cd": 21,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Jettison Fuel",
        "desc": "Borrifa combustível que causa dano contínuo e reduz resistência a balas, depois dispara uma rajada espiritual que empurra Danny para trás.",
        "cd": 22,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Close The Deal",
        "desc": "Agarra um inimigo, o ergue e o arremessa; ambos caem sofrendo dano contínuo e o impacto causa dano extra, maior contra inimigos abaixo de 50% de vida.",
        "cd": 135,
        "passive": 0
      }
    ]
  },
  {
    "name": "Drifter",
    "file": "Drifter.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 3,
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
        "name": "Rend",
        "desc": "Ataca em cone à frente com dano espiritual e dano corpo a corpo extra a curta distância.",
        "cd": 16,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Stalker's Mark",
        "desc": "Envia uma marca que faz o primeiro alvo atingido sangrar; reativar enquanto ele sangra teleporta Drifter para trás dele.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Bloodscent",
        "desc": "Heróis isolados deixam rastro e seus batimentos são ouvidos de longe; Drifter causa dano ampliado neles e matar um por perto dá dano de arma permanente.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Eternal Night",
        "desc": "Escurece heróis inimigos próximos, limitando a visão deles e revelando-os brevemente enquanto os trata como isolados, e dá velocidade de corrida extra.",
        "cd": 145,
        "passive": 0
      }
    ]
  },
  {
    "name": "Dynamo",
    "file": "Dynamo.png",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 2,
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
        "name": "Kinetic Pulse",
        "desc": "Envia um pulso pelo chão que causa dano espiritual e joga inimigos para o ar.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Quantum Entanglement",
        "desc": "Teleporta Dynamo a um local alvo, deixando-o intangível por pouco tempo; a versão alternativa leva aliados próximos junto.",
        "cd": 20,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Rejuvenating Aurora",
        "desc": "Canaliza uma cura ao longo do tempo para Dynamo e aliados próximos, e ele ainda pode dar dash e atacar corpo a corpo durante o canal.",
        "cd": 48,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Singularity",
        "desc": "Cria uma singularidade nas mãos que causa dano espiritual contínuo, atordoa e puxa inimigos próximos.",
        "cd": 250,
        "passive": 0
      }
    ]
  },
  {
    "name": "Graves",
    "file": "Graves.png",
    "arch": "Místico",
    "role": "Controle",
    "diff": 2,
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
        "name": "Jar of Dead",
        "desc": "Mortes próximas são coletadas num pote, que é lançado para invocar Cabeças-Mortas que causam dano espiritual repetido.",
        "cd": 13,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Grasping Hands",
        "desc": "Faz surgir uma linha de mãos agarradoras que invoca um Ghoul e imobiliza inimigos que passam, causando dano espiritual.",
        "cd": 34,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Essence Theft",
        "desc": "A arma rouba aos poucos o dano de arma e a resistência espiritual dos inimigos, até um máximo por alvo.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Borrowed Decree",
        "desc": "Habilidades invocam Ghouls que seguem para a base inimiga, e uma lápide ativa invoca Ghouls ao longo do tempo.",
        "cd": 140,
        "passive": 0
      }
    ]
  },
  {
    "name": "Grey Talon",
    "file": "GreyTalon.png",
    "arch": "—",
    "role": "Carry",
    "diff": 3,
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
        "name": "Charged Shot",
        "desc": "Segura uma flecha carregada e a dispara num tiro perfurante.",
        "cd": 17,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Rain of Arrows",
        "desc": "Lança-se ao ar e plana, aumentando o dano de arma e o multitiro enquanto estiver no ar.",
        "cd": 35,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Spirit Snare",
        "desc": "Coloca uma armadilha que, armada, amaldiçoa e retarda inimigos no raio e os interrompe, silencia e desarma.",
        "cd": 34,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Guided Owl",
        "desc": "Após um breve preparo, lança uma coruja espiritual que ele controla e que explode no impacto, ferindo e atordoando inimigos.",
        "cd": 120,
        "passive": 0
      }
    ]
  },
  {
    "name": "Haze",
    "file": "Haze.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
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
        "name": "Sleep Dagger",
        "desc": "Lança uma adaga que fere e faz o alvo dormir; alvos dormindo acordam pouco depois de sofrer dano.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Smoke Bomb",
        "desc": "Some de vista, ficando invisível e ganhando velocidade de corrida; atacar quebra a invisibilidade e inimigos muito próximos ainda a veem.",
        "cd": 33,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Fixation",
        "desc": "Cada tiro acertado num alvo acumula um bônus de dano de bala contra ele, com bônus maior em tiros na cabeça.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Bullet Dance",
        "desc": "Entra numa rajada que atira em inimigos próximos com precisão perfeita e dano de bala adicional.",
        "cd": 165,
        "passive": 0
      }
    ]
  },
  {
    "name": "Holliday",
    "file": "Holliday.png",
    "arch": "—",
    "role": "Carry",
    "diff": 2,
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
        "name": "Powder Keg",
        "desc": "Lança um barril que explode após um tempo, causando dano espiritual, incendiando e jogando inimigos para o alto.",
        "cd": 28,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Bounce Pad",
        "desc": "Solta uma plataforma que lança heróis ao ar e causa dano espiritual a inimigos próximos quando ela pousa.",
        "cd": 41,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Crackshot",
        "desc": "Tiros na cabeça causam dano de arma extra e aplicam uma lentidão que se dissipa, só quando o efeito não está em recarga.",
        "cd": 20,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Spirit Lasso",
        "desc": "Lança um laço que causa dano espiritual, puxa o alvo até ela e o atordoa.",
        "cd": 130,
        "passive": 0
      }
    ]
  },
  {
    "name": "Infernus",
    "file": "Infernus.png",
    "arch": "—",
    "role": "Carry",
    "diff": 1,
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
        "passive": 0
      },
      {
        "key": "2",
        "name": "Flame Dash",
        "desc": "Avança com resistência a lentidão deixando um rastro de fogo que causa dano espiritual contínuo.",
        "cd": 38,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Afterburn",
        "desc": "Acertos de arma acumulam uma queimadura que causa dano espiritual contínuo.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Concussive Combustion",
        "desc": "Após um breve atraso, detona causando dano espiritual e atordoando inimigos próximos.",
        "cd": 140,
        "passive": 0
      }
    ]
  },
  {
    "name": "Ivy",
    "file": "Ivy.png",
    "arch": "—",
    "role": "Suporte",
    "diff": 2,
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
        "name": "Entangling Thorns",
        "desc": "Cria um canteiro de espinhos que fere e retarda inimigos dentro do raio.",
        "cd": 32,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Kudzu Connection",
        "desc": "Liga Ivy a um aliado próximo para compartilhar bônus e replicar curas.",
        "cd": 37,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Stone Form",
        "desc": "Vira pedra e bate no chão, ferindo e atordoando inimigos próximos enquanto se cura.",
        "cd": 40,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Air Drop",
        "desc": "Ergue um aliado no ar e o derruba para explodir entre inimigos, ou o leva voando para longe do perigo.",
        "cd": 100,
        "passive": 0
      }
    ]
  },
  {
    "name": "Kelvin",
    "file": "Kelvin.png",
    "arch": "Lutador",
    "role": "Suporte",
    "diff": 2,
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
        "name": "Frost Grenade",
        "desc": "Lança uma granada que explode em gelo, curando aliados e causando dano espiritual e lentidão a inimigos.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Ice Path",
        "desc": "Cria uma trilha de gelo flutuante que dá velocidade a Kelvin e aliados, e resistência a lentidão a Kelvin.",
        "cd": 50,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Arctic Beam",
        "desc": "Dispara um raio congelante que fere e reduz progressivamente a velocidade de movimento e a cadência de tiro quanto mais tempo fica no alvo.",
        "cd": 28,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Frozen Shelter",
        "desc": "Cria uma cúpula de gelo impenetrável em torno de Kelvin ou de um herói alvo, curando aliados dentro e retardando inimigos.",
        "cd": 185,
        "passive": 0
      }
    ]
  },
  {
    "name": "Lady Geist",
    "file": "LadyGeist.png",
    "arch": "Místico",
    "role": "Carry",
    "diff": 3,
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
        "name": "Essence Bomb",
        "desc": "Gasta parte da própria vida para disparar uma bomba que explode após um breve tempo de armação.",
        "cd": 14,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Life Drain",
        "desc": "Prende um inimigo para drenar sua vida ao longo do tempo e curar Geist; também pode transferir vida a um herói aliado.",
        "cd": 34,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Malice",
        "desc": "Gasta parte da vida para lançar estilhaços de sangue que acumulam lentidão e dano recebido nos inimigos.",
        "cd": 6,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Soul Exchange",
        "desc": "Troca o nível de vida com um inimigo alvo, respeitando limites mínimos de vida.",
        "cd": 220,
        "passive": 0
      }
    ]
  },
  {
    "name": "Lash",
    "file": "Lash.png",
    "arch": "Assassino",
    "role": "Controle",
    "diff": 3,
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
        "name": "Ground Strike",
        "desc": "Pisoteia o chão ferindo inimigos num cone à frente e mergulha em direção ao chão se usado no ar.",
        "cd": 21,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Grapple",
        "desc": "Puxa Lash pelo ar até um alvo e restaura seus pulos aéreos e dashes.",
        "cd": 35,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Flog",
        "desc": "Chicoteia inimigos à frente e se cura com parte do dano causado.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Death Slam",
        "desc": "Prende chicotes em inimigos durante um canal e então os ergue, atordoa e esmaga no chão.",
        "cd": 150,
        "passive": 0
      }
    ]
  },
  {
    "name": "McGinnis",
    "file": "McGinnis.png",
    "arch": "Místico",
    "role": "Controle",
    "diff": 2,
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
        "name": "Mini Turret",
        "desc": "Instala uma torreta de curta duração que atira em inimigos e causa dano espiritual contínuo.",
        "cd": 18,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Medicinal Specter",
        "desc": "Invoca um espírito que cura e restaura stamina de aliados próximos.",
        "cd": 48,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Spectral Wall",
        "desc": "Cria uma parede no terreno que fere e retarda inimigos próximos, e pode ser detonada antes do tempo.",
        "cd": 50,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Heavy Barrage",
        "desc": "Dispara foguetes teleguiados numa área alvo por um tempo, retardando McGinnis enquanto dura.",
        "cd": 165,
        "passive": 0
      }
    ]
  },
  {
    "name": "Mina",
    "file": "Mina.png",
    "arch": "—",
    "role": "Assassino",
    "diff": 3,
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
        "name": "Rake",
        "desc": "Corta com o guarda-chuva com dano espiritual que escala com a vida perdida do alvo, curando-a a cada abate.",
        "cd": 16,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Sanguine Retreat",
        "desc": "Vira morcegos por um instante, ficando intangível enquanto voa até um local escolhido, com uma breve janela de reativação.",
        "cd": 32,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Love Bites",
        "desc": "Adiciona dano espiritual aos tiros e acumula uma explosão de dano espiritual extra quando causa dano a inimigos com habilidades.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Nox Nostra",
        "desc": "Solta uma nuvem de morcegos teleguiados que causam dano espiritual e Silêncio, com mais morcegos conforme ativa Love Bites em heróis.",
        "cd": 150,
        "passive": 0
      }
    ]
  },
  {
    "name": "Mirage",
    "file": "Mirage.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
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
        "name": "Fire Scarabs",
        "desc": "Infesta um inimigo com escaravelhos que roubam sua vida e reduzem o dano que ele causa.",
        "cd": 35,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Dust Devil",
        "desc": "Vira um redemoinho que avança ferindo, retardando e erguendo inimigos, e depois dá evasão de balas.",
        "cd": 36,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Djinn's Mark",
        "desc": "Tiros aplicam marcas que causam dano espiritual e revelam o alvo ao expirar ou serem consumidas. Ativa, consome todas as marcas de uma vez.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Traveler",
        "desc": "Teleporta Mirage a um local do minimapa após uma breve espera, interrompida se ele sofrer dano.",
        "cd": 140,
        "passive": 0
      }
    ]
  },
  {
    "name": "Mo & Krill",
    "file": "MoKrill.png",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 2,
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
        "name": "Scorn",
        "desc": "Fere inimigos próximos e cura a dupla com base no dano causado, mais contra heróis inimigos.",
        "cd": 13,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Burrow",
        "desc": "Viaja sob a terra em velocidade maior com armadura espiritual e de bala, e depois irrompe ferindo, retardando e lançando inimigos ao ar.",
        "cd": 40,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Sand Blast",
        "desc": "Dispara um jato de areia que desarma e fere inimigos à frente da dupla.",
        "cd": 40,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Combo",
        "desc": "Segura um alvo no lugar, atordoando e ferindo; ganha vida máxima permanente se ele morrer durante ou logo após o canal.",
        "cd": 150,
        "passive": 0
      }
    ]
  },
  {
    "name": "Nurse Harrow",
    "file": "NurseHarrow.png",
    "arch": "—",
    "role": "A definir",
    "diff": 2,
    "tier": "B",
    "desc": "Figura rígida e intimidadora que usa uma seringa como arma. Ainda não foi lançada.",
    "soon": true,
    "win": "55.0",
    "pick": "7.4",
    "hp": 0,
    "spd": 0,
    "skills": []
  },
  {
    "name": "Paige",
    "file": "Paige.png",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 2,
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
        "name": "Conjure Dragon",
        "desc": "Invoca um dragão no local alvo que voa para a frente causando dano espiritual e deixando um rastro em chamas.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Defend and Fight!",
        "desc": "Dá a um aliado uma barreira que também aumenta o dano de arma dele enquanto durar.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Captivating Read",
        "desc": "Marca uma área com magia retardada que retarda inimigos e depois detona causando dano espiritual e imobilizando quem está dentro.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Rallying Charge",
        "desc": "Envia cavaleiros espectrais pela cidade, curando aliados e ferindo inimigos, com ambos os efeitos crescendo com a distância.",
        "cd": 190,
        "passive": 0
      }
    ]
  },
  {
    "name": "Paradox",
    "file": "Paradox.png",
    "arch": "—",
    "role": "Controle",
    "diff": 3,
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
        "name": "Pulse Grenade",
        "desc": "Lança uma granada que pulsa ao pousar, causando dano espiritual, retardando inimigos e acumulando um amplificador de dano em cada vítima.",
        "cd": 32,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Time Wall",
        "desc": "Cria uma parede que congela projéteis inimigos, aumenta a velocidade e o dano das balas aliadas e retarda brevemente inimigos que a cruzam.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Kinetic Carbine",
        "desc": "Carrega um único tiro poderoso que causa dano espiritual e aplica Parada no Tempo, com dano escalando do dano de arma.",
        "cd": 28,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Paradoxical Swap",
        "desc": "Dispara um projétil que troca a posição de Paradox com um herói inimigo, causando dano de troca e dando uma barreira.",
        "cd": 110,
        "passive": 0
      }
    ]
  },
  {
    "name": "Pocket",
    "file": "Pocket.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 3,
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
        "name": "Barrage",
        "desc": "Canaliza para disparar projéteis espirituais que retardam inimigos ao redor do impacto, com acertos em heróis acumulando um amplificador de dano.",
        "cd": 32,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Flying Cloak",
        "desc": "Envia uma capa senciente que fere inimigos pelo caminho, e Pocket pode se teleportar até onde ela está.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Enchanter's Satchel",
        "desc": "Pocket se esconde na mala e causa dano espiritual a inimigos próximos quando termina; qualquer ação o encerra antes.",
        "cd": 17,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Affliction",
        "desc": "Causa dano contínuo a inimigos próximos e impede toda cura enquanto ativo.",
        "cd": 170,
        "passive": 0
      }
    ]
  },
  {
    "name": "Rat King",
    "file": "RatKing.png",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 2,
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
        "name": "Scrap Grenade",
        "desc": "Lança uma granada de sucata que detona várias vezes, causando dano de bala e retardando inimigos.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Rat Swarm",
        "desc": "Invoca ratos que grudam nos inimigos, causando dano espiritual contínuo e reduzindo a resistência a balas a cada mordida.",
        "cd": 24,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Royal Pestments",
        "desc": "Veste armadura para ganhar uma barreira baseada na vida máxima, podendo rebater balas de volta aos atacantes.",
        "cd": 22,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Rule, Ratannia!",
        "desc": "Finca um estandarte que dá velocidade, imunidade a lentidão e redução de dano a aliados próximos, e depois uma pancada fere, lança ao ar e retarda inimigos na área.",
        "cd": 160,
        "passive": 0
      }
    ]
  },
  {
    "name": "Rem",
    "file": "Rem.png",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 2,
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
        "name": "Pillow Toss",
        "desc": "Lança um travesseiro que causa dano espiritual e grande repulsão; acertos reduzem a recarga das suas outras habilidades.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Tag Along",
        "desc": "Pula até um aliado e tira uma soneca ao lado dele, dando a ambos uma cura imediata baseada na vida perdida, seguida de regeneração.",
        "cd": 40,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Lil Helpers",
        "desc": "Envia ajudantes para coletar caixas, fazer Sacrifícios do Pecador ou seguir heróis ou tropas para dar bônus ou cura.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Naptime",
        "desc": "Canaliza um olhar através de paredes e pisos que retarda inimigos e depois os faz dormir; ao acordarem, sofrem dano espiritual.",
        "cd": 200,
        "passive": 0
      }
    ]
  },
  {
    "name": "Seven",
    "file": "Seven.png",
    "arch": "Místico",
    "role": "Carry",
    "diff": 2,
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
        "name": "Lightning Ball",
        "desc": "Dispara uma bola de raio em linha reta que fere inimigos no raio, retardando quem atinge e parando no terreno.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Static Charge",
        "desc": "Marca um herói inimigo e, após um breve atraso, atordoa e fere inimigos na área.",
        "cd": 42,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Power Surge",
        "desc": "Cada rajada de arma de Seven adiciona dano de choque ao alvo, que pode saltar para inimigos próximos.",
        "cd": 50,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Storm Cloud",
        "desc": "Canaliza uma nuvem de tempestade em expansão que fere inimigos no raio, exceto os fora da linha de visão.",
        "cd": 180,
        "passive": 0
      }
    ]
  },
  {
    "name": "Shiv",
    "file": "Shiv.png",
    "arch": "Lutador",
    "role": "Assassino",
    "diff": 2,
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
        "name": "Serrated Knives",
        "desc": "Lança uma faca que faz o inimigo sangrar; cada acerto extra acumula e renova o sangramento.",
        "cd": 16,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Slice and Dice",
        "desc": "Avança ferindo inimigos pelo caminho e reduzindo a resistência espiritual deles.",
        "cd": 16,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Bloodletting",
        "desc": "Recebe só parte do dano imediatamente e adia o resto ao longo do tempo; pode ser ativada para limpar parte do dano adiado.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Killing Blow",
        "desc": "Salta contra o primeiro herói inimigo e o executa se estiver abaixo do limite de vida; senão, o fere.",
        "cd": 145,
        "passive": 0
      }
    ]
  },
  {
    "name": "Silver",
    "file": "Silver.png",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 2,
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
        "name": "Slam Fire",
        "desc": "Recarrega a arma na hora e dá cadência de tiro e dano extras conforme a vida do alvo por alguns tiros, com precisão reduzida.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Boot Kick",
        "desc": "Avança chutando o primeiro inimigo atingido com dano corpo a corpo e o marca; atirar no marcado causa dano espiritual.",
        "cd": 21,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Entangling Bola",
        "desc": "Lança uma bola que causa dano espiritual, retarda o alvo e impede habilidades de movimento e uso de stamina.",
        "cd": 23,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Lycan Curse",
        "desc": "Transforma Silver por 15 segundos, dando vida máxima e cadência de tiro contra heróis inimigos e trocando habilidades e arma por versões de lobisomem.",
        "cd": 60,
        "passive": 0
      }
    ]
  },
  {
    "name": "Sinclair",
    "file": "Sinclair.png",
    "arch": "Místico",
    "role": "Controle",
    "diff": 3,
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
        "name": "Vexing Bolt",
        "desc": "Dispara um raio mágico que causa mais dano quanto mais longe vai; com o Assistente em campo, ele também dispara um raio mais fraco.",
        "cd": 24,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Spectral Assistant",
        "desc": "Invoca um Assistente num local alvo que ataca sempre que você atira; a habilidade 2 troca sua posição com a do Assistente.",
        "cd": 40,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Rabbit Hex",
        "desc": "Enfeitiça uma área e transforma todos os inimigos dentro em Coelhos por um tempo limitado.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Audience Participation",
        "desc": "Copia a suprema de um herói inimigo por um tempo; reativar usa a suprema copiada.",
        "cd": 85,
        "passive": 0
      }
    ]
  },
  {
    "name": "Solomon",
    "file": "Solomon.png",
    "arch": "Místico",
    "role": "Controle",
    "diff": 3,
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
        "name": "Setup Bishop",
        "desc": "Coloca um bispo que, ao ser movido, retarda e fere inimigos pelo caminho, e suas casas diagonais causam dano extra ao serem pisadas; reativar recolhe todos os bispos.",
        "cd": 12,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Kingside Knight",
        "desc": "Transforma um aliado em cavalo, dando stamina extra e barreira; em si mesmo, Solomon vira o rei, com barreira maior e sem stamina.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Rook Battery",
        "desc": "Lança um par de torres que ferem e imobilizam inimigos, refletindo nas paredes; reativar as separa em direções perpendiculares.",
        "cd": 33,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Develop Queen",
        "desc": "Invoca uma rainha que cai ferindo a área e depois solta linhas de casas que ferem e atordoam; mover faz ela saltar e reativar a recolhe antes.",
        "cd": 210,
        "passive": 0
      }
    ]
  },
  {
    "name": "The Doorman",
    "file": "Doorman.png",
    "arch": "Místico",
    "role": "Suporte",
    "diff": 2,
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
        "name": "Call Bell",
        "desc": "Lança um sino que causa dano espiritual no impacto e explode depois, causando mais dano, retardando inimigos próximos e reduzindo sua precisão.",
        "cd": 18,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Doorway",
        "desc": "Coloca duas portas ligadas que levam jogadores e a maioria dos projéteis de uma para a outra até fecharem.",
        "cd": 45,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Luggage Cart",
        "desc": "Envia um carrinho que causa dano espiritual e puxa heróis inimigos pelo caminho.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Hotel Guest",
        "desc": "Manda o corpo de um inimigo para uma estadia no Hotel Baroness e o devolve na saída; não sair a tempo causa dano espiritual extra.",
        "cd": 140,
        "passive": 0
      }
    ]
  },
  {
    "name": "Venator",
    "file": "Venator.png",
    "arch": "—",
    "role": "Carry",
    "diff": 3,
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
        "name": "Consecrating Grenade",
        "desc": "Dispara uma granada quicante que explode, fere e incendeia inimigos, causando dano puro e reduzindo a cura.",
        "cd": 25,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Gutshot",
        "desc": "Dispara um tiro de espingarda que fere e empurra inimigos; os perto de uma parede ficam atordoados e sofrem dano extra.",
        "cd": 23,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Hex-Lined Snap Trap",
        "desc": "Chuta uma armadilha que se arma após um instante e fecha no primeiro herói inimigo que tocar, causando dano espiritual, imobilizando e revelando.",
        "cd": 28,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Ira Domini",
        "desc": "Carrega a besta com três estacas de dano pesado, sendo a última abençoada para causar dano puro extra e executar inimigos com pouca vida.",
        "cd": 160,
        "passive": 0
      }
    ]
  },
  {
    "name": "Victor",
    "file": "Victor.png",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 2,
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
        "name": "Pain Battery",
        "desc": "Sofrer dano o carrega; quando cheio, ativá-lo dispara raios de choque que causam dano espiritual uma vez em cada alvo.",
        "cd": 2,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Jumpstart",
        "desc": "Eletrocuta Victor com dano espiritual e depois dá regeneração de vida e velocidade extras que se dissipam com o tempo.",
        "cd": 30,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Aura of Suffering",
        "desc": "Canalizada para liberar dor que fere inimigos próximos e o próprio Victor ao longo do tempo, com dano crescente quanto mais tempo canalizar.",
        "cd": 2,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Shocking Reanimation",
        "desc": "Passiva: após sofrer dano letal, Victor libera uma onda retardadora e revive após um breve canal, causando dano espiritual e atordoando inimigos próximos.",
        "cd": 240,
        "passive": 1
      }
    ]
  },
  {
    "name": "Vindicta",
    "file": "Vindicta.png",
    "arch": "—",
    "role": "Carry",
    "diff": 3,
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
        "name": "Stake",
        "desc": "Lança uma estaca que prende inimigos ao local onde ela cai, limitando o movimento ao comprimento da corrente.",
        "cd": 40,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Flight",
        "desc": "Salta e voa, dando à arma dano espiritual bônus e maior alcance de itens enquanto está no ar.",
        "cd": 42,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Crow Familiar",
        "desc": "Envia um corvo que causa dano de impacto, reduz a resistência a balas e espiritual do alvo e aplica sangramento baseado na vida atual dele.",
        "cd": 32,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Assassinate",
        "desc": "Dispara um tiro de sniper de longo alcance com mira que causa dano extra a inimigos abaixo de 50% de vida.",
        "cd": 55,
        "passive": 0
      }
    ]
  },
  {
    "name": "Violet",
    "file": "Violet.png",
    "arch": "Místico",
    "role": "Carry",
    "diff": 1,
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
        "passive": 0
      },
      {
        "key": "2",
        "name": "Estado de Fluxo",
        "desc": "Arrasta um pincel que continua avançando e deixa um rastro que dá distância extra de deslize para os aliados e causa lentidão e dano espiritual nos inimigos que atravessa, que aumenta quanto mais longe ele vai. Reative para arremessar o pincel e causar dano em uma área maior.",
        "cd": 23,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Natureza Morta",
        "desc": "Escolhe um herói como modelo e causa dano espiritual contínuo enquanto você estiver olhando para ele. Se completar o desenho, o alvo leva dano extra, fica atordoado e deixa cair um esboço: cada esboço coletado dá atributos permanentes.",
        "cd": 35,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Paisagem Abstrata",
        "desc": "Cria um círculo de tinta gigante que bloqueia a visão e concede Poder Espiritual aos aliados. Os inimigos dentro ficam revelados e, ao sair, levam dano espiritual, ficam silenciados e desacelerados, o que desfaz a tinta.",
        "cd": 165,
        "passive": 0
      }
    ]
  },
  {
    "name": "Viscous",
    "file": "Viscous.png",
    "arch": "Místico",
    "role": "Tanque",
    "diff": 3,
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
        "name": "Splatter",
        "desc": "Lança uma bola de gosma que causa dano e deixa poças que retardam.",
        "cd": 26,
        "passive": 0
      },
      {
        "key": "2",
        "name": "The Cube",
        "desc": "Envolve um alvo, ele mesmo ou um aliado, num cubo de gosma protetor que bloqueia dano e aumenta a regeneração de vida.",
        "cd": 42,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Puddle Punch",
        "desc": "Invoca um punho que lança todos na área ao ar; socar um inimigo também o retarda.",
        "cd": 24,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Goo Ball",
        "desc": "Transforma Viscous numa grande bola quicante que atordoa inimigos no impacto e dá resistência a balas e espiritual.",
        "cd": 130,
        "passive": 0
      }
    ]
  },
  {
    "name": "Vyper",
    "file": "Vyper.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 2,
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
        "name": "Screwjab Dagger",
        "desc": "Lança uma adaga que causa dano espiritual e retarda o alvo; acertos repetidos no mesmo alvo acumulam dano e lentidão.",
        "cd": 10,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Lethal Venom",
        "desc": "Injeta veneno num alvo que dispara após um tempo causando dano espiritual, maior quanto menos vida o alvo tiver.",
        "cd": 28,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Slither",
        "desc": "Aumenta a distância do deslize, deixa Vyper subir ladeiras deslizando e melhora a curva; níveis maiores dão uma barreira ao deslizar.",
        "cd": null,
        "passive": 1
      },
      {
        "key": "★",
        "name": "Petrifying Bola",
        "desc": "Lança uma bola explosiva que retarda e fere inimigos na área; acertos diretos petrificam o alvo, bloqueando dano e impedindo ações.",
        "cd": 115,
        "passive": 0
      }
    ]
  },
  {
    "name": "Warden",
    "file": "Warden.png",
    "arch": "Lutador",
    "role": "Tanque",
    "diff": 1,
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
        "name": "Alchemical Flask",
        "desc": "Lança um frasco que fere e retarda quem atinge, cortando o dano de arma e a velocidade deles.",
        "cd": 12,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Willpower",
        "desc": "Dá uma barreira e velocidade extra por 5 segundos.",
        "cd": 40,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Binding Word",
        "desc": "Amaldiçoa um herói inimigo, ferindo e imobilizando se ele não sair da posição inicial dentro do tempo de fuga.",
        "cd": 34,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Last Stand",
        "desc": "Após 2 segundos de carga, libera pulsos que ferem e curam Warden com base no dano causado, e aumenta muito a resistência a balas e espiritual durante o canal.",
        "cd": 155,
        "passive": 0
      }
    ]
  },
  {
    "name": "Wraith",
    "file": "Wraith.png",
    "arch": "—",
    "role": "Carry",
    "diff": 1,
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
        "name": "Card Trick",
        "desc": "Acertos de arma invocam cartas de naipes aleatórios, que podem ser lançadas em inimigos para dano e um efeito de cada naipe.",
        "cd": 0.6,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Project Mind",
        "desc": "Teleporta Wraith a um local alvo num raio de 25 m.",
        "cd": 46,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Full Auto",
        "desc": "Aumenta temporariamente a cadência de tiro de Wraith e adiciona dano espiritual por bala.",
        "cd": 45,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Telekinesis",
        "desc": "Ergue um herói inimigo no ar e o arremessa contra um local alvo, causando dano espiritual e lentidão.",
        "cd": 150,
        "passive": 0
      }
    ]
  },
  {
    "name": "Yamato",
    "file": "Yamato.png",
    "arch": "Assassino",
    "role": "Assassino",
    "diff": 3,
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
        "name": "Power Slash",
        "desc": "Canaliza para acumular dano por 1,4 segundo e libera um golpe de espada, ou dispara antes para dano parcial.",
        "cd": 12,
        "passive": 0
      },
      {
        "key": "2",
        "name": "Flying Slash",
        "desc": "Lança um gancho que puxa Yamato até um inimigo, causando dano corpo a corpo e retardando-o na chegada.",
        "cd": 36,
        "passive": 0
      },
      {
        "key": "3",
        "name": "Crimson Slash",
        "desc": "Corta inimigos à frente, ferindo-os e reduzindo a cadência de tiro, curando Yamato se acertar heróis inimigos.",
        "cd": 16,
        "passive": 0
      },
      {
        "key": "★",
        "name": "Shadow Transformation",
        "desc": "Após uma breve transformação invencível, as habilidades recarregam e são lançadas mais rápido, com imunidade a status e resistências maiores por um tempo.",
        "cd": 150,
        "passive": 0
      }
    ]
  }
];
