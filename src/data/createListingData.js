export const listingModalities = [
  {
    id: "Exchange",
    label: "Exchange",
    description: "Trade it for another book",
    icon: "🔄",
  },
  {
    id: "Loan",
    label: "Loan",
    description: "Lend it for free for a set time",
    icon: "🤝",
  },
  {
    id: "Rental",
    label: "Rental",
    description: "Rent it for a price and period",
    icon: "📅",
  },
  {
    id: "Sale",
    label: "Sale",
    description: "Sell it for a fixed price",
    icon: "🏷️",
  },
];

export const listingDurations = [
  "7 days",
  "10 days",
  "14 days",
  "21 days",
];

export const modalityMessages = {
  Exchange:
    "Exchange selected. Add the book you would like in return — this is optional.",
  Loan:
    "Loan selected. Choose how long the borrower can keep the book.",
  Rental:
    "Rental selected. Set a price and how long the book is rented.",
  Sale:
    "Sale selected. Set the price for the book.",
};

export const idleModalityMessage =
  "Select an option to see the details it needs.";
