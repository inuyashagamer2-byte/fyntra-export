"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
}

export async function enrichProductAction(name: string, imageData?: string) {
  const model = getModel();

  const prompt = `Você é um especialista em e-commerce.
Com base no nome do produto: "${name}" ${imageData ? "e na imagem fornecida," : ""}
por favor, forneça:
1. Uma descrição atraente e detalhada para o Mercado Livre.
2. Uma categoria apropriada.
3. Um preço sugerido em Reais (apenas o número).

Retorne APENAS um objeto JSON válido no seguinte formato:
{
  "description": "...",
  "category": "...",
  "suggestedPrice": 0.00
}`;

  try {
    let result;

    if (imageData) {
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent(prompt);
    }

    const text = (await result.response).text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error enriching product:", error);
    throw new Error("Falha ao enriquecer produto com IA.");
  }
}
