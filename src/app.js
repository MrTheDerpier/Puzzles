const SOURCES = {
  nasa: { label: 'NASA space', note: 'NASA images are generally public domain unless credited otherwise.', images: [
    { title: 'Pillars of Creation', url: 'https://images-assets.nasa.gov/image/PIA22915/PIA22915~orig.jpg' },
    { title: 'Earth from Apollo 17', url: 'https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~orig.jpg' },
    { title: 'Jupiter by Juno', url: 'https://images-assets.nasa.gov/image/PIA25017/PIA25017~orig.jpg' }
  ]},
  smithsonian: { label: 'Smithsonian Open Access', note: 'Open Access media marked CC0 by the Smithsonian.', images: [
    { title: 'Butterfly plate', url: 'https://ids.si.edu/ids/deliveryService?id=CHSDM-1928-39-97MattFlynn&max=1200' },
    { title: 'Botanical art', url: 'https://ids.si.edu/ids/deliveryService?id=NASM-A19751733000-NASM2018-10730&max=1200' }
  ]},
  wikimedia: { label: 'Wikimedia public domain', note: 'Selected public-domain/CC0 files from Wikimedia Commons.', images: [
    { title: 'Van Gogh Irises', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Irises-Vincent_van_Gogh.jpg' },
    { title: 'Hokusai wave', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Tsunami_by_hokusai_19th_century.jpg' }
  ]}
};
const DIFFICULTIES = [{ label: '4 pieces', rows: 2, cols: 2 }, { label: '9 pieces', rows: 3, cols: 3 }, { label: '16 pieces', rows: 4, cols: 4 }, { label: '25 pieces', rows: 5, cols: 5 }];
const $ = id => document.getElementById(id);
let source = 'nasa', selected = SOURCES.nasa.images[0], difficulty = DIFFICULTIES[1], pieces = [], dragged = null, deferredPrompt = null;
function shuffle(items) { const arr = [...items]; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function renderSetup() {
  $('sourceSelect').innerHTML = Object.entries(SOURCES).map(([key, value]) => `<option value="${key}">${value.label}</option>`).join('');
  $('sourceSelect').value = source; $('sourceNote').textContent = SOURCES[source].note;
  $('imageGrid').innerHTML = SOURCES[source].images.map((img, index) => `<button class="thumb ${selected.url === img.url ? 'selected' : ''}" data-index="${index}"><img src="${img.url}" alt=""><span>${img.title}</span></button>`).join('');
  $('imageGrid').querySelectorAll('button').forEach(button => button.addEventListener('click', () => { selected = SOURCES[source].images[Number(button.dataset.index)]; renderSetup(); }));
  $('difficultySelect').innerHTML = DIFFICULTIES.map(d => `<option>${d.label}</option>`).join(''); $('difficultySelect').value = difficulty.label;
}
function pieceStyle(piece) { const row = Math.floor(piece.correct / difficulty.cols), col = piece.correct % difficulty.cols; const x = difficulty.cols === 1 ? 0 : (col / (difficulty.cols - 1)) * 100; const y = difficulty.rows === 1 ? 0 : (row / (difficulty.rows - 1)) * 100; return `background-image:url('${selected.url}');background-size:${difficulty.cols * 100}% ${difficulty.rows * 100}%;background-position:${x}% ${y}%`; }
function renderBoard() {
  $('board').style.gridTemplateColumns = `repeat(${difficulty.cols}, 1fr)`;
  $('board').innerHTML = pieces.map((piece, index) => `<button class="piece" style="${pieceStyle(piece)}" draggable="true" data-index="${index}" aria-label="Puzzle piece ${index + 1}"></button>`).join('');
  $('board').querySelectorAll('button').forEach(button => {
    const index = Number(button.dataset.index);
    button.addEventListener('dragstart', () => dragged = index);
    button.addEventListener('dragover', event => event.preventDefault());
    button.addEventListener('drop', () => swap(dragged, index));
    button.addEventListener('click', () => { if (dragged === null) dragged = index; else { swap(dragged, index); dragged = null; } });
  });
  $('win').classList.toggle('hidden', pieces.length === 0 || !pieces.every((piece, index) => piece.correct === index));
}
function start(image = selected) { selected = image; const total = difficulty.rows * difficulty.cols; pieces = shuffle(Array.from({ length: total }, (_, correct) => ({ id: crypto.randomUUID(), correct }))); $('setup').classList.add('hidden'); $('play').classList.remove('hidden'); $('message').textContent = ''; renderBoard(); }
function swap(from, to) { if (from === null || to === null || from === to) return; [pieces[from], pieces[to]] = [pieces[to], pieces[from]]; renderBoard(); }
async function generateWithGemini() {
  const key = $('geminiKey').value.trim(), prompt = $('prompt').value.trim();
  if (!key) { $('message').textContent = 'Add your Gemini API key first.'; return; }
  if (!prompt) { $('message').textContent = 'Type an image idea first.'; return; }
  $('generateButton').disabled = true; $('generateButton').textContent = 'Creating...'; $('message').textContent = 'Creating your image...';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) });
    if (!response.ok) throw new Error('Gemini image generation was not available.');
    const data = await response.json(); const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    if (!part) throw new Error('No image was returned. Try a simpler prompt.');
    localStorage.setItem('geminiKey', key); $('modal').classList.add('hidden'); start({ title: 'My generated puzzle', url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
  } catch (error) { $('message').textContent = error.message || 'Could not create an image right now.'; }
  finally { $('generateButton').disabled = false; $('generateButton').textContent = '✨ Generate puzzle'; }
}
$('sourceSelect').addEventListener('change', e => { source = e.target.value; selected = SOURCES[source].images[0]; renderSetup(); });
$('difficultySelect').addEventListener('change', e => difficulty = DIFFICULTIES.find(d => d.label === e.target.value));
$('startButton').addEventListener('click', () => start()); $('shuffleButton').addEventListener('click', () => start()); $('picturesButton').addEventListener('click', () => { $('play').classList.add('hidden'); $('setup').classList.remove('hidden'); });
$('settingsButton').addEventListener('click', () => $('modal').classList.remove('hidden')); $('closeModal').addEventListener('click', () => $('modal').classList.add('hidden')); $('generateButton').addEventListener('click', generateWithGemini); $('geminiKey').value = localStorage.getItem('geminiKey') || '';
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; $('installButton').classList.remove('hidden'); }); $('installButton').addEventListener('click', () => deferredPrompt?.prompt());
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
renderSetup();
