const GEMINI_MODEL = "gemini-2.5-flash-image";
const OCR_PROMPT = `You are an OCR assistant for a skincare ingredient-checking web app.
Read the uploaded image carefully and extract only the visible ingredient list text.
Prioritize ingredients over decorative or marketing text.
Preserve ingredient order as closely as possible.
Return plain clean text suitable for inserting directly into a textarea.
Do not explain, summarize, or add advice.
Do not invent missing ingredients.`;

function parseDataUrl(imageDataUrl) {
  const matches = String(imageDataUrl || "").match(/^data:(.+?);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  return {
    mimeType: matches[1],
    data: matches[2]
  };
}

function extractGeminiText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function stripMarkdownCodeFence(text) {
  const trimmed = String(text || "").trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      success: false,
      error: { message: "GEMINI_API_KEY is not configured" },
      provider: "gemini",
      model: GEMINI_MODEL
    });
    return;
  }

  const { imageDataUrl } = req.body || {};
  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    res.status(400).json({
      success: false,
      error: { message: "Missing imageDataUrl" },
      provider: "gemini",
      model: GEMINI_MODEL
    });
    return;
  }

  const imagePart = parseDataUrl(imageDataUrl);
  if (!imagePart) {
    res.status(400).json({
      success: false,
      error: { message: "Invalid imageDataUrl format" },
      provider: "gemini",
      model: GEMINI_MODEL
    });
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: OCR_PROMPT },
              {
                inline_data: {
                  mime_type: imagePart.mimeType,
                  data: imagePart.data
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      res.status(response.status || 500).json({
        success: false,
        error: {
          message: data?.error?.message || `Gemini OCR request failed with status ${response.status || 500}`
        },
        provider: "gemini",
        model: GEMINI_MODEL
      });
      return;
    }

    const outputText = stripMarkdownCodeFence(extractGeminiText(data));
    const extractedText = outputText.trim();

    res.status(200).json({
      success: true,
      extractedText,
      ingredientsText: extractedText,
      productName: "",
      rawText: extractedText,
      provider: "gemini",
      model: GEMINI_MODEL
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error?.message || "Gemini OCR proxy request failed"
      },
      provider: "gemini",
      model: GEMINI_MODEL
    });
  }
};
