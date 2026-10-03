# Física — como o jogo funciona e por quê

Princípio: **mesmo desenho, mesmo resultado, em qualquer aparelho**. Nada na física muda por tentativas, tempo de jogo ou dica usada.

## Unidades
100 px = 1 m. g = 9,81 m/s² = 981 px/s². Velocidade máxima 25 m/s. O que a tela mostra (m, m/s, s) é o que a simulação usa.

## Relógio fixo
`STEP = 1/120 s` (`js/physics.js`). O laço principal (`js/main.js`) acumula o tempo real e avança a simulação em passos de exatamente `STEP`; o desenho interpola entre os dois últimos estados. Cada passo tem `SUB = 5` subpassos de contato (≈ 1/600 s). Antes (v1) o passo era o tempo do quadro: o mesmo loop dava "Pancada" a 60 Hz e "Caiu de cabeça" a 144 Hz. Agora 30, 60 e 144 Hz produzem **bit a bit** o mesmo resultado (teste T11).

## Corpo
Dois pontos de contato (raio 9 px) ligados por uma haste rígida de 36 px, integrados por posição (PBD). O corpo desenhado por cima só é testado contra a neve por *sondas* (cabeça, tronco): tocou = "Caiu de cabeça".

## Pista: do dedo ao colisor
`js/track.js`. O que está na tela **é** o que a física lê.

1. pontos crus do ponteiro (≥ 1,5 px entre si);
2. lacunas > 8 px (dedo rápido, poucos pontos) são preenchidas por Catmull-Rom centrípeto — não cria laços nem pontas;
3. reamostragem uniforme a cada 4 px;
4. **cantos intencionais**: máximos locais de giro ≥ 30° dentro de ±5 pontos (±20 px) são preservados;
5. suavização gaussiana (σ = 2 pontos ≈ 8 px) *entre* os cantos: tira o tremor do dedo, mantém lombadas do tamanho do esquiador;
6. se o traço continua o fim da rampa ou de outro traço, os primeiros ~10–48 px são trocados por uma curva Hermite que sai do ponto de junção na direção em que o esquiador chega (sem degrau, sem quina).

Por que Gaussiana + detecção de cantos e não só Chaikin/Bézier: Chaikin e splines de ajuste encolhem ou ondulam em torno das quinas; a Gaussiana com cantos "pinados" é o único método simples que separa ruído (alta frequência, pequeno desvio) de intenção (giro grande em poucos pontos). Resultados medidos: 8, 40 e 400 pontos na mesma curva dão o mesmo tempo de descida (±0,1 %); tremor de 2,5 px muda a velocidade em < 1 % (T02).

## Energia
Pista é passiva: **nunca dá energia** (só turbo, foguete e dragão dão).

*Problema da v1*: ao projetar um contato para fora de um segmento, a componente normal da velocidade some; numa polilinha cada vértice é uma pequena colisão e perde ≈ 1 − cos²θ da energia. A v1 devolvia essa perda só se a velocidade normal fosse < 1 m/s — ou seja, justamente **não** nas curvas rápidas. A v1 também nunca limitava o ganho, e a energia podia *aumentar* (10 → 13 m/s num trecho reto).

*Agora* (`physics()`): depois de cada subpasso mede-se `ΔE = E_depois − E_antes` (cinética + potencial). Se ΔE > 0 (ganho espúrio), reescala-se a velocidade para anular o ganho. Se não houve um **evento real**, repõe-se também a perda, de modo que dobrar numa curva suave não gasta energia. Eventos reais, que gastam energia de verdade:

- **pouso**: contato que estava no ar e chega com velocidade normal > 0,3 m/s;
- **quina**: o contato passa entre segmentos cujos ângulos diferem mais que 25°;
- **a barra esticada sobre uma quina**: os dois contatos em segmentos que diferem mais de 30° (o veículo pivota sobre a dobra).

Consequência: um loop desenhado à mão se comporta como o círculo ideal. A velocidade mínima no fundo medida bate com a teoria v² ≥ 5·g·r (T03: o limiar de queda fica entre +0 % e +25 % da teoria, o resto é atrito).

## Contato
`SKIN = 1 px`: um contato a menos de 1 px da neve ainda conta como encostado (sem micro-pulos em linha desenhada à mão — mesmo erro que fazia a v1 decolar sozinha em rampas longas). Trilhos (`RAIL = 60`, `HOVER = 40`): em traços que se cruzam (loop), o contato só sente os segmentos ligados a ele ao longo da linha; linhas só se ligam pelas pontas, nunca onde apenas se cruzam.

## Veículos
Ver `docs/VEHICLES.md`. Parâmetros: `roll` (atrito na neve), `drag` (arrasto do ar), `tough` (pancada que aguenta), `thrust` (foguete), `spin` (quão rápido para de girar no ar) e `bounce` (quanto devolve num pouso forte).

## Chegada
O pé *ou* o corpo dentro do círculo (raio 48 px) vence. A bandeira fica no centro do círculo: mirar na bandeira sempre funciona.

## Regra de ouro
Nenhum parâmetro físico varia com tentativas, derrotas, dicas ou itens (itens só cancelam uma perda, `hurt()`).
