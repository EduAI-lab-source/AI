import type { AppLanguage } from "@/lib/i18n";

export type BookShelf = "known" | "discovery";

export type LibraryBook = {
  id: string;
  shelf: BookShelf;
  title: string;
  author: string;
  year: string;
  sourceLabel: Record<AppLanguage, string>;
  sourceUrl: string;
  note: Record<AppLanguage, string>;
  themes: Record<AppLanguage, string[]>;
};

export const LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: "1984",
    shelf: "known",
    title: "1984",
    author: "George Orwell",
    year: "1949",
    sourceLabel: { es: "Clásico de gran comunidad lectora", en: "A widely read classic", ru: "Классика с широкой читательской аудиторией" },
    sourceUrl: "https://www.goodreads.com/list/show/107459.Best_Popular_Classics_Books_on_Goodreads",
    note: { es: "Una puerta intensa para pensar poder, lenguaje, vigilancia y libertad. Mejor leerla sin prisa.", en: "An intense doorway into power, language, surveillance, and freedom. Best read without rushing.", ru: "Напряжённый вход в размышления о власти, языке, наблюдении и свободе. Читать лучше не спеша." },
    themes: { es: ["sociedad", "ideas"], en: ["society", "ideas"], ru: ["общество", "идеи"] },
  },
  {
    id: "pride-and-prejudice",
    shelf: "known",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    year: "1813",
    sourceLabel: { es: "Clásico de gran comunidad lectora", en: "A widely read classic", ru: "Классика с широкой читательской аудиторией" },
    sourceUrl: "https://www.goodreads.com/list/show/107459.Best_Popular_Classics_Books_on_Goodreads",
    note: { es: "Ingenio, vínculos y prejuicios vistos con humor fino. Una buena elección si buscas una novela ágil y observadora.", en: "Wit, relationships, and prejudice seen through a sharp sense of humor. A good choice for an observant, lively novel.", ru: "Остроумие, отношения и предрассудки, увиденные через тонкий юмор. Хороший выбор для живого и наблюдательного романа." },
    themes: { es: ["relaciones", "humor"], en: ["relationships", "humor"], ru: ["отношения", "юмор"] },
  },
  {
    id: "little-prince",
    shelf: "known",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    year: "1943",
    sourceLabel: { es: "Clásico de gran comunidad lectora", en: "A widely read classic", ru: "Классика с широкой читательской аудиторией" },
    sourceUrl: "https://www.goodreads.com/list/show/107459.Best_Popular_Classics_Books_on_Goodreads",
    note: { es: "Breve y aparentemente simple, pero ideal para conversar sobre cuidado, amistad y aquello que importa.", en: "Short and seemingly simple, yet ideal for reflecting on care, friendship, and what matters.", ru: "Короткая и кажущаяся простой книга, идеально подходящая для размышлений о заботе, дружбе и важном." },
    themes: { es: ["amistad", "sentido"], en: ["friendship", "meaning"], ru: ["дружба", "смысл"] },
  },
  {
    id: "time-shelter",
    shelf: "discovery",
    title: "Time Shelter",
    author: "Georgi Gospodinov",
    year: "2022",
    sourceLabel: { es: "Ganador del International Booker", en: "International Booker winner", ru: "Лауреат International Booker" },
    sourceUrl: "https://thebookerprizes.com/the-booker-library/features/full-list-of-international-booker-prize-winners-shortlisted-authors-and-their-books",
    note: { es: "Una novela singular sobre memoria y nostalgia. Recomendable si te interesan las preguntas raras que siguen resonando después.", en: "A singular novel about memory and nostalgia. For readers who enjoy unusual questions that keep echoing afterward.", ru: "Необычный роман о памяти и ностальгии. Для тех, кому интересны странные вопросы, остающиеся с читателем." },
    themes: { es: ["memoria", "identidad"], en: ["memory", "identity"], ru: ["память", "идентичность"] },
  },
  {
    id: "tomb-of-sand",
    shelf: "discovery",
    title: "Tomb of Sand",
    author: "Geetanjali Shree",
    year: "2018",
    sourceLabel: { es: "Ganador del International Booker", en: "International Booker winner", ru: "Лауреат International Booker" },
    sourceUrl: "https://thebookerprizes.com/the-booker-library/features/full-list-of-international-booker-prize-winners-shortlisted-authors-and-their-books",
    note: { es: "Una historia expansiva sobre duelo, familia y fronteras. Vale la pena si quieres salir de rutas narrativas conocidas.", en: "An expansive story about grief, family, and borders. Worth trying if you want to leave familiar narrative routes.", ru: "Широкое повествование о горе, семье и границах. Подойдёт, если хочется выйти за пределы привычных историй." },
    themes: { es: ["familia", "fronteras"], en: ["family", "borders"], ru: ["семья", "границы"] },
  },
  {
    id: "kairos",
    shelf: "discovery",
    title: "Kairos",
    author: "Jenny Erpenbeck",
    year: "2021",
    sourceLabel: { es: "Ganador del International Booker", en: "International Booker winner", ru: "Лауреат International Booker" },
    sourceUrl: "https://thebookerprizes.com/the-booker-library/features/full-list-of-international-booker-prize-winners-shortlisted-authors-and-their-books",
    note: { es: "Relación, memoria y cambio político se cruzan en una novela exigente. Buena para quien disfruta leer con lápiz cerca.", en: "Relationship, memory, and political change meet in a demanding novel. A good fit for readers who enjoy taking notes.", ru: "Отношения, память и политические перемены пересекаются в требовательном романе. Подойдёт тем, кто любит читать с карандашом." },
    themes: { es: ["historia", "vínculos"], en: ["history", "relationships"], ru: ["история", "отношения"] },
  },
];

export const LIBRARY_COPY: Record<AppLanguage, Record<string, string>> = {
  es: {
    desk: "Mesa de aprendizaje", library: "Biblioteca", tools: "Herramientas", notes: "Cuaderno", study: "Modo estudio", preferences: "Preferencias",
    known: "Puertas conocidas", discovery: "Hallazgos para salir de la ruta", source: "Ver criterio editorial", save: "Guardar para leer", saved: "En mi biblioteca", remove: "Quitar", 
    libraryIntro: "No es una lista de ‘los mejores’. Es una estantería con criterio: obras de gran comunidad lectora y descubrimientos con recepción editorial destacada.",
    curationTitle: "Cómo elegimos esta estantería", curationDetail: "Combinamos clásicos con una comunidad lectora amplia y obras menos transitadas reconocidas por premios internacionales. No mostramos estrellas ni rankings inventados.", curationReaders: "Clásicos con comunidad lectora", curationAwards: "Ganadores del International Booker",
    toolsIntro: "Elige una herramienta y Edu AI convertirá tu intención en un primer paso concreto.", notesIntro: "Aquí puedes guardar una idea propia o una respuesta que no quieres perder. Se queda en este navegador.",
    addNote: "Guardar nota", saveResponse: "Guardar última respuesta", notePlaceholder: "Escribe una idea que quieras volver a encontrar…", emptyNotes: "Todavía no hay notas. Empieza por algo pequeño.",
    studyIntro: "Dile qué quieres aprender. Edu AI te propondrá una ruta realista con práctica y repaso.", studyPlaceholder: "Ej.: inglés para atender clientes", startStudy: "Crear mi ruta", 
    preferencesIntro: "Esta preferencia guía el ritmo de la próxima respuesta, sin cambiar tu conversación.", brief: "Breve y directo", deep: "Profundo y ordenado", creative: "Creativo y explorador", studyStyle: "Con enfoque de estudio",
    challenge: "Reto de esta semana", share: "Compartir una idea", copied: "Texto copiado", speak: "Escuchar última respuesta", stop: "Detener lectura", facebook: "Seguir a Edu AI en Facebook",
  },
  en: {
    desk: "Learning desk", library: "Library", tools: "Tools", notes: "Notebook", study: "Study mode", preferences: "Preferences",
    known: "Familiar doorways", discovery: "Discoveries off the usual path", source: "See editorial criterion", save: "Save to my library", saved: "In my library", remove: "Remove",
    libraryIntro: "This is not a list of ‘the best’. It is a shelf with a clear criterion: widely read works and discoveries with recognized editorial reception.",
    curationTitle: "How this shelf is curated", curationDetail: "We combine classics with a broad reading community and less-traveled works recognized by international prizes. We do not show invented stars or rankings.", curationReaders: "Classics with a reading community", curationAwards: "International Booker winners",
    toolsIntro: "Choose a tool and Edu AI will turn your intention into a concrete first step.", notesIntro: "Save an idea of your own or an answer you do not want to lose. It stays in this browser.",
    addNote: "Save note", saveResponse: "Save latest response", notePlaceholder: "Write an idea you want to find again…", emptyNotes: "There are no notes yet. Start with something small.",
    studyIntro: "Say what you want to learn. Edu AI will propose a realistic path with practice and review.", studyPlaceholder: "E.g.: English for serving customers", startStudy: "Create my path",
    preferencesIntro: "This preference guides the pace of your next response without changing your conversation.", brief: "Brief and direct", deep: "Deep and structured", creative: "Creative and exploratory", studyStyle: "Study focused",
    challenge: "This week’s challenge", share: "Share an idea", copied: "Text copied", speak: "Listen to the latest response", stop: "Stop reading", facebook: "Follow Edu AI on Facebook",
  },
  ru: {
    desk: "Пространство для учёбы", library: "Библиотека", tools: "Инструменты", notes: "Блокнот", study: "Режим учёбы", preferences: "Настройки",
    known: "Знакомые входы", discovery: "Находки вне привычного маршрута", source: "Посмотреть редакционный критерий", save: "Сохранить в библиотеку", saved: "В моей библиотеке", remove: "Убрать",
    libraryIntro: "Это не список «лучших». Это полка с ясным критерием: широко читаемые книги и открытия с признанной редакционной оценкой.",
    curationTitle: "Как составлена эта полка", curationDetail: "Мы соединяем классику с широкой читательской аудиторией и менее известные книги, отмеченные международными премиями. Мы не показываем вымышленные звёзды или рейтинги.", curationReaders: "Классика с читательской аудиторией", curationAwards: "Лауреаты International Booker",
    toolsIntro: "Выберите инструмент, и Edu AI превратит ваше намерение в конкретный первый шаг.", notesIntro: "Сохраните свою мысль или ответ, который не хотите потерять. Всё остаётся в этом браузере.",
    addNote: "Сохранить заметку", saveResponse: "Сохранить последний ответ", notePlaceholder: "Запишите мысль, к которой хотите вернуться…", emptyNotes: "Заметок пока нет. Начните с малого.",
    studyIntro: "Расскажите, чему хотите научиться. Edu AI предложит реалистичный путь с практикой и повторением.", studyPlaceholder: "Например: английский для общения с клиентами", startStudy: "Создать мой путь",
    preferencesIntro: "Эта настройка задаёт темп следующего ответа, не меняя ваш разговор.", brief: "Кратко и по делу", deep: "Глубоко и структурно", creative: "Творчески и исследовательски", studyStyle: "С фокусом на учёбу",
    challenge: "Задание этой недели", share: "Поделиться мыслью", copied: "Текст скопирован", speak: "Прослушать последний ответ", stop: "Остановить чтение", facebook: "Подписаться на Edu AI в Facebook",
  },
};
