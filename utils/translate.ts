// Detects if text is likely Spanish or English
// Checks for Spanish-specific characters and common words
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
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);

  const data = await response.json();

  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return decodeURIComponent(data.responseData.translatedText);
  }

  throw new Error(data.responseDetails ?? 'Translation failed');
}
