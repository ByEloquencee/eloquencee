export type WordCategory = "filozofia" | "literatura" | "ogólne";

export interface PolishWord {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  etymology?: string;
  category: WordCategory;
}

export const categories: { value: WordCategory | "all"; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "filozofia", label: "Filozofia" },
  { value: "literatura", label: "Literatura" },
  { value: "ogólne", label: "Ogólne" },
];

export const words: PolishWord[] = [
  // Filozofia
  { id: "1", word: "Aprioryczny", partOfSpeech: "przymiotnik", definition: "Oparty na rozumowaniu, a nie na doświadczeniu; z góry założony.", example: "Jego aprioryczne przekonania nie miały oparcia w faktach.", etymology: "z łac. a priori — z tego, co wcześniejsze", category: "filozofia" },
  { id: "4", word: "Demiurg", partOfSpeech: "rzeczownik", definition: "Twórca, stwórca; w filozofii — boski budowniczy świata.", example: "Pisarz stał się demiurgiem własnego literackiego uniwersum.", category: "filozofia" },
  { id: "6", word: "Egzegeza", partOfSpeech: "rzeczownik", definition: "Naukowy komentarz i interpretacja tekstu, zwłaszcza biblijnego.", example: "Egzegeza tego fragmentu zajęła uczonym lata.", etymology: "z gr. exēgēsis — wyjaśnienie", category: "filozofia" },
  { id: "12", word: "Immanentny", partOfSpeech: "przymiotnik", definition: "Tkwiący wewnętrznie w czymś, nieodłączny.", example: "Ciekawość jest immanentną cechą ludzkiej natury.", category: "filozofia" },
  { id: "32", word: "Solipsyzm", partOfSpeech: "rzeczownik", definition: "Pogląd filozoficzny, że istnieje tylko własne ja i jego przeżycia.", example: "Solipsyzm jest skrajną formą subiektywizmu.", etymology: "z łac. solus ipse — sam jedyny", category: "filozofia" },
  { id: "46", word: "Gnozeologia", partOfSpeech: "rzeczownik", definition: "Dział filozofii badający źródła i granice poznania.", example: "Gnozeologia Kanta zrewolucjonizowała europejską myśl.", category: "filozofia" },
  { id: "47", word: "Hubris", partOfSpeech: "rzeczownik", definition: "Pycha, zuchwałość; nadmierna pewność siebie prowadząca do upadku.", example: "Hubris dyrektora doprowadził firmę do bankructwa.", etymology: "z gr. hybris", category: "filozofia" },
  { id: "15", word: "Kontemplacja", partOfSpeech: "rzeczownik", definition: "Głębokie, skupione rozmyślanie; duchowe skupienie.", example: "Pogrążył się w kontemplacji zachodu słońca.", category: "filozofia" },
  { id: "35", word: "Transgresja", partOfSpeech: "rzeczownik", definition: "Przekroczenie granic, norm, konwencji.", example: "Sztuka awangardowa często opiera się na transgresji.", category: "filozofia" },
  { id: "50", word: "Liminalny", partOfSpeech: "przymiotnik", definition: "Dotyczący progu, graniczny; przejściowy.", example: "Adolescencja to okres liminalny między dzieciństwem a dorosłością.", category: "filozofia" },

  // Literatura
  { id: "23", word: "Palimpsest", partOfSpeech: "rzeczownik", definition: "Rękopis, z którego zmyto pierwotny tekst i napisano nowy.", example: "Naukowcy odkryli pod tekstem palimpsestu starożytny traktat.", category: "literatura" },
  { id: "42", word: "Apokryficzny", partOfSpeech: "przymiotnik", definition: "Nieautentyczny, zmyślony; dotyczący apokryfów.", example: "Ta historia jest apokryficzna — nie ma potwierdzenia w źródłach.", category: "literatura" },
  { id: "10", word: "Hermetyczny", partOfSpeech: "przymiotnik", definition: "Szczelnie zamknięty; trudny do zrozumienia dla postronnych.", example: "Jego wiersze są hermetyczne i wymagają głębokiej analizy.", category: "literatura" },
  { id: "27", word: "Prolegomena", partOfSpeech: "rzeczownik (l.mn.)", definition: "Wstęp, wprowadzenie do jakiejś nauki lub dzieła.", example: "Prolegomena do dzieła liczyły ponad sto stron.", category: "literatura" },
  { id: "49", word: "Kabotyn", partOfSpeech: "rzeczownik", definition: "Osoba zachowująca się teatralnie, afektowanie.", example: "Nie znosiła kabotynów, którzy grają nawet poza sceną.", category: "literatura" },
  { id: "44", word: "Eklektyczny", partOfSpeech: "przymiotnik", definition: "Łączący różne style, elementy z różnych źródeł.", example: "Jej eklektyczny gust muzyczny obejmował jazz i metal.", category: "literatura" },
  { id: "18", word: "Meandry", partOfSpeech: "rzeczownik (l.mn.)", definition: "Zakręty, zawiłości; przenośnie — zawiłe koleje czegoś.", example: "Meandry polskiej biurokracji potrafią zaskoczyć.", etymology: "od rzeki Meander w Azji Mniejszej", category: "literatura" },
  { id: "7", word: "Efemeryczny", partOfSpeech: "przymiotnik", definition: "Krótkotrwały, przemijający, nietrwały.", example: "Sława w mediach społecznościowych jest efemeryczna.", category: "literatura" },
  { id: "38", word: "Wernisaż", partOfSpeech: "rzeczownik", definition: "Uroczyste otwarcie wystawy artystycznej.", example: "Na wernisażu pojawiło się wielu krytyków sztuki.", etymology: "z fr. vernissage — lakierowanie", category: "literatura" },
  { id: "36", word: "Truizm", partOfSpeech: "rzeczownik", definition: "Banalne, oczywiste stwierdzenie; komunał.", example: "Mówienie, że czas to pieniądz, to truizm.", category: "literatura" },

  // Ogólne
  { id: "2", word: "Atawizm", partOfSpeech: "rzeczownik", definition: "Nawrót do cech przodków; przeżytek z dawnych czasów.", example: "Ta tradycja to swoisty atawizm kulturowy.", etymology: "z łac. atavus — przodek", category: "ogólne" },
  { id: "3", word: "Bigoteria", partOfSpeech: "rzeczownik", definition: "Przesadna, ślepa pobożność; dewocja.", example: "Jej bigoteria budziła niepokój bliskich.", etymology: "z fr. bigoterie", category: "ogólne" },
  { id: "5", word: "Dyletant", partOfSpeech: "rzeczownik", definition: "Osoba zajmująca się czymś powierzchownie, bez głębszej wiedzy.", example: "Nie chcę, żeby jakiś dyletant naprawiał mi samochód.", category: "ogólne" },
  { id: "8", word: "Endemiczny", partOfSpeech: "przymiotnik", definition: "Występujący wyłącznie na określonym obszarze.", example: "Ten gatunek żaby jest endemiczny dla wyspy Borneo.", category: "ogólne" },
  { id: "9", word: "Filister", partOfSpeech: "rzeczownik", definition: "Człowiek o ciasnych horyzontach, nieczuły na sztukę i kulturę.", example: "Nie bądź filistrem — spróbuj chociaż raz pójść do opery.", category: "ogólne" },
  { id: "11", word: "Idiosynkrazja", partOfSpeech: "rzeczownik", definition: "Wrodzona niechęć, odraza do czegoś lub kogoś.", example: "Miała idiosynkrazję na dźwięk skrzypiec.", etymology: "z gr. idiosynkrasia", category: "ogólne" },
  { id: "13", word: "Jurysdykcja", partOfSpeech: "rzeczownik", definition: "Zakres władzy sądowniczej; kompetencja do rozstrzygania spraw.", example: "Ta sprawa nie podlega jurysdykcji polskich sądów.", category: "ogólne" },
  { id: "14", word: "Koniunktura", partOfSpeech: "rzeczownik", definition: "Sprzyjający układ okoliczności, zwłaszcza gospodarczych.", example: "Firma rozwijała się dzięki dobrej koniunkturze rynkowej.", category: "ogólne" },
  { id: "16", word: "Lackoniczny", partOfSpeech: "przymiotnik", definition: "Zwięzły, treściwy, wyrażony w niewielu słowach.", example: "Jego lakoniczna odpowiedź nie pozostawiała wątpliwości.", category: "ogólne" },
  { id: "17", word: "Makiawelizm", partOfSpeech: "rzeczownik", definition: "Bezwzględność w dążeniu do celu; polityka pozbawiona skrupułów.", example: "Makiawelizm szefa firmy przerażał pracowników.", etymology: "od Niccolò Machiavelli", category: "ogólne" },
  { id: "19", word: "Nepotyzm", partOfSpeech: "rzeczownik", definition: "Faworyzowanie krewnych i znajomych przy obsadzaniu stanowisk.", example: "Nepotyzm w tej instytucji był powszechnie znany.", category: "ogólne" },
  { id: "20", word: "Nonszalancja", partOfSpeech: "rzeczownik", definition: "Swobodne, lekceważące zachowanie; brak skrępowania.", example: "Z nonszalancją odrzucił wszystkie propozycje.", category: "ogólne" },
  { id: "21", word: "Obskurantyzm", partOfSpeech: "rzeczownik", definition: "Wrogość wobec postępu i oświaty; ciemnota.", example: "Obskurantyzm tamtych czasów hamował rozwój nauki.", category: "ogólne" },
  { id: "22", word: "Ostentacyjny", partOfSpeech: "przymiotnik", definition: "Robiony na pokaz, demonstracyjny, manifestacyjny.", example: "Ostentacyjnie odwrócił się plecami do mówcy.", category: "ogólne" },
  { id: "24", word: "Parweniusz", partOfSpeech: "rzeczownik", definition: "Osoba, która szybko się wzbogaciła i naśladuje wyższe sfery.", example: "Zachowywał się jak typowy parweniusz.", etymology: "z fr. parvenu", category: "ogólne" },
  { id: "25", word: "Pejoratywny", partOfSpeech: "przymiotnik", definition: "Mający ujemne zabarwienie, uwłaczający, pogardliwy.", example: "Użył pejoratywnego określenia, co wywołało oburzenie.", category: "ogólne" },
  { id: "26", word: "Pernamentny", partOfSpeech: "przymiotnik", definition: "Trwały, ciągły, nieustanny.", example: "Permanentny brak snu odbijał się na jego zdrowiu.", category: "ogólne" },
  { id: "28", word: "Prokrastynacja", partOfSpeech: "rzeczownik", definition: "Nawykowe odkładanie działań na później.", example: "Prokrastynacja to plaga współczesnych studentów.", category: "ogólne" },
  { id: "29", word: "Redundancja", partOfSpeech: "rzeczownik", definition: "Nadmiar, zbędne powtórzenia; nadmiarowość informacji.", example: "Redundancja w jego tekście utrudniała lekturę.", category: "ogólne" },
  { id: "30", word: "Relikwia", partOfSpeech: "rzeczownik", definition: "Szczątki lub przedmioty związane ze świętym; przenośnie — cenny zabytek.", example: "Ten zegarek to rodzinna relikwia przekazywana od pokoleń.", category: "ogólne" },
  { id: "31", word: "Sentymentalny", partOfSpeech: "przymiotnik", definition: "Skłonny do czułostkowości, nadmiernie uczuciowy.", example: "Przy starych zdjęciach stawał się sentymentalny.", category: "ogólne" },
  { id: "33", word: "Subtelny", partOfSpeech: "przymiotnik", definition: "Delikatny, wyrafinowany; trudny do uchwycenia.", example: "Subtelna różnica między tymi odcieniami była ledwo zauważalna.", category: "ogólne" },
  { id: "34", word: "Sybarycki", partOfSpeech: "przymiotnik", definition: "Związany z przepychem i wyrafinowanymi przyjemnościami.", example: "Prowadził sybarycki tryb życia.", etymology: "od Sybarytów — mieszkańców starożytnego Sybaris", category: "ogólne" },
  { id: "37", word: "Ubikwitarny", partOfSpeech: "przymiotnik", definition: "Wszechobecny, spotykany wszędzie.", example: "Smartfony stały się ubikwitarne w codziennym życiu.", category: "ogólne" },
  { id: "39", word: "Wielomówność", partOfSpeech: "rzeczownik", definition: "Skłonność do mówienia zbyt wiele; gadatliwość.", example: "Jego wielomówność zniechęcała rozmówców.", category: "ogólne" },
  { id: "40", word: "Xenofobia", partOfSpeech: "rzeczownik", definition: "Niechęć, wrogość wobec obcych, cudzoziemców.", example: "Xenofobia jest problemem społecznym w wielu krajach.", category: "ogólne" },
  { id: "41", word: "Abnegacja", partOfSpeech: "rzeczownik", definition: "Wyrzeczenie się, zaniedbywanie własnych potrzeb.", example: "Jego abnegacja w kwestii ubioru była legendarna.", category: "ogólne" },
  { id: "43", word: "Deprecjacja", partOfSpeech: "rzeczownik", definition: "Spadek wartości; umniejszanie, pomniejszanie znaczenia.", example: "Deprecjacja waluty uderzyła w oszczędności obywateli.", category: "ogólne" },
  { id: "45", word: "Fetyszyzm", partOfSpeech: "rzeczownik", definition: "Przypisywanie nadmiernego znaczenia przedmiotom lub pojęciom.", example: "Fetyszyzm technologiczny sprawia, że gubimy to, co ważne.", category: "ogólne" },
  { id: "48", word: "Inklinacja", partOfSpeech: "rzeczownik", definition: "Skłonność, tendencja do czegoś; upodobanie.", example: "Od dziecka miał inklinację do nauk ścisłych.", category: "ogólne" },
];
