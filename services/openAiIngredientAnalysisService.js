(function attachOpenAiIngredientAnalysisService() {
  const config = window.OLUSCAN_API_CONFIG;

  async function analyzeIngredients(payload) {
    const proxyUrl = config?.ingredientAnalysis?.proxyUrl;
    const enabled = config?.featureFlags?.enableOpenAiIngredientAnalysis;

    if (!enabled || !proxyUrl) {
      return {
        ok: false,
        data: null,
        error: {
          type: "ingredient_analysis_proxy_unavailable",
          message: "Ingredient analysis proxy is not configured"
        }
      };
    }

    const timeoutMs = Number.isFinite(config?.ingredientAnalysis?.timeoutMs) ? config.ingredientAnalysis.timeoutMs : 22000;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload || {}),
        signal: controller.signal
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        return {
          ok: false,
          data: null,
          error: {
            type: "http_error",
            message: data?.error?.message || `Ingredient analysis request failed with status ${response.status}`
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
          message: error?.message || "Unknown ingredient analysis proxy error"
        }
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  window.OluScanServices = window.OluScanServices || {};
  window.OluScanServices.openAiIngredientAnalysisService = {
    analyzeIngredients
  };
})();
