(function attachApiConfig() {
  window.OLUSCAN_API_CONFIG = {
    openBeautyFacts: {
      productByBarcodeUrl: "https://world.openbeautyfacts.org/api/v2/product",
      productSearchUrl: "https://world.openbeautyfacts.org/cgi/search.pl"
    },
    ocrScan: {
      proxyUrl: "/api/ocr-scan",
      timeoutMs: 20000
    },
    ingredientAnalysis: {
      proxyUrl: "/api/analyze-ingredients",
      timeoutMs: 22000
    },
    request: {
      timeoutMs: 6500
    },
    featureFlags: {
      enableOpenBeautyFacts: true,
      enableOpenBeautyFactsNameSearch: true,
      enableInciEnrichment: true,
      enableOpenAiIngredientAnalysis: true,
      enableOcrProxy: true,
      useFallbackOnError: true
    },
    debug: {
      enableConsoleTracing: true
    }
  };
})();
