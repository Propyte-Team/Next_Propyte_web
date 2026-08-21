/**
 * Traduce vocabulario de fecha dentro de texto libre del CMS
 * (`delivery_text` / `estimated_delivery`, ej. "Invierno 2027", "Q4 2026",
 * "Diciembre 2026"). No es una traducción completa: solo sustituye palabras
 * de fecha conocidas (meses, estaciones, trimestre/semestre) palabra por
 * palabra; cualquier otra palabra del texto libre queda igual. Interim fix
 * mientras el campo no tenga contraparte `_en` en el Hub.
 */
const DATE_WORDS_EN: Record<string, string> = {
  enero: 'January',
  febrero: 'February',
  marzo: 'March',
  abril: 'April',
  mayo: 'May',
  junio: 'June',
  julio: 'July',
  agosto: 'August',
  septiembre: 'September',
  octubre: 'October',
  noviembre: 'November',
  diciembre: 'December',
  invierno: 'Winter',
  primavera: 'Spring',
  verano: 'Summer',
  otono: 'Fall',
  trimestre: 'quarter',
  semestre: 'half',
};

function stripAccents(word: string): string {
  return word.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function translateDateWords(text: string, locale: string): string {
  if (locale !== 'en' || !text) return text;
  return text.replace(/[a-zA-ZÁÉÍÓÚÑáéíóúñ]+/g, (word) => {
    const key = stripAccents(word).toLowerCase();
    const translated = DATE_WORDS_EN[key];
    if (!translated) return word;
    return word[0] === word[0].toUpperCase() ? translated : translated.toLowerCase();
  });
}
