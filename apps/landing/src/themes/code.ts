import type { ThemeRegistration } from "shiki";

interface Palette {
  readonly background: string;
  readonly foreground: string;
  readonly comment: string;
  readonly punctuation: string;
  readonly keyword: string;
  readonly string: string;
  readonly number: string;
  readonly function: string;
  readonly type: string;
  readonly property: string;
  readonly parameter: string;
  readonly tag: string;
  readonly invalid: string;
  readonly inserted: string;
  readonly deleted: string;
}

const createTheme = (name: string, type: "light" | "dark", p: Palette): ThemeRegistration => ({
  name,
  type,
  colors: {
    "editor.background": p.background,
    "editor.foreground": p.foreground,
  },
  tokenColors: [
    { settings: { foreground: p.foreground } },
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: p.comment, fontStyle: "italic" },
    },
    {
      scope: [
        "punctuation",
        "meta.brace",
        "keyword.operator",
        "storage.type.function.arrow",
        "meta.type.annotation punctuation",
      ],
      settings: { foreground: p.punctuation },
    },
    {
      scope: [
        "keyword",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.operator.new",
        "keyword.operator.expression",
        "keyword.control",
        "variable.language.this",
      ],
      settings: { foreground: p.keyword },
    },
    {
      scope: ["string", "string.template", "punctuation.definition.string", "markup.inline.raw"],
      settings: { foreground: p.string },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "support.constant",
        "variable.other.enummember",
      ],
      settings: { foreground: p.number },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function",
      ],
      settings: { foreground: p.function },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.other.inherited-class",
        "support.type",
        "support.class",
        "entity.name.namespace",
        "storage.type.primitive",
      ],
      settings: { foreground: p.type },
    },
    {
      scope: [
        "variable.other.property",
        "variable.other.object.property",
        "meta.object-literal.key",
        "support.type.property-name",
        "support.variable.property",
      ],
      settings: { foreground: p.property },
    },
    { scope: ["variable.parameter"], settings: { foreground: p.parameter } },
    {
      scope: ["entity.name.tag", "support.class.component"],
      settings: { foreground: p.tag },
    },
    { scope: ["entity.other.attribute-name"], settings: { foreground: p.property } },
    {
      scope: ["markup.heading", "entity.name.section"],
      settings: { foreground: p.foreground, fontStyle: "bold" },
    },
    { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    { scope: ["markup.inserted"], settings: { foreground: p.inserted } },
    { scope: ["markup.deleted"], settings: { foreground: p.deleted } },
    { scope: ["invalid"], settings: { foreground: p.invalid } },
  ],
});

/** Zinc-based dark theme matching the site's near-black surfaces. */
export const effectKitDark = createTheme("effect-kit-dark", "dark", {
  background: "#111113",
  foreground: "#e4e4e7",
  comment: "#71717a",
  punctuation: "#a1a1aa",
  keyword: "#c4b5fd",
  string: "#6ee7b7",
  number: "#fdba74",
  function: "#7dd3fc",
  type: "#fde68a",
  property: "#d4d4d8",
  parameter: "#f4f4f5",
  tag: "#f9a8d4",
  invalid: "#f87171",
  inserted: "#6ee7b7",
  deleted: "#fca5a5",
});

/** Light counterpart with the same token roles at AA contrast on white. */
export const effectKitLight = createTheme("effect-kit-light", "light", {
  background: "#fafafa",
  foreground: "#27272a",
  comment: "#71717a",
  punctuation: "#52525b",
  keyword: "#6d28d9",
  string: "#047857",
  number: "#c2410c",
  function: "#0369a1",
  type: "#a16207",
  property: "#3f3f46",
  parameter: "#18181b",
  tag: "#be185d",
  invalid: "#dc2626",
  inserted: "#047857",
  deleted: "#b91c1c",
});
