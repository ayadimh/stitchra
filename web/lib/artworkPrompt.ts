const blockedPattern =
  /\b(nike|adidas|louis\s*vuitton|gucci|disney|marvel|anime\s+characters?|anime\s+character|celebrity|celebrities|copyrighted\s+characters?|trademarked\s+brand\s+logos?|counterfeit|designer\s+marks?|hate\s+symbol|hateful|illegal)\b/i;

export const unsafeArtworkMessage =
  'Please describe an original design idea. Stitchra cannot generate or reproduce copyrighted or trademarked brand artwork.';

export function validateArtworkIdea(prompt: string) {
  const cleaned = prompt.trim();

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

export function buildEmbroideryArtworkPrompt(userPrompt: string) {
  const cleanedPrompt = userPrompt
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[<>]/g, '');

  return [
    `Clean embroidery-friendly logo patch concept for ${cleanedPrompt}.`,
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
  ].join(' ');
}
