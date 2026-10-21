import { defineArrayMember, defineField } from "sanity";

/** Must match ICON_NAMES in src/content/types.ts. */
export const ICONS = [
  { title: "Telefon", value: "phone" },
  { title: "Aparat", value: "camera" },
  { title: "Drzewo", value: "tree" },
  { title: "Uwaga (trójkąt)", value: "alert-triangle" },
  { title: "Nożyce", value: "scissors" },
  { title: "Pień (walec)", value: "cylinder" },
  { title: "Ciężarówka", value: "truck" },
  { title: "Wiatr", value: "wind" },
  { title: "Dokument", value: "file-text" },
  { title: "Tarcza", value: "shield" },
  { title: "Zegar", value: "clock" },
  { title: "Ptaszek", value: "check" },
  { title: "Strzałka", value: "arrow-right" },
];

export const TOKENS_HELP =
  "Możesz użyć znaczników: {firma} {rok} {miasto} {telefon} {email} {adres} {nip} {godziny} {godzina_zamkniecia} {promien} {termin_oddzwonienia}. Wielka litera ({Termin_oddzwonienia}) = wartość od wielkiej litery.";

type Opts = { description?: string; group?: string; rows?: number; required?: boolean };

export const str = (name: string, title: string, o: Opts = {}) =>
  defineField({
    name,
    title,
    type: "string",
    description: o.description,
    group: o.group,
    validation: o.required === false ? undefined : (r) => r.required(),
  });

export const txt = (name: string, title: string, o: Opts = {}) =>
  defineField({
    name,
    title,
    type: "text",
    rows: o.rows ?? 3,
    description: o.description ?? TOKENS_HELP,
    group: o.group,
    validation: o.required === false ? undefined : (r) => r.required(),
  });

export const bool = (name: string, title: string, o: Opts = {}) =>
  defineField({ name, title, type: "boolean", description: o.description, group: o.group, initialValue: false });

export const icon = (name = "icon", title = "Ikona") =>
  defineField({ name, title, type: "string", options: { list: ICONS, layout: "dropdown" }, validation: (r) => r.required() });

export const strings = (name: string, title: string, o: Opts = {}) =>
  defineField({
    name,
    title,
    type: "array",
    of: [defineArrayMember({ type: "string" })],
    description: o.description,
    group: o.group,
  });

export const navLinks = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "array",
    of: [
      defineArrayMember({
        type: "object",
        name: "navLink",
        fields: [str("label", "Etykieta"), str("href", "Link (np. #uslugi)")],
        preview: { select: { title: "label", subtitle: "href" } },
      }),
    ],
  });

/** Image slot: photo + alt + shot-list label for the striped placeholder (HANDOFF §7). */
export const siteImage = (name: string, title: string, o: Opts = {}) =>
  defineField({
    name,
    title,
    type: "siteImage",
    description: o.description,
    group: o.group,
  });

/** An object field holding one page section. */
export const section = (name: string, title: string, fields: ReturnType<typeof defineField>[]) =>
  defineField({ name, title, type: "object", group: name, options: { collapsible: false }, fields });
