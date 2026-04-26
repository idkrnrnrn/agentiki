const DEFAULT_MODEL = "gemini-3-flash-preview";
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiClient {
  constructor({
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL || DEFAULT_MODEL,
    baseUrl = DEFAULT_BASE_URL,
    fetchImpl = globalThis.fetch
  } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
  }

  get isConfigured() {
    return Boolean(this.apiKey);
  }

  async generateJson({
    prompt,
    schema,
    file,
    thinkingLevel = "low",
    temperature = 1
  }) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const parts = [];
    if (file) {
      parts.push({
        inline_data: {
          mime_type: file.mimeType,
          data: file.base64
        }
      });
    }
    parts.push({ text: prompt });

    const body = {
      contents: [
        {
          role: "user",
          parts
        }
      ],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        thinkingConfig: {
          thinkingLevel
        }
      }
    };

    const response = await this.fetchImpl(
      `${this.baseUrl}/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${details}`);
    }

    const payload = await response.json();
    const text = extractGeminiText(payload);
    return parseJsonText(text);
  }
}

export function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini response does not contain text");
  }

  return text;
}

export function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      return JSON.parse(fenced[1]);
    }
    throw new Error(`Model returned non-JSON content: ${text.slice(0, 300)}`);
  }
}
