// A simple lightweight profanity and spam filter for the MVP

const BAD_WORDS = new Set([
    "spam",
    "scam",
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "dick",
    "pussy",
    "crap"
]);

export function containsSpam(text: string): boolean {
    if (!text) return false;

    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
        // Remove punctuation
        const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        if (BAD_WORDS.has(cleanWord)) {
            return true;
        }
    }

    // Basic check for repeated characters/gibberish (e.g., "aaaaaaa")
    if (/(.)\1{5,}/.test(text)) {
        return true;
    }

    return false;
}
