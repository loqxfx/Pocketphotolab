const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const fileInput = document.getElementById('fileInput');
const emptyState = document.getElementById('emptyState');
const dropZone = document.getElementById('dropZone');
const imageStatus = document.getElementById('imageStatus');

const controlNames = ['exposure','contrast','highlights','shadows','temperature','saturation','vibrance'];
const defaults = Object.fromEntries(controlNames.map(name => [name, 0]));
let settings = {...defaults};
let originalImage = null;
let originalPixels = null;
let rotation = 0;
let showingOriginal = false;

const $ = id => document.getElementById(id);

function setEnabled(enabled) {
  ['compareBtn','resetBtn','downloadBtn','rotateLeft','rotateRight'].forEach(id => $(id).disabled = !enabled);
}

function loadFile(file) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) {
    alert('Please choose a JPG, PNG or WebP image.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      rotation = 0;
      settings = {...defaults};
      controlNames.forEach(name => { $(name).value = 0; updateOutput(name); });
      const maxSide = 2400;
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const source = document.createElement('canvas');
      source.width = w; source.height = h;
      source.getContext('2d').drawImage(img, 0, 0, w, h);
      originalPixels = source.getContext('2d', {willReadFrequently:true}).getImageData(0,0,w,h);
      emptyState.hidden = true;
      canvas.hidden = false;
      imageStatus.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
      setEnabled(true);
      render();
    };
    img.onerror = () => alert('That image could not be opened.');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function updateOutput(name) {
  const value = Number($(name).value);
  settings[name] = value;
  $(name + 'Value').textContent = value > 0 ? `+${value}` : `${value}`;
}

function render() {
  if (!originalPixels) return;
  const sourceW = originalPixels.width, sourceH = originalPixels.height;
  const sideways = Math.abs(rotation % 180) === 90;
  canvas.width = sideways ? sourceH : sourceW;
  canvas.height = sideways ? sourceW : sourceH;
  const work = document.createElement('canvas');
  work.width = sourceW; work.height = sourceH;
  const workCtx = work.getContext('2d', {willReadFrequently:true});
  workCtx.putImageData(originalPixels, 0, 0);
  const frame = workCtx.getImageData(0, 0, sourceW, sourceH);
  const data = frame.data;

  const exposure = Math.pow(2, settings.exposure / 100);
  const contrast = (settings.contrast / 100) * 0.75;
  const saturation = 1 + settings.saturation / 100;
  const vibrance = settings.vibrance / 100;
  const warmth = settings.temperature * 0.42;
  const highlight = settings.highlights / 100;
  const shadow = settings.shadows / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i+1], b = data[i+2];
    const lum = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
    const shadowWeight = Math.pow(1 - lum, 2);
    const highlightWeight = Math.pow(lum, 2);
    r = (r * exposure) + shadow * 65 * shadowWeight - highlight * 55 * highlightWeight;
    g = (g * exposure) + shadow * 65 * shadowWeight - highlight * 55 * highlightWeight;
    b = (b * exposure) + shadow * 65 * shadowWeight - highlight * 55 * highlightWeight;
    r += warmth; b -= warmth;
    const avg = (r + g + b) / 3;
    const satFactor = saturation + vibrance * (1 - Math.min(1, Math.abs(avg - (r+g+b)/3) / 128));
    r = avg + (r - avg) * satFactor;
    g = avg + (g - avg) * satFactor;
    b = avg + (b - avg) * satFactor;
    const c = 1 + contrast;
    r = (r - 128) * c + 128;
    g = (g - 128) * c + 128;
    b = (b - 128) * c + 128;
    data[i] = clamp(r); data[i+1] = clamp(g); data[i+2] = clamp(b);
  }
  workCtx.putImageData(frame, 0, 0);

  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.drawImage(work, -sourceW/2, -sourceH/2);
  ctx.restore();
}

function clamp(value) { return Math.max(0, Math.min(255, value)); }

controlNames.forEach(name => {
  $(name).addEventListener('input', () => {
    updateOutput(name);
    render();
  });
});

fileInput.addEventListener('change', event => loadFile(event.target.files[0]));

dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', event => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  loadFile(event.dataTransfer.files[0]);
});

$('resetBtn').addEventListener('click', () => {
  settings = {...defaults};
  controlNames.forEach(name => { $(name).value = 0; updateOutput(name); });
  rotation = 0;
  render();
});

$('rotateLeft').addEventListener('click', () => { rotation = (rotation + 270) % 360; render(); });
$('rotateRight').addEventListener('click', () => { rotation = (rotation + 90) % 360; render(); });

$('compareBtn').addEventListener('pointerdown', () => {
  if (!originalPixels) return;
  showingOriginal = true;
  const saved = settings;
  settings = {...defaults};
  render();
  settings = saved;
});
function stopCompare() {
  if (!showingOriginal) return;
  showingOriginal = false;
  render();
}
$('compareBtn').addEventListener('pointerup', stopCompare);
$('compareBtn').addEventListener('pointerleave', stopCompare);
$('compareBtn').addEventListener('pointercancel', stopCompare);

$('downloadBtn').addEventListener('click', () => {
  if (!originalPixels) return;
  const link = document.createElement('a');
  link.download = 'pocketphotolab-edit.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
