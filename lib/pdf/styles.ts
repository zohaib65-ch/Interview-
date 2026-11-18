import { StyleSheet } from "@react-pdf/renderer";

import { COLORS, FONT_MONO, FONT_SANS, type Accent } from "./theme";

const PAGE_PADDING_X = 46;
/** A4 in points. Bars that sit outside the content flow get explicit coordinates and sizes: react-pdf mis-lays out fixed bars sized by left+right/bottom. */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING_X * 2;
const HEADER_HEIGHT = 20;
// Taller than the text needs: react-pdf drops text from a bar that is too short for its padding.
const FOOTER_HEIGHT = 30;

/** All PDF styles for one export; the accent colour depends on the bank being exported. */
export function createStyles(accent: Accent) {
  return StyleSheet.create({
    page: {
      paddingTop: 58,
      paddingBottom: 60,
      paddingHorizontal: PAGE_PADDING_X,
      fontFamily: FONT_SANS,
      fontSize: 10,
      lineHeight: 1.5,
      color: COLORS.body,
      backgroundColor: "#ffffff",
    },

    // ----- page chrome
    topBand: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: accent.base },
    header: {
      position: "absolute",
      top: 22,
      left: PAGE_PADDING_X,
      width: CONTENT_WIDTH,
      height: HEADER_HEIGHT,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      borderBottomWidth: 0.5,
      borderBottomColor: COLORS.line,
    },
    headerBrand: { flexDirection: "row", alignItems: "center" },
    headerMark: {
      width: 11,
      height: 11,
      borderRadius: 3,
      backgroundColor: COLORS.ink,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 5,
    },
    headerMarkText: { fontFamily: FONT_MONO, fontWeight: 700, fontSize: 5, lineHeight: 1, color: "#ffffff" },
    headerBrandText: { fontSize: 8, fontWeight: 700, color: COLORS.ink },
    headerTitle: { fontSize: 8, color: COLORS.faint },
    footer: {
      position: "absolute",
      top: PAGE_HEIGHT - 20 - FOOTER_HEIGHT,
      left: PAGE_PADDING_X,
      width: CONTENT_WIDTH,
      height: FOOTER_HEIGHT,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 7,
      borderTopWidth: 0.5,
      borderTopColor: COLORS.line,
    },
    footerText: { fontSize: 8, color: COLORS.muted },
    // Dynamic text is measured before its content is known, so it needs an explicit box (not a flex row slot).
    footerPage: { position: "absolute", top: 7, right: 0, width: 120, fontSize: 8, color: COLORS.muted, textAlign: "right" },

    // ----- first-page hero
    eyebrow: {
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: accent.ink,
      marginBottom: 7,
    },
    title: { fontSize: 29, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.8, color: COLORS.ink },
    pills: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 0.75,
      borderColor: COLORS.line,
      borderRadius: 11,
      backgroundColor: COLORS.surface,
      paddingVertical: 3.5,
      paddingHorizontal: 10,
      marginRight: 7,
      marginBottom: 4,
    },
    pillValue: { fontSize: 9, fontWeight: 700, color: COLORS.ink },
    pillLabel: { fontSize: 9, color: COLORS.muted, marginLeft: 3 },
    heroRule: { marginTop: 18, height: 0.75, backgroundColor: COLORS.line },
    heroRuleAccent: { width: 46, height: 2.5, marginTop: -1.5, borderRadius: 2, backgroundColor: accent.base },

    // ----- table of contents (whole-bank exports)
    contents: {
      marginTop: 22,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 0.75,
      borderColor: COLORS.line,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
    },
    contentsLabel: {
      fontSize: 7.5,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: COLORS.muted,
      marginBottom: 5,
    },
    contentsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4.5,
      borderTopWidth: 0.5,
      borderTopColor: COLORS.line,
    },
    contentsName: { fontSize: 10, fontWeight: 600, color: COLORS.ink, textDecoration: "none" },
    contentsCount: { fontSize: 9, color: COLORS.muted },

    // ----- category sections
    sectionGap: { height: 26 },
    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 8,
      borderBottomWidth: 1.25,
      borderBottomColor: accent.base,
    },
    sectionTitleRow: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
    sectionDot: { width: 8, height: 8, borderRadius: 2.5, backgroundColor: accent.base, marginRight: 9 },
    sectionTitle: { fontSize: 16, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.3 },
    sectionCount: { fontSize: 8.5, color: COLORS.muted },

    // ----- questions
    questionGap: { height: 18 },
    questionHead: { flexDirection: "row", alignItems: "flex-start" },
    questionNumber: {
      width: 22,
      height: 22,
      borderRadius: 6,
      backgroundColor: accent.tint,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      flexShrink: 0,
    },
    questionNumberText: { fontSize: 8.5, fontWeight: 700, lineHeight: 1, color: accent.ink },
    questionTitle: { flex: 1, paddingTop: 2.5, fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink },
    answer: {
      marginTop: 8,
      marginLeft: 11,
      paddingLeft: 21,
      borderLeftWidth: 1,
      borderLeftColor: COLORS.line,
    },
    emptyAnswer: { fontSize: 9.5, fontStyle: "italic", color: COLORS.faint },

    // ----- answer content
    p: { marginBottom: 6, fontSize: 10, lineHeight: 1.55 },
    liText: { marginBottom: 2, fontSize: 10, lineHeight: 1.55 },
    bold: { fontWeight: 700, color: COLORS.ink },
    italic: { fontStyle: "italic" },
    underline: { textDecoration: "underline" },
    strike: { textDecoration: "line-through" },
    inlineCode: { fontFamily: FONT_MONO, fontSize: 8.8, color: accent.ink, backgroundColor: accent.tint },
    link: { color: accent.ink, textDecoration: "underline" },
    heading1: { marginTop: 8, marginBottom: 4, fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: COLORS.ink },
    heading2: { marginTop: 8, marginBottom: 4, fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: COLORS.ink },
    heading3: { marginTop: 8, marginBottom: 4, fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: COLORS.ink },
    heading4: { marginTop: 6, marginBottom: 3, fontSize: 10.5, fontWeight: 600, lineHeight: 1.3, color: COLORS.ink },
    list: { marginBottom: 6 },
    listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 2 },
    listMarker: { width: 16, fontSize: 10, lineHeight: 1.55, color: accent.base, fontWeight: 700 },
    listBody: { flex: 1 },
    quote: {
      marginTop: 2,
      marginBottom: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderLeftWidth: 2.5,
      borderLeftColor: accent.base,
      backgroundColor: accent.tint,
      borderTopRightRadius: 5,
      borderBottomRightRadius: 5,
    },
    codeBlock: {
      marginTop: 2,
      marginBottom: 8,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderWidth: 0.75,
      borderColor: COLORS.line,
      borderRadius: 6,
      backgroundColor: COLORS.code,
    },
    codeText: { fontFamily: FONT_MONO, fontSize: 8.6, lineHeight: 1.55, color: COLORS.ink },
  });
}

export type PdfStyles = ReturnType<typeof createStyles>;
