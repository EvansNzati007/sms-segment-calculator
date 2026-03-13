// Caractères GSM 7-bit de base (norme ETSI GSM 03.38)
// Attention : ê, î, ô, û, ë, ï ne sont PAS dans cette liste → ils forcent l'encodage Unicode
const gsmRegex = /[^@£$¥èéùìòÇ\nØø\rΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà]/

// Caractères d'extension GSM 7-bit — chacun compte pour 2 unités GSM, pas 1
// Ex : un message "Cost: 10€" fait 11 caractères visuels mais 12 unités GSM
const gsmExtendedChars = new Set(['[', ']', '{', '}', '\\', '^', '~', '|', '€'])

// Limites SMS selon l'encodage
const GSM_7BIT_MAX     = 160  // SMS simple, encodage GSM 7-bit
const UNICODE_MAX      = 70   // SMS simple, encodage Unicode (UCS-2)
const GSM_7BIT_SEGMENT = 153  // Segment en SMS multi-parties, GSM 7-bit
const UNICODE_SEGMENT  = 67   // Segment en SMS multi-parties, Unicode

// Vérifie si le texte nécessite l'encodage Unicode
// Dès qu'un seul caractère est hors du charset GSM, tout le message passe en Unicode
function estUnicode(text: string): boolean {
    return gsmRegex.test(text)
}

// Calcule la longueur réelle en unités GSM 7-bit
// Les caractères d'extension (€, [, ], etc.) comptent double
function getLongueurGSM(text: string): number {
    let longueur = 0
    for (const char of text) {
        longueur += gsmExtendedChars.has(char) ? 2 : 1
    }
    return longueur
}

// Retourne la limite de caractères applicable selon l'encodage et la longueur du message
function getSegmentLimit(text: string): number {
    const isUnicode = estUnicode(text)
    const longueur = isUnicode
        ? Array.from(text).length   // Unicode : on compte les "vrais" caractères (gère les emojis multi-bytes)
        : getLongueurGSM(text)      // GSM : on compte les unités GSM (extension = 2 unités)

    if (isUnicode) {
        return longueur > UNICODE_MAX ? UNICODE_SEGMENT : UNICODE_MAX
    } else {
        return longueur > GSM_7BIT_MAX ? GSM_7BIT_SEGMENT : GSM_7BIT_MAX
    }
}

// Calcule le nombre de segments SMS d'un message
function calculerSegments(texte: string): number {
    const isUnicode = estUnicode(texte)
    const longueur = isUnicode
        ? Array.from(texte).length
        : getLongueurGSM(texte)
    const limit = getSegmentLimit(texte)
    return Math.ceil(longueur / limit)
}

// --- Tests ---

const tests = [
    { texte: "Bonjour",                                                                    description: "GSM 7-bit court" },
    { texte: "a".repeat(161),                                                              description: "GSM 7-bit long (161 caractères)" },
    { texte: "😀",                                                                         description: "Unicode emoji seul" },
    { texte: "Hello 😀",                                                                   description: "Unicode court avec emoji" },
    { texte: "Ceci est un test très long avec des emojis 😀😂🥰 pour dépasser 70 car.",   description: "Unicode long avec plusieurs emojis" },
    { texte: "a".repeat(320),                                                              description: "GSM 7-bit très long (2+ segments)" },
    { texte: "fête",                                                                       description: "ê n'est PAS dans le charset GSM → Unicode" },
    { texte: "Coût : 10€",                                                                 description: "€ est GSM étendu → compte pour 2 unités" },
]

for (const test of tests) {
    const segments = calculerSegments(test.texte)
    const isUni = estUnicode(test.texte)
    console.log(`${test.description} → Unicode: ${isUni}, Segments: ${segments}`)
}
