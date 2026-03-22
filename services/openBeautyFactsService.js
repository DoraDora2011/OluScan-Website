(function attachOpenBeautyFactsService() {
  const config = window.OLUSCAN_API_CONFIG;
  const utils = window.OluScanUtils || {};
  const safeFetchJson = utils.safeFetchJson;
  const ingredientNormalizer = utils.ingredientNormalizer;

  function normalizeProduct(rawProduct, sourceLabel) {
    if (!rawProduct) {
      return null;
    }

    const ingredientsText =
      rawProduct.ingredients_text_en ||
      rawProduct.ingredients_text ||
      rawProduct.ingredients_text_with_allergens ||
      "";

    return {
      barcode: rawProduct.code || "",
      productName: rawProduct.product_name || rawProduct.product_name_en || "",
      brand: rawProduct.brands || "",
      ingredientsText,
      ingredientsList: ingredientNormalizer.splitIngredientText(ingredientsText),
      imageUrl: rawProduct.image_url || rawProduct.image_front_url || "",
      categories: Array.isArray(rawProduct.categories_tags) ? rawProduct.categories_tags : [],
      source: sourceLabel || "openBeautyFacts"
    };
  }

  async function fetchProductByBarcode(barcode) {
    if (!barcode || !config?.featureFlags?.enableOpenBeautyFacts || typeof safeFetchJson !== "function") {
      return { product: null, error: null };
    }

    const url = `${config.openBeautyFacts.productByBarcodeUrl}/${encodeURIComponent(barcode)}.json`;
    const response = await safeFetchJson(url, { timeoutMs: config.request.timeoutMs });

    if (!response.ok || !response.data?.product) {
      return {
        product: null,
        error: response.error || { type: "not_found", message: "Product not found" }
      };
    }

    return {
      product: normalizeProduct(response.data.product, "openBeautyFacts"),
      error: null
    };
  }

  async function searchProductByName(searchTerm) {
    if (
      !searchTerm ||
      !config?.featureFlags?.enableOpenBeautyFacts ||
      !config?.featureFlags?.enableOpenBeautyFactsNameSearch ||
      typeof safeFetchJson !== "function"
    ) {
      return { product: null, error: null };
    }

    const query = new URLSearchParams({
      search_terms: searchTerm,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "1"
    });
    const url = `${config.openBeautyFacts.productSearchUrl}?${query.toString()}`;
    const response = await safeFetchJson(url, { timeoutMs: config.request.timeoutMs });

    if (!response.ok || !response.data?.products?.length) {
      return {
        product: null,
        error: response.error || { type: "not_found", message: "No matching product found" }
      };
    }

    return {
      product: normalizeProduct(response.data.products[0], "openBeautyFactsSearch"),
      error: null
    };
  }

  window.OluScanServices = window.OluScanServices || {};
  window.OluScanServices.openBeautyFactsService = {
    fetchProductByBarcode,
    searchProductByName,
    normalizeProduct
  };
})();
