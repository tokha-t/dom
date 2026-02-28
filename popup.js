const COLS = 10;
const ROWS = 20;
const BLOCK = 24;

const boardCanvas = document.getElementById('board');
const ctx = boardCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartButton = document.getElementById('restart');

const colors = [
  null,
  '#00f0f0',
  '#f0f000',
  '#a000f0',
  '#00f000',
  '#f00000',
  '#0000f0',
  '#f0a000'
];

const SHAPES = [
  [],
  [[1, 1, 1, 1]],
  [[2, 2], [2, 2]],
  [[0, 3, 0], [3, 3, 3]],
  [[0, 4, 4], [4, 4, 0]],
  [[5, 5, 0], [0, 5, 5]],
  [[6, 0, 0], [6, 6, 6]],
  [[0, 0, 7], [7, 7, 7]]
];

let board = [];
let score = 0;
let dropCounter = 0;
let dropInterval = 600;
let lastTime = 0;
let gameOver = false;

const player = {
  x: 0,
  y: 0,
  matrix: null
};

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece() {
  const type = ((Math.random() * 7) | 0) + 1;
  return SHAPES[type].map((row) => [...row]);
}

function collide(arena, currentPlayer) {
  const matrix = currentPlayer.matrix;
  const offset = { x: currentPlayer.x, y: currentPlayer.y };

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] !== 0 && (arena[y + offset.y] && arena[y + offset.y][x + offset.x]) !== 0) {
        return true;
      }
    }
  }

  return false;
}

function merge(arena, currentPlayer) {
  currentPlayer.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + currentPlayer.y][x + currentPlayer.x] = value;
      }
    });
  });
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect((x + offset.x) * BLOCK, (y + offset.y) * BLOCK, BLOCK, BLOCK);
        ctx.strokeStyle = '#101010';
        ctx.strokeRect((x + offset.x) * BLOCK, (y + offset.y) * BLOCK, BLOCK, BLOCK);
      }
    });
  });
}

function draw() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  drawMatrix(board, { x: 0, y: 0 });

  if (!gameOver) {
    drawMatrix(player.matrix, { x: player.x, y: player.y });
    return;
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', boardCanvas.width / 2, boardCanvas.height / 2);
}

function rotate(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function playerRotate() {
  const previousX = player.x;
  player.matrix = rotate(player.matrix);

  let offset = 1;
  while (collide(board, player)) {
    player.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));

    if (offset > player.matrix[0].length) {
      player.matrix = rotate(rotate(rotate(player.matrix)));
      player.x = previousX;
      return;
    }
  }
}

function sweepRows() {
  let lines = 0;

  outer: for (let y = board.length - 1; y >= 0; y--) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }

    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    y++;
    lines++;
  }

  if (lines > 0) {
    score += lines * 100;
    scoreEl.textContent = String(score);
  }
}

function playerDrop() {
  player.y++;

  if (collide(board, player)) {
    player.y--;
    merge(board, player);
    sweepRows();
    playerReset();
  }

  dropCounter = 0;
}

function playerHardDrop() {
  while (!collide(board, player)) {
    player.y++;
  }

  player.y--;
  merge(board, player);
  sweepRows();
  playerReset();
  dropCounter = 0;
}

function playerMove(direction) {
  player.x += direction;

  if (collide(board, player)) {
    player.x -= direction;
  }
}

function playerReset() {
  player.matrix = createPiece();
  player.y = 0;
  player.x = ((COLS / 2) | 0) - ((player.matrix[0].length / 2) | 0);

  if (collide(board, player)) {
    gameOver = true;
  }
}

function resetGame() {
  board = createBoard();
  score = 0;
  dropCounter = 0;
  lastTime = 0;
  gameOver = false;
  scoreEl.textContent = '0';
  playerReset();
  draw();
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!gameOver) {
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }

  draw();
  requestAnimationFrame(update);
}

document.addEventListener('keydown', (event) => {
  if (gameOver) {
    if (event.key.toLowerCase() === 'r') {
      resetGame();
    }
    return;
  }

  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowDown') {
    playerDrop();
  } else if (event.key === 'ArrowUp') {
    playerRotate();
  } else if (event.code === 'Space') {
    event.preventDefault();
    playerHardDrop();
  }
});

restartButton.addEventListener('click', () => {
  resetGame();
});

resetGame();
update();
