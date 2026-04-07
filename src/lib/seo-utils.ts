/**
 * SEO Utilities for Qpixa
 * Handles dynamic meta generation with variation logic to avoid spam/duplication.
 */

interface MetaInput {
  prompt: string;
  category?: string;
  tags?: string[];
}

interface MetaOutput {
  title: string;
  description: string;
  keywords: string[];
  isLowQuality: boolean;
}

const TITLE_TEMPLATES = [
  (kw: string) => `${kw} AI Image — Create with Qpixa`,
  (kw: string) => `Generate ${kw} AI Art Instantly | Qpixa`,
  (kw: string) => `${kw} Prompt for AI Image Generation | Qpixa`,
  (kw: string) => `Explore ${kw} AI Creations on Qpixa`,
  (kw: string) => `High Quality ${kw} AI Generated Art`
];

const DESC_TEMPLATES = [
  (kw: string, cat: string) => `Discover this amazing ${kw} AI image in the ${cat} category. Create your own AI art with Qpixa's powerful generation tools.`,
  (kw: string, cat: string) => `Check out this ${kw} prompt for AI image generation. Perfect for ${cat} enthusiasts looking for high-quality AI art.`,
  (kw: string, cat: string) => `Generate stunning ${kw} AI art with Qpixa. This ${cat} prompt is designed for professional results and creative inspiration.`,
  (kw: string, cat: string) => `Looking for ${kw} AI images? Qpixa offers the best ${cat} prompts to help you create unique and beautiful AI art instantly.`,
  (kw: string, cat: string) => `A unique ${kw} AI creation. Explore more ${cat} prompts and images on Qpixa, the ultimate AI art marketplace.`
];

export function generatePromptMeta({ prompt, category = 'General', tags = [] }: MetaInput): MetaOutput {
  // 1. Extract meaningful keyword (first 3-4 words of prompt or title)
  const cleanPrompt = prompt.replace(/[#@*]/g, '').trim();
  const words = cleanPrompt.split(/\s+/).filter(w => w.length > 3);
  const keyword = words.slice(0, 3).join(' ') || category;
  
  // 2. Quality Check
  const isLowQuality = cleanPrompt.length < 15 || words.length < 3;

  // 3. Variation Logic (Deterministic based on prompt length/content to avoid random shifts)
  const seed = cleanPrompt.length;
  const titleIdx = seed % TITLE_TEMPLATES.length;
  const descIdx = (seed + 1) % DESC_TEMPLATES.length;

  const title = TITLE_TEMPLATES[titleIdx](keyword);
  const description = DESC_TEMPLATES[descIdx](keyword, category).slice(0, 160);

  // 4. Keywords extraction
  const allKeywords = [category, ...tags, ...words.slice(0, 5)].filter(Boolean);
  const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 10);

  return {
    title,
    description,
    keywords: uniqueKeywords,
    isLowQuality
  };
}

export function generateAltText(prompt: string, category?: string): string {
  const cleanPrompt = prompt.replace(/[#@*]/g, '').trim();
  const keyword = cleanPrompt.split(/\s+/).slice(0, 5).join(' ');
  return `${keyword} ${category ? `(${category})` : ''} AI generated image`.trim();
}
