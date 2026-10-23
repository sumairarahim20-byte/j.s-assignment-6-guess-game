
/* ==========================================
   PIXEL ARCADE - GAME LOGIC
   Events + Functions + DOM Manipulation
   ========================================== */

// 1. DOM ELEMENTS

const screens = document.querySelectorAll(".screen");

const startButton = document.getElementById("start-button");
const levelCards = document.querySelectorAll(".level-card");

const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");

const feedbackBox = document.getElementById("feedback-box");
const feedbackMessage = document.getElementById("feedback-message");
const inputError = document.getElementById("input-error");

const attemptsLeftElement = document.getElementById("attempts-left");
const currentScoreElement = document.getElementById("current-score");

const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const progressTrack = document.getElementById("progress-track");

const highScoreElement = document.getElementById("high-score");

const currentLevelBadge = document.getElementById("current-level-badge");
const rangeInstruction = document.getElementById("range-instruction");

const resultCard = document.getElementById("result-card");
const resultIcon = document.getElementById("result-icon");
const resultEyebrow = document.getElementById("result-eyebrow");
const resultTitle = document.getElementById("result-title");
const resultMessage = document.getElementById("result-message");

const revealedNumber = document.getElementById("revealed-number");
const finalScoreElement = document.getElementById("final-score");
const guessesUsedElement = document.getElementById("guesses-used");
const resultHighScoreElement = document.getElementById("result-high-score");
const newRecordMessage = document.getElementById("new-record-message");

const playAgainButton = document.getElementById("play-again-button");
const resultLevelButton = document.getElementById("result-level-button");
const changeLevelButton = document.getElementById("change-level-button");

const toast = document.getElementById("toast");


// 2. GAME CONFIGURATION

const LEVELS = {
  easy: {
    name: "EASY",
    min: 1,
    max: 20,
    attempts: 10,
    bonus: 100
  },

  medium: {
    name: "MEDIUM",
    min: 1,
    max: 100,
    attempts: 7,
    bonus: 250
  },

  hard: {
    name: "HARD",
    min: 1,
    max: 500,
    attempts: 8,
    bonus: 500
  }
};


// 3. GAME STATE

let currentLevel = null;
let secretNumber = null;
let attemptsLeft = 0;
let attemptsUsed = 0;
let currentScore = 0;
let gameOver = false;
let previousGuesses = new Set();


// 4. HIGH SCORE STORAGE

const STORAGE_KEY = "pixelArcadeHighScore";

function getHighScore() {
  try {
    const savedScore = Number(localStorage.getItem(STORAGE_KEY));

    if (!Number.isFinite(savedScore) || savedScore < 0) {
      return 0;
    }

    return savedScore;
  } catch (error) {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (error) {
    // The game can still run if browser storage is unavailable.
  }
}

function updateHighScoreDisplay() {
  highScoreElement.textContent = getHighScore();
}


// 5. SCREEN NAVIGATION

function showScreen(screenId) {
  screens.forEach((screen) => {
    const isActive = screen.id === screenId;

    screen.classList.toggle("active", isActive);
    screen.hidden = !isActive;
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(showToast.timer);

  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


// 6. START A NEW GAME

function startGame(levelKey) {
  if (!Object.hasOwn(LEVELS, levelKey)) {
    showToast("Please select a valid difficulty level.");
    return;
  }

  currentLevel = LEVELS[levelKey];

  // Generate a random integer inside the selected range.
  secretNumber =
    Math.floor(Math.random() * (currentLevel.max - currentLevel.min + 1))
    + currentLevel.min;

  attemptsLeft = currentLevel.attempts;
  attemptsUsed = 0;
  currentScore = 0;
  gameOver = false;

  previousGuesses.clear();

  guessInput.min = currentLevel.min;
  guessInput.max = currentLevel.max;
  guessInput.value = "";
  guessInput.placeholder = "?";

  currentLevelBadge.textContent = `${currentLevel.name} MODE`;

  rangeInstruction.textContent =
    `Guess a number between ${currentLevel.min} and ${currentLevel.max}.`;

  attemptsLeftElement.textContent = attemptsLeft;
  currentScoreElement.textContent = currentScore;

  inputError.textContent = "";

  updateProgress();
  setFeedback(
    "💡",
    "Your first guess starts here. Good luck!",
    ""
  );

  updateHighScoreDisplay();
  showScreen("game-screen");

  guessInput.focus();
}


// 7. UPDATE GAME FEEDBACK

function setFeedback(icon, message, type) {
  const iconElement = feedbackBox.querySelector(".feedback-icon");

  iconElement.textContent = icon;
  feedbackMessage.textContent = message;

  feedbackBox.classList.remove(
    "feedback-low",
    "feedback-high",
    "feedback-correct",
    "feedback-error"
  );

  if (type) {
    feedbackBox.classList.add(`feedback-${type}`);
  }
}


// 8. UPDATE ATTEMPT PROGRESS

function updateProgress() {
  const totalAttempts = currentLevel.attempts;

  const percentage = (attemptsUsed / totalAttempts) * 100;

  progressFill.style.width = `${percentage}%`;

  progressText.textContent =
    `${attemptsUsed} / ${totalAttempts}`;

  progressTrack.setAttribute("aria-valuemax", totalAttempts);
  progressTrack.setAttribute("aria-valuenow", attemptsUsed);

  attemptsLeftElement.textContent = attemptsLeft;
  currentScoreElement.textContent = currentScore;
}


// 9. CALCULATE SCORE

function calculateScore() {
  const remainingBonus = attemptsLeft * 50;

  return currentLevel.bonus + remainingBonus;
}


// 10. HANDLE A GUESS

function handleGuess(event) {
  event.preventDefault();

  if (gameOver || !currentLevel) {
    return;
  }

  const rawValue = guessInput.value.trim();

  if (rawValue === "") {
    showInputError("Please enter a number first.");
    return;
  }

  const guess = Number(rawValue);

  if (!Number.isInteger(guess)) {
    showInputError("Please enter a whole number.");
    return;
  }

  if (guess < currentLevel.min || guess > currentLevel.max) {
    showInputError(
      `Choose a number from ${currentLevel.min} to ${currentLevel.max}.`
    );
    return;
  }

  if (previousGuesses.has(guess)) {
    showInputError("You already tried this number. Try another!");
    return;
  }

  inputError.textContent = "";

  previousGuesses.add(guess);
  attemptsUsed++;
  attemptsLeft--;

  // Correct guess
  if (guess === secretNumber) {
    currentScore = calculateScore();

    updateProgress();
    setFeedback(
      "🏆",
      "CORRECT! You cracked the secret number!",
      "correct"
    );

    endGame(true);
    return;
  }

  // Incorrect guess
  if (guess < secretNumber) {
    setFeedback(
      "⬆️",
      "Too Low! Try a HIGHER number.",
      "low"
    );
  } else {
    setFeedback(
      "⬇️",
      "Too High! Try a LOWER number.",
      "high"
    );
  }

  updateProgress();

  // No attempts remaining
  if (attemptsLeft === 0) {
    endGame(false);
    return;
  }

  guessInput.value = "";
  guessInput.focus();
}

function showInputError(message) {
  inputError.textContent = message;

  setFeedback("⚠️", message, "error");
}


// 11. END GAME

function endGame(won) {
  gameOver = true;

  guessInput.disabled = true;

  const previousHighScore = getHighScore();
  let isNewRecord = false;

  if (won && currentScore > previousHighScore) {
    saveHighScore(currentScore);
    isNewRecord = true;
  }

  updateHighScoreDisplay();

  resultCard.classList.toggle("is-lose", !won);

  if (won) {
    resultIcon.textContent = isNewRecord ? "🏆" : "🎉";
    resultEyebrow.textContent = "LEVEL COMPLETE";
    resultTitle.textContent = isNewRecord ? "NEW RECORD!" : "YOU DID IT!";

    resultMessage.textContent =
      `Amazing! You guessed the number in ${attemptsUsed} ` +
      `${attemptsUsed === 1 ? "attempt" : "attempts"}.`;

    playSound("win");
  } else {
    resultIcon.textContent = "👾";
    resultEyebrow.textContent = "GAME OVER";
    resultTitle.textContent = "NICE TRY!";
    resultMessage.textContent =
      "Don't give up! Learn from this round and try again.";

    playSound("lose");
  }

  revealedNumber.textContent = secretNumber;
  finalScoreElement.textContent = currentScore;
  guessesUsedElement.textContent = attemptsUsed;
  resultHighScoreElement.textContent = getHighScore();

  newRecordMessage.hidden = !isNewRecord;

  playAgainButton.textContent = won
    ? "↻ PLAY AGAIN"
    : "↻ TRY AGAIN";

  showScreen("result-screen");
}


// 12. SOUND EFFECTS

function playSound(type) {
  // Sound is optional. The game still works if audio is unavailable.
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  let audioContext;

  try {
    audioContext = new AudioContextClass();
  } catch (error) {
    return;
  }

  const notes = type === "win"
    ? [523.25, 659.25, 783.99]
    : [392, 329.63, 261.63];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = frequency;

    const startTime = audioContext.currentTime + index * 0.13;

    gain.gain.setValueAtTime(0.045, startTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + 0.12
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.12);
  });

  window.setTimeout(() => {
    audioContext.close().catch(() => {});
  }, 700);
}


// 13. RESET INPUT WHEN STARTING AGAIN

function resetGameInput() {
  guessInput.disabled = false;
  guessInput.value = "";
  inputError.textContent = "";
}


// 14. EVENT LISTENERS

startButton.addEventListener("click", () => {
  showScreen("level-screen");
});

levelCards.forEach((card) => {
  card.addEventListener("click", () => {
    resetGameInput();
    startGame(card.dataset.level);
  });
});

guessForm.addEventListener("submit", handleGuess);

changeLevelButton.addEventListener("click", () => {
  resetGameInput();
  showScreen("level-screen");
});

resultLevelButton.addEventListener("click", () => {
  resetGameInput();
  showScreen("level-screen");
});

playAgainButton.addEventListener("click", () => {
  if (!currentLevel) {
    showScreen("level-screen");
    return;
  }

  resetGameInput();

  const selectedLevel = Object.keys(LEVELS).find(
    (key) => LEVELS[key] === currentLevel
  );

  startGame(selectedLevel);
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.back === "welcome"
      ? "welcome-screen"
      : "level-screen");
  });
});


// 15. INITIALIZE THE GAME

updateHighScoreDisplay();
showScreen("welcome-screen");
