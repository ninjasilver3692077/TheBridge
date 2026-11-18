export function validateCatalogQuery(query) {
  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return "Enter a title, author, or keyword.";
  }

  if (trimmed.length < 3) return "Use at least 3 characters.";
  if (trimmed.length > 100) return "Use 100 characters or fewer.";
  return "";
}

export function normalizeCatalogValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
