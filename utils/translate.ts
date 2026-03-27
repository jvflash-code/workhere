// Detects if text is likely Spanish or English
const SPANISH_CHARS = /[ñáéíóúüÑÁÉÍÓÚÜ¿¡]/;
const SPANISH_WORDS =
  /\b(hola|gracias|que|como|trabajas|horas|semana|cuantas|tiene|para|con|por|una|más|esto|aquí|hacer|bien|muy|también|trabajo|empresa|buenos|días|dónde|cuando|quién|cómo|qué|sí|pero|porque|puedo|quiero|necesito|cuál|favor|tengo)\b/i;

export type SupportedLang = 'en' | 'es';

export function detectLanguage(text: string): SupportedLang {
  if (SPANISH_CHARS.test(text) || SPANISH_WORDS.test(text)) return 'es';
  return 'en';
}

export async function translateText(
  text: string,
  from: SupportedLang,
  to: SupportedLang
): Promise<string> {
  // Uses Google Translate's internal endpoint — no API key required
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);

  // Response is a nested array: data[0] contains translation chunks
  // Each chunk is [translatedText, originalText], concatenate all chunks
  const data = await response.json();
  const chunks: string[][] = data[0];
  const translated = chunks
    .map((chunk) => chunk[0])
    .filter(Boolean)
    .join('');

  if (!translated) throw new Error('Empty translation response');
  return translated;
}
