/**
 * Cleans model output so reviews read like a person typed them, not marketing copy.
 */
/** ~1 in 3 reviews start lowercase for a casual note feel. */
const CASUAL_LOWER_FIRST_CHANCE = 0.35;
/** ~1 in 3 reviews drop the trailing period. */
const DROP_FINAL_PERIOD_CHANCE = 0.35;

/** Stripped post-generation if the model slips marketing language through. Longest first. */
const MARKETING_PHRASES = [
  "highly recommended",
  "highly recommend",
  "amazing experience",
  "exceptional service",
  "perfect experience",
  "overall experience",
  "went above and beyond",
  "above and beyond",
  "you won't be disappointed",
  "will definitely be back",
  "can't wait to go back",
  "exceeded expectations",
  "cannot say enough",
  "can't say enough",
  "gem of a place",
  "don't hesitate",
  "hidden gem",
  "must visit",
  "must try",
  "must-try",
  "top notch",
  "top-notch",
  "five stars",
  "second to none",
  "absolutely loved",
  "truly wonderful",
  "hands down",
  "atmosphere was",
  "exceptional",
  "delightful",
] as const;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMarketingPhrases(text: string): string {
  let s = text;
  for (const phrase of MARKETING_PHRASES) {
    s = s.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi"), "");
  }
  return s;
}

function normalizePunctuationSpacing(text: string): string {
  return text
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/([,.!?])\s*([,.!?])+/g, "$1")
    .replace(/,{2,}/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+$/g, "")
    .trim();
}

function maybeLowercaseFirstWord(text: string): string {
  if (Math.random() >= CASUAL_LOWER_FIRST_CHANCE) return text;

  const match = text.match(/^([A-Za-z]+)/);
  if (!match) return text;

  const word = match[1];
  if (word === "I" || word.length <= 1) return text;
  if (word === word.toUpperCase() && word.length > 1) return text;

  const first = word[0];
  if (first === first.toLowerCase()) return text;

  return text.replace(/^([A-Za-z])/, (c) => c.toLowerCase());
}

function maybeDropFinalPeriod(text: string): string {
  if (Math.random() >= DROP_FINAL_PERIOD_CHANCE) return text;
  if (!text.endsWith(".")) return text;
  if (text.endsWith("...")) return text;
  return text.slice(0, -1);
}

export function humanizeReview(text: string): string {
  let s = text.trim();

  // Em / en dashes → comma
  s = s.replace(/\s*[—–]\s*/g, ", ");
  // Spaced hyphens used as dashes → comma
  s = s.replace(/\s+-\s+/g, ", ");
  // Hyphenated compounds → spaced words
  s = s.replace(/\b([a-zA-Z]+)-([a-zA-Z]+)\b/g, "$1 $2");
  // Collapse repeated punctuation
  s = s.replace(/([.!?,])\1+/g, "$1");

  s = stripMarketingPhrases(s);
  s = normalizePunctuationSpacing(s);

  s = maybeLowercaseFirstWord(s);
  s = maybeDropFinalPeriod(s);

  return s.trim();
}
