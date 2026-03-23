module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: "OPENAI_API_KEY is not configured" } });
    return;
  }

  const { productName = "", ingredientsText = "", productType = "", profile = {} } = req.body || {};
  if (!ingredientsText || typeof ingredientsText !== "string") {
    res.status(400).json({ error: { message: "Missing ingredientsText" } });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You help enrich a skincare ingredient-analysis prototype. Return valid JSON only. Be conservative. Never invent ingredients that are not clearly present in the provided ingredient text. Do not replace the app's core classification. Provide additive enrichment only. Treat user allergy notes in profile.conditionNote or profile.structuredAllergies as high-priority risk signals: if an ingredient clearly matches an allergy note, mention it in extraReasons, include it in cautionIngredients, and make recommendedAction clearly advise avoiding the product. Allowed effect values: support, neutral, caution, avoid. Allowed comboTags: beneficial_combo_oily, beneficial_combo_sensitive, risky_combo_exfoliation, risky_combo_retinoid_exfoliant, risky_combo_retinoid_fragrance, risky_combo_acid_fragrance, risky_combo_drying, risky_combo_sensitive_trigger."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze this skincare product ingredient text for additive enrichment only. Product name: ${productName || "Unknown"}. Product type: ${productType || "Unknown"}. User profile: ${JSON.stringify(profile || {})}. Ingredient text: ${ingredientsText}. Return JSON with keys: extraReasons (array of short strings, max 4), enrichedIngredients (array of up to 8 objects with ingredientName, functions, explanation, effect), helpfulIngredients (same object shape), cautionIngredients (same object shape), comboTags (array of strings), analysisNote (string), recommendedAction (string). Only use ingredients clearly present in the ingredient text.`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const outputText = data?.output_text || "";
    let parsed;

    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      parsed = {
        extraReasons: [],
        enrichedIngredients: [],
        helpfulIngredients: [],
        cautionIngredients: [],
        comboTags: [],
        analysisNote: "",
        recommendedAction: ""
      };
    }

    const normalizeArray = (value) => Array.isArray(value) ? value : [];
    const normalizeIngredientItems = (value) => normalizeArray(value)
      .filter((item) => item && typeof item === "object" && item.ingredientName)
      .slice(0, 8)
      .map((item) => ({
        ingredientName: String(item.ingredientName || "").trim(),
        functions: Array.isArray(item.functions) ? item.functions.slice(0, 3).map((entry) => String(entry || "").trim()).filter(Boolean) : [],
        explanation: String(item.explanation || "").trim(),
        effect: ["support", "neutral", "caution", "avoid"].includes(item.effect) ? item.effect : "neutral",
        source: "openai"
      }))
      .filter((item) => item.ingredientName);

    res.status(200).json({
      extraReasons: normalizeArray(parsed.extraReasons).map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4),
      enrichedIngredients: normalizeIngredientItems(parsed.enrichedIngredients),
      helpfulIngredients: normalizeIngredientItems(parsed.helpfulIngredients),
      cautionIngredients: normalizeIngredientItems(parsed.cautionIngredients),
      comboTags: normalizeArray(parsed.comboTags).map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8),
      analysisNote: String(parsed.analysisNote || "").trim(),
      recommendedAction: String(parsed.recommendedAction || "").trim()
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: error?.message || "Ingredient analysis proxy request failed"
      }
    });
  }
};
