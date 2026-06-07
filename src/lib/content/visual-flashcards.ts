/**
 * Visual Flashcards — banco de 24 objetos con íconos neon.
 * Mecánica: imagen → selección múltiple (4 opciones en inglés).
 * Sin IA, 100% curado.
 */

export interface VisualObject {
  key: string;       // nombre del archivo en /public/objects/
  en: string;        // palabra en inglés
  es: string;        // traducción al español
  pron: string;      // pronunciación aproximada
}

export const VISUAL_OBJECTS: VisualObject[] = [
  { key: "apple",    en: "apple",    es: "manzana",  pron: "[Á-pol]"    },
  { key: "backpack", en: "backpack", es: "mochila",  pron: "[BÁK-pak]"  },
  { key: "ball",     en: "ball",     es: "pelota",   pron: "[bol]"       },
  { key: "bed",      en: "bed",      es: "cama",     pron: "[bed]"       },
  { key: "book",     en: "book",     es: "libro",    pron: "[buk]"       },
  { key: "bread",    en: "bread",    es: "pan",      pron: "[bred]"      },
  { key: "car",      en: "car",      es: "auto",     pron: "[kar]"       },
  { key: "chair",    en: "chair",    es: "silla",    pron: "[cher]"      },
  { key: "clock",    en: "clock",    es: "reloj",    pron: "[klok]"      },
  { key: "cup",      en: "cup",      es: "taza",     pron: "[kap]"       },
  { key: "door",     en: "door",     es: "puerta",   pron: "[dor]"       },
  { key: "eraser",   en: "eraser",   es: "borrador", pron: "[i-RÉI-ser]" },
  { key: "flower",   en: "flower",   es: "flor",     pron: "[fláu-er]"   },
  { key: "fork",     en: "fork",     es: "tenedor",  pron: "[fork]"      },
  { key: "key",      en: "key",      es: "llave",    pron: "[ki]"        },
  { key: "lamp",     en: "lamp",     es: "lámpara",  pron: "[lamp]"      },
  { key: "milk",     en: "milk",     es: "leche",    pron: "[milk]"      },
  { key: "pencil",   en: "pencil",   es: "lápiz",    pron: "[PÉN-sil]"   },
  { key: "ruler",    en: "ruler",    es: "regla",    pron: "[RÚ-ler]"    },
  { key: "scissors", en: "scissors", es: "tijeras",  pron: "[SÍ-zorz]"   },
  { key: "spoon",    en: "spoon",    es: "cuchara",  pron: "[spun]"      },
  { key: "table",    en: "table",    es: "mesa",     pron: "[TÉI-bol]"   },
  { key: "tree",     en: "tree",     es: "árbol",    pron: "[tri]"       },
  { key: "window",   en: "window",   es: "ventana",  pron: "[UÍN-dou]"   },
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
