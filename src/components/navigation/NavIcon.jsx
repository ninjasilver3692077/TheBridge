function NavIcon({ name }) {
  const commonProps = {
    className: "h-5 w-5 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
        </svg>
      );

    case "marketplace":
      return (
        <svg {...commonProps}>
          <path d="M4 7h16M5 7l1-3h12l1 3M5 7v13h14V7M9 11h6M9 15h6" />
        </svg>
      );

    case "books":
      return (
        <svg {...commonProps}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5Z" />
          <path d="M4 6.5v13" />
        </svg>
      );

    case "add":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );

    case "edit":
      return (
        <svg {...commonProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );

    case "requests":
      return (
        <svg {...commonProps}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        </svg>
      );

    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7h.01" />
        </svg>
      );
  }
}

export default NavIcon;
