// tictactoe.js — Xs and Os in the terminal
// Single player: you are X, the computer is O
// Run with:  node tictactoe.js
// Requires Node 18+ (no npm packages needed)

const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");

// ---------- Game state ----------
// The board is just an array of 9 cells: index 0–8.
// We show players the numbers 1–9 because humans don't count from zero.
let board = Array(9).fill(null);
let currentPlayer = "X";

// Every way to win: 3 rows, 3 columns, 2 diagonals
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

// ---------- Colours (ANSI escape codes) ----------
const color = {
  X: (s) => `\x1b[36m${s}\x1b[0m`,   // cyan
  O: (s) => `\x1b[35m${s}\x1b[0m`,   // magenta
  dim: (s) => `\x1b[2m${s}\x1b[0m`,  // faded grey
};

// ---------- Drawing ----------
function cell(i) {
  const value = board[i];
  if (value) return color[value](value);
  return color.dim(String(i + 1)); // empty cell shows its number
}

function drawBoard() {
  console.clear();
  console.log("\n  TIC-TAC-TOE  (type 1–9, or q to quit)\n");
  console.log(`   ${cell(0)} | ${cell(1)} | ${cell(2)}`);
  console.log("  ---+---+---");
  console.log(`   ${cell(3)} | ${cell(4)} | ${cell(5)}`);
  console.log("  ---+---+---");
  console.log(`   ${cell(6)} | ${cell(7)} | ${cell(8)}\n`);
}

// ---------- Rules ----------
function getWinner() {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw() {
  return board.every((spot) => spot !== null);
}

// ---------- Computer player (O) ----------
// A simple strategy, checked in order:
//   1. If I can win this turn, do it.
//   2. If X is about to win, block it.
//   3. Take the centre.
//   4. Take a corner.
//   5. Take whatever is left.
function findWinningMove(player) {
  for (const [a, b, c] of WIN_LINES) {
    const line = [board[a], board[b], board[c]];
    const mine = line.filter((v) => v === player).length;
    const empty = line.filter((v) => v === null).length;
    if (mine === 2 && empty === 1) {
      return [a, b, c][line.indexOf(null)];
    }
  }
  return null;
}

function randomFrom(options) {
  const free = options.filter((i) => board[i] === null);
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function computerMove() {
  return (
    findWinningMove("O") ??          // 1. win
    findWinningMove("X") ??          // 2. block
    (board[4] === null ? 4 : null) ?? // 3. centre
    randomFrom([0, 2, 6, 8]) ??      // 4. corner
    randomFrom([1, 3, 5, 7])         // 5. anything left
  );
}

// A short pause so it feels like the computer is "thinking"
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Main game loop ----------
async function play() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    drawBoard();

    let index;
    if (currentPlayer === "O") {
      // Computer's turn
      console.log(`  Computer (${color.O("O")}) is thinking...`);
      await pause(700);
      index = computerMove();
    } else {
      // Human's turn
      const answer = await rl.question(`  Your turn (${color.X("X")}), pick a square: `);
      if (answer.trim().toLowerCase() === "q") break;
      index = Number(answer) - 1;
    }

    // Validate the move
    if (!Number.isInteger(index) || index < 0 || index > 8) {
      await rl.question("  That's not 1–9. Press Enter to try again.");
      continue;
    }
    if (board[index]) {
      await rl.question("  That square is taken. Press Enter to try again.");
      continue;
    }

    // Make the move
    board[index] = currentPlayer;

    // Check for the end of the game
    const winner = getWinner();
    if (winner || isDraw()) {
      drawBoard();
      if (winner === "X") console.log("  🎉 You win!\n");
      else if (winner === "O") console.log("  🤖 The computer wins!\n");
      else console.log("  It's a draw!\n");

      const again = await rl.question("  Play again? (y/n): ");
      if (again.trim().toLowerCase() !== "y") break;
      board = Array(9).fill(null);
      currentPlayer = "X";
      continue;
    }

    // Switch turns
    currentPlayer = currentPlayer === "X" ? "O" : "X";
  }

  console.log("\n  Thanks for playing!\n");
  rl.close();
}

play();