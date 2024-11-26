const spaceship = document.getElementById('spaceship');
const gameArea = document.getElementById('game-area');
const bestTimeElement = document.getElementById('best-time');
const timerElement = document.getElementById('timer');

let positionX = window.innerWidth / 2;
let positionY = window.innerHeight / 2;
const speed = 1; 
let isInvincible = false;
let spawnRate = 1000; // Initial asteroid spawn rate
let minSpawnRate = 300; // Minimum spawn rate based on screen size
let spawnRateDecrement = 50; // Decrease spawn rate per iteration
let asteroidMinSpeed = 5; // Minimum asteroid speed
let asteroidMaxSpeed = 10; // Maximum asteroid speed
let difficultyMultiplier = 1; // Reset during game resets

let gameRunning = false; // Tracks whether the game loop is active

let lastSpawn = 0; // Tracks time for asteroid spawning
let lastMove = 0; // Throttle for mousemove events
let asteroids = []; // Active asteroids
let spawnPaused = false; // Flag to pause spawning
let currentTime = 0;
let timerInterval;
let bestTime = localStorage.getItem('bestTime') ? parseInt(localStorage.getItem('bestTime')) : 0;

// Adjust minimum spawn rate based on screen size
function updateMinSpawnRate() {
  if (window.innerWidth <= 400){
    minSpawnRate = 500;
    asteroidMinSpeed = 2;
    asteroidMaxSpeed = 8;
  } 
  else if (window.innerWidth <= 500){
    minSpawnRate = 400;
    asteroidMinSpeed = 2;
    asteroidMaxSpeed = 8;
  } 
  else if (window.innerWidth <= 600){
    minSpawnRate = 300;
    asteroidMinSpeed = 2;
    asteroidMaxSpeed = 8;
  } 
  else if (window.innerWidth <= 800){
    minSpawnRate = 200;
    asteroidMinSpeed = 3;
    asteroidMaxSpeed = 9;
  } 
  else if (window.innerWidth <= 1200){
    minSpawnRate = 150;
    asteroidMinSpeed = 5;
    asteroidMaxSpeed = 15;
  }
  else{
    minSpawnRate = 50;
    asteroidMinSpeed = 10;
    asteroidMaxSpeed = 20;
  } 
}
updateMinSpawnRate();
window.addEventListener('resize', updateMinSpawnRate);

// Increment difficultyMultiplier during gameplay
setInterval(() => {
  difficultyMultiplier += 0.1; // Gradually increase speed
}, 5000); // Every 5 seconds


// Update spaceship position
function updatePosition() {
  // spaceship.style.transform = `translate(${positionX}px, ${positionY}px)`;
  spaceship.style.left = `${positionX}px`;
  spaceship.style.top = `${positionY}px`;
}

// Throttled mousemove handler
document.addEventListener('mousemove', (event) => {
  const now = Date.now();
  if (now - lastMove > 16) { // Throttle to ~60fps
    lastMove = now;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const gameAreaRect = gameArea.getBoundingClientRect();
    if (
      mouseX > gameAreaRect.left &&
      mouseX < gameAreaRect.right &&
      mouseY > gameAreaRect.top &&
      mouseY < gameAreaRect.bottom
    ) {
      positionX += (mouseX - positionX) * speed;
      positionY += (mouseY - positionY) * speed;
      updatePosition();
    }
  }
});

// Function to create an asteroid
function createAsteroid() {
  const asteroid = document.createElement('div');
  asteroid.classList.add('asteroid');
  asteroid.style.left = `${Math.random() * gameArea.offsetWidth}px`;
  asteroid.style.top = `-50px`;
  gameArea.appendChild(asteroid);

  const speed = Math.random() * (asteroidMaxSpeed - asteroidMinSpeed) + asteroidMinSpeed;   // Use the speed range for asteroid speed
  let asteroidSpeed = speed * difficultyMultiplier;
  asteroids.push({ element: asteroid, asteroidSpeed});
}

// Move asteroids
function moveAsteroids() {
  asteroids = asteroids.filter(({ element, asteroidSpeed }) => {
    const top = parseFloat(element.style.top) + asteroidSpeed;
    if (top > gameArea.offsetHeight) {
      element.remove();
      return false;
    }
    element.style.top = `${top}px`;
    return true;
  });
}

// Check collisions
function checkCollisions() {
  if (isInvincible) return; // Skip collision detection if invincible
  const spaceshipRect = spaceship.getBoundingClientRect();
  asteroids.forEach(({ element }) => {
    const asteroidRect = element.getBoundingClientRect();
    if (
      !isInvincible &&
      spaceshipRect.left < asteroidRect.right &&
      spaceshipRect.right > asteroidRect.left &&
      spaceshipRect.top < asteroidRect.bottom &&
      spaceshipRect.bottom > asteroidRect.top
    ) {
      handleCollision(element);
    }
  });
}

// Handle collision
function handleCollision(asteroid) {
  asteroid.remove();
  createExplosion();

  // Pause asteroid spawning for 3 seconds
  spawnPaused = true;
  setTimeout(() => {
    spawnPaused = false;
  }, 3000);

  resetGame();
}

// Create explosion effect
function createExplosion() {
  const explosion = document.createElement('div');
  explosion.classList.add('explosion');
  explosion.style.left = `${positionX}px`;
  explosion.style.top = `${positionY}px`;

  // explosion.style.transform = `translate(${positionX}px, ${positionY}px)`;
  gameArea.appendChild(explosion);
  setTimeout(() => explosion.remove(), 1000);
}

// Update and display timer
function updateTimer() {
  currentTime++;

      // Convert currentTime to hours, minutes, and seconds
      const hours = Math.floor(currentTime / 3600);
      const minutes = Math.floor((currentTime % 3600) / 60);
      const seconds = currentTime % 60;
  
      // Format the timer display
      const timeString = hours > 0
        ? `Time: ${hours}h ${minutes}m ${seconds}s`
        : minutes > 0
        ? `Time: ${minutes}m ${seconds}s`
        : `Time: ${seconds}s`;
  
  timerElement.textContent = timeString;
  if (currentTime > bestTime) {
    bestTime = currentTime;
    localStorage.setItem('bestTime', bestTime);
  }
    // Convert bestTime to hours, minutes, and seconds
    const hoursBest = Math.floor(bestTime / 3600);
    const minutesBest = Math.floor((bestTime % 3600) / 60);
    const secondsBest = bestTime % 60;
  
    // Format the best time display
    const bestTimeString = hoursBest > 0
      ? `Best Time: ${hoursBest}h ${minutesBest}m ${secondsBest}s`
      : minutesBest > 0
      ? `Best Time: ${minutesBest}m ${secondsBest}s`
      : `Best Time: ${secondsBest}s`;
  
  bestTimeElement.textContent = bestTimeString;
}

// Reset game state
function resetGame() {
  clearInterval(timerInterval);
  gameRunning = false;

  // Temporarily disable collisions and spawning
  isInvincible = true;
  spawnPaused = true;

  // Continue moving asteroids off-screen
  const moveAsteroidsUntilClear = setInterval(() => {
    moveAsteroids();
    if (asteroids.length === 0) {
      clearInterval(moveAsteroidsUntilClear); // Stop once all asteroids are cleared
    }
  }, 16); // Move at ~60fps


  currentTime = 0;
  spaceship.style.display = 'none';
  spawnRate = 1000;
  difficultyMultiplier = 1; // Reset the difficulty multiplier
  
  setTimeout(() => {
    isInvincible = true;
    spaceship.style.display = 'block';
    spaceship.classList.add('invincible');
    // End invincibility after 3 seconds
    setTimeout(() => {
      isInvincible = false;
      spaceship.classList.remove('invincible');
    }, 3000);
    startGame();
  }, 3000);
}

// Game loop
function gameLoop(timestamp) {
  if (!gameRunning) return; // Stop the loop if the game isn't running
  // Only spawn asteroids if spawning is not paused
  if (!spawnPaused && timestamp - lastSpawn > spawnRate) {
    createAsteroid();
    lastSpawn = timestamp;
    if (spawnRate > minSpawnRate) spawnRate -= spawnRateDecrement;
  }
  moveAsteroids();
  checkCollisions();
  requestAnimationFrame(gameLoop);
}


// Start the timer
function startTimer() {
  currentTime = 0;
  timerInterval = setInterval(updateTimer, 1000);
}

// Start the game
function startGame() {
  gameRunning = true;

  startTimer();
  requestAnimationFrame(gameLoop);
}

// Initialize position and start the game
document.addEventListener('DOMContentLoaded', () => {
  updatePosition();
  startGame();
});
