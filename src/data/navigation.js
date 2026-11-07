export const navigationItems = [
  { id: "home", label: "Home", path: "/", icon: "home", mobile: true, audience: "everyone" },
  {
    id: "marketplace",
    label: "Marketplace",
    path: "/marketplace",
    icon: "marketplace",
    mobile: true,
    audience: "everyone",
  },
  {
    id: "my-books",
    label: "My Books",
    path: "/my-books",
    icon: "books",
    mobile: true,
    audience: "Member",
  },
  { id: "add-book", label: "Add Book", path: "/add-book", icon: "add", audience: "Member" },
  {
    id: "create-listing",
    label: "Create Listing",
    path: "/create-listing",
    icon: "edit",
    audience: "Member",
  },
  {
    id: "requests",
    label: "Requests",
    path: "/requests",
    icon: "requests",
    mobile: true,
    audience: "Member",
  },
  {
    id: "admin",
    label: "Admin Area",
    path: "/admin",
    icon: "admin",
    mobile: true,
    audience: "Admin",
  },
  { id: "about", label: "About", path: "/about", icon: "about", mobile: true, audience: "everyone" },
  {
    id: "sign-in",
    label: "Sign in",
    path: "/login",
    icon: "sign-in",
    mobile: true,
    audience: "Guest",
  },
];

export function navigationItemsFor(role) {
  const audience = role ?? "Guest";
  return navigationItems.filter(
    (item) => item.audience === "everyone" || item.audience === audience,
  );
}
