/**
 * ludo.js — Implementação das regras do jogo Ludo para 2 jogadores
 *
 * Estrutura do tabuleiro:
 *   - Percurso comum: 40 casas (0–39), sentido horário
 *   - Ponto de partida do Jogador 1 (RED):  casa 0
 *   - Ponto de partida do Jogador 2 (BLUE): casa 20
 *   - Reta final de cada cor: 6 casas (posições 0–5 dentro da reta final)
 *     O peão entra na reta final após completar as 40 casas do percurso comum.
 *   - Ponto final central = posição 6 da reta final (home)
 *
 * Estado de um peão:
 *   { inBase: boolean, pos: number, inFinalStretch: boolean, finished: boolean }
 */

'use strict';

// ─── Constantes ────────────────────────────────────────────────────────────────

const TOTAL_COMMON_SQUARES = 40;
const FINAL_STRETCH_LENGTH = 6; // posições 0..5; chegar em 6 = home
const PLAYERS = {
  RED: 'RED',
  BLUE: 'BLUE',
};
const START_POSITIONS = {
  [PLAYERS.RED]: 0,
  [PLAYERS.BLUE]: 20,
};
const NUM_PIECES = 4;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Cria um peão novo (na base).
 */
function createPiece() {
  return {
    inBase: true,
    pos: null,          // posição no percurso comum (0–39) ou null
    inFinalStretch: false,
    finalPos: null,     // posição dentro da reta final (0–5) ou null
    finished: false,
  };
}

/**
 * Cria o estado inicial do jogo.
 * @param {string} firstPlayer - PLAYERS.RED ou PLAYERS.BLUE
 */
function createGame(firstPlayer) {
  if (![PLAYERS.RED, PLAYERS.BLUE].includes(firstPlayer)) {
    throw new Error(`Jogador inválido: ${firstPlayer}`);
  }
  return {
    players: {
      [PLAYERS.RED]: {
        id: PLAYERS.RED,
        pieces: Array.from({ length: NUM_PIECES }, createPiece),
      },
      [PLAYERS.BLUE]: {
        id: PLAYERS.BLUE,
        pieces: Array.from({ length: NUM_PIECES }, createPiece),
      },
    },
    currentPlayer: firstPlayer,
    winner: null,
    extraTurn: false,
  };
}

/**
 * Determina qual jogador começa com base nos lançamentos iniciais.
 * @param {number} rollRed  - resultado do dado do RED
 * @param {number} rollBlue - resultado do dado do BLUE
 * @returns {string} PLAYERS.RED | PLAYERS.BLUE
 */
function determineFirstPlayer(rollRed, rollBlue) {
  if (rollRed === rollBlue) {
    throw new Error('Empate: relance o dado para determinar o primeiro jogador.');
  }
  return rollRed > rollBlue ? PLAYERS.RED : PLAYERS.BLUE;
}

/**
 * Retorna o jogador adversário.
 */
function getOpponent(player) {
  return player === PLAYERS.RED ? PLAYERS.BLUE : PLAYERS.RED;
}

/**
 * Converte a posição absoluta do percurso comum em posição relativa ao ponto
 * de partida do jogador (quantas casas já percorreu desde que saiu da base).
 */
function getRelativePos(absolutePos, player) {
  const start = START_POSITIONS[player];
  return (absolutePos - start + TOTAL_COMMON_SQUARES) % TOTAL_COMMON_SQUARES;
}

/**
 * Verifica se um determinado peão está bloqueado por uma torre adversária
 * no caminho até a posição destino.
 *
 * @param {object} game  - estado do jogo
 * @param {string} player - jogador movendo
 * @param {number} fromAbsPos - posição absoluta atual (percurso comum)
 * @param {number} steps - casas a avançar
 * @returns {boolean}
 */
function isPathBlocked(game, player, fromAbsPos, steps) {
  const opponent = getOpponent(player);
  const opponentPieces = game.players[opponent].pieces.filter(
    (p) => !p.inBase && !p.inFinalStretch && !p.finished
  );

  for (let step = 1; step <= steps; step++) {
    const checkPos = (fromAbsPos + step) % TOTAL_COMMON_SQUARES;
    const piecesAtPos = opponentPieces.filter((p) => p.pos === checkPos);
    if (piecesAtPos.length >= 2) {
      return true; // bloqueio (torre)
    }
  }
  return false;
}

// ─── API principal ─────────────────────────────────────────────────────────────

/**
 * Move um peão da base para a casa de partida (requer dado = 6).
 *
 * @param {object} game       - estado do jogo (mutado)
 * @param {number} pieceIndex - índice do peão (0–3)
 * @param {number} diceValue  - valor do dado
 * @returns {{ success: boolean, extraTurn: boolean, message: string }}
 */
function movePieceFromBase(game, pieceIndex, diceValue) {
  if (game.winner) return { success: false, extraTurn: false, message: 'Jogo já encerrado.' };

  const player = game.currentPlayer;
  const piece = game.players[player].pieces[pieceIndex];

  if (!piece.inBase) {
    return { success: false, extraTurn: false, message: 'Peão não está na base.' };
  }
  if (diceValue !== 6) {
    return { success: false, extraTurn: false, message: 'É necessário tirar 6 para sair da base.' };
  }

  // Move para o ponto de partida
  piece.inBase = false;
  piece.pos = START_POSITIONS[player];

  // Verifica captura de adversário na casa de partida
  _captureAtPosition(game, player, piece.pos);

  // Sempre ganha jogada extra ao tirar 6
  game.extraTurn = true;

  return { success: true, extraTurn: true, message: `Peão ${pieceIndex} saiu da base.` };
}

/**
 * Move um peão que já está no percurso comum ou na reta final.
 *
 * @param {object} game       - estado do jogo (mutado)
 * @param {number} pieceIndex - índice do peão (0–3)
 * @param {number} diceValue  - valor do dado (1–6)
 * @returns {{ success: boolean, extraTurn: boolean, captured: boolean, finished: boolean, message: string }}
 */
function movePiece(game, pieceIndex, diceValue) {
  if (game.winner) {
    return { success: false, extraTurn: false, captured: false, finished: false, message: 'Jogo já encerrado.' };
  }

  const player = game.currentPlayer;
  const piece = game.players[player].pieces[pieceIndex];

  if (piece.inBase) {
    return { success: false, extraTurn: false, captured: false, finished: false, message: 'Peão ainda está na base. Use movePieceFromBase.' };
  }
  if (piece.finished) {
    return { success: false, extraTurn: false, captured: false, finished: true, message: 'Peão já chegou ao destino final.' };
  }

  let captured = false;

  // ── Peão na reta final ──────────────────────────────────────────────────────
  if (piece.inFinalStretch) {
    const remaining = FINAL_STRETCH_LENGTH - piece.finalPos;
    if (diceValue === remaining) {
      // Chegada exata → home!
      piece.finalPos = FINAL_STRETCH_LENGTH;
      piece.finished = true;
      _checkVictory(game, player);
      const extraTurn = diceValue === 6;
      game.extraTurn = extraTurn;
      return { success: true, extraTurn, captured: false, finished: true, message: `Peão ${pieceIndex} chegou ao ponto final!` };
    } else if (diceValue < remaining) {
      // Avança parcialmente dentro da reta final
      piece.finalPos += diceValue;
      const extraTurn = diceValue === 6;
      game.extraTurn = extraTurn;
      return { success: true, extraTurn, captured: false, finished: false, message: `Peão ${pieceIndex} avança na reta final para posição ${piece.finalPos}.` };
    } else {
      // Excesso: vai até o fim e recua o excedente
      const excess = diceValue - remaining;
      piece.finalPos = FINAL_STRETCH_LENGTH - excess;
      const extraTurn = diceValue === 6;
      game.extraTurn = extraTurn;
      return { success: true, extraTurn, captured: false, finished: false, message: `Peão ${pieceIndex} recuou ${excess} casa(s) por excesso. Posição: ${piece.finalPos}.` };
    }
  }

  // ── Peão no percurso comum ──────────────────────────────────────────────────

  // Verifica bloqueio no caminho
  if (isPathBlocked(game, player, piece.pos, diceValue)) {
    // Peão não pode avançar; turno passa (sem jogada extra)
    game.extraTurn = false;
    return { success: false, extraTurn: false, captured: false, finished: false, message: `Caminho bloqueado por torre adversária. Peão ${pieceIndex} não pode avançar.` };
  }

  // Calcula posição relativa atual e futura
  const currentRelative = getRelativePos(piece.pos, player);
  const newRelative = currentRelative + diceValue;

  if (newRelative >= TOTAL_COMMON_SQUARES) {
    // Entra na reta final
    const stepsIntoFinal = newRelative - TOTAL_COMMON_SQUARES;
    piece.pos = null;
    piece.inFinalStretch = true;

    if (stepsIntoFinal >= FINAL_STRETCH_LENGTH) {
      // Passa o ponto final e recua (caso extremo na entrada)
      const excess = stepsIntoFinal - FINAL_STRETCH_LENGTH;
      piece.finalPos = FINAL_STRETCH_LENGTH - excess;
    } else if (stepsIntoFinal === FINAL_STRETCH_LENGTH) {
      piece.finalPos = FINAL_STRETCH_LENGTH;
      piece.finished = true;
      _checkVictory(game, player);
    } else {
      piece.finalPos = stepsIntoFinal;
    }

    const extraTurn = diceValue === 6;
    game.extraTurn = extraTurn;
    return {
      success: true,
      extraTurn,
      captured: false,
      finished: piece.finished,
      message: piece.finished
        ? `Peão ${pieceIndex} chegou ao ponto final pela reta final!`
        : `Peão ${pieceIndex} entrou na reta final na posição ${piece.finalPos}.`,
    };
  }

  // Avança no percurso comum
  const newAbsPos = (piece.pos + diceValue) % TOTAL_COMMON_SQUARES;
  piece.pos = newAbsPos;

  // Verifica captura
  captured = _captureAtPosition(game, player, newAbsPos);

  const extraTurn = diceValue === 6;
  game.extraTurn = extraTurn;

  return {
    success: true,
    extraTurn,
    captured,
    finished: false,
    message: captured
      ? `Peão ${pieceIndex} capturou um peão adversário na casa ${newAbsPos}!`
      : `Peão ${pieceIndex} avançou para a casa ${newAbsPos}.`,
  };
}

/**
 * Encerra o turno atual e passa para o próximo jogador (se não houver jogada extra).
 *
 * @param {object} game - estado do jogo (mutado)
 */
function endTurn(game) {
  if (game.winner) return;
  if (game.extraTurn) {
    game.extraTurn = false;
    return; // mantém o mesmo jogador
  }
  game.currentPlayer = getOpponent(game.currentPlayer);
}

/**
 * Verifica se o jogador atual não tem nenhuma jogada possível com o dado.
 * (todos os peões na base e dado ≠ 6, ou todos já chegaram)
 *
 * @param {object} game
 * @param {number} diceValue
 * @returns {boolean}
 */
function mustSkipTurn(game, diceValue) {
  const player = game.currentPlayer;
  const pieces = game.players[player].pieces;

  const hasActivePieces = pieces.some((p) => !p.inBase && !p.finished);
  const canLeaveBase = pieces.some((p) => p.inBase) && diceValue === 6;

  return !hasActivePieces && !canLeaveBase;
}

// ─── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Captura o peão adversário na posição indicada (se houver exatamente 1).
 * Retorna true se capturou, false caso contrário.
 */
function _captureAtPosition(game, attackingPlayer, pos) {
  const opponent = getOpponent(attackingPlayer);
  const opponentPieces = game.players[opponent].pieces.filter(
    (p) => !p.inBase && !p.inFinalStretch && !p.finished && p.pos === pos
  );

  if (opponentPieces.length === 1) {
    // Captura: retorna para a base
    opponentPieces[0].inBase = true;
    opponentPieces[0].pos = null;
    return true;
  }
  // 0 = ninguém para capturar; 2 = bloqueio, não captura
  return false;
}

/**
 * Checa se o jogador venceu (todos os 4 peões no ponto final).
 */
function _checkVictory(game, player) {
  const allFinished = game.players[player].pieces.every((p) => p.finished);
  if (allFinished) {
    game.winner = player;
  }
}

// ─── Exportações ───────────────────────────────────────────────────────────────

module.exports = {
  PLAYERS,
  START_POSITIONS,
  TOTAL_COMMON_SQUARES,
  FINAL_STRETCH_LENGTH,
  NUM_PIECES,
  createGame,
  createPiece,
  determineFirstPlayer,
  getOpponent,
  getRelativePos,
  isPathBlocked,
  movePieceFromBase,
  movePiece,
  endTurn,
  mustSkipTurn,
};
