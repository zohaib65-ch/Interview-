const PRE_BLOCK = /(<pre\b[\s\S]*?<\/pre>)/gi;

function joinBrokenWords(html: string) {
  return html
    .replace(/([A-Za-z0-9])\s*<br\s*\/?>\s*([A-Za-z0-9])/g, "$1$2")
    .replace(/([A-Za-z0-9])\r?\n([A-Za-z0-9])/g, "$1$2");
}

export function normalizeAnswerHtml(answer: string) {
  const cleaned = answer
    .replace(/ /g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/­/g, "")
    .replace(/[​-‍﻿]/g, "");

  // Code blocks keep their line breaks; split() puts the captured <pre> blocks at odd indexes.
  return cleaned
    .split(PRE_BLOCK)
    .map((part, index) => (index % 2 === 1 ? part : joinBrokenWords(part)))
    .join("");
}
