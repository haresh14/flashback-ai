/**
 * OpenAI (ChatGPT) image generation service using GPT Image 1.5 Edit API.
 * Transforms an image based on a text prompt (image-to-image).
 * Uses input_fidelity: "high" to preserve face, pose, body, and aspect ratio while changing era styling.
 */

import { prepareImageForOpenAI, blobToDataUrl } from '../lib/imageUtils';

const API_KEY = (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) || '';

/**
 * Builds a prompt that preserves identity and composition while applying decade styling.
 */
function buildOpenAIPrompt(originalPrompt: string): string {
  return `CRITICAL: Keep the person's face, facial features, body proportions, pose, position, and the exact framing/composition identical to the input. Preserve the original aspect ratio. ONLY change: the clothing, hairstyle, and photo quality/aesthetic (color grading, film grain) to match the era. ${originalPrompt} The person must look like the same individual in the same pose - only their outfit, hair, and the photo's vintage feel should change.`;
}

async function callOpenAIWithRetry(
  imageDataUrl: string,
  prompt: string
): Promise<string> {
  const maxRetries = 4;
  const initialDelay = 2000;
  const openAIPrompt = buildOpenAIPrompt(prompt);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const body = {
        model: 'gpt-image-1.5',
        images: [{ image_url: imageDataUrl }],
        prompt: openAIPrompt,
        input_fidelity: 'high',
        size: 'auto',
        n: 1,
        output_format: 'png',
        quality: 'high',
      };

      const timeoutMs = 120000; // 2 minutes for image generation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
      }

      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) {
        throw new Error('OpenAI API did not return an image');
      }
      return `data:image/png;base64,${b64}`;
    } catch (error) {
      console.error(`Error calling OpenAI API (Attempt ${attempt}/${maxRetries}):`, error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

      const isRetryable =
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('aborted') ||
        errorMessage.includes('500');

      if (isRetryable && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('OpenAI API call failed after all retries.');
}

/**
 * Generates a decade-styled image from a source image and a prompt using OpenAI GPT Image 1.5.
 * Uses input_fidelity: "high" to preserve face, pose, body, and aspect ratio.
 * Only clothing, hairstyle, and photo aesthetic are changed.
 */
export async function generateDecadeImage(
  imageDataUrl: string,
  prompt: string
): Promise<string> {
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error(
      "Invalid image data URL format. Expected 'data:image/...;base64,...'"
    );
  }

  if (!API_KEY) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. Add it to your .env file.'
    );
  }

  console.log('Preparing image for OpenAI (GPT Image 1.5)...');
  const { blob: imageBlob } = await prepareImageForOpenAI(imageDataUrl, false);
  const imageDataUrlPrepared = await blobToDataUrl(imageBlob);

  // 4MB limit for API
  if (imageBlob.size > 4 * 1024 * 1024) {
    throw new Error(
      'Image is too large after processing. Please use a smaller image (4MB limit).'
    );
  }

  console.log('Attempting generation with OpenAI GPT Image 1.5 (input_fidelity: high, size: auto)...');
  return callOpenAIWithRetry(imageDataUrlPrepared, prompt);
}
