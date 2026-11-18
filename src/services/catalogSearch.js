export function validateCatalogQuery(query) {
  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return "Enter a title, author, or keyword.";
  }

  return trimmed.length < 3 ? "Use at least 3 characters." : "";
}
