(function attachFallbackRules() {
  window.OLUSCAN_FALLBACK_RULES = {
    productTypeBias: {
      cleanser: {
        supportCategories: ["hydration", "soothing"],
        cautionCategories: ["essential-oil", "surfactant"]
      },
      toner: {
        supportCategories: ["hydration", "soothing", "barrier"],
        cautionCategories: ["essential-oil", "active"]
      },
      pharmaceuticals: {
        supportCategories: ["pharmaceutical-support"],
        cautionCategories: ["pharmaceutical", "high-risk"]
      }
    }
  };
})();
