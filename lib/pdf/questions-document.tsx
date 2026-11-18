import { Document, Link, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { renderAnswerHtml } from "./answer-html";
import { createStyles, type PdfStyles } from "./styles";
import { ACCENTS } from "./theme";
import type { ExportData, ExportQuestion, ExportSection } from "./types";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

const plural = (count: number, one: string, many = `${one}s`) => (count === 1 ? one : many);

/** Adds an entry to the PDF's outline (bookmarks panel). react-pdf honours `bookmark` on any node but only types it on <Page>. */
const outline = (title: string) => ({ bookmark: { title, fit: true } });

function Pill({ value, label, styles }: { value: string | number; label?: string; styles: PdfStyles }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      {label ? <Text style={styles.pillLabel}>{label}</Text> : null}
    </View>
  );
}

function QuestionBlock({ item, number, styles }: { item: ExportQuestion; number: number; styles: PdfStyles }) {
  const answer: ReactNode[] = item.answer.trim() ? renderAnswerHtml(item.answer, styles) : [];

  return (
    <View {...outline(item.question.length > 110 ? `${item.question.slice(0, 107)}...` : item.question)}>
      {/*
        The gap is a real first child on purpose: react-pdf only moves an element to the next page for
        `minPresenceAhead` when it has a preceding sibling. This keeps a question together with the start of its
        answer (all of a short one); a long answer may still continue on the next page.
      */}
      <View style={styles.questionGap} />
      <View style={styles.questionHead} wrap={false} minPresenceAhead={72}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{String(number).padStart(2, "0")}</Text>
        </View>
        <Text style={styles.questionTitle}>{item.question}</Text>
      </View>

      <View style={styles.answer}>
        {answer.length > 0 ? answer : <Text style={styles.emptyAnswer}>No answer written yet.</Text>}
      </View>
    </View>
  );
}

function Section({ section, styles }: { section: ExportSection; styles: PdfStyles }) {
  const questions = section.questions.map((item, index) => (
    <QuestionBlock key={item.id} item={item} number={index + 1} styles={styles} />
  ));

  if (!section.title) return <>{questions}</>;

  return (
    <View id={`sec-${section.id}`} {...outline(section.title)}>
      <View style={styles.sectionGap} />
      {/* Same rule as questions: never leave a category heading alone at the bottom of a page. */}
      <View style={styles.sectionHead} wrap={false} minPresenceAhead={90}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Text style={styles.sectionCount}>
          {section.questions.length} {plural(section.questions.length, "question")}
        </Text>
      </View>
      {questions}
    </View>
  );
}

export function QuestionsDocument({ data }: { data: ExportData }) {
  const accent = ACCENTS[data.bank];
  const styles = createStyles(accent);

  const dateLabel = dateFormat.format(data.exportedAt);
  const titledSections = data.sections.filter((section) => section.title);
  const runningTitle = data.title.toLowerCase().startsWith(data.bankLabel.toLowerCase())
    ? data.title
    : `${data.bankLabel} · ${data.title}`;

  return (
    <Document
      title={`PrepForge — ${runningTitle}`}
      author="PrepForge"
      creator="PrepForge"
      producer="PrepForge"
      subject={`${data.questionCount} interview ${plural(data.questionCount, "question")}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Accent band: not fixed, so it only appears at the top of the first page. */}
        <View style={styles.topBand} />

        {/* Running header, repeated on every page. */}
        <View fixed style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.headerMark}>
              <Text style={styles.headerMarkText}>{">_"}</Text>
            </View>
            <Text style={styles.headerBrandText}>PrepForge</Text>
          </View>
          <Text style={styles.headerTitle}>{runningTitle}</Text>
        </View>

        <View fixed style={styles.footer}>
          <Text style={styles.footerText}>Exported {dateLabel}</Text>
          <Text fixed style={styles.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

        {/* Hero */}
        <View>
          <Text style={styles.eyebrow}>{data.bankLabel} Bank</Text>
          <Text style={styles.title}>{data.title}</Text>

          <View style={styles.pills}>
            <Pill value={data.questionCount} label={plural(data.questionCount, "question")} styles={styles} />
            {titledSections.length > 0 ? (
              <Pill value={titledSections.length} label={plural(titledSections.length, "category", "categories")} styles={styles} />
            ) : null}
            <Pill value={dateLabel} styles={styles} />
          </View>

          <View style={styles.heroRule}>
            <View style={styles.heroRuleAccent} />
          </View>
        </View>

        {/* Contents: only worth showing when several categories share the document. */}
        {titledSections.length > 1 ? (
          <View style={styles.contents}>
            <Text style={styles.contentsLabel}>Contents</Text>
            {titledSections.map((section) => (
              <View key={section.id} style={styles.contentsRow}>
                <Link src={`#sec-${section.id}`} style={styles.contentsName}>
                  {section.title}
                </Link>
                <Text style={styles.contentsCount}>
                  {section.questions.length} {plural(section.questions.length, "question")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.sections.map((section) => (
          <Section key={section.id} section={section} styles={styles} />
        ))}
      </Page>
    </Document>
  );
}
