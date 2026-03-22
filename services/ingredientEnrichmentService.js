(function attachIngredientEnrichmentService() {
  const ingredientLibrary = window.OLUSCAN_INGREDIENT_LIBRARY;
  const fallbackIngredients = window.OLUSCAN_FALLBACK_INGREDIENTS || [];
  const config = window.OLUSCAN_API_CONFIG;
  const ingredientNormalizer = window.OluScanUtils?.ingredientNormalizer;

  function findInLibrary(ingredientName) {
    const normalized = ingredientNormalizer.normalizeIngredientName(ingredientName);
    return ingredientLibrary.ingredients.find((entry) => {
      if (entry.key === normalized || normalized.includes(entry.key) || entry.key.includes(normalized)) {
        return true;
      }

      return entry.aliases.some((alias) => {
        const normalizedAlias = ingredientNormalizer.normalizeIngredientName(alias);
        return (
          normalizedAlias === normalized ||
          normalized.includes(normalizedAlias) ||
          normalizedAlias.includes(normalized)
        );
      });
    });
  }

  function findInFallback(ingredientName) {
    const normalized = ingredientNormalizer.normalizeIngredientName(ingredientName);
    return fallbackIngredients.find((entry) => {
      const candidate = ingredientNormalizer.normalizeIngredientName(entry.ingredientName);
      return candidate === normalized || normalized.includes(candidate) || candidate.includes(normalized);
    });
  }

  async function enrichIngredients(ingredientNames) {
    const normalizedNames = Array.isArray(ingredientNames) ? ingredientNames : [];

    return normalizedNames.map((ingredientName) => {
      const libraryMatch = findInLibrary(ingredientName);
      if (libraryMatch) {
        return {
          ingredientName: libraryMatch.key,
          functions: [libraryMatch.category],
          concerns: libraryMatch.effect === "caution" || libraryMatch.effect === "avoid" ? [libraryMatch.explanation] : [],
          benefits: libraryMatch.effect === "support" ? [libraryMatch.explanation] : [],
          explanation: libraryMatch.explanation,
          effect: libraryMatch.effect,
          source: "fallback"
        };
      }

      if (!config?.featureFlags?.useFallbackOnError) {
        return null;
      }

      const fallbackMatch = findInFallback(ingredientName);
      if (!fallbackMatch) {
        return null;
      }

      return {
        ingredientName: fallbackMatch.ingredientName,
        functions: fallbackMatch.functions || [],
        concerns: fallbackMatch.concerns || [],
        benefits: fallbackMatch.benefits || [],
        explanation: fallbackMatch.explanation || "",
        effect: fallbackMatch.effect || "neutral",
        source: fallbackMatch.source || "fallback"
      };
    }).filter(Boolean);
  }

  window.OluScanServices = window.OluScanServices || {};
  window.OluScanServices.ingredientEnrichmentService = {
    enrichIngredients
  };
})();
