(function attachBarcodeParser() {
  function extractBarcodeCandidates(value) {
    const matches = String(value || "").match(/\b\d{8,14}\b/g);
    return matches ? Array.from(new Set(matches)) : [];
  }

  function getBestBarcode(formData) {
    const fromName = extractBarcodeCandidates(formData?.productName);
    const fromIngredients = extractBarcodeCandidates(formData?.ingredients);
    return [...fromName, ...fromIngredients][0] || "";
  }

  window.OluScanUtils = window.OluScanUtils || {};
  window.OluScanUtils.barcodeParser = {
    extractBarcodeCandidates,
    getBestBarcode
  };
})();
