import pThrottle from 'https://unpkg.com/p-throttle@5.0.0/index.js';

const MOVE_DISTANCE = 4;
const DIRECTIONS = Object.freeze(['left', 'right', 'up', 'down']);
const alpaca = document.querySelector('.alpaca');
const spawned = new Set();
const pieces = new Map();
const subscriberPieces = new Map();
const CURLING_PIECENAME = 'curl';
const curlingSound = new Audio('/assets/sounds/curling.m4a');
const confettiSound = new Audio('/assets/sounds/emojipalooza.m4a');
const confettiEmojis = [
  'ð',
  'ðĶ',
  'ðĐ',
  'ðĐ',
  'ð',
  'ð',
  'ð',
  'ðĪĄ',
  'ðĪ ',
  'ðĪĐ',
  'ðą',
  'ðĪŠ',
];

let jsConfetti;
let confettiCount = 0;

curlingSound.volume = 0.5;
confettiSound.volume = 0.5;

pieces.set('todd', createPiece('ðĶ'));
pieces.set('poop', createPiece('ðĐ'));
pieces.set('donut', createPiece('ðĐ'));

subscriberPieces.set(CURLING_PIECENAME, createPiece('ðĨ', true));
subscriberPieces.set('unicorn', createPiece('ðĶ', true));

function createPiece(text, subscriber = false) {
  const piece = Object.assign(document.createElement('div'), {
    className: `${text} ${subscriber ? 'subscriber--piece' : 'piece'}`,
    innerHTML: text,
  });

  return piece;
}

function moveX(distance, piece) {
  const currentXPosition =
    getComputedStyle(piece).getPropertyValue('--x-position');
  const newXPosition = `${parseInt(currentXPosition, 10) + distance}vw`;

  piece.style.setProperty('--x-position', newXPosition);
}

function moveY(distance, piece) {
  const currentYPosition =
    getComputedStyle(piece).getPropertyValue('--y-position');
  const newYPosition = `${parseInt(currentYPosition, 10) + distance}vh`;

  piece.style.setProperty('--y-position', newYPosition);
}

function movePiece({ piece, direction, flags, sound }) {
  const { subscriber = false } = flags;

  if (piece.classList.contains('subscriber--piece') && !subscriber) {
    console.log(
      'You are not a subscriber. This piece requires a subscription.',
    );

    return;
  }

  sound?.play();

  switch (direction) {
    case 'left':
      moveX(-MOVE_DISTANCE, piece);
      break;

    case 'right':
      moveX(MOVE_DISTANCE, piece);
      break;

    case 'down':
      moveY(MOVE_DISTANCE, piece);
      break;

    case 'up':
      moveY(-MOVE_DISTANCE, piece);
      break;

    default:
      break;
  }
}

function spawn(pieceName, flags = { subscriber: false }) {
  const { subscriber = false } = flags;

  if (!pieces.has(pieceName) && !subscriberPieces.has(pieceName)) {
    console.log(`There are no pieces that exist with the name ${pieceName}`);
    return null;
  }

  let piece = pieces.get(pieceName);

  if (!piece && subscriber) {
    piece = subscriberPieces.get(pieceName);
  }

  if (!piece) {
    console.log(
      'You are not a subscriber. This piece requires a subscription.',
    );

    return null;
  }

  if (spawned.has(piece)) {
    console.log(`The piece ${pieceName} has already been spawned`);
    return piece;
  }

  document.body.appendChild(piece);

  setTimeout(() => {
    piece.style.opacity = 1;
  }, 0);
  spawned.add(piece);

  return piece;
}

let alpacaTimeout = 0;

function handleAlpaca(command, timeout = 5000) {
  if (alpacaTimeout) {
    clearTimeout(alpacaTimeout);
  }

  switch (command) {
    case 'hide': {
      alpaca.classList.add('alpaca--hide');

      alpacaTimeout = setTimeout(() => {
        alpaca.classList.remove('alpaca--hide');
      }, timeout);
      break;
    }

    default:
      break;
  }
}

function getRandomEmoji() {
  return confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
}

const throttle = pThrottle({
  limit: 1,
  interval: 45000,
});

const confetti = throttle((flags = { subscriber: false }) => {
  confettiCount++;

  let confettiConfig = {
    confettiNumber: 50,
  };

  handleAlpaca('hide', 2300);

  if (flags.subscriber) {
    confettiSound.play();
    confettiConfig = {
      ...confettiConfig,
      emojis: confettiCount % 5 === 0 ? confettiEmojis : [getRandomEmoji()],
      emojiSize: 100,
      confettiNumber: confettiCount % 5 === 0 ? 150 : 50,
      confettiRadius: 20,
    };
  }

  jsConfetti.addConfetti(confettiConfig);
});

export function inializeChatInteractions() {
  const canvas = document.querySelector('.confetti');
  jsConfetti = new JSConfetti({ canvas });

  ComfyJS.onCommand = (user, command, message, flags, extra) => {
    const [pieceName, pieceCommand] = command.split('-');

    switch (pieceName) {
      case 'alpaca':
        handleAlpaca(pieceCommand);
        break;

      case 'confetti': {
        confetti(flags);
        break;
      }

      default: {
        const sound = pieceName === CURLING_PIECENAME ? curlingSound : null;
        const piece = spawn(pieceName, flags);

        if (!piece) {
          return;
        }

        if (pieceCommand == null || !DIRECTIONS.includes(pieceCommand)) {
          console.log(`There is no direction ${pieceCommand} defined.`);
          return;
        }

        movePiece({ piece, direction: pieceCommand, flags, sound });
        break;
      }
    }
  };

  ComfyJS.Init('nickytonline');
}
