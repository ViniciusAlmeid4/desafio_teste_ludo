# Desafio de Testes — Ludo (`desafio_teste_ludo`)

## 1. Identificação do Desafio

Este repositório é a entrega do **Desafio de Testes: Ludo**, proposto na disciplina de Projeto, Implementação e Teste de Software da **Unicesumar**. O objetivo é implementar, em JavaScript, as regras do jogo Ludo para 2 jogadores e uma suíte de testes automatizados que valide essas regras.

A especificação completa está em [`especifica_o_e_guia_do_desafio_ludo.md`](./especifica_o_e_guia_do_desafio_ludo.md).

---

## 2. Como instalar e executar os testes

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm 9 ou superior (já vem com o Node.js)

### Instalação

```bash
npm install
```

### Executar a suíte completa

```bash
npm test
```

Roda o Jest nos dois arquivos de `tests/` e gera o relatório de cobertura em `coverage/` (o resumo também aparece no terminal).

### Outras formas de executar

```bash
npx jest tests/ludo.final.test.js   # apenas um arquivo
npx jest -t "CT12"                  # apenas um caso de teste
npm run test:watch                  # modo watch, reexecuta a cada alteração
```

---

## 3. Estrutura do Projeto

```text
desafio_teste_ludo/
├── src/
│   └── ludo.js             # Regras e estado do jogo
├── tests/
│   ├── ludo.test.js        # CT01–CT09 (inicialização, base, movimentação, captura, bloqueio)
│   └── ludo.final.test.js  # CT10–CT14 (reta final e vitória)
├── package.json
└── README.md
```

---

## 4. Como os testes funcionam

### Modelo do tabuleiro usado pela engine

O percurso comum tem 40 casas, numeradas de 0 a 39 e percorridas em sentido horário. O RED sai da base na casa 0 e o BLUE na casa 20. Para cada peão a engine calcula a casa _relativa_, ou seja, quantas casas ele já andou desde a própria saída. Quando a casa relativa passa de 39, o peão deixa o percurso comum (`pos` vira `null`) e entra na reta final da sua cor (`inFinalStretch = true`).

Na reta final a posição fica em `finalPos`, de 0 a 5. Chegar em `finalPos = 6` significa alcançar o ponto central, e nesse caso `finished = true`.

A API usada nos testes é:

- `createGame(primeiroJogador)` cria o estado inicial.
- `determineFirstPlayer(dadoRed, dadoBlue)` faz o sorteio de quem começa.
- `movePieceFromBase(game, peao, dado)` tira um peão da base.
- `movePiece(game, peao, dado)` move um peão que já está no percurso ou na reta final.
- `endTurn(game)` passa a vez, a não ser que haja jogada extra.
- `mustSkipTurn(game, dado)` indica se o jogador não tem movimento possível.

As funções de movimento devolvem um objeto com `success`, `extraTurn`, `captured` e `finished`. Os testes conferem esse retorno e também o estado do jogo depois da jogada.

### Como os cenários são montados

Os fluxos curtos (sair da base, andar algumas casas, passar a vez) são montados chamando a própria API, como aconteceria numa partida.

Os cenários de reta final e de vitória exigiriam dezenas de jogadas para chegar ao ponto testado. Por isso, `ludo.final.test.js` posiciona os peões diretamente no estado com três funções auxiliares:

- `antesDaReta(game, cor, peao, faltam)` coloca o peão no percurso comum a `faltam` casas da entrada da reta. A conta parte do `START_POSITIONS` da cor, então funciona para RED e para BLUE.
- `naReta(game, cor, peao, finalPos)` coloca o peão já dentro da reta final.
- `concluirTres(game, cor)` marca três peões como concluídos, para testar o momento da vitória.

O último teste do CT14 não usa essas funções para o peão principal. Ele joga uma partida curta só com a API: o peão sai da base com 6, emenda jogadas extras, o BLUE passa a vez por não ter peão fora da base e o RED vence com o número exato. Esse teste percorre o fluxo do diagrama da seção 4 da especificação.

### O que cada grupo verifica

- **CT01–CT02:** estado inicial (4 peões na base por jogador, sem vencedor) e o sorteio pelo maior dado, incluindo o empate.
- **CT03–CT04:** a saída da base só acontece com 6; os dados de 1 a 5 são recusados e o 6 coloca o peão na casa de partida da cor.
- **CT05–CT06:** o avanço de N casas, a volta circular do tabuleiro e a jogada extra ao tirar 6 (o `endTurn` mantém o mesmo jogador).
- **CT07:** a captura manda o peão adversário de volta para a base. Não há captura de peão da própria cor nem de torre.
- **CT08–CT09:** dois peões da mesma cor formam torre, e o adversário não pode parar nela nem ultrapassá-la.
- **CT10:** a entrada na reta final para as duas cores. O peão na reta não pode ser capturado nem bloqueado.
- **CT11–CT13:** dentro da reta final, o avanço parcial, a chegada exata e o bate e volta quando o dado passa do necessário.
- **CT14:** a vitória ao concluir os 4 peões. Depois dela nenhuma jogada é aceita e a vez não muda mais.

---

## 5. Variação de regras validada

A saída da base exige tirar **6** no dado, que é a variação padrão da especificação. A regra alternativa (sair com 1 ou 6) não foi implementada. O CT03 confirma que os valores de 1 a 5 não tiram o peão da base.

---

## 6. Observações sobre a engine

- **Correção feita nos testes do CT10:** a função `isPathBlocked` verificava todas as casas cobertas pelo dado, inclusive as que ficam depois da entrada da reta final. Com isso, uma torre adversária logo após a entrada (por exemplo, na casa 1 para o RED) bloqueava um peão que nem passaria por ela. Agora a função considera só as casas do percurso comum que o peão realmente anda. Dois testes de regressão no CT10 cobrem os dois lados da correção.
- **Cobertura de ramos abaixo de 100%:** em `movePiece`, os ramos que tratam a chegada ou o recuo _no mesmo movimento de entrada_ na reta nunca são executados. Como a entrada acontece a partir da casa relativa 39 no máximo e o dado vai até 6, o peão entra no máximo em `finalPos = 5`. Esses ramos ficaram como proteção e aparecem como não cobertos no relatório.

---

## 7. Casos de Teste Cobertos

| ID   | Categoria     | Cenário                                            | Arquivo              |
| :--- | :------------ | :------------------------------------------------- | :------------------- |
| CT01 | Inicialização | Início com 2 jogadores                             | `ludo.test.js`       |
| CT02 | Inicialização | Sorteio de ordem inicial pelo dado                 | `ludo.test.js`       |
| CT03 | Saída da Base | Dado diferente de 6 com todos os peões na base     | `ludo.test.js`       |
| CT04 | Saída da Base | Dado 6 tira o peão da base e dá jogada extra       | `ludo.test.js`       |
| CT05 | Movimentação  | Avanço simples no percurso comum                   | `ludo.test.js`       |
| CT06 | Dado Extra    | Tirar 6 garante nova jogada                        | `ludo.test.js`       |
| CT07 | Captura       | Parar em casa com 1 peão adversário                | `ludo.test.js`       |
| CT08 | Bloqueio      | 2 peões aliados formam torre                       | `ludo.test.js`       |
| CT09 | Bloqueio      | Adversário não pode ultrapassar nem parar na torre | `ludo.test.js`       |
| CT10 | Reta Final    | Entrada na reta final após volta completa          | `ludo.final.test.js` |
| CT11 | Reta Final    | Avanço parcial dentro da reta final                | `ludo.final.test.js` |
| CT12 | Reta Final    | Chegada com número exato                           | `ludo.final.test.js` |
| CT13 | Reta Final    | Excesso de pontos, o "bate e volta"                | `ludo.final.test.js` |
| CT14 | Vitória       | Os 4 peões no ponto final declaram o vencedor      | `ludo.final.test.js` |

---

## 8. Colaboradores

| Nome                 | GitHub          | E-mail                    |
| :------------------- | :-------------- | :------------------------ |
| Vinicius Almeida     | ViniciusAlmeid4 | cmpalmeidaa@gmail.com     |
| Luiz Augusto Holanda | LUIZAUGUSTO1113 | luizholanda.dev@gmail.com |
