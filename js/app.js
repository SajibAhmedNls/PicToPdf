/**
 * Image to PDF Maker
 * Pure JavaScript + PDF-Lib + SortableJS
 */

// Application State
const state = {
  images: [], // List of { id, file, dataUrl, name, size, naturalWidth, naturalHeight, rotation }
  settings: {
    pageSize: 'A4',       // 'A4', 'LETTER', 'FIT'
    orientation: 'portrait', // 'portrait', 'landscape', 'auto'
    margin: 18,            // 0, 18, 36 (points)
    quality: 1.0,          // 1.0, 0.8, 0.6
    fileName: 'converted-document'
  }
};

// Standard Dimensions in points (72 pt = 1 inch)
const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612.00, height: 792.00 }
};

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const workspace = document.getElementById('workspace');
const imageGrid = document.getElementById('imageGrid');
const imageCount = document.getElementById('imageCount');
const addMoreBtn = document.getElementById('addMoreBtn');
const headerAddMoreBtn = document.getElementById('headerAddMoreBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const convertBtn = document.getElementById('convertBtn');
const pageSizeSelect = document.getElementById('pageSize');
const qualitySelect = document.getElementById('imageQuality');
const qualityText = document.getElementById('qualityText');
const pdfFileNameInput = document.getElementById('pdfFileName');
const progressModal = document.getElementById('progressModal');
const progressStatus = document.getElementById('progressStatus');
const progressBarFill = document.getElementById('progressBarFill');
const progressPercent = document.getElementById('progressPercent');

// Crop Modal DOM Elements
const cropModal = document.getElementById('cropModal');
const cropperImage = document.getElementById('cropperImage');
const cropImageName = document.getElementById('cropImageName');
const cancelCropHeaderBtn = document.getElementById('cancelCropHeaderBtn');
const cancelCropBtn = document.getElementById('cancelCropBtn');
const applyCropBtn = document.getElementById('applyCropBtn');
const autoCropDetectBtn = document.getElementById('autoCropDetectBtn');
const resetCropBtn = document.getElementById('resetCropBtn');
const cropRatioButtons = document.querySelectorAll('.crop-ratio-btn');

// PDF Preview Modal Elements
const previewBtn = document.getElementById('previewBtn');
const pdfPreviewModal = document.getElementById('pdfPreviewModal');
const pdfPreviewPagesContainer = document.getElementById('pdfPreviewPagesContainer');
const previewFileNameText = document.getElementById('previewFileNameText');
const previewPageCountBadge = document.getElementById('previewPageCountBadge');
const previewOpenNewTabBtn = document.getElementById('previewOpenNewTabBtn');
const previewModalDownloadBtn = document.getElementById('previewModalDownloadBtn');
const closePdfPreviewBtn = document.getElementById('closePdfPreviewBtn');
const successPreviewBtn = document.getElementById('successPreviewBtn');

let sortableInstance = null;
let cropperInstance = null;
let activeCropImage = null;
let currentPdfBlobUrl = null;
let currentPdfFileName = 'converted-document.pdf';
let currentPreviewPages = [];
let downloadSuccessTimer = null;

// Hide success modal & clear auto-close timer
function hideSuccessModal() {
  if (downloadSuccessTimer) {
    clearTimeout(downloadSuccessTimer);
    downloadSuccessTimer = null;
  }
  const modalLoadingState = document.getElementById('modalLoadingState');
  const modalSuccessState = document.getElementById('modalSuccessState');
  const successModalTitle = document.getElementById('successModalTitle');
  const successModalSubtitle = document.getElementById('successModalSubtitle');

  progressModal.classList.add('hidden');
  if (modalLoadingState) modalLoadingState.classList.remove('hidden');
  if (modalSuccessState) modalSuccessState.classList.add('hidden');
  if (successModalTitle) successModalTitle.textContent = 'PDF Created Successfully!';
  if (successModalSubtitle) successModalSubtitle.textContent = 'Your PDF is ready to download or review.';
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initSortable();
  lucide.createIcons();
});

// Event Listeners Setup
function setupEventListeners() {
  // File Input Change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      fileInput.value = ''; // Reset input to allow selecting same files
    }
  });

  // Drag and Drop on dropZone
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      handleFiles(Array.from(dt.files));
    }
  });

  // Add More buttons
  addMoreBtn.addEventListener('click', () => fileInput.click());
  headerAddMoreBtn.addEventListener('click', () => fileInput.click());

  // Clear All
  clearAllBtn.addEventListener('click', () => {
    if (state.images.length === 0) return;
    if (confirm('Are you sure you want to remove all uploaded images?')) {
      state.images = [];
      updateWorkspaceView();
    }
  });

  // Settings: Page Size
  pageSizeSelect.addEventListener('change', (e) => {
    state.settings.pageSize = e.target.value;
  });

  // Settings: Orientation Buttons
  const orientationButtons = document.querySelectorAll('.orientation-btn');
  orientationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      orientationButtons.forEach(b => {
        b.classList.remove('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
        b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
      });
      btn.classList.add('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
      btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-600');
      state.settings.orientation = btn.dataset.orientation;
    });
  });

  // Settings: Margin Buttons
  const marginButtons = document.querySelectorAll('.margin-btn');
  marginButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      marginButtons.forEach(b => {
        b.classList.remove('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
        b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
      });
      btn.classList.add('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
      btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-600');
      state.settings.margin = parseInt(btn.dataset.margin, 10);
    });
  });

  // Settings: Quality
  qualitySelect.addEventListener('change', (e) => {
    state.settings.quality = parseFloat(e.target.value);
    const texts = {
      '1.0': 'Original (100%)',
      '0.8': 'Medium (~80%)',
      '0.6': 'Small (~60%)'
    };
    qualityText.textContent = texts[e.target.value] || '';
  });

  // Settings: File Name
  pdfFileNameInput.addEventListener('input', (e) => {
    state.settings.fileName = e.target.value.trim() || 'converted-document';
  });

  // Convert Button
  convertBtn.addEventListener('click', generatePdf);

  // Crop Modal Event Listeners
  cancelCropHeaderBtn.addEventListener('click', closeCropModal);
  cancelCropBtn.addEventListener('click', closeCropModal);
  applyCropBtn.addEventListener('click', applyCrop);
  autoCropDetectBtn.addEventListener('click', performAutoCrop);
  resetCropBtn.addEventListener('click', () => {
    if (cropperInstance) cropperInstance.reset();
  });

  cropRatioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      cropRatioButtons.forEach(b => {
        b.classList.remove('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
        b.classList.add('border-slate-200', 'bg-white', 'text-slate-600');
      });
      btn.classList.add('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
      btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-600');

      const ratio = parseFloat(btn.dataset.ratio);
      if (cropperInstance) {
        cropperInstance.setAspectRatio(ratio);
      }
    });
  });

  // PDF Preview Event Listeners
  if (previewBtn) previewBtn.addEventListener('click', reviewPdf);
  if (closePdfPreviewBtn) closePdfPreviewBtn.addEventListener('click', closePdfPreview);
  if (successPreviewBtn) {
    successPreviewBtn.addEventListener('click', () => {
      hideSuccessModal();
      if (currentPdfBlobUrl) {
        openPdfPreview(currentPdfBlobUrl, currentPdfFileName, currentPreviewPages);
      }
    });
  }
}

// Handle File Additions
async function handleFiles(files) {
  const validFiles = files.filter(f => f.type.startsWith('image/'));
  
  if (validFiles.length === 0) {
    alert('Please select valid image files (JPG, PNG, WebP, BMP).');
    return;
  }

  for (const file of validFiles) {
    const dataUrl = await readFileAsDataUrl(file);
    const { width, height } = await getImageDimensions(dataUrl);

    state.images.push({
      id: 'img_' + Math.random().toString(36).substring(2, 9),
      file: file,
      dataUrl: dataUrl,
      name: file.name,
      size: file.size,
      naturalWidth: width,
      naturalHeight: height,
      rotation: 0
    });
  }

  updateWorkspaceView();
}

// Read File as Data URL
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Get Image Dimensions
function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = dataUrl;
  });
}

// Initialize SortableJS
function initSortable() {
  sortableInstance = new Sortable(imageGrid, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.image-card-drag-handle',
    delay: 120, // Prevents unintended drag during touch scroll on mobile
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    onEnd: () => {
      // Synchronize state.images array with new DOM order
      const newOrderIds = Array.from(imageGrid.children).map(card => card.dataset.id);
      state.images.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
      updatePageBadges();
    }
  });
}

// Update Workspace View
function updateWorkspaceView() {
  const count = state.images.length;
  imageCount.textContent = count;

  if (count === 0) {
    dropZone.classList.remove('hidden');
    workspace.classList.add('hidden');
    headerAddMoreBtn.classList.add('hidden');
    headerAddMoreBtn.classList.remove('inline-flex');
  } else {
    dropZone.classList.add('hidden');
    workspace.classList.remove('hidden');
    workspace.classList.add('flex');
    headerAddMoreBtn.classList.remove('hidden');
    headerAddMoreBtn.classList.add('inline-flex');
  }

  renderImageCards();
}

// Render Image Cards into Grid
function renderImageCards() {
  imageGrid.innerHTML = '';

  state.images.forEach((img, index) => {
    const card = document.createElement('div');
    card.className = 'image-card bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group relative';
    card.dataset.id = img.id;

    // Format file size
    const sizeKB = (img.size / 1024).toFixed(0);

    card.innerHTML = `
      <!-- Drag Handle & Thumbnail Container -->
      <div class="image-card-drag-handle relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-1.5 sm:p-2">
        <img 
          src="${img.dataUrl}" 
          alt="${img.name}" 
          class="thumbnail-img max-w-full max-h-full object-contain pointer-events-none drop-shadow-sm" 
          style="transform: rotate(${img.rotation}deg);"
        >
        <!-- Page Number Badge -->
        <span class="page-badge absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-slate-900/75 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm pointer-events-none">
          Page ${index + 1}
        </span>

        <!-- Drag Hint Overlay on hover -->
        <div class="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <i data-lucide="move" class="w-5 h-5 text-white drop-shadow-md"></i>
        </div>
      </div>

      <!-- Footer Info & Actions -->
      <div class="p-2 sm:p-2.5 flex flex-col justify-between border-t border-slate-100 bg-white gap-1.5">
        <div class="flex items-center justify-between gap-1 min-w-0">
          <p class="text-xs font-medium text-slate-700 truncate" title="${img.name}">${img.name}</p>
          <span class="text-[10px] text-slate-400 shrink-0">${sizeKB} KB</span>
        </div>

        <div class="flex items-center justify-end gap-1 shrink-0 pt-1 border-t border-slate-100/75">
          <!-- Crop Button -->
          <button 
            type="button" 
            class="crop-btn flex-1 sm:flex-initial p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 active:bg-brand-100 flex items-center justify-center transition" 
            title="Crop Image (Manual & Auto)"
          >
            <i data-lucide="crop" class="w-3.5 h-3.5"></i>
          </button>

          <!-- Rotate Button -->
          <button 
            type="button" 
            class="rotate-btn flex-1 sm:flex-initial p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 active:bg-brand-100 flex items-center justify-center transition" 
            title="Rotate 90° Clockwise"
          >
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
          </button>
          
          <!-- Delete Button -->
          <button 
            type="button" 
            class="delete-btn flex-1 sm:flex-initial p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100 flex items-center justify-center transition" 
            title="Remove Image"
          >
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    // Crop Handler
    const cropBtn = card.querySelector('.crop-btn');
    cropBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCropModal(img);
    });

    // Rotate Handler
    const rotateBtn = card.querySelector('.rotate-btn');
    rotateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      img.rotation = (img.rotation + 90) % 360;
      const thumb = card.querySelector('.thumbnail-img');
      thumb.style.transform = `rotate(${img.rotation}deg)`;
    });

    // Delete Handler
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.images = state.images.filter(item => item.id !== img.id);
      updateWorkspaceView();
    });

    imageGrid.appendChild(card);
  });

  lucide.createIcons();
}

// Update Page Badges without re-rendering everything
function updatePageBadges() {
  const cards = imageGrid.querySelectorAll('.image-card');
  cards.forEach((card, index) => {
    const badge = card.querySelector('.page-badge');
    if (badge) {
      badge.textContent = `Page ${index + 1}`;
    }
  });
}

// ==========================================
// Image Cropper Logic (Manual & Auto Crop)
// ==========================================

function openCropModal(imgItem) {
  activeCropImage = imgItem;
  cropImageName.textContent = imgItem.name;

  // If image already has a rotation applied, bake it into an offscreen canvas first
  // so the user crops exactly the rotated view they see in the preview card
  if (imgItem.rotation !== 0) {
    const rotImg = new Image();
    rotImg.onload = () => {
      const rotCanvas = document.createElement('canvas');
      const rotCtx = rotCanvas.getContext('2d');
      const rot = imgItem.rotation;

      if (rot === 90 || rot === 270) {
        rotCanvas.width = rotImg.naturalHeight;
        rotCanvas.height = rotImg.naturalWidth;
      } else {
        rotCanvas.width = rotImg.naturalWidth;
        rotCanvas.height = rotImg.naturalHeight;
      }

      rotCtx.save();
      rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rotCtx.rotate((rot * Math.PI) / 180);
      rotCtx.drawImage(rotImg, -rotImg.naturalWidth / 2, -rotImg.naturalHeight / 2);
      rotCtx.restore();

      initCropperWithSource(rotCanvas.toDataURL('image/jpeg', 0.95));
    };
    rotImg.src = imgItem.dataUrl;
  } else {
    initCropperWithSource(imgItem.dataUrl);
  }
}

function initCropperWithSource(srcUrl) {
  cropperImage.src = srcUrl;
  cropModal.classList.remove('hidden');

  // Reset aspect ratio buttons to Free
  cropRatioButtons.forEach(btn => {
    btn.classList.remove('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
    btn.classList.add('border-slate-200', 'bg-white', 'text-slate-600');
    if (btn.dataset.ratio === 'NaN') {
      btn.classList.add('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
      btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-600');
    }
  });

  if (cropperInstance) {
    cropperInstance.destroy();
  }

  cropperInstance = new Cropper(cropperImage, {
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.95,
    restore: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    ready() {
      lucide.createIcons();
    }
  });

  lucide.createIcons();
}

function closeCropModal() {
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  cropModal.classList.add('hidden');
  activeCropImage = null;
}

// Auto Crop Algorithm: Detects border/background edges and bounds content
function performAutoCrop() {
  if (!cropperInstance) return;

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Sample border pixels along edges to find predominant background color
    let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
    const samplePoints = [
      [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
      [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
      [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)]
    ];

    samplePoints.forEach(([x, y]) => {
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      aSum += data[idx + 3];
    });

    const bgR = Math.round(rSum / samplePoints.length);
    const bgG = Math.round(gSum / samplePoints.length);
    const bgB = Math.round(bSum / samplePoints.length);
    const bgA = Math.round(aSum / samplePoints.length);

    // Color tolerance
    const tolerance = 25;

    function isBackground(idx) {
      const a = data[idx + 3];
      if (bgA < 15 && a < 15) return true; // transparent
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return Math.abs(r - bgR) <= tolerance &&
             Math.abs(g - bgG) <= tolerance &&
             Math.abs(b - bgB) <= tolerance;
    }

    let minY = height, maxY = 0, minX = width, maxX = 0;
    let foundAny = false;

    // Scan top to bottom
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        if (!isBackground(idx)) {
          minY = y;
          foundAny = true;
          break;
        }
      }
      if (foundAny) break;
    }

    // Scan bottom to top
    foundAny = false;
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        if (!isBackground(idx)) {
          maxY = y;
          foundAny = true;
          break;
        }
      }
      if (foundAny) break;
    }

    // Scan left to right
    foundAny = false;
    for (let x = 0; x < width; x++) {
      for (let y = minY; y <= maxY; y += 2) {
        const idx = (y * width + x) * 4;
        if (!isBackground(idx)) {
          minX = x;
          foundAny = true;
          break;
        }
      }
      if (foundAny) break;
    }

    // Scan right to left
    foundAny = false;
    for (let x = width - 1; x >= 0; x--) {
      for (let y = minY; y <= maxY; y += 2) {
        const idx = (y * width + x) * 4;
        if (!isBackground(idx)) {
          maxX = x;
          foundAny = true;
          break;
        }
      }
      if (foundAny) break;
    }

    // Add safe padding
    const padding = 8;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);

    const detectedW = maxX - minX;
    const detectedH = maxY - minY;

    if (detectedW > 40 && detectedH > 40 && (detectedW < width - 10 || detectedH < height - 10)) {
      // Set Free aspect ratio
      cropperInstance.setAspectRatio(NaN);
      cropRatioButtons.forEach(btn => {
        btn.classList.remove('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
        btn.classList.add('border-slate-200', 'bg-white', 'text-slate-600');
        if (btn.dataset.ratio === 'NaN') {
          btn.classList.add('active', 'border-brand-500', 'bg-brand-50', 'text-brand-700');
          btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-600');
        }
      });

      cropperInstance.setData({
        x: minX,
        y: minY,
        width: detectedW,
        height: detectedH
      });
    } else {
      alert('Auto Crop: No distinct border or margins found on this image.');
    }
  };
  img.src = cropperImage.src;
}

// Apply Crop
function applyCrop() {
  if (!cropperInstance || !activeCropImage) return;

  const croppedCanvas = cropperInstance.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  });

  if (!croppedCanvas) {
    alert('Could not crop image. Please adjust selection.');
    return;
  }

  const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.95);

  activeCropImage.dataUrl = croppedDataUrl;
  activeCropImage.naturalWidth = croppedCanvas.width;
  activeCropImage.naturalHeight = croppedCanvas.height;
  activeCropImage.rotation = 0; // rotation is now baked in
  activeCropImage.size = Math.round((croppedDataUrl.length * 3) / 4);

  renderImageCards();
  closeCropModal();
}

// Helper: Convert Data URL to Uint8Array
function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Process Image (Rotate, Compress, and Render to Offscreen Canvas)
function processImage(imgItem, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const rot = imgItem.rotation || 0;

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        // Handle orientation swap for 90 and 270 degrees
        if (rot === 90 || rot === 270) {
          canvas.width = h;
          canvas.height = w;
        } else {
          canvas.width = w;
          canvas.height = h;
        }

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(img, -w / 2, -h / 2);
        ctx.restore();

        // Convert canvas to JPEG Uint8Array
        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            if (!blob) {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              const bytes = dataUrlToUint8Array(dataUrl);
              resolve({ bytes, width: canvas.width, height: canvas.height, canvas });
              return;
            }
            blob.arrayBuffer().then(buffer => {
              resolve({
                bytes: new Uint8Array(buffer),
                width: canvas.width,
                height: canvas.height,
                canvas
              });
            }).catch(reject);
          }, 'image/jpeg', quality);
        } else {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const bytes = dataUrlToUint8Array(dataUrl);
          resolve({ bytes, width: canvas.width, height: canvas.height, canvas });
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image: ' + (imgItem.name || 'image')));
    img.src = imgItem.dataUrl;
  });
}

// Build PDF Document (Shared by Download & Preview)
async function buildPdfDoc(progressCallback) {
  if (state.images.length === 0) {
    alert('Please upload at least one image first.');
    return null;
  }

  if (typeof PDFLib === 'undefined' || !PDFLib.PDFDocument) {
    alert('PDF Engine (PDF-Lib) is still loading. Please check your internet connection or reload the page.');
    return null;
  }

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();

  const totalImages = state.images.length;
  const { pageSize, orientation, margin, quality, fileName } = state.settings;
  const previewPages = [];

  for (let i = 0; i < totalImages; i++) {
    const imgItem = state.images[i];
    const percent = Math.round(((i + 1) / totalImages) * 85);
    if (progressCallback) {
      progressCallback(percent, `Processing Page ${i + 1} of ${totalImages}...`);
    }

    // 1. Process image on canvas (applies rotation & quality compression)
    const processed = await processImage(imgItem, quality);

    // 2. Embed into PDF-Lib as JPEG
    const embeddedImage = await pdfDoc.embedJpg(processed.bytes);

    // 3. Determine Page Dimensions & Orientation
    let pageWidth, pageHeight;
    let formatInfo = pageSize;

    if (pageSize === 'FIT') {
      pageWidth = processed.width;
      pageHeight = processed.height;
      formatInfo = `${Math.round(pageWidth)} × ${Math.round(pageHeight)} px`;
    } else {
      const standard = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
      let isLandscape = false;

      if (orientation === 'landscape') {
        isLandscape = true;
      } else if (orientation === 'portrait') {
        isLandscape = false;
      } else if (orientation === 'auto') {
        isLandscape = processed.width > processed.height;
      }

      if (isLandscape) {
        pageWidth = Math.max(standard.width, standard.height);
        pageHeight = Math.min(standard.width, standard.height);
        formatInfo = `${pageSize} Landscape`;
      } else {
        pageWidth = Math.min(standard.width, standard.height);
        pageHeight = Math.max(standard.width, standard.height);
        formatInfo = `${pageSize} Portrait`;
      }
    }

    // 4. Calculate dimensions and centering inside margins
    const effectiveMargin = pageSize === 'FIT' ? 0 : margin;
    const availWidth = Math.max(10, pageWidth - (2 * effectiveMargin));
    const availHeight = Math.max(10, pageHeight - (2 * effectiveMargin));

    const scale = Math.min(availWidth / processed.width, availHeight / processed.height);
    const drawWidth = processed.width * scale;
    const drawHeight = processed.height * scale;

    const posX = effectiveMargin + (availWidth - drawWidth) / 2;
    const posY = effectiveMargin + (availHeight - drawHeight) / 2;

    // 5. Add Page and Draw Image
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: posX,
      y: posY,
      width: drawWidth,
      height: drawHeight,
    });

    // 6. Generate Page Preview Image for Full Multi-Page Viewer
    try {
      const pCanvas = document.createElement('canvas');
      const maxDim = 1100;
      const pScale = Math.min(2, maxDim / Math.max(pageWidth, pageHeight));
      pCanvas.width = Math.round(pageWidth * pScale);
      pCanvas.height = Math.round(pageHeight * pScale);
      const pCtx = pCanvas.getContext('2d');

      // White paper
      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

      // Centered image
      const pDrawX = posX * pScale;
      const pDrawY = (effectiveMargin + (availHeight - drawHeight) / 2) * pScale;
      const pDrawW = drawWidth * pScale;
      const pDrawH = drawHeight * pScale;

      if (processed.canvas) {
        pCtx.drawImage(processed.canvas, pDrawX, pDrawY, pDrawW, pDrawH);
      }

      previewPages.push({
        pageNum: i + 1,
        formatInfo: formatInfo,
        dataUrl: pCanvas.toDataURL('image/jpeg', 0.9),
        width: pageWidth,
        height: pageHeight
      });
    } catch (err) {
      console.warn('Page preview error on page ' + (i + 1), err);
    }
  }

  if (progressCallback) {
    progressCallback(95, 'Compiling and saving PDF file...');
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const finalFileName = (fileName.trim() || 'converted-document') + '.pdf';

  currentPdfBlobUrl = downloadUrl;
  currentPdfFileName = finalFileName;
  currentPreviewPages = previewPages;

  return { pdfBytes, blob, downloadUrl, fileName: finalFileName, previewPages };
}

// PDF Generation
async function generatePdf() {
  const modalLoadingState = document.getElementById('modalLoadingState');
  const modalSuccessState = document.getElementById('modalSuccessState');
  const manualDownloadBtn = document.getElementById('manualDownloadBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const successModalTitle = document.getElementById('successModalTitle');
  const successModalSubtitle = document.getElementById('successModalSubtitle');

  // Reset modal state to loading
  if (modalLoadingState) modalLoadingState.classList.remove('hidden');
  if (modalSuccessState) modalSuccessState.classList.add('hidden');
  if (successModalTitle) successModalTitle.textContent = 'PDF Created Successfully!';
  if (successModalSubtitle) successModalSubtitle.textContent = 'Your PDF is ready to download or review.';
  progressModal.classList.remove('hidden');

  try {
    showProgress(0, `Starting PDF generation...`);
    const result = await buildPdfDoc((percent, msg) => showProgress(percent, msg));
    if (!result) {
      hideProgress();
      return;
    }

    // Switch modal to success state (NO automatic download!)
    if (modalLoadingState) modalLoadingState.classList.add('hidden');
    if (modalSuccessState) modalSuccessState.classList.remove('hidden');
    lucide.createIcons();

    // Hook Download button in the popup: ONLY download when user clicks this!
    if (manualDownloadBtn) {
      manualDownloadBtn.onclick = () => {
        // 1. Download file
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
        }, 200);

        // 2. Change text to "Download Successful!"
        if (successModalTitle) successModalTitle.textContent = 'Download Successful!';
        if (successModalSubtitle) successModalSubtitle.textContent = 'Your PDF has been saved successfully.';
      };
    }

    // Setup manual close handler
    if (closeModalBtn) {
      closeModalBtn.onclick = hideSuccessModal;
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF: ' + (error.message || error));
    hideProgress();
  }
}

// PDF Review / Preview Feature
async function reviewPdf() {
  const modalLoadingState = document.getElementById('modalLoadingState');
  const modalSuccessState = document.getElementById('modalSuccessState');

  if (modalLoadingState) modalLoadingState.classList.remove('hidden');
  if (modalSuccessState) modalSuccessState.classList.add('hidden');
  progressModal.classList.remove('hidden');

  try {
    showProgress(0, `Preparing PDF for preview...`);
    const result = await buildPdfDoc((percent, msg) => showProgress(percent, msg));
    hideProgress();
    if (!result) return;

    openPdfPreview(result.downloadUrl, result.fileName, result.previewPages);
  } catch (error) {
    console.error('Error preparing PDF review:', error);
    alert('Error preparing PDF review: ' + (error.message || error));
    hideProgress();
  }
}

function openPdfPreview(url, fileName, pages = []) {
  if (previewFileNameText) previewFileNameText.textContent = fileName;
  if (previewModalDownloadBtn) {
    previewModalDownloadBtn.href = url;
    previewModalDownloadBtn.download = fileName;
  }
  if (previewOpenNewTabBtn) {
    previewOpenNewTabBtn.href = url;
  }
  if (previewPageCountBadge) {
    const count = pages.length;
    previewPageCountBadge.textContent = `${count} Page${count > 1 ? 's' : ''}`;
  }

  const container = document.getElementById('pdfPreviewPagesContainer');
  if (container) {
    container.innerHTML = '';

    if (pages && pages.length > 0) {
      pages.forEach((page) => {
        const pageCard = document.createElement('div');
        pageCard.className = 'w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-750 shrink-0';

        pageCard.innerHTML = `
          <div class="px-3.5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 font-semibold select-none">
            <span class="flex items-center gap-1.5">
              <i data-lucide="file-text" class="w-3.5 h-3.5 text-brand-600"></i>
              <span>Page ${page.pageNum} of ${pages.length}</span>
            </span>
            <span class="text-[11px] font-medium text-slate-400">${page.formatInfo || ''}</span>
          </div>
          <div class="w-full bg-slate-50 flex items-center justify-center p-2.5 sm:p-4">
            <img 
              src="${page.dataUrl}" 
              alt="Page ${page.pageNum}" 
              class="w-full h-auto max-w-full block rounded shadow-xs border border-slate-200" 
              loading="lazy"
            >
          </div>
        `;
        container.appendChild(pageCard);
      });

      // Bottom download helper card
      const footerCard = document.createElement('div');
      footerCard.className = 'w-full max-w-xl py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-white text-xs select-none';
      footerCard.innerHTML = `
        <span class="text-slate-400 text-xs">All ${pages.length} page(s) ready to download</span>
        <a href="${url}" download="${fileName}" class="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 font-semibold rounded-lg shadow-md flex items-center justify-center gap-1.5 transition">
          <i data-lucide="download" class="w-3.5 h-3.5"></i> Download PDF
        </a>
      `;
      container.appendChild(footerCard);

      // Scroll to top
      container.scrollTop = 0;
    } else {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-300">
          <p class="text-sm">No preview pages available.</p>
        </div>
      `;
    }
  }

  if (pdfPreviewModal) pdfPreviewModal.classList.remove('hidden');
  lucide.createIcons();
}

function closePdfPreview() {
  if (pdfPreviewModal) pdfPreviewModal.classList.add('hidden');
  const container = document.getElementById('pdfPreviewPagesContainer');
  if (container) container.innerHTML = '';
}

// Progress Modal Controls
function showProgress(percent, message) {
  progressModal.classList.remove('hidden');
  progressStatus.textContent = message;
  progressBarFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
}

function hideProgress() {
  progressModal.classList.add('hidden');
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
}
