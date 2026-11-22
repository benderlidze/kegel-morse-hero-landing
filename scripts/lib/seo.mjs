// Shared <title> / meta description length rules for every builder.
// Google shows ~60 characters of a title and ~155-160 of a description; longer ones get cut mid-word.
const BRAND = ' | Kegel Morse Hero';
const len = (s) => [...s].length;

// Cut at a word boundary, then drop dangling short words ("die den", "de la", "and the") and trailing punctuation.
const cutWords = (s, max) => {
  let words = [];
  for (const w of s.split(/\s+/)) {
    if (len([...words, w].join(' ')) > max) break;
    words.push(w);
  }
  while (words.length > 3 && len(words[words.length - 1].replace(/[^\p{L}]/gu, '')) <= 3 && !/\d/.test(words[words.length - 1])) words.pop();
  return words.join(' ').replace(/[\s,:;–—-]+$/, '');
};

// 1) fits -> as is; 2) drop " | Kegel Morse Hero"; 3) part before ":" if it is meaningful; 4) cut at a word boundary.
export function seoTitle(title, max = 60) {
  if (!title || len(title) <= max) return title;
  const s = title.endsWith(BRAND) ? title.slice(0, -BRAND.length) : title;
  if (len(s) <= max) return s;
  const head = s.split(/\s*:\s+/)[0];
  if (head !== s && len(head) >= 20 && len(head) <= max) return head;
  const cut = cutWords(s, max);
  const comma = cut.lastIndexOf(', ');
  return comma >= 25 ? cut.slice(0, comma) : cut;
}

// 1) fits -> as is; 2) whole sentences up to 155 chars; 3) cut at a word boundary + "…".
export function seoDesc(description, max = 160, target = 155) {
  if (!description || len(description) <= max) return description;
  const sentences = description.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
  let out = '';
  for (const sentence of sentences) {
    const next = `${out}${sentence}`;
    if (len(next.trim()) > target) break;
    out = next;
  }
  out = out.trim();
  if (len(out) >= 90) return out;
  return `${cutWords(description, target - 1)}…`;
}
