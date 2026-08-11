const SOURCES = {
  nasa: {
    name: 'NASA',
    license: 'Public domain',
    note: 'NASA imagery is generally public domain. Some images may carry specific credit or usage notes.',
    images: [
      { title: 'Pillars of Creation', url: 'https://images-assets.nasa.gov/image/PIA22915/PIA22915~orig.jpg' },
      { title: 'Earth from Apollo 17', url: 'https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~orig.jpg' },
      { title: 'Jupiter by Juno', url: 'https://images-assets.nasa.gov/image/PIA25017/PIA25017~orig.jpg' }
    ]
  },
  smithsonian: {
    name: 'Smithsonian',
    license: 'Open Access / CC0',
    note: 'These selections are from Smithsonian Open Access and are marked for unrestricted reuse.',
    images: [
      { title: 'Butterfly plate', url: 'https://ids.si.edu/ids/deliveryService?id=CHSDM-1928-39-97MattFlynn&max=1600' },
      { title: 'Botanical art', url: 'https://ids.si.edu/ids/deliveryService?id=NASM-A19751733000-NASM2018-10730&max=1600' }
    ]
  },
  wikimedia: {
    name: 'Wikimedia',
    license: 'Public domain selections',
    note: 'Selected public-domain works from Wikimedia Commons. Individual file licenses are shown by Wikimedia.',
    images: [
      { title: 'Irises by Van Gogh', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Irises-Vincent_van_Gogh.jpg' },
      { title: 'The Great Wave', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Tsunami_by_hokusai_19th_century.jpg' }
    ]
  }
};

const DIFFICULTIES = [
  { pieces: 4, rows: 2, cols: 2, label: '4', name: 'Easy' },
  { pieces: 9, rows: 3, cols: 3, label: '9', name: 'Relaxed' },
  { pieces: 16, rows: 4, cols: 4, label: '16', name: 'Classic' },
  { pieces: 25, rows: 5, cols: 5, label: '25', name: 'Challenge' }
];

const $ = (id) => document.getElementById(id);
const state = {
  source: 'nasa',
  image: SOURCES.nasa.images[0],
  difficulty: DIFFICULTIES[1],
  pieces: [],
  selectedIndex: null,
  moves: 0,
  startedAt: 0,
  deferredInstall: null,
  generatedImages: []
};

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createShuffledPieces(total) {
  let order = shuffle(Array.from({ length: total }, (_, correct) => ({ correct })));
  // Do not let a new puzzle accidentally start already solved.
  while (order.every((piece, index) => piece.correct === index)) order = shuffle(order);
  return order;
}

function isSolved() {
  return state.pieces.length > 0 && state.pieces.every((piece, index) => piece.correct === index);
}

function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function renderSources() {
  const sourceTabs = $('sourceTabs');
  sourceTabs.innerHTML = '';
  Object.entries(SOURCES).forEach(([key, source]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `source-tab${state.source === key ? ' active' : ''}`;
    button.textContent = source.name;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(state.source === key));
    button.addEventListener('click', () => {
      state.source = key;
      state.image = SOURCES[key].images[0];
      renderSetup();
    });
    sourceTabs.appendChild(button);
  });
}

function renderImages() {
  const grid = $('imageGrid');
  grid.innerHTML = '';
  SOURCES[state.source].images.forEach((image) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `image-choice${state.image.url === image.url ? ' selected' : ''}`;
    button.setAttribute('aria-label', `Choose ${image.title}`);
    button.innerHTML = `<img loading="lazy" src="${image.url}" alt="${image.title}"><span>${image.title}</span><b class="check" aria-hidden="true">✓</b>`;
    button.addEventListener('click', () => {
      state.image = image;
      renderImages();
    });
    grid.appendChild(button);
  });
}

function renderDifficulties() {
  const grid = $('difficultyGrid');
  grid.innerHTML = '';
  DIFFICULTIES.forEach((difficulty) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `difficulty${state.difficulty.pieces === difficulty.pieces ? ' selected' : ''}`;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(state.difficulty.pieces === difficulty.pieces));
    button.innerHTML = `<strong>${difficulty.label} pieces</strong><small>${difficulty.name}</small>`;
    button.addEventListener('click', () => {
      state.difficulty = difficulty;
      renderDifficulties();
    });
    grid.appendChild(button);
  });
}

function renderSetup() {
  renderSources();
  $('sourceNote').textContent = SOURCES[state.source].note;
  $('sourceLicense').textContent = SOURCES[state.source].license;
  renderImages();
  renderDifficulties();
}

function pieceBackground(piece) {
  const row = Math.floor(piece.correct / state.difficulty.cols);
  const col = piece.correct % state.difficulty.cols;
  const x = state.difficulty.cols === 1 ? 0 : (col / (state.difficulty.cols - 1)) * 100;
  const y = state.difficulty.rows === 1 ? 0 : (row / (state.difficulty.rows - 1)) * 100;
  return `background-image:url("${state.image.url}");background-size:${state.difficulty.cols * 100}% ${state.difficulty.rows * 100}%;background-position:${x}% ${y}%;`;
}

function renderBoard() {
  const board = $('board');
  board.style.gridTemplateColumns = `repeat(${state.difficulty.cols}, minmax(0, 1fr))`;
  board.innerHTML = '';

  state.pieces.forEach((piece, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'piece';
    if (state.selectedIndex === index) button.classList.add('selected');
    if (piece.correct === index) button.classList.add('correct');
    button.style.cssText = pieceBackground(piece);
    button.dataset.index = String(index);
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `Piece ${index + 1} of ${state.pieces.length}`);
    button.draggable = true;

    button.addEventListener('click', () => selectPiece(index));
    button.addEventListener('dragstart', (event) => {
      state.selectedIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
      renderBoard();
    });
    button.addEventListener('dragover', (event) => event.preventDefault());
    button.addEventListener('drop', (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer.getData('text/plain'));
      swapPieces(from, index);
    });
    board.appendChild(button);
  });

  const correct = state.pieces.filter((piece, index) => piece.correct === index).length;
  $('progressText').textContent = `${correct} / ${state.pieces.length}`;
  $('winPanel').classList.toggle('hidden', !isSolved());
}

function selectPiece(index) {
  if (isSolved()) return;
  if (state.selectedIndex === null) {
    state.selectedIndex = index;
    $('instruction').textContent = 'Now choose another piece to swap.';
    renderBoard();
    return;
  }
  if (state.selectedIndex === index) {
    state.selectedIndex = null;
    $('instruction').textContent = 'Tap a piece, then tap another piece to swap them.';
    renderBoard();
    return;
  }
  swapPieces(state.selectedIndex, index);
}

function swapPieces(first, second) {
  if (!Number.isInteger(first) || !Number.isInteger(second) || first < 0 || second < 0 || first >= state.pieces.length || second >= state.pieces.length || first === second) return;
  [state.pieces[first], state.pieces[second]] = [state.pieces[second], state.pieces[first]];
  state.selectedIndex = null;
  state.moves += 1;
  $('instruction').textContent = 'Tap a piece, then tap another piece to swap them.';
  renderBoard();

  if (isSolved()) {
    const elapsed = formatTime(Date.now() - state.startedAt);
    $('winDetails').textContent = `${state.moves} ${state.moves === 1 ? 'move' : 'moves'} · ${elapsed}`;
    $('instruction').textContent = 'You completed the picture.';
  }
}

function startPuzzle() {
  state.pieces = createShuffledPieces(state.difficulty.pieces);
  state.selectedIndex = null;
  state.moves = 0;
  state.startedAt = Date.now();
  $('setupScreen').classList.add('hidden');
  $('playScreen').classList.remove('hidden');
  $('pageTitle').textContent = 'Your puzzle';
  $('playTitle').textContent = state.image.title;
  $('winPanel').classList.add('hidden');
  $('instruction').textContent = 'Tap a piece, then tap another piece to swap them.';
  renderBoard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function returnToPictures() {
  $('playScreen').classList.add('hidden');
  $('setupScreen').classList.remove('hidden');
  $('pageTitle').textContent = 'Choose a picture';
  state.selectedIndex = null;
}

function shuffleCurrentPuzzle() {
  if (!state.pieces.length || isSolved()) {
    startPuzzle();
    return;
  }
  state.pieces = shuffle(state.pieces);
  while (isSolved()) state.pieces = shuffle(state.pieces);
  state.selectedIndex = null;
  state.moves += 1;
  $('instruction').textContent = 'The pieces have been shuffled. Tap a piece to begin.';
  renderBoard();
}

function openSettings() {
  $('settingsModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('geminiKey').focus();
}

function closeSettings() {
  $('settingsModal').classList.add('hidden');
  document.body.style.overflow = '';
  $('settingsMessage').textContent = '';
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

async function generateWithGemini() {
  const key = $('geminiKey').value.trim();
  const prompt = $('promptInput').value.trim();
  const message = $('settingsMessage');
  const button = $('generateButton');

  if (!key) {
    message.textContent = 'Please enter your Gemini API key.';
    return;
  }
  if (!prompt) {
    message.textContent = 'Please describe the picture you want.';
    return;
  }

  button.disabled = true;
  message.textContent = 'Creating your picture…';
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Create a family-friendly, puzzle-friendly image based on this request: ${prompt}` }] }],
        generationConfig: { responseModalities: ['IMAGE'] }
      })
    });

    if (!response.ok) {
      let detail = '';
      try { detail = (await response.json())?.error?.message || ''; } catch (_) { /* response may not be JSON */ }
      throw new Error(detail || `Gemini returned HTTP ${response.status}.`);
    }

    const data = await response.json();
    const part = data?.candidates?.flatMap((candidate) => candidate?.content?.parts || [])?.find((item) => item?.inlineData?.data);
    if (!part) throw new Error('Gemini did not return an image. Try a different description.');

    const generated = {
      title: 'My generated picture',
      url: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`
    };
    state.generatedImages.push(generated);
    state.image = generated;
    localStorage.setItem('pocketPuzzlesGeminiKey', key);
    message.textContent = 'Picture created. Starting your puzzle…';
    setTimeout(() => {
      closeSettings();
      startPuzzle();
    }, 450);
  } catch (error) {
    message.textContent = error?.message || 'The picture could not be created right now.';
  } finally {
    button.disabled = false;
  }
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.deferredInstall = event;
    $('installButton').classList.remove('hidden');
  });

  $('installButton').addEventListener('click', async () => {
    if (!state.deferredInstall) return;
    state.deferredInstall.prompt();
    await state.deferredInstall.userChoice;
    state.deferredInstall = null;
    $('installButton').classList.add('hidden');
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('./sw.js', document.baseURI)).catch(() => {
      // Offline caching is optional; the game still works without it.
    });
  });
}

function init() {
  $('geminiKey').value = localStorage.getItem('pocketPuzzlesGeminiKey') || '';

  $('startButton').addEventListener('click', startPuzzle);
  $('backButton').addEventListener('click', returnToPictures);
  $('newPuzzleButton').addEventListener('click', startPuzzle);
  $('shuffleButton').addEventListener('click', shuffleCurrentPuzzle);
  $('settingsButton').addEventListener('click', openSettings);
  $('closeSettingsButton').addEventListener('click', closeSettings);
  $('doneSettingsButton').addEventListener('click', closeSettings);
  $('generateButton').addEventListener('click', generateWithGemini);
  $('settingsModal').addEventListener('click', (event) => {
    if (event.target.matches('[data-close-settings]')) closeSettings();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('settingsModal').classList.contains('hidden')) closeSettings();
  });

  renderSetup();
  setupInstallPrompt();
  registerServiceWorker();
}

init();
