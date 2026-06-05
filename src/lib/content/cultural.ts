/**
 * Cápsula cultural diaria — un idiom, una canción, un dato.
 * Selección determinística por day-of-year para que toda la familia vea lo mismo el mismo día.
 */

export const CULTURAL_IDIOMS = [
  { en: "It's raining cats and dogs", es: "Está lloviendo a cántaros" },
  { en: "Break a leg!", es: "¡Mucha suerte! (especialmente para artistas)" },
  { en: "Piece of cake", es: "Pan comido / Muy fácil" },
  { en: "Hit the books", es: "Ponerse a estudiar duro" },
  { en: "Under the weather", es: "Sentirse mal/enfermo" },
  { en: "Once in a blue moon", es: "Muy de vez en cuando" },
  { en: "Cost an arm and a leg", es: "Costar un ojo de la cara" },
  { en: "Bite the bullet", es: "Apechugar / Aguantarse" },
  { en: "Spill the beans", es: "Soltar el secreto" },
  { en: "Hit the nail on the head", es: "Dar en el clavo" },
  { en: "When pigs fly", es: "Cuando las ranas críen pelo" },
  { en: "A blessing in disguise", es: "No hay mal que por bien no venga" },
  { en: "Call it a day", es: "Dejarlo por hoy" },
  { en: "Hang in there", es: "Aguanta / No te rindas" },
  { en: "Out of the blue", es: "De la nada / Inesperadamente" },
  { en: "Get your act together", es: "Ponte las pilas" },
  { en: "Better late than never", es: "Más vale tarde que nunca" },
  { en: "Don't judge a book by its cover", es: "Las apariencias engañan" },
  { en: "Speak of the devil!", es: "¡Hablando del rey de Roma!" },
  { en: "The early bird catches the worm", es: "Al que madruga, Dios lo ayuda" },
];

export const CULTURAL_SONGS = [
  { line: "Yesterday, all my troubles seemed so far away", song: "Yesterday — The Beatles" },
  { line: "We don't need no education", song: "Another Brick in the Wall — Pink Floyd" },
  { line: "I want to break free", song: "I Want to Break Free — Queen" },
  { line: "Don't stop believin'", song: "Don't Stop Believin' — Journey" },
  { line: "Let it be, let it be", song: "Let It Be — The Beatles" },
  { line: "I will always love you", song: "I Will Always Love You — Whitney Houston" },
  { line: "Hello, is it me you're looking for?", song: "Hello — Lionel Richie" },
  { line: "Shake it off, shake it off", song: "Shake It Off — Taylor Swift" },
  { line: "I'm walking on sunshine", song: "Walking on Sunshine — Katrina & The Waves" },
  { line: "Don't worry, be happy", song: "Don't Worry Be Happy — Bobby McFerrin" },
  { line: "Someone like you", song: "Someone Like You — Adele" },
  { line: "Imagine all the people living life in peace", song: "Imagine — John Lennon" },
  { line: "I gotta feeling that tonight's gonna be a good night", song: "I Gotta Feeling — Black Eyed Peas" },
  { line: "Photograph, I won't ever let you go", song: "Photograph — Ed Sheeran" },
  { line: "We are the champions, my friends", song: "We Are the Champions — Queen" },
];

export const CULTURAL_FACTS = [
  { en: "English has over 170,000 words in current use.", es: "El inglés tiene más de 170,000 palabras en uso." },
  { en: "Shakespeare invented over 1,700 English words still used today.", es: "Shakespeare inventó más de 1,700 palabras del inglés." },
  { en: "The most common letter in English is 'E'.", es: "La letra más común en inglés es la 'E'." },
  { en: "'Set' has over 430 definitions — most of any English word.", es: "'Set' es la palabra inglesa con más significados: más de 430." },
  { en: "English is the official language of aviation.", es: "El inglés es el idioma oficial de la aviación." },
  { en: "The dot over the letter 'i' is called a 'tittle'.", es: "El puntito sobre la 'i' se llama 'tittle' en inglés." },
  { en: "About 1.5 billion people speak English worldwide.", es: "Cerca de 1.500 millones de personas hablan inglés." },
  { en: "Only 400 million speak English as a first language.", es: "Solo 400 millones tienen el inglés como lengua materna." },
  { en: "'Goodbye' originally meant 'God be with you'.", es: "'Goodbye' originalmente significaba 'God be with you'." },
  { en: "'Rhythms' is the longest English word without a vowel.", es: "'Rhythms' es la palabra más larga del inglés sin vocales." },
  { en: "'I am' is the shortest complete sentence in English.", es: "'I am' es la oración completa más corta del inglés." },
  { en: "'Actually' means 'really', NOT 'currently' (false friend).", es: "'Actually' significa 'realmente', NO 'actualmente'." },
  { en: "'Library' = biblioteca. Bookstore = librería. False friend!", es: "'Library' es BIBLIOTECA, no librería." },
  { en: "'Embarrassed' = avergonzado. 'Pregnant' = embarazada.", es: "'Embarrassed' es AVERGONZADO, no embarazada." },
];

export interface CulturalCapsule {
  idiom: typeof CULTURAL_IDIOMS[number];
  song: typeof CULTURAL_SONGS[number];
  fact: typeof CULTURAL_FACTS[number];
}

export function getCulturalCapsule(date: Date = new Date()): CulturalCapsule {
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return {
    idiom: CULTURAL_IDIOMS[doy % CULTURAL_IDIOMS.length],
    song: CULTURAL_SONGS[doy % CULTURAL_SONGS.length],
    fact: CULTURAL_FACTS[doy % CULTURAL_FACTS.length],
  };
}
