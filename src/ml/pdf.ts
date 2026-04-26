import { PDFParse } from "pdf-parse";

export async function extractPdfTextFromBase64(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
