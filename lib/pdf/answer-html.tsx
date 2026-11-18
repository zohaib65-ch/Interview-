import { Link, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import type { PdfStyles } from "./styles";

/** Turns the sanitized answer HTML stored with a question into react-pdf elements. */

type Context = { styles: PdfStyles; depth: number; inList: boolean };

const NBSP = " ";
const SAFE_HREF = /^(https?:|mailto:)/i;

const INLINE_TAGS = new Set([
  "a", "b", "strong", "i", "em", "u", "ins", "s", "del", "strike", "code", "span", "mark", "small", "sub", "sup", "kbd", "br",
]);

// The bundled fonts have no colour-emoji glyphs. Keep the meaning of the common check/cross marks, drop the rest.
const CHECK_MARKS = /[\u2705\u2611\u2714]\uFE0F?/gu;
const CROSS_MARKS = /[\u274C\u274E\u2716]\uFE0F?/gu;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u2600-\u2712\u2715\u2719-\u27BF\u2B50\u2B55\u231A\u231B\u23E9-\u23F3\u200D\uFE0F]/gu;

function cleanGlyphs(text: string) {
  return text.replace(CHECK_MARKS, "\u2713").replace(CROSS_MARKS, "\u2717").replace(EMOJI, "");
}

/** Preserves indentation and column alignment in code, which PDF text layout would otherwise collapse. */
function codeText(raw: string) {
  return cleanGlyphs(raw)
    .replace(/\r\n?/g, "\n")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "")
    .replace(/\t/g, "  ")
    .split("\n")
    .map((line) =>
      line
        .replace(/^ +/, (spaces) => NBSP.repeat(spaces.length))
        .replace(/ {2,}/g, (spaces) => ` ${NBSP.repeat(spaces.length - 1)}`),
    )
    .join("\n");
}

function isInline(node: Node) {
  return node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && INLINE_TAGS.has((node as Element).tagName.toLowerCase()));
}

/** Merges neighbouring strings, collapses whitespace and trims the run; null when nothing visible is left. */
function finalizeInline(parts: ReactNode[]): ReactNode[] | null {
  const merged: ReactNode[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (typeof part === "string" && typeof last === "string") merged[merged.length - 1] = last + part;
    else merged.push(part);
  }

  const cleaned = merged.map((part) =>
    typeof part === "string" ? part.replace(/[ \t\r\f]+/g, " ").replace(/ ?\n ?/g, "\n") : part,
  );

  const first = cleaned[0];
  if (typeof first === "string") cleaned[0] = first.replace(/^[\s]+/, "");
  const lastIndex = cleaned.length - 1;
  const last = cleaned[lastIndex];
  if (typeof last === "string") cleaned[lastIndex] = last.replace(/\s+$/, "");

  const visible = cleaned.filter((part) => part !== "");
  return visible.length > 0 ? visible : null;
}

function renderInline(node: Node, ctx: Context, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return cleanGlyphs(node.textContent ?? "").replace(/\s+/g, " ");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  if (tag === "br") return "\n";

  const children = Array.from(element.childNodes).map((child, index) => renderInline(child, ctx, `${key}.${index}`));
  const { styles } = ctx;

  switch (tag) {
    case "strong":
    case "b":
      return <Text key={key} style={styles.bold}>{children}</Text>;
    case "em":
    case "i":
      return <Text key={key} style={styles.italic}>{children}</Text>;
    case "u":
    case "ins":
      return <Text key={key} style={styles.underline}>{children}</Text>;
    case "s":
    case "del":
    case "strike":
      return <Text key={key} style={styles.strike}>{children}</Text>;
    case "code":
    case "kbd":
      return <Text key={key} style={styles.inlineCode}>{children}</Text>;
    case "a": {
      const href = element.getAttribute("href")?.trim() ?? "";
      return SAFE_HREF.test(href) ? (
        <Link key={key} src={href} style={styles.link}>{children}</Link>
      ) : (
        <Text key={key}>{children}</Text>
      );
    }
    default:
      return <Text key={key}>{children}</Text>;
  }
}

function inlineContent(nodes: Node[], ctx: Context, key: string) {
  return finalizeInline(nodes.map((node, index) => renderInline(node, ctx, `${key}.${index}`)));
}

function renderList(element: Element, ctx: Context, key: string) {
  const { styles } = ctx;
  const ordered = element.tagName.toLowerCase() === "ol";
  const start = Number.parseInt(element.getAttribute("start") ?? "", 10) || 1;
  const items = Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "li");
  const bullet = ctx.depth === 0 ? "•" : "–";

  return (
    <View key={key} style={styles.list}>
      {items.map((item, index) => (
        <View key={`${key}.${index}`} style={styles.listItem}>
          <Text style={styles.listMarker}>{ordered ? `${start + index}.` : bullet}</Text>
          <View style={styles.listBody}>
            {renderBlocks(Array.from(item.childNodes), { ...ctx, depth: ctx.depth + 1, inList: true }, `${key}.${index}`)}
          </View>
        </View>
      ))}
    </View>
  );
}

function renderBlocks(nodes: Node[], ctx: Context, keyBase: string): ReactNode[] {
  const { styles } = ctx;
  const output: ReactNode[] = [];
  let run: Node[] = [];

  // Loose text and inline elements sitting directly in a container read as a paragraph.
  const flushRun = () => {
    if (run.length === 0) return;
    const content = inlineContent(run, ctx, `${keyBase}.run${output.length}`);
    run = [];
    if (content) {
      output.push(
        <Text key={`${keyBase}.run${output.length}`} style={ctx.inList ? styles.liText : styles.p}>
          {content}
        </Text>,
      );
    }
  };

  nodes.forEach((node, index) => {
    if (isInline(node)) {
      run.push(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    flushRun();
    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    const key = `${keyBase}.${index}`;

    switch (tag) {
      case "p": {
        const content = inlineContent(Array.from(element.childNodes), ctx, key);
        if (content) {
          output.push(
            <Text key={key} style={ctx.inList ? styles.liText : styles.p}>
              {content}
            </Text>,
          );
        }
        break;
      }
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const content = inlineContent(Array.from(element.childNodes), ctx, key);
        const level = Number(tag[1]);
        const style = level <= 2 ? (level === 1 ? styles.heading1 : styles.heading2) : level === 3 ? styles.heading3 : styles.heading4;
        if (content) {
          output.push(
            <Text key={key} style={style} minPresenceAhead={36}>
              {content}
            </Text>,
          );
        }
        break;
      }
      case "ul":
      case "ol":
        output.push(renderList(element, ctx, key));
        break;
      case "blockquote":
        output.push(
          <View key={key} style={styles.quote}>
            {renderBlocks(Array.from(element.childNodes), { ...ctx, inList: false }, key)}
          </View>,
        );
        break;
      case "pre": {
        const text = codeText(element.textContent ?? "");
        if (text) {
          output.push(
            <View key={key} style={styles.codeBlock}>
              <Text style={styles.codeText}>{text}</Text>
            </View>,
          );
        }
        break;
      }
      default:
        // Unknown wrapper (div, section...): render what is inside it.
        output.push(...renderBlocks(Array.from(element.childNodes), ctx, key));
    }
  });

  flushRun();
  return output;
}

export function renderAnswerHtml(html: string, styles: PdfStyles): ReactNode[] {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return renderBlocks(Array.from(parsed.body.childNodes), { styles, depth: 0, inList: false }, "a");
}
