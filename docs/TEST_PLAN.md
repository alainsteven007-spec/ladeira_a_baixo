# Plano de testes

Tudo roda no Chromium sem interface (Playwright), sobre o **código real do jogo**, sem duplicar a física em outro lugar.

| Comando | O que garante |
|---|---|
| `node tests/physics.mjs` | 12 cenários de referência (T01–T12): reta inclinada, curva com tremor, loop (limiar vs. teoria), salto, queda vertical, quina, alta e baixa velocidade, poucos/muitos pontos, determinismo 30/60/144 Hz, fase 1 |
| `node tests/solve.mjs` | prova de solvabilidade: 50 fases × 6 veículos × 2 orientações têm um traço vencedor desenhável dentro da tela (e que sobrevive a ±3 px de tremor). `--write` grava em `tests/data/solutions.json` |
| `node tests/magic.mjs` | os 50 itens mágicos podem ser pegos chegando vivo (em pé e deitado) e **nenhum** traço comum (de qualquer veículo, nem a reta ingênua) o pega por acidente |
| `node tests/save.mjs` | migração de saves antigos, dicas, recarga diária (etapa 7) |
| `node tests/levels.mjs` | geometria das fases: corredores largos o bastante, itens fora de perigos, progressão da dificuldade (etapa 6) |

Critérios de saída de cada entrega: tudo acima verde, sem erros de JavaScript, e a lista de combinações é regerada (não confia em prova antiga: física nova invalida prova antiga).
