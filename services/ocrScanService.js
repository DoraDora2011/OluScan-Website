(function attachOcrScanService() {
  const config = window.OLUSCAN_API_CONFIG;

  function loadImageFromBlob(fileOrBlob) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(fileOrBlob);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("image_load_failed"));
      };

      image.src = objectUrl;
    });
  }

  async function fileToDataUrl(fileOrBlob) {
    const image = await loadImageFromBlob(fileOrBlob);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas_unavailable");
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  async function extractIngredientsFromFile(fileOrBlob, options = {}) {
    const proxyUrl = config?.ocrScan?.proxyUrl;
    const enabled = config?.featureFlags?.enableOcrProxy;

    if (!enabled || !proxyUrl) {
      return {
        ok: false,
        data: null,
        error: {
          type: "ocr_proxy_unavailable",
          message: "OCR proxy is not configured"
        }
      };
    }

    const timeoutMs = Number.isFinite(config?.ocrScan?.timeoutMs) ? config.ocrScan.timeoutMs : 20000;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const imageDataUrl = await fileToDataUrl(fileOrBlob);
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageDataUrl,
          language: options.language || "vi,en"
        }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        return {
          ok: false,
          data: null,
          error: {
            type: "http_error",
            message: data?.error?.message || `OCR request failed with status ${response.status}`
          }
        };
      }

      return {
        ok: true,
        data,
        error: null
      };
    } catch (error) {
      return {
        ok: false,
        data: null,
        error: {
          type: error?.name === "AbortError" ? "timeout" : "network_error",
          message: error?.message || "Unknown OCR proxy error"
        }
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  window.OluScanServices = window.OluScanServices || {};
  window.OluScanServices.ocrScanService = {
    extractIngredientsFromFile
  };
})();
