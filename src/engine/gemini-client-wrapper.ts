/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Gemini Vision Client Wrapper
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/engine/gemini-client-wrapper.ts
 * =========================================================================
 */

import { GoogleGenAI } from "@google/genai";
import { AIClient } from "./universal-cognitive-engine";

export class GeminiUniversalClient implements AIClient {
  constructor(private readonly getClient: () => GoogleGenAI) {}

  public async complete(options: {
    systemPrompt: string;
    prompt: string;
    response_format?: any;
    timeoutMs?: number;
  }): Promise<{ text: string; detectedLanguage?: string }> {
    const ai = this.getClient();
    
    // Convert format schemas to Gemini config
    const config: any = {
      systemInstruction: options.systemPrompt,
    };

    if (options.response_format) {
      config.responseMimeType = "application/json";
      // If we need schema validation, we can inject it as responseSchema
      if (options.response_format.json_schema?.schema) {
        config.responseSchema = options.response_format.json_schema.schema;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: options.prompt,
      config,
    });

    return {
      text: response.text || "{}",
      detectedLanguage: "ar/en",
    };
  }

  public async analyzeImage(options: {
    imageUrl: string;
    prompt: string;
  }): Promise<{ text: string; detectedLanguage?: string }> {
    const ai = this.getClient();

    // In a production container, options.imageUrl might be a remote URL or a base64 string.
    // If it is a base64 data URL, we decode it to inlineData.
    let contentParts: any[] = [];

    if (options.imageUrl.startsWith("data:")) {
      const match = options.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      }
    } else {
      // Treat as text reference when not base64 in sandbox environments
      contentParts.push(options.imageUrl);
    }

    contentParts.push(options.prompt);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentParts,
    });

    return {
      text: response.text || "{}",
      detectedLanguage: "ar/en",
    };
  }
}
