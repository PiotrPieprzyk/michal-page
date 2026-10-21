export interface QuoteEmail {
  name: string;
  phone: string;
  city: string;
  description: string;
  photos: { name: string; link: string; attached: boolean }[];
  submittedAt: Date;
  siteUrl: string;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function telLink(phone: string) {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  if (!digits.startsWith("+")) digits = digits.length === 9 ? "+48" + digits : "+" + digits;
  return "tel:" + digits;
}

function when(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(d);
}

export function subject(q: QuoteEmail) {
  const where = q.city ? ` — ${q.city}` : "";
  return `Nowe zgłoszenie wyceny${where} — tel. ${q.phone}`;
}

export function textBody(q: QuoteEmail) {
  const lines = [
    "Nowe zgłoszenie z formularza wyceny",
    "",
    `Imię:        ${q.name || "—"}`,
    `Telefon:     ${q.phone}`,
    `Miejscowość: ${q.city || "—"}`,
    `Opis:        ${q.description || "—"}`,
    `Wysłano:     ${when(q.submittedAt)}`,
    "",
  ];
  if (q.photos.length) {
    lines.push(`Zdjęcia (${q.photos.length}) — w załącznikach; linki ważne 30 dni:`);
    q.photos.forEach((p, i) => lines.push(`${i + 1}. ${p.name}: ${p.link}`));
  } else {
    lines.push("Bez zdjęć.");
  }
  lines.push("", `— ${q.siteUrl}`);
  return lines.join("\n");
}

export function htmlBody(q: QuoteEmail) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#5C4A33;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0;font-weight:600">${value}</td></tr>`;
  const photos = q.photos.length
    ? `<p style="margin:20px 0 6px;font-weight:700">Zdjęcia (${q.photos.length})</p>
       <p style="margin:0 0 8px;color:#5C4A33;font-size:13px">W załącznikach. Gdyby się nie otworzyły — linki ważne 30 dni:</p>
       <ol style="margin:0;padding-left:20px">${q.photos
         .map((p) => `<li style="margin:4px 0"><a href="${esc(p.link)}" style="color:#1F3D2B">${esc(p.name)}</a>${p.attached ? "" : " <em>(za duże na załącznik — tylko link)</em>"}</li>`)
         .join("")}</ol>`
    : `<p style="margin:20px 0 0;color:#5C4A33">Bez zdjęć.</p>`;

  return `<!doctype html><html lang="pl"><body style="margin:0;padding:24px;background:#F5EFE4;font-family:Arial,Helvetica,sans-serif;color:#1B1B1B">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D6C2;border-radius:12px;padding:24px">
    <h1 style="margin:0 0 4px;font-size:20px;color:#14291D">Nowe zgłoszenie wyceny</h1>
    <p style="margin:0 0 16px;color:#5C4A33;font-size:13px">${esc(when(q.submittedAt))}</p>
    <p style="margin:0 0 20px"><a href="${telLink(q.phone)}" style="display:inline-block;background:#FF6B1A;color:#1B1B1B;font-weight:800;text-decoration:none;padding:12px 20px;border-radius:10px">Zadzwoń: ${esc(q.phone)}</a></p>
    <table style="border-collapse:collapse;font-size:15px">
      ${row("Imię", esc(q.name || "—"))}
      ${row("Telefon", `<a href="${telLink(q.phone)}" style="color:#1F3D2B">${esc(q.phone)}</a>`)}
      ${row("Miejscowość", esc(q.city || "—"))}
      ${row("Opis", esc(q.description || "—").replace(/\n/g, "<br>"))}
    </table>
    ${photos}
  </div>
  <p style="max-width:560px;margin:12px auto 0;color:#5C4A33;font-size:12px">Wiadomość z formularza na ${esc(q.siteUrl)}</p>
</body></html>`;
}
