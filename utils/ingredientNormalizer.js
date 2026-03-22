(function attachIngredientNormalizer() {
  function normalizeIngredientName(value) {
    return String(value || "")
      .replace(/[•]+/g, ",")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function splitIngredientText(value) {
    return String(value || "")
      .split(/,|;|\n|\r|\u2022|\u00b7/)
      .map((item) => normalizeIngredientName(item))
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  function toDisplayName(value) {
    return String(value || "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  window.OluScanUtils = window.OluScanUtils || {};
  window.OluScanUtils.ingredientNormalizer = {
    normalizeIngredientName,
    splitIngredientText,
    toDisplayName
  };
})();
