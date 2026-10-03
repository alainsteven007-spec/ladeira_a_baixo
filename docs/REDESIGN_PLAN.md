# Ladeira Abaixo — Plano de redesign

> "Fácil de entender, gostoso de tentar, inteligente de resolver e satisfatório de dominar."
> O protagonista é **a linha que o jogador desenhou + a física reagindo a ela**. Todo o resto serve a isso.

Base auditada: commit `5440323` (cópia integral em `legacy/v1-index.html`).

---

## 1. Estado atual (auditoria)

### 1.1 Arquitetura
- Um único `index.html` (~100 KB, 1 500 linhas): CSS + HTML + ~1 300 linhas de JS sem build, sem dependências.
- Seções internas: dados de fase → personagens/veículos → estado/save → trilhos+física → regras do jogo (perigos, itens, magia, dragão) → ragdoll → UI → entrada → renderização → arte (itens mágicos, dragão, personagem) → loop.
- Mundo 700×1000 px em pé (100 px = 1 m, g = 9,81 m/s²); deitado estica para 1000×700 e desacelera fogo/avalanche/ataques (`LAND_PACE = 0,7`).
- Ferramentas de verificação existiam só no scratchpad da sessão (Playwright + "hill-climb" que encontra pistas vencedoras). Nenhum teste no repositório.

### 1.2 Física (o que existe)
- Corpo = 2 pontos de contato (raio 9 px) ligados por haste rígida de 36 px, dinâmica baseada em posição (PBD), 10 subpassos por quadro.
- **Passo variável**: `dt` = duração do quadro (limitado a 1/30 s). O mesmo desenho pode dar resultados diferentes em 30, 60 ou 144 Hz.
- Pista = polilinha crua do dedo (um ponto a cada ≥ 6 px), ou seja, centenas de quinas.
- "Restauração de energia": depois de cada subpasso, se a energia caiu **e não houve "impacto"**, as velocidades são reescaladas para devolver a perda. "Impacto" = qualquer contato com velocidade normal > 1 m/s.
- Colisão do corpo: sondas na cabeça/tronco; tocar a neve = "Caiu de cabeça".
- Trilhos (loops): um contato que está andando na pista só sente os segmentos ligados a ele num raio de 60 px ao longo da linha.

### 1.3 Medições (laboratório `tests/` — ver TEST_PLAN.md)

**Quinas comem energia proporcionalmente ao ângulo** (rampa de 30°, quina côncava de θ, perda de energia além do atrito):

| θ | 4 m/s | 8 m/s | 12 m/s |
|---|---|---|---|
| 5° | 4 % | 2 % | 2 % |
| 15° | 9 % | 8 % | 8 % |
| 20° | 15 % | 13 % | 13 % |
| 30° | 29 % | 28 % | 27 % |
| 45° | — | 54 % | Pancada |

A perda é ≈ 1 − cos²θ: a projeção da posição remove a componente normal da velocidade, e a restauração **nunca roda** nessas quinas porque a velocidade normal (v·sen θ) passa de 1 m/s. Ou seja: a suspeita do teste estava certa — **a correção só funciona em colisões fracas, e quanto mais rápido o esqui, mais quinas viram "impacto"**. Isso pune exatamente as manobras rápidas (loops, curvas em alta).

**Loops desenhados à mão falham por motivos numéricos**: com raio 0,8–1,1 m e velocidade de entrada bem acima do mínimo teórico (√(5gr) ≈ 6,6–7,6 m/s), 0 de 16 configurações completaram. Houve também **ganho** de energia espúrio (10,2 → 13,4 m/s num trecho plano) quando o contato é empurrado para fora de um segmento muito penetrado — a correção só tira energia, nunca limita o ganho.

**Passo variável muda o resultado**: o mesmo loop dá "Pancada forte" a 60 Hz e "Caiu de cabeça" a 144 Hz.

**Fase 1, "reta simples perde"**: a reta do fim da rampa até o *centro* da chegada vence; a reta até a **bandeira** perde ("Despencou"). A bandeira e o rótulo "CHEGADA" ficam *acima* do círculo de chegada (raio 42 px), e a vitória só conta se o *centro do corpo* entrar no círculo. Mirando a bandeira, a linha termina 30 px acima, o esquiador decola a 12 m/s e passa a 45 px do centro — 3 px fora. É um problema de legibilidade + regra de chegada, não de física.

### 1.4 Outros achados
- UI: cabeçalho + rodapé + painel de info ocupam ~25 % da altura no celular; vitória e derrota abrem um popup modal que exige toque.
- Sem áudio, sem vibração, sem dicas, sem estatísticas, sem métricas.
- Campanha: as 36 primeiras fases são variações de "retângulo listrado" (estático e depois móvel); fogo, avalanche e ataques só aparecem nas 14 últimas. Não há loop, salto ou uso de energia como tema, e os power-ups (turbo/lento/gelo) aparecem em 7 fases sem papel claro no quebra-cabeça.
- Save: chaves soltas no `localStorage` indexadas pela **posição** da fase (reordenar fases quebraria saves).
- Desfazer só remove o último traço inteiro; não há borracha.
- Avisos de perigo: o fogo "crepita" antes de acender (bom); canhão e águia não avisam; a avalanche mostra só um texto.

---

## 2. Problemas (priorizados)

1. **Física imprevisível** (passo variável, quinas, ganho espúrio) — destrói a confiança "eu errei, não o jogo". Crítico.
2. **Traço = colisor cru**: o jogador desenha uma curva lisa e o jogo enxerga dezenas de quinas.
3. **Onboarding**: a primeira tentativa natural (mirar a bandeira) falha.
4. **Feedback de falha** descreve o resultado, não a causa.
5. **Fluxo**: popup a cada tentativa; interface rouba espaço do tabuleiro.
6. **Campanha monótona** e sem curva de ensino.
7. Sem áudio/haptics, sem dicas, sem progressão visível.

## 3. Oportunidades

- **Determinismo como promessa de produto**: "o mesmo desenho dá sempre o mesmo resultado, em qualquer aparelho". Isso transforma cada falha em informação — é o coração do ciclo desenhar→testar→entender.
- **Fantasma da tentativa anterior + causa física da falha**: ensina sem texto.
- **Power-ups como inversões** (turbo que atrapalha, lento que salva) e **loops/saltos** como momentos "uau" — conteúdo novo sem sistema novo.
- **Dados locais** (tentativas por fase) para descobrir as fases quebradas antes de qualquer backend.

## 4. Arquitetura alvo

Continua sem build e sem dependências (abre com duplo-clique, publica como arquivos estáticos). O `index.html` vira só marcação; o código vai para scripts clássicos com responsabilidades separadas (escopo global compartilhado, carregados em ordem):

```
index.html            marcação
css/style.css         tema papel milimetrado / blueprint
js/levels.js          dados das fases, seções, itens mágicos, versão por orientação
js/riders.js          personagens e veículos (aparência + parâmetros físicos)
js/state.js           estado global, save/migração, utilitários
js/track.js          pipeline do traço (cru → suavizado → colisor) + trilhos
js/physics.js         integração em passo fixo, contatos, energia
js/game.js            regras: perigos, ataques, itens, magia, vitória/derrota, causas
js/effects.js         ragdoll, partículas
js/render.js          desenho do tabuleiro
js/art.js             arte do personagem, itens mágicos, dragão
js/audio.js           som procedural (WebAudio) + vibração
js/hints.js           dicas por fase + banco diário
js/progress.js        estatísticas, conquistas, métricas locais
js/ui.js              HUD, menus, banners
js/input.js           desenho, borracha, atalhos
js/main.js            laço principal, inicialização
tests/                Playwright: cenários físicos, solvabilidade de todas as fases, saves
```

## 5. Etapas (cada uma vai ao ar no link ao terminar)

| # | Etapa | Entrega |
|---|---|---|
| 1 | Auditoria + plano + backup | este documento, `legacy/v1-index.html` |
| 2 | Separar arquivos (refatoração pura) + testes no repo | comportamento idêntico (600/600 combinações, 50/50 itens) |
| 3 | Física nova | passo fixo 1/120 s com interpolação; pipeline do traço; conservação de energia em contato contínuo; energia nunca aumenta sozinha; chegada mais justa; personalidade dos veículos; 10 cenários de referência; todas as fases re-resolvidas |
| 4 | UI/HUD + fluxo | tabuleiro ≥ 85 % da tela; banner em vez de popup; retry instantâneo; marcador "caiu aqui"; borracha; menu ⋯ |
| 5 | Feedback, áudio, haptics | causas físicas das falhas; som que responde à velocidade; vibração sutil; configurações |
| 6 | Campanha | `LEVEL_DESIGN_PLAN.md`; IDs estáveis + migração de saves; fases reordenadas/redesenhadas em ondas; pegadinhas justas; todas verificadas com os 6 veículos nas 2 orientações |
| 7 | Dicas + progressão | 3 camadas por fase, banco de 3 que recarrega por dia; mapa da montanha; estatísticas; conquistas leves; métricas locais |
| 8 | Polimento + auditoria final | traço, personagem, vitória, avisos de perigo; docs; `FINAL_REDESIGN_REPORT.md` |

## 6. Riscos

| Risco | Mitigação |
|---|---|
| Mudar a física invalida todas as soluções conhecidas | Solucionador automático re-prova as 600 combinações fase×veículo×orientação e os 50 itens mágicos a cada mudança; nada vai ao ar sem 100 %. |
| Suavização altera a intenção do traço | Suavização adaptativa: preserva quinas detectadas (giro > 40° em < 24 px); teste de "quina intencional" nos cenários. |
| Reordenar fases quebra saves | IDs estáveis por fase + migração do formato antigo (as chaves antigas continuam lá, intocadas). |
| Escopo enorme | Entregas incrementais e independentes; cada uma é jogável. |
| Banco de dicas virar escassez artificial | Dica liberada fica liberada para sempre; o feedback de falha já ensina de graça; recarga diária simples ("amanhã tem 3 de novo"). |
| Interface "limpa" esconder o essencial | Play, Desfazer, Borracha e Dica sempre visíveis; o resto num menu. |

## 7. Testes

- **Cenários físicos de referência** (`tests/physics.mjs`): reta inclinada (energia ≈ teórica), curva suave (sem perda numérica), loop (completa acima de √(5gr), cai abaixo), salto (parábola), queda vertical, quina abrupta (perde energia/pancada), alta e baixa velocidade, traço com poucos pontos e com muitos pontos (mesmo resultado), determinismo (mesmo resultado em 30/60/144 Hz).
- **Solvabilidade** (`tests/levels.mjs`): toda fase × 6 veículos × 2 orientações tem uma pista vencedora; todo item mágico pode ser pego chegando vivo; a linha ingênua não pega o item.
- **Saves** (`tests/save.mjs`): migração do formato antigo, dicas, recarga diária.

## 8. Critério de aceite

1. Mesmo desenho ⇒ mesmo resultado em qualquer taxa de quadros (teste automático).
2. Uma curva lisa não perde energia além do atrito; um loop desenhado à mão completa quando há velocidade e cai quando não há.
3. Fase 1: linha reta do início à bandeira ou ao círculo vence.
4. 50 fases × 6 veículos × 2 orientações solucionáveis; 50 itens mágicos alcançáveis.
5. Falha → nova tentativa em 1 toque, sem popup.
6. Tabuleiro ocupa ≥ 85 % da área útil durante o jogo no celular em pé.
7. Nenhum erro de JavaScript nos testes; 60 fps num celular comum.
