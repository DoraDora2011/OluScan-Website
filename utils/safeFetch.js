(function attachSafeFetch() {
  async function safeFetchJson(url, options = {}) {
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 6500;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: options.headers || {},
        signal: controller.signal
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          data: null,
          error: {
            type: "http_error",
            message: `Request failed with status ${response.status}`,
            url
          }
        };
      }

      return {
        ok: true,
        status: response.status,
        data,
        error: null
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: {
          type: error?.name === "AbortError" ? "timeout" : "network_error",
          message: error?.message || "Unknown network error",
          url
        }
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  window.OluScanUtils = window.OluScanUtils || {};
  window.OluScanUtils.safeFetchJson = safeFetchJson;
})();
