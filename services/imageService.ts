/**
 * Unified image generation service.
 * Routes to either Gemini or OpenAI (ChatGPT) based on IMAGE_PROVIDER environment variable.
 * Only one provider is used at a time.
 */

const IMAGE_PROVIDER =
  (typeof process !== 'undefined' && process.env?.IMAGE_PROVIDER) || 'gemini';

/**
 * Generates a decade-styled image from a source image and a prompt.
 * Uses Gemini or OpenAI based on IMAGE_PROVIDER env var ("gemini" | "openai").
 */
export async function generateDecadeImage(
  imageDataUrl: string,
  prompt: string
): Promise<string> {
  const provider = IMAGE_PROVIDER.toLowerCase();

  if (provider === 'openai' || provider === 'chatgpt') {
    const { generateDecadeImage: openaiGenerate } = await import(
      './openaiService'
    );
    return openaiGenerate(imageDataUrl, prompt);
  }

  // Default to Gemini
  const { generateDecadeImage: geminiGenerate } = await import(
    './geminiService'
  );
  return geminiGenerate(imageDataUrl, prompt);
}
