const { z } = require('zod');

// Query parameter validation schemas
const bibleIdSchema = z.string().optional();
const bookIdSchema = z.string().regex(/^\d+$/).transform(Number).optional();
const chapterSchema = z.string().regex(/^\d+$/).transform(Number).optional();
const verseSchema = z.string().regex(/^\d+$/).transform(Number).optional();
const testamentSchema = z.enum(['Antigo Testamento', 'Novo Testamento']).optional();
const limitSchema = z.string().regex(/^\d+$/).transform(Number).optional().default('20');
const offsetSchema = z.string().regex(/^\d+$/).transform(Number).optional().default('0');

// Validate query params and return sanitized values or errors
function validateQuery(query, schemas) {
  const result = {};
  const errors = [];

  for (const [key, schema] of Object.entries(schemas)) {
    if (query[key] !== undefined) {
      try {
        result[key] = schema.parse(query[key]);
      } catch (e) {
        errors.push(`${key}: ${e.errors[0]?.message || 'valor inválido'}`);
      }
    }
  }

  return { result, errors };
}

// Book name to ID mapping (for reference endpoint)
const bookNameMap = {
  'genesis': 1, 'genesis': 1, 'gn': 1,
  'exodo': 2, 'ex': 2,
  'levitico': 3, 'lev': 3, 'lv': 3,
  'numeros': 4, 'num': 4, 'nm': 4,
  'deuteronomio': 5, 'deut': 5, 'dt': 5,
  'josue': 6, 'jos': 6, 'js': 6,
  'juizes': 7, 'juiz': 7, 'jz': 7,
  'rute': 8, 'rut': 8, 'rt': 8,
  '1-samuel': 9, '1samuel': 9, '1sam': 9, '1sm': 9,
  '2-samuel': 10, '2samuel': 10, '2sam': 10, '2sm': 10,
  '1-reis': 11, '1reis': 11, '1rs': 11,
  '2-reis': 12, '2reis': 12, '2rs': 12,
  '1-cronicas': 13, '1cronicas': 13, '1cr': 13,
  '2-cronicas': 14, '2cronicas': 14, '2cr': 14,
  'esdras': 15, 'edr': 15, 'ed': 15,
  'neemias': 16, 'neem': 16, 'ne': 16,
  'ester': 17, 'est': 17, 'et': 17,
  'jo': 18, 'job': 18,
  'salmos': 19, 'sal': 19, 'sl': 19,
  'proverbios': 20, 'prov': 20, 'pv': 20,
  'eclesiastes': 21, 'ecles': 21, 'ec': 21,
  'cantico-dos-canticos': 22, 'cantico': 22, 'cant': 22, 'ct': 22,
  'isaias': 23, 'isa': 23, 'is': 23,
  'jeremias': 24, 'jer': 24, 'jr': 24,
  'lamentacoes': 25, 'lam': 25, 'lm': 25,
  'ezequiel': 26, 'ez': 26,
  'daniel': 27, 'dan': 27, 'dn': 27,
  'oseias': 28, 'os': 28,
  'joel': 29, 'jl': 29,
  'amos': 30, 'am': 30,
  'obadias': 31, 'ob': 31,
  'jonas': 32, 'jon': 32, 'jn': 32,
  'miqueias': 33, 'miq': 33, 'mq': 33,
  'naum': 34, 'na': 34,
  'habacuque': 35, 'hab': 35, 'hc': 35,
  'sofonias': 36, 'sop': 36, 'sf': 36,
  'ageu': 37, 'ag': 37,
  'zacarias': 38, 'zac': 38, 'zc': 38,
  'malaquias': 39, 'mal': 39, 'ml': 39,
  'mateus': 40, 'mat': 40, 'mt': 40,
  'marcos': 41, 'mc': 41,
  'lucas': 42, 'lc': 42,
  'joao': 43, 'jo': 43,
  'atos': 44, 'atos-dos-apostolos': 44, 'at': 44,
  'romanos': 45, 'rom': 45, 'rm': 45,
  '1-corintios': 46, '1corintios': 46, '1co': 46,
  '2-corintios': 47, '2corintios': 47, '2co': 47,
  'galatas': 48, 'gal': 48, 'gl': 48,
  'efesios': 49, 'efe': 49, 'ef': 49,
  'filipenses': 50, 'fil': 50, 'fp': 50,
  'colossenses': 51, 'col': 51, 'cl': 51,
  '1-tessalonicenses': 52, '1tes': 52, '1ts': 52,
  '2-tessalonicenses': 53, '2tes': 53, '2ts': 53,
  '1-timotheo': 54, '1tимоtheo': 54, '1tm': 54,
  '2-timotheo': 55, '2tимоtheo': 55, '2tm': 55,
  'tito': 56, 'tt': 56,
  'filemom': 57, 'fim': 57, 'fm': 57,
  'hebreus': 58, 'heb': 58, 'hb': 58,
  'tiago': 59, 'tg': 59,
  '1-pedro': 60, '1pedro': 60, '1pe': 60,
  '2-pedro': 61, '2pedro': 61, '2pe': 61,
  '1-joao': 62, '1joao': 62, '1jo': 62,
  '2-joao': 63, '2joao': 63, '2jo': 63,
  '3-joao': 64, '3joao': 64, '3jo': 64,
  'judas': 65, 'jd': 65,
  'apocalipse': 66, 'apo': 66, 'ap': 66
};

// Normalize book name: lowercase, remove accents, replace spaces with hyphens
function normalizeBookName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

// Look up book ID by name
function getBookIdByName(name) {
  const normalized = normalizeBookName(name);
  return bookNameMap[normalized] || null;
}

module.exports = {
  validateQuery,
  bibleIdSchema,
  bookIdSchema,
  chapterSchema,
  verseSchema,
  testamentSchema,
  limitSchema,
  offsetSchema,
  getBookIdByName,
  normalizeBookName
};
