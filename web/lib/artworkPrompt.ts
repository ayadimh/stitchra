const blockedPattern =
  /\b(nike|adidas|louis\s*vuitton|gucci|chanel|rolex|disney|marvel|dc|spider[-\s]?man|batman|mario|super\s+mario|nintendo|pok[eé]mon|pikachu|anime\s+characters?|anime\s+character|celebrity|celebrities|copyrighted\s+characters?|copyrighted|trademarked\s+brand\s+logos?|trademarked|brand\s+logos?|counterfeit|designer\s+marks?|hate\s+symbol|hateful|illegal)\b/i;
const drugRelatedPattern =
  /\b(drugs?|smoking\s+a\s+joint|smoke\s+a\s+joint|joint|cannabis|weed|marijuana|blunt|bong|stoner|smoke\s+weed)\b/i;

export const unsafeArtworkMessage =
  'Please describe an original design idea. Stitchra cannot generate copyrighted characters, brand logos, or trademarked artwork.';
export const unsafeDrugArtworkMessage =
  'Please describe a family-friendly original design idea. Stitchra cannot generate drug-related artwork for this concept.';

export function validateArtworkIdea(prompt: string) {
  const cleaned = prompt.trim();

  if (drugRelatedPattern.test(cleaned)) {
    return {
      ok: false,
      message: unsafeDrugArtworkMessage,
    };
  }

  if (blockedPattern.test(cleaned)) {
    return {
      ok: false,
      message: unsafeArtworkMessage,
    };
  }

  return {
    ok: true,
    message: '',
  };
}

export type ArtworkVariationMode = 'new' | 'refine' | 'same';

type ArtworkPromptOptions = {
  variationMode?: ArtworkVariationMode;
  variationHint?: string;
  forceDifferent?: boolean;
};

export function buildEmbroideryArtworkPrompt(
  userPrompt: string,
  options: ArtworkPromptOptions = {}
) {
  const cleanedPrompt = userPrompt
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[<>]/g, '');
  const variationMode = options.variationMode ?? 'new';
  const variationInstruction =
    variationMode === 'refine'
      ? 'Modify the previous concept according to the change request while keeping the core idea.'
      : variationMode === 'same'
        ? 'Recreate the same core concept consistently.'
        : 'Create a clearly different visual variation from previous concepts. Change composition, icon arrangement, framing, and decorative details while keeping the same core idea. Do not repeat the exact same layout.';

  return [
    `Clean embroidery-friendly logo patch concept for ${cleanedPrompt}.`,
    options.variationHint ? `Visual direction: ${options.variationHint}.` : '',
    variationInstruction,
    options.forceDifferent
      ? 'Strong variation required: use a noticeably different silhouette, layout balance, and decorative motif.'
      : '',
    'Centered graphic.',
    'Bold readable shapes.',
    'High contrast.',
    'Limited 4-6 thread colors.',
    'Simple vector patch style.',
    'No tiny text.',
    'No thin lines.',
    'No complex gradients.',
    'No photorealistic background.',
    'Plain background.',
    'Suitable for black or white T-shirt embroidery preview.',
  ]
    .filter(Boolean)
    .join(' ');
}
