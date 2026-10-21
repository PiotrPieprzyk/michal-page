export default function NotFound() {
  return (
    <main className="container-page section-pad flex min-h-[60vh] flex-col items-start justify-center gap-4">
      <h1 className="m-0 text-[30px] text-forest-900 lg:text-[48px]">Nie ma takiej strony</h1>
      <a href="/" className="inline-flex min-h-12 items-center font-bold text-forest-800 underline">
        Wróć na stronę główną
      </a>
    </main>
  );
}
