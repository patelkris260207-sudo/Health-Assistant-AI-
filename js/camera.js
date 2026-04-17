/**
 * Health Assistant AI — Camera / Photo helper
 * Provides photo capture (camera) and photo upload from library,
 * then converts the image to a base64 data URL for GPT-4o vision.
 */

const Camera = (() => {
  let _currentDataUrl = null;
  let _stream = null;

  /* ── helpers ────────────────────────────────────────────────────── */
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function canvasToDataUrl(canvas, quality = 0.85) {
    return canvas.toDataURL('image/jpeg', quality);
  }

  /** Resize an image element to max 1024 px on longest side */
  function resizeImage(img, maxPx = 1024) {
    let { width, height } = img;
    if (width <= maxPx && height <= maxPx) {
      // no resize needed – draw directly
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      c.getContext('2d').drawImage(img, 0, 0);
      return canvasToDataUrl(c);
    }
    const ratio = Math.min(maxPx / width, maxPx / height);
    const c = document.createElement('canvas');
    c.width = Math.round(width * ratio);
    c.height = Math.round(height * ratio);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return canvasToDataUrl(c);
  }

  /* ── Public API ─────────────────────────────────────────────────── */
  return {
    get currentDataUrl() { return _currentDataUrl; },
    get hasImage() { return !!_currentDataUrl; },

    /** Open hidden file-input to pick image from library */
    openFilePicker() {
      const input = document.getElementById('photoFileInput');
      if (input) input.click();
    },

    /** Called when user selects a file from the input */
    async onFileSelected(file) {
      if (!file || !file.type.startsWith('image/')) return null;
      const dataUrl = await blobToDataUrl(file);
      return Camera._process(dataUrl);
    },

    /** Open the camera (live preview) */
    async openCamera() {
      const modal = document.getElementById('cameraModal');
      const video = document.getElementById('cameraVideo');
      if (!modal || !video) return;

      try {
        _stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        video.srcObject = _stream;
        modal.classList.add('active');
      } catch (err) {
        UI.showToast('Camera access denied. Please use the upload button instead.', 'error');
        console.error('Camera error:', err);
      }
    },

    /** Snap a frame from the live camera preview */
    captureFromCamera() {
      const video = document.getElementById('cameraVideo');
      if (!video) return null;
      const c = document.createElement('canvas');
      c.width = video.videoWidth || 640;
      c.height = video.videoHeight || 480;
      c.getContext('2d').drawImage(video, 0, 0);
      Camera.closeCamera();
      return Camera._process(canvasToDataUrl(c));
    },

    /** Stop the stream and close the camera modal */
    closeCamera() {
      const modal = document.getElementById('cameraModal');
      const video = document.getElementById('cameraVideo');
      if (_stream) {
        _stream.getTracks().forEach(t => t.stop());
        _stream = null;
      }
      if (video) video.srcObject = null;
      if (modal) modal.classList.remove('active');
    },

    /** Internal: load image into an off-screen element, resize, store */
    _process(dataUrl) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const resized = resizeImage(img);
          _currentDataUrl = resized;
          // Show preview thumbnail in the UI
          Camera._showPreview(resized);
          resolve(resized);
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    },

    /** Display a small thumbnail above the chat input */
    _showPreview(dataUrl) {
      const preview = document.getElementById('imagePreviewArea');
      if (!preview) return;
      preview.innerHTML = `
        <div class="img-preview-wrap">
          <img src="${dataUrl}" alt="Selected photo" class="img-preview-thumb" />
          <button class="img-remove-btn" id="removeImageBtn" title="Remove image">✕</button>
        </div>`;
      preview.style.display = 'block';
      document.getElementById('removeImageBtn')?.addEventListener('click', () => {
        Camera.clearImage();
      });
    },

    /** Remove the selected image */
    clearImage() {
      _currentDataUrl = null;
      const preview = document.getElementById('imagePreviewArea');
      if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
    },
  };
})();
