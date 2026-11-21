/**
 * ludo.final.test.js
 *
 * Suíte de testes — Parte 2 (CT10 a CT14)
 * Cobre: Reta Final (entrada, avanço parcial, chegada exata, bate-e-volta)
 *        e Vitória.
 *
 * ATENÇÃO: Este arquivo está reservado para ser completado pelo parceiro.
 * Os `describe` blocks e os cenários estão estruturados; os `test` bodies
 * devem ser implementados conforme a especificação do desafio.
 *
 * Executar: npm test
 */

'use strict';

const {
  PLAYERS,
  TOTAL_COMMON_SQUARES,
  FINAL_STRETCH_LENGTH,
  NUM_PIECES,
  createGame,
  movePieceFromBase,
  movePiece,
  endTurn,
} = require('../src/ludo');

// Utilitário: posiciona um peão exatamente antes de entrar na reta final.
// Para RED (start=0): a reta final começa ao completar 40 casas relativas.
// A última casa do percurso comum para RED é a posição absoluta 39.
function putPieceBeforeFinalStretch(game, player, pieceIndex, stepsFromEntry) {
  const piece = game.players[player].pieces[pieceIndex];
  // Coloca o peão na última casa do percurso comum
  piece.inBase = false;
  // Posição absoluta que fica `stepsFromEntry` antes de entrar na reta final
  // Para RED: start=0, entra na reta final ao chegar na casa relativa 40 (wrap)
  // A casa absoluta imediatamente antes da reta final é a 39 (relativa 39).
  // Para simplificar: colocamos o peão em pos tal que faltam `stepsFromEntry` para a reta
  const start = player === PLAYERS.RED ? 0 : 20;
  const absPos = (start + TOTAL_COMMON_SQUARES - stepsFromEntry) % TOTAL_COMMON_SQUARES;
  piece.pos = absPos;
}

// ─── CT10 — Entrada na reta final após volta completa ─────────────────────────

describe('CT10 — Reta Final: entrada após volta completa no percurso', () => {
  /**
   * TODO (parceiro): Implemente os testes a seguir.
   *
   * Cenário: um peão que completou as 40 casas do percurso comum deve
   * transitar para inFinalStretch = true ao avançar além da última casa.
   *
   * Dicas:
   * - Use `putPieceBeforeFinalStretch(game, PLAYERS.RED, 0, N)` para posicionar
   *   o peão N casas antes do início da reta final.
   * - Após `movePiece(game, 0, N)`, verifique piece.inFinalStretch === true
   *   e piece.pos === null.
   */

  test('peão deve ter inFinalStretch = true ao entrar na reta final', () => {
    const game = createGame(PLAYERS.RED);
    putPieceBeforeFinalStretch(game, PLAYERS.RED, 0, 3);
    movePiece(game, 0, 3);
    const piece = game.players[PLAYERS.RED].pieces[0];
    expect(piece.inFinalStretch).toBe(true);
    expect(piece.pos).toBeNull();
  });

  test('peão deve ter pos = null após entrar na reta final', () => {
    const game = createGame(PLAYERS.RED);
    putPieceBeforeFinalStretch(game, PLAYERS.RED, 0, 2);
    movePiece(game, 0, 2);
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBeNull();
  });

  test('peão deve ter finalPos = 0 ao entrar com dado exato que o coloca no início da reta', () => {
    const game = createGame(PLAYERS.RED);
    putPieceBeforeFinalStretch(game, PLAYERS.RED, 0, 1);
    movePiece(game, 0, 1); // entra e fica na posição 0 da reta final
    const piece = game.players[PLAYERS.RED].pieces[0];
    expect(piece.inFinalStretch).toBe(true);
    // Avançou 0 casas dentro da reta final → finalPos deve ser 0
    expect(piece.finalPos).toBe(0);
  });

  // TODO: adicionar mais cenários de entrada conforme necessário
});

// ─── CT11 — Avanço parcial dentro da reta final ───────────────────────────────

describe('CT11 — Reta Final: avanço parcial (dado < casas restantes)', () => {
  /**
   * TODO (parceiro): Implemente os testes a seguir.
   *
   * Cenário: peão já está na reta final com finalPos < FINAL_STRETCH_LENGTH.
   * Com dado menor que as casas restantes, o peão avança sem concluir.
   *
   * Dicas:
   * - Coloque piece.inFinalStretch = true e piece.finalPos = X manualmente.
   * - Chame movePiece(game, pieceIndex, dado).
   * - Verifique piece.finalPos === X + dado e piece.finished === false.
   */

  test('peão avança parcialmente dentro da reta final', () => {
    const game = createGame(PLAYERS.RED);
    const piece = game.players[PLAYERS.RED].pieces[0];
    piece.inBase = false;
    piece.inFinalStretch = true;
    piece.finalPos = 2;

    movePiece(game, 0, 2); // casas restantes = 6-2=4; dado=2 < 4
    expect(piece.finalPos).toBe(4);
    expect(piece.finished).toBe(false);
  });

  test('peão não é marcado como finished ao avançar parcialmente', () => {
    const game = createGame(PLAYERS.RED);
    const piece = game.players[PLAYERS.RED].pieces[0];
    piece.inBase = false;
    piece.inFinalStretch = true;
    piece.finalPos = 0;

    movePiece(game, 0, 3);
    expect(piece.finished).toBe(false);
  });

  // TODO: adicionar mais cenários conforme necessário
});

// ─── CT12 — Chegada com número exato ─────────────────────────────────────────

describe('CT12 — Reta Final: chegada com número exato ao ponto final', () => {
  /**
   * TODO (parceiro): Implemente os testes a seguir.
   *
   * Cenário: peão na reta final com exatamente `FINAL_STRETCH_LENGTH - finalPos`
   * casas restantes. Tirar esse valor exato no dado conclui o trajeto.
   *
   * Dicas:
   * - Defina piece.finalPos = X e dado = FINAL_STRETCH_LENGTH - X.
   * - Após movePiece, verifique piece.finished === true e piece.finalPos === FINAL_STRETCH_LENGTH.
   */

  test('dado igual às casas restantes conclui o peão (finished = true)', () => {
    const game = createGame(PLAYERS.RED);
    const piece = game.players[PLAYERS.RED].pieces[0];
    piece.inBase = false;
    piece.inFinalStretch = true;
    piece.finalPos = 4; // faltam 2

    const result = movePiece(game, 0, 2);
    expect(result.finished).toBe(true);
    expect(piece.finished).toBe(true);
  });

  test('finalPos deve ser igual a FINAL_STRETCH_LENGTH ao concluir', () => {
    const game = createGame(PLAYERS.RED);
    const piece = game.players[PLAYERS.RED].pieces[0];
    piece.inBase = false;
    piece.inFinalStretch = true;
    piece.finalPos = 0; // faltam 6

    movePiece(game, 0, FINAL_STRETCH_LENGTH);
    expect(piece.finalPos).toBe(FINAL_STRETCH_LENGTH);
  });

  // TODO: adicionar mais cenários conforme necessário
});

// ─── CT13 — Excesso de pontos na reta final ("bate e volta") ──────────────────

describe('CT13 — Reta Final: excesso de pontos — bate-e-volta', () => {
  /**
   * TODO (parceiro): Implemente os testes a seguir.
   *
   * Cenário: peão na reta final com menos casas restantes do que o dado.
   * O peão vai até o ponto final e recua o excedente.
   *
   * Dicas:
   * - piece.finalPos = X, dado > (FINAL_STRETCH_LENGTH - X).
   * - Excesso = dado - (FINAL_STRETCH_LENGTH - X).
   * - finalPos resultante = FINAL_STRETCH_LENGTH - excesso.
   * - piece.finished deve ser false.
   */

  test('peão recua o excedente ao ultrapassar o ponto final', () => {
    const game = createGame(PLAYERS.RED);
    const piece = game.players[PLAYERS.RED].pieces[0];
    piece.inBase = false;
    piece.inFinalStretch = true;
    piece.finalPos = 4; // faltam 2; dado = 4 → excesso = 2

    movePiece(game, 0, 4);
    // vai até 6 e recua 2 → finalPos = 6 - 2 = 4
    expect(piece.finalPos).toBe(4);
    expect(piece.finished).toBe(false);
  });

  test('peão não é marcado como finished ao recuar por excesso', () => {
    const game = createGame(PLAYERS.RED);
    const piece = game.players[PLAYERS.RED].pieces[0];
    piece.inBase = false;
    piece.inFinalStretch = true;
    piece.finalPos = 5; // falta 1; dado = 3 → excesso = 2

    movePiece(game, 0, 3);
    expect(piece.finished).toBe(false);
  });

  // TODO: adicionar mais cenários conforme necessário
});

// ─── CT14 — Vitória: todos os 4 peões no ponto final ─────────────────────────

describe('CT14 — Vitória: todos os 4 peões concluídos declaram vencedor', () => {
  /**
   * TODO (parceiro): Implemente os testes a seguir.
   *
   * Cenário: o último peão de um jogador chega ao ponto final.
   * O campo game.winner deve ser preenchido com o ID do jogador vencedor.
   *
   * Dicas:
   * - Marque 3 peões como finished = true manualmente.
   * - Posicione o 4º na reta final com as casas certas.
   * - Chame movePiece para concluir o 4º peão.
   * - Verifique game.winner === PLAYERS.RED (ou BLUE).
   * - Verifique que novas jogadas retornam success = false após o fim do jogo.
   */

  test('game.winner é definido quando todos os 4 peões chegam ao ponto final', () => {
    const game = createGame(PLAYERS.RED);
    const pieces = game.players[PLAYERS.RED].pieces;

    // Marca 3 peões como concluídos
    for (let i = 0; i < 3; i++) {
      pieces[i].inBase = false;
      pieces[i].inFinalStretch = true;
      pieces[i].finalPos = FINAL_STRETCH_LENGTH;
      pieces[i].finished = true;
    }

    // 4º peão quase chegando
    pieces[3].inBase = false;
    pieces[3].inFinalStretch = true;
    pieces[3].finalPos = 5; // falta 1

    movePiece(game, 3, 1);
    expect(game.winner).toBe(PLAYERS.RED);
  });

  test('partida é encerrada após a vitória (movimentos retornam success = false)', () => {
    const game = createGame(PLAYERS.RED);
    const pieces = game.players[PLAYERS.RED].pieces;

    for (let i = 0; i < 3; i++) {
      pieces[i].finished = true;
      pieces[i].inBase = false;
      pieces[i].inFinalStretch = true;
      pieces[i].finalPos = FINAL_STRETCH_LENGTH;
    }
    pieces[3].inBase = false;
    pieces[3].inFinalStretch = true;
    pieces[3].finalPos = 5;
    movePiece(game, 3, 1); // vence aqui

    // Tentativa de continuar jogando
    const extraResult = movePiece(game, 3, 1);
    expect(extraResult.success).toBe(false);
  });

  // TODO: adicionar mais cenários de vitória conforme necessário
});
