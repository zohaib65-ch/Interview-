const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
};

/**
 * Converts stored answer HTML to searchable plain text.
 * Block-level boundaries become spaces so words from adjacent paragraphs don't fuse together,
 * and entities are decoded so searching for "a & b" or "<div>" works against the stored text.
 */
export function htmlToPlainText(html: string) {
  return html
    .replace(/<\/(p|div|li|h[1-6]|pre|blockquote|tr)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}
