# Veículos

Todos repousam nos mesmos dois contatos; o que muda é o *comportamento*. Notas medidas na física v2.

| Veículo | Personalidade | roll (atrito) | drag (ar) | aguenta | no ar | outros |
|---|---|---|---|---|---|---|
| Esqui | equilibrado | 25 | .040 | 7,5 m/s | gira 3,5 | — |
| Trenó | pesado: o ar quase não o freia, guarda o embalo; baixinho | 24 | **.015** | 8,5 m/s | gira 2,5 | passa em vãos baixos |
| Snowboard | desliza muito; **se endireita no ar** e aterrissa reto; frágil | **16** | .035 | 7,1 m/s | **gira 8** | — |
| Boia | escorrega de lado, quica ao cair, gira à toa no ar; quase indestrutível | **14** | .060 | 9,3 m/s | **gira 1,2** | **bounce .3** |
| Esquibunda | simples, lenta, rente ao chão | 34 | .045 | 8,0 m/s | gira 3 | passa por vãos baixos |
| Trenó-foguete | o mais rápido e frágil; empurra enquanto encosta | 25 | .040 | 6,75 m/s | gira 3,5 | thrust 55 |

Regra de design: nenhuma fase pode ser **impossível** para um veículo (verificado em `tests/solve.mjs`: 6 veículos × 2 orientações × 50 fases). Algumas ficam *mais fáceis* ou *mais difíceis* por veículo (listado em `LEVEL_DESIGN_PLAN.md`, coluna "Veículos relevantes").
