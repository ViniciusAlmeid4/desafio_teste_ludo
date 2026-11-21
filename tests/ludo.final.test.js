'use strict';

// Testes CT10 a CT14: reta final e vitória.

const {
  PLAYERS,
  START_POSITIONS,
  TOTAL_COMMON_SQUARES,
  FINAL_STRETCH_LENGTH,
  createGame,
  movePieceFromBase,
  movePiece,
  endTurn,
  mustSkipTurn,
} = require('../src/ludo');

const { RED, BLUE } = PLAYERS;

// Coloca o peão no percurso comum, a `faltam` casas de entrar na reta final.
function antesDaReta(game, cor, i, faltam) {
  const p = game.players[cor].pieces[i];
  p.inBase = false;
  p.pos = (START_POSITIONS[cor] + TOTAL_COMMON_SQUARES - faltam) % TOTAL_COMMON_SQUARES;
  return p;
}

function naReta(game, cor, i, finalPos) {
  const p = game.players[cor].pieces[i];
  p.inBase = false;
  p.pos = null;
  p.inFinalStretch = true;
  p.finalPos = finalPos;
  return p;
}

function concluirTres(game, cor) {
  for (let i = 0; i < 3; i++) {
    naReta(game, cor, i, FINAL_STRETCH_LENGTH).finished = true;
  }
}

describe('CT10 - entrada na reta final', () => {
  test('RED na casa 37 com dado 3 entra na reta na posição 0', () => {
    const game = createGame(RED);
    const peao = antesDaReta(game, RED, 0, 3);

    const result = movePiece(game, 0, 3);

    expect(result.success).toBe(true);
    expect(peao.inFinalStretch).toBe(true);
    expect(peao.pos).toBeNull();
    expect(peao.finalPos).toBe(0);
  });

  test.each([1, 2, 3, 4, 5, 6])('RED na casa 39 com dado %i', (dado) => {
    const game = createGame(RED);
    const peao = antesDaReta(game, RED, 0, 1);

    movePiece(game, 0, dado);

    expect(peao.inFinalStretch).toBe(true);
    expect(peao.finalPos).toBe(dado - 1);
    expect(peao.finished).toBe(false);
  });

  test('BLUE entra na sua reta depois da casa 19', () => {
    const game = createGame(BLUE);
    const peao = antesDaReta(game, BLUE, 0, 1);
    expect(peao.pos).toBe(19);

    movePiece(game, 0, 4);

    expect(peao.inFinalStretch).toBe(true);
    expect(peao.finalPos).toBe(3);
  });

  test('BLUE passando pela casa 39 só dá a volta no tabuleiro', () => {
    const game = createGame(BLUE);
    const peao = antesDaReta(game, BLUE, 0, 22); // casa 38

    movePiece(game, 0, 4);

    expect(peao.inFinalStretch).toBe(false);
    expect(peao.pos).toBe(2);
  });

  test('peão recém-saído da base não entra na reta', () => {
    const game = createGame(RED);
    movePieceFromBase(game, 0, 6);
    movePiece(game, 0, 6);

    const peao = game.players[RED].pieces[0];
    expect(peao.inFinalStretch).toBe(false);
    expect(peao.pos).toBe(6);
  });

  test('peão na reta final não pode ser capturado', () => {
    const game = createGame(RED);
    const red = antesDaReta(game, RED, 0, 1);
    movePiece(game, 0, 1);
    endTurn(game);

    const blue = game.players[BLUE].pieces[0];
    blue.inBase = false;
    blue.pos = 35;
    const result = movePiece(game, 0, 4); // para na 39, onde o RED estava

    expect(result.captured).toBe(false);
    expect(blue.pos).toBe(39);
    expect(red.inBase).toBe(false);
    expect(red.inFinalStretch).toBe(true);
  });

  test('dois peões na reta final não formam bloqueio no percurso', () => {
    const game = createGame(BLUE);
    naReta(game, RED, 0, 2);
    naReta(game, RED, 1, 2);
    const blue = antesDaReta(game, BLUE, 0, 22);

    const result = movePiece(game, 0, 4);

    expect(result.success).toBe(true);
    expect(blue.pos).toBe(2);
  });

  test('torre depois da entrada da reta não impede o peão de entrar', () => {
    const game = createGame(RED);
    const red = antesDaReta(game, RED, 0, 2); // casa 38
    const torre = game.players[BLUE].pieces.slice(0, 2);
    torre.forEach((p) => {
      p.inBase = false;
      p.pos = 1;
    });

    // anda 39 e entra na reta; a casa 1 nem faz parte do caminho
    const result = movePiece(game, 0, 5);

    expect(result.success).toBe(true);
    expect(red.inFinalStretch).toBe(true);
    expect(red.finalPos).toBe(3);
    torre.forEach((p) => expect(p.pos).toBe(1));
  });

  test('torre antes da entrada continua bloqueando', () => {
    const game = createGame(RED);
    const red = antesDaReta(game, RED, 0, 4); // casa 36
    game.players[BLUE].pieces.slice(0, 2).forEach((p) => {
      p.inBase = false;
      p.pos = 38;
    });

    const result = movePiece(game, 0, 3);

    expect(result.success).toBe(false);
    expect(red.pos).toBe(36);
  });
});

describe('CT11 - avanço parcial na reta final', () => {
  test.each([
    [0, 1, 1],
    [0, 5, 5],
    [2, 3, 5],
    [3, 2, 5],
  ])('de %i com dado %i vai para %i', (inicio, dado, esperado) => {
    const game = createGame(RED);
    const peao = naReta(game, RED, 0, inicio);

    const result = movePiece(game, 0, dado);

    expect(result.success).toBe(true);
    expect(result.finished).toBe(false);
    expect(peao.finalPos).toBe(esperado);
    expect(peao.finished).toBe(false);
  });

  test('sem 6 não há jogada extra e a vez passa para o adversário', () => {
    const game = createGame(RED);
    naReta(game, RED, 0, 1);

    const result = movePiece(game, 0, 3);
    endTurn(game);

    expect(result.extraTurn).toBe(false);
    expect(game.currentPlayer).toBe(BLUE);
  });
});

describe('CT12 - chegada com número exato', () => {
  test.each([0, 1, 2, 3, 4, 5])('de %i com o valor que falta', (inicio) => {
    const game = createGame(RED);
    const peao = naReta(game, RED, 0, inicio);

    const result = movePiece(game, 0, FINAL_STRETCH_LENGTH - inicio);

    expect(result.success).toBe(true);
    expect(result.finished).toBe(true);
    expect(peao.finished).toBe(true);
    expect(peao.finalPos).toBe(FINAL_STRETCH_LENGTH);
  });

  test('chegar tirando 6 dá jogada extra', () => {
    const game = createGame(RED);
    naReta(game, RED, 0, 0);

    expect(movePiece(game, 0, 6).extraTurn).toBe(true);
    endTurn(game);
    expect(game.currentPlayer).toBe(RED);
  });

  test('chegar com outro valor não dá jogada extra', () => {
    const game = createGame(RED);
    naReta(game, RED, 0, 4);

    expect(movePiece(game, 0, 2).extraTurn).toBe(false);
  });

  test('peão que já chegou não se move mais', () => {
    const game = createGame(RED);
    const peao = naReta(game, RED, 0, 4);
    movePiece(game, 0, 2);

    const result = movePiece(game, 0, 3);

    expect(result.success).toBe(false);
    expect(peao.finalPos).toBe(FINAL_STRETCH_LENGTH);
    expect(peao.finished).toBe(true);
  });

  test('um peão concluído não decide a partida', () => {
    const game = createGame(RED);
    naReta(game, RED, 0, 5);
    movePiece(game, 0, 1);

    expect(game.winner).toBeNull();
  });
});

describe('CT13 - bate e volta', () => {
  // faltam (6 - inicio) casas; o que sobra do dado é recuado a partir do 6
  test.each([
    [4, 4, 4],
    [5, 3, 4],
    [5, 6, 1],
    [3, 6, 3],
    [1, 6, 5],
  ])('de %i com dado %i volta para %i', (inicio, dado, esperado) => {
    const game = createGame(RED);
    const peao = naReta(game, RED, 0, inicio);

    const result = movePiece(game, 0, dado);

    expect(result.success).toBe(true);
    expect(result.finished).toBe(false);
    expect(peao.finalPos).toBe(esperado);
    expect(peao.finished).toBe(false);
    expect(peao.inFinalStretch).toBe(true);
  });

  test('depois de recuar, conclui na rodada seguinte com o valor exato', () => {
    const game = createGame(RED);
    const peao = naReta(game, RED, 0, 5);

    movePiece(game, 0, 3);
    expect(peao.finalPos).toBe(4);

    endTurn(game);
    endTurn(game); // BLUE não tem peão fora da base, passa a vez

    movePiece(game, 0, 2);
    expect(peao.finished).toBe(true);
  });

  test('recuar tirando 6 ainda dá jogada extra', () => {
    const game = createGame(RED);
    naReta(game, RED, 0, 5);

    expect(movePiece(game, 0, 6).extraTurn).toBe(true);
  });
});

describe('CT14 - vitória', () => {
  test('RED vence ao levar o quarto peão ao ponto final', () => {
    const game = createGame(RED);
    concluirTres(game, RED);
    naReta(game, RED, 3, 5);

    movePiece(game, 3, 1);

    expect(game.winner).toBe(RED);
  });

  test('BLUE também pode vencer', () => {
    const game = createGame(BLUE);
    concluirTres(game, BLUE);
    naReta(game, BLUE, 3, 2);

    movePiece(game, 3, 4);

    expect(game.winner).toBe(BLUE);
  });

  test('sem vencedor se o último peão passa do ponto final', () => {
    const game = createGame(RED);
    concluirTres(game, RED);
    naReta(game, RED, 3, 5);

    movePiece(game, 3, 3);

    expect(game.winner).toBeNull();
  });

  test('depois da vitória nenhuma jogada é aceita', () => {
    const game = createGame(RED);
    concluirTres(game, RED);
    naReta(game, RED, 3, 5);
    movePiece(game, 3, 1);

    expect(movePiece(game, 3, 1).success).toBe(false);
    expect(movePieceFromBase(game, 0, 6).success).toBe(false);

    endTurn(game);
    expect(game.currentPlayer).toBe(RED);
    expect(game.winner).toBe(RED);
  });

  test('último peão sai da base e completa o percurso até vencer', () => {
    const game = createGame(RED);
    concluirTres(game, RED);
    const peao = game.players[RED].pieces[3];

    movePieceFromBase(game, 3, 6);
    endTurn(game);
    expect(game.currentPlayer).toBe(RED);

    for (const dado of [6, 6, 6, 6, 6, 6]) {
      movePiece(game, 3, dado);
      endTurn(game);
    }
    expect(peao.pos).toBe(36);
    expect(game.currentPlayer).toBe(RED);

    movePiece(game, 3, 3);
    endTurn(game);
    expect(peao.pos).toBe(39);
    expect(game.currentPlayer).toBe(BLUE);

    expect(mustSkipTurn(game, 2)).toBe(true);
    endTurn(game);

    movePiece(game, 3, 1);
    expect(peao.inFinalStretch).toBe(true);
    expect(peao.finalPos).toBe(0);
    endTurn(game);

    expect(mustSkipTurn(game, 5)).toBe(true);
    endTurn(game);

    movePiece(game, 3, 6);
    expect(peao.finished).toBe(true);
    expect(game.winner).toBe(RED);
  });
});
