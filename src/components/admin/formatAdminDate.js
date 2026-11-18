export function formatAdminDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", { dateStyle: "medium" });
}
