(function attachProductAnalysisService() {
  const config = window.OLUSCAN_API_CONFIG;
  const fallbackRules = window.OLUSCAN_FALLBACK_RULES || {};
  const barcodeParser = window.OluScanUtils?.barcodeParser;
  const ingredientNormalizer = window.OluScanUtils?.ingredientNormalizer;
  const openBeautyFactsService = window.OluScanServices?.openBeautyFactsService;
  const ingredientEnrichmentService = window.OluScanServices?.ingredientEnrichmentService;
  const openAiIngredientAnalysisService = window.OluScanServices?.openAiIngredientAnalysisService;

  function scoreEnrichedIngredients(enrichedIngredients, productType) {
    let score = 50;
    const helpfulIngredients = [];
    const cautionIngredients = [];

    enrichedIngredients.forEach((item) => {
      if (item.effect === "support") {
        score += 8;
        helpfulIngredients.push(item);
      } else if (item.effect === "caution") {
        score -= 10;
        cautionIngredients.push(item);
      } else if (item.effect === "avoid") {
        score -= 18;
        cautionIngredients.push(item);
      }
    });

    const productRules = fallbackRules.productTypeBias?.[productType];
    if (productRules) {
      enrichedIngredients.forEach((item) => {
        const category = item.functions?.[0];
        if (productRules.supportCategories?.includes(category)) {
          score += 2;
        }
        if (productRules.cautionCategories?.includes(category)) {
          score -= 3;
        }
      });
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      helpfulIngredients,
      cautionIngredients
    };
  }

  function mergeIngredientCollections(primaryItems, secondaryItems) {
    const merged = [];
    const seen = new Set();

    [...(Array.isArray(primaryItems) ? primaryItems : []), ...(Array.isArray(secondaryItems) ? secondaryItems : [])].forEach((item) => {
      const key = ingredientNormalizer.normalizeIngredientName(item?.ingredientName || item?.key || "");
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      merged.push(item);
    });

    return merged;
  }

  function mergeStringList(primaryItems, secondaryItems) {
    const merged = [];
    const seen = new Set();

    [...(Array.isArray(primaryItems) ? primaryItems : []), ...(Array.isArray(secondaryItems) ? secondaryItems : [])].forEach((item) => {
      const normalized = String(item || "").trim();
      const key = normalized.toLowerCase();
      if (!normalized || seen.has(key)) {
        return;
      }

      seen.add(key);
      merged.push(normalized);
    });

    return merged;
  }

  async function prepareProductAnalysis(formData, profile) {
    const sourceMeta = [];
    const errors = [];
    const originalIngredients = ingredientNormalizer.splitIngredientText(formData.ingredients);
    let resolvedProduct = null;

    if (config?.featureFlags?.enableOpenBeautyFacts) {
      const barcode = barcodeParser.getBestBarcode(formData);

      if (barcode) {
        const barcodeLookup = await openBeautyFactsService.fetchProductByBarcode(barcode);
        if (barcodeLookup.product) {
          resolvedProduct = barcodeLookup.product;
          sourceMeta.push({ type: "product", source: resolvedProduct.source, barcode: resolvedProduct.barcode });
        } else if (barcodeLookup.error) {
          errors.push(barcodeLookup.error);
        }
      } else if (formData.productName && formData.productName.length > 2) {
        const nameLookup = await openBeautyFactsService.searchProductByName(formData.productName);
        if (nameLookup.product) {
          resolvedProduct = nameLookup.product;
          sourceMeta.push({ type: "product", source: nameLookup.product.source, barcode: nameLookup.product.barcode || "" });
        } else if (nameLookup.error) {
          errors.push(nameLookup.error);
        }
      }
    }

    const mergedIngredients = originalIngredients.length
      ? originalIngredients
      : (resolvedProduct?.ingredientsList || []);
    const analysisIngredientsText = formData.ingredients || resolvedProduct?.ingredientsText || "";

    const enrichedIngredients = await ingredientEnrichmentService.enrichIngredients(mergedIngredients);
    let aiAnalysisData = null;

    if (
      analysisIngredientsText &&
      config?.featureFlags?.enableOpenAiIngredientAnalysis &&
      openAiIngredientAnalysisService?.analyzeIngredients
    ) {
      const aiResult = await openAiIngredientAnalysisService.analyzeIngredients({
        productName: resolvedProduct?.productName || formData.productName,
        ingredientsText: analysisIngredientsText,
        productType: formData.productType,
        profile
      });

      if (aiResult.ok && aiResult.data) {
        aiAnalysisData = aiResult.data;
        sourceMeta.push({ type: "ai-ingredient-analysis", source: "openai" });
      } else if (aiResult.error) {
        errors.push(aiResult.error);
      }
    }

    const mergedEnrichedIngredients = mergeIngredientCollections(enrichedIngredients, aiAnalysisData?.enrichedIngredients || []);
    const serviceSummary = scoreEnrichedIngredients(mergedEnrichedIngredients, formData.productType);
    const mergedHelpfulIngredients = mergeIngredientCollections(serviceSummary.helpfulIngredients, aiAnalysisData?.helpfulIngredients || []);
    const mergedCautionIngredients = mergeIngredientCollections(serviceSummary.cautionIngredients, aiAnalysisData?.cautionIngredients || []);

    if (enrichedIngredients.length) {
      sourceMeta.push({ type: "ingredient-enrichment", source: enrichedIngredients[0].source || "fallback" });
    }

    return {
      product: resolvedProduct,
      mergedFormData: {
        productName: resolvedProduct?.productName || formData.productName,
        ingredients: analysisIngredientsText,
        productType: formData.productType
      },
      profile,
      summary: {
        suitability:
          serviceSummary.score >= 62 ? "good" : serviceSummary.score >= 42 ? "mixed" : "caution",
        score: serviceSummary.score,
        summary: resolvedProduct
          ? "External product data was available and used to strengthen the ingredient lookup."
          : "Local ingredient analysis was used because external product data was limited or unavailable.",
        reasons: mergeStringList([], aiAnalysisData?.extraReasons || []),
        helpfulIngredients: mergedHelpfulIngredients,
        cautionIngredients: mergedCautionIngredients,
        recommendedActions: mergeStringList([], aiAnalysisData?.recommendedAction ? [aiAnalysisData.recommendedAction] : []),
        analysisNote: aiAnalysisData?.analysisNote || "",
        comboTags: mergeStringList([], aiAnalysisData?.comboTags || []),
        historyMeta: {
          usedExternalProduct: Boolean(resolvedProduct),
          matchedIngredientCount: mergedEnrichedIngredients.length,
          usedOpenAiIngredientAnalysis: Boolean(aiAnalysisData)
        },
        sources: sourceMeta
      },
      enrichedIngredients: mergedEnrichedIngredients,
      errors
    };
  }

  window.OluScanServices = window.OluScanServices || {};
  window.OluScanServices.productAnalysisService = {
    prepareProductAnalysis
  };
})();
