/**
 * Visual Flashcards — banco de 68 objetos con íconos neon.
 * Mecánica: imagen → selección múltiple (4 opciones en inglés).
 * Sin IA, 100% curado. Cada `key` corresponde a /public/objects/<key>.png.
 */

export interface VisualObject {
  key: string;       // nombre del archivo en /public/objects/
  en: string;        // palabra en inglés
  es: string;        // traducción al español
  pron: string;      // pronunciación aproximada
}

export const VISUAL_OBJECTS: VisualObject[] = [
  // Animales
  { key: "cat",       en: "cat",       es: "gato",      pron: "[kat]"        },
  { key: "dog",       en: "dog",       es: "perro",     pron: "[dog]"        },
  { key: "bird",      en: "bird",      es: "pájaro",    pron: "[berd]"       },
  { key: "fish",      en: "fish",      es: "pez",       pron: "[fish]"       },
  { key: "horse",     en: "horse",     es: "caballo",   pron: "[jors]"       },
  { key: "cow",       en: "cow",       es: "vaca",      pron: "[káu]"        },
  { key: "lion",      en: "lion",      es: "león",      pron: "[LÁI-on]"     },
  { key: "elephant",  en: "elephant",  es: "elefante",  pron: "[É-le-fant]"  },
  { key: "rabbit",    en: "rabbit",    es: "conejo",    pron: "[RÁ-bit]"     },
  { key: "duck",      en: "duck",      es: "pato",      pron: "[dak]"        },
  // Comida y bebida
  { key: "apple",     en: "apple",     es: "manzana",   pron: "[Á-pol]"      },
  { key: "banana",    en: "banana",    es: "plátano",   pron: "[ba-NÁ-na]"   },
  { key: "orange",    en: "orange",    es: "naranja",   pron: "[Ó-ranch]"    },
  { key: "bread",     en: "bread",     es: "pan",       pron: "[bred]"       },
  { key: "cheese",    en: "cheese",    es: "queso",     pron: "[chiis]"      },
  { key: "egg",       en: "egg",       es: "huevo",     pron: "[eg]"         },
  { key: "cake",      en: "cake",      es: "pastel",    pron: "[kéik]"       },
  { key: "pizza",     en: "pizza",     es: "pizza",     pron: "[PÍT-sa]"     },
  { key: "sandwich",  en: "sandwich",  es: "sándwich",  pron: "[SÁND-uich]"  },
  { key: "ice_cream", en: "ice cream", es: "helado",    pron: "[áis-kriim]"  },
  { key: "coffee",    en: "coffee",    es: "café",      pron: "[KÓ-fi]"      },
  { key: "water",     en: "water",     es: "agua",      pron: "[UÓ-ter]"     },
  // Ropa
  { key: "shirt",     en: "shirt",     es: "camisa",    pron: "[shert]"      },
  { key: "shoe",      en: "shoe",      es: "zapato",    pron: "[shu]"        },
  { key: "hat",       en: "hat",       es: "sombrero",  pron: "[jat]"        },
  { key: "sock",      en: "sock",      es: "calcetín",  pron: "[sok]"        },
  { key: "jacket",    en: "jacket",    es: "chaqueta",  pron: "[YÁ-ket]"     },
  { key: "dress",     en: "dress",     es: "vestido",   pron: "[dres]"       },
  { key: "glove",     en: "glove",     es: "guante",    pron: "[glav]"       },
  // Casa y objetos
  { key: "table",     en: "table",     es: "mesa",      pron: "[TÉI-bol]"    },
  { key: "chair",     en: "chair",     es: "silla",     pron: "[cher]"       },
  { key: "door",      en: "door",      es: "puerta",    pron: "[dor]"        },
  { key: "lamp",      en: "lamp",      es: "lámpara",   pron: "[lamp]"       },
  { key: "cup",       en: "cup",       es: "taza",      pron: "[kap]"        },
  { key: "bottle",    en: "bottle",    es: "botella",   pron: "[BÓ-tol]"     },
  { key: "plate",     en: "plate",     es: "plato",     pron: "[pléit]"      },
  { key: "fork",      en: "fork",      es: "tenedor",   pron: "[fork]"       },
  { key: "knife",     en: "knife",     es: "cuchillo",  pron: "[náif]"       },
  { key: "mirror",    en: "mirror",    es: "espejo",    pron: "[MÍ-ror]"     },
  { key: "sofa",      en: "sofa",      es: "sofá",      pron: "[SÓU-fa]"     },
  { key: "fridge",    en: "fridge",    es: "refrigerador", pron: "[frich]"   },
  { key: "tv",        en: "TV",        es: "televisor", pron: "[ti-VÍ]"      },
  { key: "phone",     en: "phone",     es: "teléfono",  pron: "[fóun]"       },
  { key: "toothbrush",en: "toothbrush",es: "cepillo de dientes", pron: "[TÚZ-brash]" },
  { key: "book",      en: "book",      es: "libro",     pron: "[buk]"        },
  { key: "pencil",    en: "pencil",    es: "lápiz",     pron: "[PÉN-sil]"    },
  { key: "ruler",     en: "ruler",     es: "regla",     pron: "[RÚ-ler]"     },
  { key: "scissors",  en: "scissors",  es: "tijeras",   pron: "[SÍ-zorz]"    },
  { key: "ball",      en: "ball",      es: "pelota",    pron: "[bol]"        },
  // Naturaleza
  { key: "sun",       en: "sun",       es: "sol",       pron: "[san]"        },
  { key: "moon",      en: "moon",      es: "luna",      pron: "[muun]"       },
  { key: "star",      en: "star",      es: "estrella",  pron: "[star]"       },
  { key: "cloud",     en: "cloud",     es: "nube",      pron: "[kláud]"      },
  { key: "rain",      en: "rain",      es: "lluvia",    pron: "[réin]"       },
  { key: "rainbow",   en: "rainbow",   es: "arcoíris",  pron: "[RÉIN-bou]"   },
  { key: "mountain",  en: "mountain",  es: "montaña",   pron: "[MÁUN-ten]"   },
  { key: "flower",    en: "flower",    es: "flor",      pron: "[FLÁU-er]"    },
  { key: "leaf",      en: "leaf",      es: "hoja",      pron: "[liif]"       },
  // Transporte
  { key: "car",       en: "car",       es: "auto",      pron: "[kar]"        },
  { key: "bus",       en: "bus",       es: "autobús",   pron: "[bas]"        },
  { key: "train",     en: "train",     es: "tren",      pron: "[tréin]"      },
  { key: "plane",     en: "plane",     es: "avión",     pron: "[pléin]"      },
  { key: "bike",      en: "bike",      es: "bicicleta", pron: "[báik]"       },
  { key: "boat",      en: "boat",      es: "bote",      pron: "[bóut]"       },
  // Cuerpo
  { key: "hand",      en: "hand",      es: "mano",      pron: "[jand]"       },
  { key: "eye",       en: "eye",       es: "ojo",       pron: "[ái]"         },
  { key: "foot",      en: "foot",      es: "pie",       pron: "[fut]"        },
  { key: "nose",      en: "nose",      es: "nariz",     pron: "[nóus]"       },
];

export interface VisualCard {
  object: VisualObject;
  options: string[];   // 4 palabras en inglés (opciones), orden aleatorio
  correct: string;     // la respuesta correcta
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Construye una sesión de N tarjetas visuales con opciones múltiples.
 * - Selecciona N objetos al azar del pool de 24.
 * - Cada tarjeta tiene 4 opciones (1 correcta + 3 distractores únicos).
 * - El orden de las opciones es aleatorio (respuesta correcta nunca en posición fija).
 */
export function buildVisualSession(count = 12): VisualCard[] {
  const pool = shuffle(VISUAL_OBJECTS).slice(0, Math.min(count, VISUAL_OBJECTS.length));

  return pool.map((obj) => {
    const distractors = shuffle(
      VISUAL_OBJECTS.filter((o) => o.key !== obj.key)
    )
      .slice(0, 3)
      .map((o) => o.en);

    return {
      object: obj,
      options: shuffle([obj.en, ...distractors]),
      correct: obj.en,
    };
  });
}
