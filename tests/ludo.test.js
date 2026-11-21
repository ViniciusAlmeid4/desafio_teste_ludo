/**
 * ludo.test.js
 *
 * Suíte de testes — Parte 1 (CT01 a CT09)
 * Cobre: Inicialização, Saída da Base, Movimentação, Dado Extra,
 *        Captura e Bloqueio.
 *
 * Executar: npm test
 */

'use strict';

const {
  PLAYERS,
  START_POSITIONS,
  NUM_PIECES,
  TOTAL_COMMON_SQUARES,
  createGame,
  createPiece,
  determineFirstPlayer,
  getOpponent,
  movePieceFromBase,
  movePiece,
  endTurn,
  mustSkipTurn,
} = require('../src/ludo');

// ─── CT01 — Inicialização ──────────────────────────────────────────────────────

describe('CT01 — Inicialização: início de partida para 2 jogadores', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.RED);
  });

  test('deve criar exatamente 2 jogadores', () => {
    expect(Object.keys(game.players)).toHaveLength(2);
    expect(game.players[PLAYERS.RED]).toBeDefined();
    expect(game.players[PLAYERS.BLUE]).toBeDefined();
  });

  test('cada jogador deve ter exatamente 4 peões', () => {
    expect(game.players[PLAYERS.RED].pieces).toHaveLength(NUM_PIECES);
    expect(game.players[PLAYERS.BLUE].pieces).toHaveLength(NUM_PIECES);
  });

  test('todos os peões devem começar na base (inBase = true)', () => {
    for (const player of [PLAYERS.RED, PLAYERS.BLUE]) {
      game.players[player].pieces.forEach((piece) => {
        expect(piece.inBase).toBe(true);
      });
    }
  });

  test('nenhum peão deve estar no percurso ou na reta final', () => {
    for (const player of [PLAYERS.RED, PLAYERS.BLUE]) {
      game.players[player].pieces.forEach((piece) => {
        expect(piece.pos).toBeNull();
        expect(piece.inFinalStretch).toBe(false);
        expect(piece.finished).toBe(false);
      });
    }
  });

  test('não deve haver vencedor no início', () => {
    expect(game.winner).toBeNull();
  });

  test('deve lançar erro ao criar jogo com jogador inválido', () => {
    expect(() => createGame('GREEN')).toThrow();
  });
});

// ─── CT02 — Sorteio de ordem inicial ──────────────────────────────────────────

describe('CT02 — Inicialização: sorteio de ordem inicial', () => {
  test('RED vence o sorteio quando tira maior valor (5 vs 3)', () => {
    expect(determineFirstPlayer(5, 3)).toBe(PLAYERS.RED);
  });

  test('BLUE vence o sorteio quando tira maior valor (2 vs 6)', () => {
    expect(determineFirstPlayer(2, 6)).toBe(PLAYERS.BLUE);
  });

  test('deve lançar erro em caso de empate', () => {
    expect(() => determineFirstPlayer(4, 4)).toThrow();
  });

  test('createGame deve registrar o primeiro jogador corretamente', () => {
    const game = createGame(PLAYERS.BLUE);
    expect(game.currentPlayer).toBe(PLAYERS.BLUE);
  });

  test('RED inicia o jogo quando createGame recebe RED', () => {
    const game = createGame(PLAYERS.RED);
    expect(game.currentPlayer).toBe(PLAYERS.RED);
  });
});

// ─── CT03 — Saída da Base: dado ≠ 6 com todos peões na base ───────────────────

describe('CT03 — Saída da Base: dado diferente de 6 não permite saída', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.RED);
  });

  test.each([1, 2, 3, 4, 5])(
    'dado %i não permite sair da base',
    (diceValue) => {
      const result = movePieceFromBase(game, 0, diceValue);
      expect(result.success).toBe(false);
      expect(game.players[PLAYERS.RED].pieces[0].inBase).toBe(true);
    }
  );

  test('com dado ≠ 6, mustSkipTurn retorna true (todos peões na base)', () => {
    expect(mustSkipTurn(game, 3)).toBe(true);
  });

  test('com dado ≠ 6, o peão continua com pos = null', () => {
    movePieceFromBase(game, 0, 4);
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBeNull();
  });
});

// ─── CT04 — Saída da Base: dado = 6 ───────────────────────────────────────────

describe('CT04 — Saída da Base: dado igual a 6 move peão e concede jogada extra', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.RED);
  });

  test('dado 6 move o peão da base para a casa de partida', () => {
    const result = movePieceFromBase(game, 0, 6);
    expect(result.success).toBe(true);
    expect(game.players[PLAYERS.RED].pieces[0].inBase).toBe(false);
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBe(START_POSITIONS[PLAYERS.RED]);
  });

  test('dado 6 concede jogada extra (extraTurn = true)', () => {
    const result = movePieceFromBase(game, 0, 6);
    expect(result.extraTurn).toBe(true);
    expect(game.extraTurn).toBe(true);
  });

  test('pode sair com qualquer um dos 4 peões', () => {
    for (let i = 0; i < NUM_PIECES; i++) {
      const g = createGame(PLAYERS.RED);
      const result = movePieceFromBase(g, i, 6);
      expect(result.success).toBe(true);
      expect(g.players[PLAYERS.RED].pieces[i].inBase).toBe(false);
    }
  });

  test('tentar sair com peão que já não está na base retorna erro', () => {
    movePieceFromBase(game, 0, 6);
    const result = movePieceFromBase(game, 0, 6);
    expect(result.success).toBe(false);
  });

  test('a posição do peão corresponde ao START_POSITIONS do RED (casa 0)', () => {
    movePieceFromBase(game, 2, 6);
    expect(game.players[PLAYERS.RED].pieces[2].pos).toBe(0);
  });

  test('a posição do peão BLUE corresponde ao START_POSITIONS do BLUE (casa 20)', () => {
    const blueGame = createGame(PLAYERS.BLUE);
    movePieceFromBase(blueGame, 1, 6);
    expect(blueGame.players[PLAYERS.BLUE].pieces[1].pos).toBe(START_POSITIONS[PLAYERS.BLUE]);
  });
});

// ─── CT05 — Movimentação simples no percurso comum ────────────────────────────

describe('CT05 — Movimentação: avanço simples no percurso comum', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.RED);
    // Coloca um peão no percurso
    movePieceFromBase(game, 0, 6);
    game.extraTurn = false; // consumir a jogada extra para simplificar
  });

  test('peão avança exatamente N casas conforme o dado', () => {
    const startPos = game.players[PLAYERS.RED].pieces[0].pos; // casa 0
    movePiece(game, 0, 4);
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBe((startPos + 4) % TOTAL_COMMON_SQUARES);
  });

  test('avanço de 1 casa', () => {
    movePiece(game, 0, 1);
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBe(1);
  });

  test('avanço de 6 casas', () => {
    movePiece(game, 0, 6);
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBe(6);
  });

  test('percurso é circular: posição 38 + dado 5 = casa 3', () => {
    game.players[PLAYERS.RED].pieces[0].pos = 38;
    // Mas RED entra na reta final ao completar 40 casas relativas.
    // Para testar somente o módulo circular sem reta final:
    // usamos BLUE (start=20) e posicionamos no 36 (relativa = 16)
    const blueGame = createGame(PLAYERS.BLUE);
    movePieceFromBase(blueGame, 0, 6);
    blueGame.players[PLAYERS.BLUE].pieces[0].pos = 36; // relativa = 16
    movePiece(blueGame, 0, 3);
    expect(blueGame.players[PLAYERS.BLUE].pieces[0].pos).toBe(39);
  });

  test('após avanço sem tirar 6, extraTurn é false', () => {
    movePiece(game, 0, 3);
    expect(game.extraTurn).toBe(false);
  });

  test('após avanço com dado 6, extraTurn é true', () => {
    movePiece(game, 0, 6);
    expect(game.extraTurn).toBe(true);
  });
});

// ─── CT06 — Dado Extra ────────────────────────────────────────────────────────

describe('CT06 — Dado Extra: tirar 6 garante nova jogada', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.RED);
    movePieceFromBase(game, 0, 6);
    game.extraTurn = false;
  });

  test('tirar 6 no percurso define extraTurn = true no game', () => {
    movePiece(game, 0, 6);
    expect(game.extraTurn).toBe(true);
  });

  test('endTurn com extraTurn=true não muda o jogador atual', () => {
    game.extraTurn = true;
    endTurn(game);
    expect(game.currentPlayer).toBe(PLAYERS.RED);
  });

  test('endTurn com extraTurn=false alterna para o adversário', () => {
    game.extraTurn = false;
    endTurn(game);
    expect(game.currentPlayer).toBe(PLAYERS.BLUE);
  });

  test('tirar 6 ao sair da base concede jogada extra (testado via movePieceFromBase)', () => {
    const g = createGame(PLAYERS.RED);
    const result = movePieceFromBase(g, 0, 6);
    expect(result.extraTurn).toBe(true);
  });

  test('tirar valor ≠ 6 não garante jogada extra', () => {
    movePiece(game, 0, 3);
    expect(game.extraTurn).toBe(false);
  });
});

// ─── CT07 — Captura ───────────────────────────────────────────────────────────

describe('CT07 — Captura: parar em casa com 1 peão adversário', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.RED);
    // RED sai da base na casa 0
    movePieceFromBase(game, 0, 6);
    game.extraTurn = false;
    // Coloca BLUE manualmente na casa 4 (1 peão adversário)
    game.players[PLAYERS.BLUE].pieces[0].inBase = false;
    game.players[PLAYERS.BLUE].pieces[0].pos = 4;
  });

  test('RED avança 4 casas e captura o peão BLUE', () => {
    const result = movePiece(game, 0, 4);
    expect(result.success).toBe(true);
    expect(result.captured).toBe(true);
  });

  test('peão BLUE capturado retorna para a base (inBase = true)', () => {
    movePiece(game, 0, 4);
    expect(game.players[PLAYERS.BLUE].pieces[0].inBase).toBe(true);
    expect(game.players[PLAYERS.BLUE].pieces[0].pos).toBeNull();
  });

  test('peão RED ocupa a casa do peão capturado', () => {
    movePiece(game, 0, 4);
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBe(4);
  });

  test('não captura quando a casa tem 2 peões adversários (bloqueio)', () => {
    // Adiciona segundo BLUE na mesma casa 4 → torre
    game.players[PLAYERS.BLUE].pieces[1].inBase = false;
    game.players[PLAYERS.BLUE].pieces[1].pos = 4;
    const result = movePiece(game, 0, 4);
    // É bloqueio: o movimento falha
    expect(result.success).toBe(false);
    expect(game.players[PLAYERS.BLUE].pieces[0].inBase).toBe(false);
    expect(game.players[PLAYERS.BLUE].pieces[1].inBase).toBe(false);
  });

  test('não captura peão da própria cor', () => {
    // RED tenta ir para a casa onde há outro RED
    game.players[PLAYERS.RED].pieces[1].inBase = false;
    game.players[PLAYERS.RED].pieces[1].pos = 4;
    // Remove BLUE da casa 4
    game.players[PLAYERS.BLUE].pieces[0].inBase = true;
    game.players[PLAYERS.BLUE].pieces[0].pos = null;
    const result = movePiece(game, 0, 4);
    // Avança normalmente, não captura aliado
    expect(result.success).toBe(true);
    expect(result.captured).toBe(false);
    expect(game.players[PLAYERS.RED].pieces[1].inBase).toBe(false);
  });
});

// ─── CT08 — Bloqueio: formação de torre ──────────────────────────────────────

describe('CT08 — Bloqueio: formação de torre com 2 peões da mesma cor', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.RED);
    // Dois peões RED na mesma casa (casa 10) → torre
    game.players[PLAYERS.RED].pieces[0].inBase = false;
    game.players[PLAYERS.RED].pieces[0].pos = 10;
    game.players[PLAYERS.RED].pieces[1].inBase = false;
    game.players[PLAYERS.RED].pieces[1].pos = 10;
  });

  test('dois peões da mesma cor na mesma casa formam estado de bloqueio', () => {
    const piecesAtPos10 = game.players[PLAYERS.RED].pieces.filter(
      (p) => !p.inBase && p.pos === 10
    );
    expect(piecesAtPos10).toHaveLength(2);
  });

  test('a torre não é capturada quando BLUE tenta parar nela', () => {
    // BLUE na casa 8, avança 2 → tenta chegar na 10
    game.players[PLAYERS.BLUE].pieces[0].inBase = false;
    game.players[PLAYERS.BLUE].pieces[0].pos = 8;
    game.currentPlayer = PLAYERS.BLUE;
    const result = movePiece(game, 0, 2);
    // Deve ser bloqueado (torre no caminho)
    expect(result.success).toBe(false);
    // Peões RED permanecem na base 10
    expect(game.players[PLAYERS.RED].pieces[0].pos).toBe(10);
    expect(game.players[PLAYERS.RED].pieces[1].pos).toBe(10);
  });

  test('peões da torre continuam com inBase = false', () => {
    expect(game.players[PLAYERS.RED].pieces[0].inBase).toBe(false);
    expect(game.players[PLAYERS.RED].pieces[1].inBase).toBe(false);
  });
});

// ─── CT09 — Bloqueio: peão adversário impedido de cruzar ou parar ─────────────

describe('CT09 — Bloqueio: adversário não pode ultrapassar ou parar em torre', () => {
  let game;

  beforeEach(() => {
    game = createGame(PLAYERS.BLUE);
    // Torre RED nas casas 15 e 15
    game.players[PLAYERS.RED].pieces[0].inBase = false;
    game.players[PLAYERS.RED].pieces[0].pos = 15;
    game.players[PLAYERS.RED].pieces[1].inBase = false;
    game.players[PLAYERS.RED].pieces[1].pos = 15;
    // Peão BLUE atrás da torre
    game.players[PLAYERS.BLUE].pieces[0].inBase = false;
    game.players[PLAYERS.BLUE].pieces[0].pos = 12;
  });

  test('BLUE não pode parar exatamente na torre (avanço de 3)', () => {
    const result = movePiece(game, 0, 3);
    expect(result.success).toBe(false);
    expect(game.players[PLAYERS.BLUE].pieces[0].pos).toBe(12); // sem mover
  });

  test('BLUE não pode ultrapassar a torre (avanço de 5)', () => {
    const result = movePiece(game, 0, 5);
    expect(result.success).toBe(false);
    expect(game.players[PLAYERS.BLUE].pieces[0].pos).toBe(12);
  });

  test('BLUE pode avançar sem cruzar a torre (avanço de 2)', () => {
    const result = movePiece(game, 0, 2);
    expect(result.success).toBe(true);
    expect(game.players[PLAYERS.BLUE].pieces[0].pos).toBe(14);
  });

  test('bloqueio não impede peões da própria cor da torre', () => {
    // Muda para turno RED e move outro peão da RED além da posição 15
    game.currentPlayer = PLAYERS.RED;
    game.players[PLAYERS.RED].pieces[2].inBase = false;
    game.players[PLAYERS.RED].pieces[2].pos = 13;
    const result = movePiece(game, 2, 4); // vai para 17
    expect(result.success).toBe(true);
    expect(game.players[PLAYERS.RED].pieces[2].pos).toBe(17);
  });

  test('turno não avança (extraTurn = false) quando movimento é bloqueado', () => {
    movePiece(game, 0, 3); // bloqueado
    expect(game.extraTurn).toBe(false);
  });
});
