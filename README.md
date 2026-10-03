# Ladeira Abaixo

Jogo de navegador com física de gravidade. Você desenha a pista na montanha com o dedo ou o mouse, aperta **Play** e o esquiador desce empurrado só pela gravidade (9,81 m/s²). O objetivo é chegar na bandeira inteiro.

## Como jogar

- Arraste na prancheta para desenhar a pista do **INÍCIO** até a **CHEGADA**. Um traço que começa perto do fim de outro continua a pista sem degrau.
- **Play** (ou Espaço) solta o esquiador. **Desfazer** (Z) apaga o último traço e **Limpar** apaga tudo.
- O esquiador quebra se bater com o corpo na neve, se pancar a mais de 7,5 m/s, se encostar numa área listrada ou se cair do mapa.
- Curvas fechadas e lombadas fazem ele voar: desenhe curvas suaves.

## Personagem e transporte

O botão com o nome do personagem, ao lado do botão de fases, abre a escolha de quem desce e em quê. A escolha fica salva.

- **Personagens:** Rafa, Bia, Vô Zé, Kai e Pinguim. Eles mudam só a aparência.
- **Transportes:** cada um muda a descida de verdade.

| Transporte | Como desce |
|---|---|
| Esqui | O original, equilibrado. Aguenta pancada até 7,5 m/s. |
| Trenó | Mais baixo e firme: aguenta 8,5 m/s, mas desliza menos. |
| Snowboard | Desliza mais, mas aguenta só 7,0 m/s. |
| Boia | Aguenta 9,5 m/s, mas o ar segura bastante, então corre menos da avalanche. |
| Esquibunda | Sentado numa tábua, rente ao chão: passa por vãos mais baixos e aguenta 8,0 m/s, mas é o mais lento. |
| Trenó-foguete | Um foguete empurra enquanto ele encosta na neve. É o mais rápido e o mais frágil (6,8 m/s). |

Todas as 50 fases foram testadas com os seis transportes, em pé e deitado, e todas têm pelo menos uma pista que chega inteira.

## Fases

São 50 fases. Da 7 à 16 os obstáculos se movem. Da 17 à 21 elas voltam a ser paradas, mas com formatos novos: túnel, vale, contramão (descida da direita para a esquerda), montanha-russa (a chegada fica no alto e você tem que descer antes para pegar embalo) e escadaria. Da 22 à 36 tudo se move de novo: portas de correr, pistões, avalanche, elevadores, fresta móvel e o grande final. No seletor, as fases com obstáculos móveis têm ↔.

A cada Play os obstáculos recomeçam da mesma posição, então dá para acertar o tempo mudando o formato da pista.

## Modalidades

No seletor, as fases estão agrupadas por modalidade. Da 37 à 50 entram três modalidades novas e uma final que junta tudo:

- **Fogo (37–40):** saídas de fogo acendem e apagam no chão e nas paredes. A linha tracejada mostra até onde vai a chama, e ela solta faíscas um pouco antes de acender. Encostar no fogo aceso queima.
- **Avalanche (41–44):** uma onda de neve sai de trás do INÍCIO e desce atrás do esquiador, cada vez mais rápido. Se ela alcançar o esquiador, ele fica soterrado. Pista lenta perde.
- **Ataque (45–48):** águias saem do ninho e perseguem o esquiador. Canhões atiram bolas de fogo mirando onde o esquiador vai estar se seguir reto, então fazer curva faz a bola errar.
- **Tudo junto (49–50):** fogo, avalanche, águia e canhão na mesma descida.

## Itens

**Durante a descida** (valem só naquela tentativa):

- **Turbo (raio):** empurra o esquiador para a frente por 3 s.
- **Lento (caracol):** freia por 3 s. Às vezes é armadilha, às vezes ajuda a acertar o tempo.
- **Gelo (floco de neve):** congela por 3 s tudo o que se move.

**Itens mágicos:** cada fase esconde um, num lugar quase impossível. Só fica com ele quem encosta no item **e chega vivo** ao fim da fase. As fases que ainda têm item aparecem com ✦ no menu, e as que já deram o item aparecem com ★.

- **Bolha:** aguenta 1 batida.
- **Capacete:** aguenta até 3 batidas.
- **Pena:** pancadas fortes e quedas de cabeça não machucam durante a fase inteira.
- **Amuleto de brasa:** fogo e bolas de fogo não queimam durante a fase inteira.
- **Cachecol de neve:** a avalanche não soterra durante a fase inteira.
- **Apito:** as águias ficam no ninho durante a fase inteira.
- **Dragão** (raríssimo, em 3 fases): leva o esquiador voando direto até a chegada.

Regras da bolsa:

- Ela guarda no máximo 2 itens.
- Todo item, menos o dragão, vale automaticamente na próxima fase que você jogar. Ele só é gasto quando você vence essa fase: perder não gasta nada.
- O dragão fica guardado até você apertar **Usar dragão**.
- Se a bolsa estiver cheia, o item conquistado fica na fase, e dá para voltar e buscar depois.
- Os itens nunca mudam a física, só cancelam uma derrota. Por isso todas as fases continuam possíveis sem eles.

## Em pé ou deitado

O botão **⟳ Deitar** troca para a montanha larga, para jogar com o celular deitado. Se a rotação de tela estiver travada, o jogo gira sozinho.

## Rodar

É um arquivo só: abra o `index.html` no navegador. Para jogar no celular, ative o GitHub Pages neste repositório (Settings → Pages → branch `main`, pasta `/`).
