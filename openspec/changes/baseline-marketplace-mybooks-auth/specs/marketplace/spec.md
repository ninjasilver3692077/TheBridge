# Spec Delta

## Purpose

Defines how a person discovers books shared by the community on the Marketplace page: the listing grid, live search, filters, counts, statistics, and the quick view of a single listing. It covers community listings only, not the catalog search section.

## ADDED Requirements

### Requirement: Marketplace shows community listings
The Marketplace page SHALL show the built-in sample listings together with every listing published from the same browser, on a single page without pagination. Each card SHALL show the cover, a modality badge, the title, the author, an offer summary, and the condition with the owner.

#### Scenario: Unfiltered grid
- **WHEN** a person opens the Marketplace page on a browser where nothing has been published
- **THEN** 24 listings are shown: 7 Exchange, 5 Loan, 6 Rental, and 6 Sale

#### Scenario: Published listing appears
- **WHEN** a listing is published from the same browser
- **THEN** the Marketplace includes it alongside the sample listings

#### Scenario: Cover that cannot load
- **WHEN** a listing's cover image fails to load
- **THEN** the card shows the book's title in place of the image and keeps the rest of its content

#### Scenario: Live update from another tab
- **WHEN** a listing is published in another tab of the same browser while Marketplace is open
- **THEN** the Marketplace shows the new listing without a reload

### Requirement: Cards summarize the offer by modality
Each card SHALL show a one-line offer summary that depends on the listing's modality. Prices SHALL be shown in Colombian pesos with the currency code.

#### Scenario: Sale summary
- **WHEN** a Sale listing priced 35000 is shown
- **THEN** its card shows "COP 35,000"

#### Scenario: Rental summary
- **WHEN** a Rental listing priced 8000 for 7 days is shown
- **THEN** its card shows "COP 8,000 / 7 days"

#### Scenario: Loan summary
- **WHEN** a Loan listing for 14 days is shown
- **THEN** its card shows "Free loan · 14 days"

#### Scenario: Exchange summary with a wanted book
- **WHEN** an Exchange listing that wants "The Martian" is shown
- **THEN** its card shows "For The Martian"

#### Scenario: Exchange summary without a wanted book
- **WHEN** an Exchange listing with no wanted book is shown
- **THEN** its card shows "Open to offers"

### Requirement: Search filters listings as the person types
The Marketplace SHALL narrow the grid to listings whose title, author, genre, or ISBN contains the typed text, updating on every keystroke and without a submit action. Matching SHALL ignore letter case and accents, and SHALL ignore spaces before and after the text.

#### Scenario: Match by title
- **WHEN** a person types "dune" in the listing search
- **THEN** only "Dune" is shown

#### Scenario: Match by author in another case
- **WHEN** a person types "ORWELL"
- **THEN** only the listing by George Orwell is shown

#### Scenario: Match by ISBN
- **WHEN** a person types "9780441172719"
- **THEN** only "Dune" is shown

#### Scenario: Match by genre
- **WHEN** a person types "science fiction"
- **THEN** only listings in the Science Fiction genre are shown

#### Scenario: Accents are ignored
- **WHEN** a person types "garcia" and a listing's author is "García"
- **THEN** that listing is shown

#### Scenario: Surrounding spaces are ignored
- **WHEN** a person types "  dune  "
- **THEN** "Dune" is shown

#### Scenario: Blank search
- **WHEN** the search holds only spaces
- **THEN** it filters nothing

#### Scenario: Submitting the search form
- **WHEN** a person presses Enter in the listing search
- **THEN** the page does not reload and the results stay the same

### Requirement: Modality, genre, and condition filters combine
The Marketplace SHALL offer a modality filter with the options All, Exchange, Loan, Rental, and Sale, a genre filter, and a condition filter. The genre and condition options SHALL be the distinct values present in the listings, in alphabetical order, after "All". All filters and the search text SHALL apply together, and results SHALL update without a reload.

#### Scenario: Modality filter
- **WHEN** a person chooses "Loan"
- **THEN** only the 5 Loan listings are shown and the "Loan" option is marked as pressed

#### Scenario: Filters combine
- **WHEN** a person chooses the Loan modality and the Fantasy genre
- **THEN** only "The Hobbit" is shown

#### Scenario: Filters and search combine
- **WHEN** a person chooses the Sale modality, the "Like new" condition, and types "habits"
- **THEN** only listings matching all three are shown

#### Scenario: Filter options
- **WHEN** a person opens the genre and condition filters
- **THEN** each starts with "All" and then lists the distinct values alphabetically, such as "Good condition" then "Like new"

### Requirement: Result count is announced
The Marketplace SHALL show how many listings match the current search and filters, using "listing" for exactly one and "listings" otherwise, and SHALL announce changes politely to assistive technology.

#### Scenario: Count with several matches
- **WHEN** 5 listings match
- **THEN** the page shows "5 listings found"

#### Scenario: Count with one match
- **WHEN** exactly one listing matches
- **THEN** the page shows "1 listing found"

#### Scenario: Count is announced
- **WHEN** the count changes after a person types or picks a filter
- **THEN** the new count is exposed in a polite live region

### Requirement: Filters can be cleared
A "Clear filters" action SHALL appear only while the search text or any filter differs from its starting value. Using it SHALL restore the search to empty and every filter to "All".

#### Scenario: Action hidden at start
- **WHEN** a person opens Marketplace without changing anything
- **THEN** no "Clear filters" action is shown next to the count

#### Scenario: Action appears and resets
- **WHEN** a person types a search and chooses a modality, then uses "Clear filters"
- **THEN** the search is empty, every filter is "All", and all listings are shown

### Requirement: No matches shows an empty state
When no listing matches, the grid SHALL be replaced by a message "No listings match your filters" with advice to try another title, author, or ISBN or to remove filters, and a "Clear filters" action.

#### Scenario: Search with no matches
- **WHEN** a person types "zzzz"
- **THEN** the empty state is shown, the count reads "0 listings found", and "Clear filters" restores all listings

### Requirement: Statistics follow the current results
The Marketplace SHALL show a statistics panel computed only from the listings that match the current search and filters. It SHALL show the number of listings shown, the count per modality, and the average sale price and average rental price rounded to whole pesos, or "No priced listings" when none applies.

#### Scenario: Statistics without filters
- **WHEN** the sample listings are shown unfiltered
- **THEN** the panel shows 24 listings shown, 7 Exchange, 5 Loan, 6 Rental, 6 Sale, an average sale price of "COP 36,833", and an average rental price of "COP 8,500"

#### Scenario: Statistics follow a filter
- **WHEN** a person chooses the Loan modality
- **THEN** the panel shows 5 listings shown, 5 Loan, 0 for every other modality, and "No priced listings" for both averages

#### Scenario: Statistics with no matches
- **WHEN** no listing matches
- **THEN** the panel stays visible with 0 listings shown and "No priced listings" for both averages

### Requirement: Selecting a card opens a quick view
Selecting a listing card SHALL open a quick view side panel with the cover, title, author, modality, condition, the offer details for its modality, the description when present, genre, year, publisher, and ISBN rows when present, and the owner with their university when present. The quick view SHALL NOT change the page address.

#### Scenario: Opening a quick view
- **WHEN** a person selects the "The Hobbit" card
- **THEN** a quick view opens showing "The Hobbit", its author, the Loan and "Good condition" badges, the loan duration, and "Shared by" with the owner

#### Scenario: Offer details by modality
- **WHEN** the quick view shows an Exchange, Loan, Rental, or Sale listing
- **THEN** its offer rows are "Wants in exchange", "Loan duration", "Rental price" with "Rental duration", or "Sale price"

#### Scenario: Missing offer terms
- **WHEN** a listing lacks its wanted book, loan duration, rental duration, or price
- **THEN** the row reads "Open to offers" for an Exchange and "To be agreed" for the others

#### Scenario: Missing optional details
- **WHEN** a listing has no year, publisher, or ISBN
- **THEN** the quick view omits those rows

### Requirement: Quick view is an accessible dialog
The quick view SHALL behave as a modal dialog: it SHALL be labeled by the listing title, move focus into itself on open, keep keyboard focus inside while open, lock page scrolling, and close with its "Close quick view" button, a click on the backdrop, or Escape. On close, focus SHALL return to the card that opened it.

#### Scenario: Closing with Escape
- **WHEN** a quick view is open and the person presses Escape
- **THEN** it closes and focus returns to the card that opened it

#### Scenario: Closing with the backdrop
- **WHEN** a person clicks outside the panel
- **THEN** the quick view closes

#### Scenario: Focus stays inside
- **WHEN** focus is on the last control of the quick view and the person presses Tab
- **THEN** focus moves to the first control of the quick view

#### Scenario: Page does not scroll behind
- **WHEN** a quick view is open
- **THEN** the page behind it cannot scroll

### Requirement: Quick view leads to details and requests
The quick view SHALL offer a "View full details" link to the listing's own page and a request action whose label depends on the modality: "Request Exchange", "Request Loan", "Request Rental", or "Request Purchase". Activating the request action SHALL open the request dialog.

#### Scenario: View full details
- **WHEN** a person chooses "View full details" on a listing
- **THEN** the listing's details page opens

#### Scenario: Request action label
- **WHEN** a quick view shows a Sale listing
- **THEN** its request action reads "Request Purchase"

#### Scenario: Opening the request dialog
- **WHEN** a person activates the request action
- **THEN** the request dialog opens

### Requirement: Quick view shows when a request was sent
If the person already has a sent request for the listing that is not rejected, or sends one from the quick view, the request action SHALL become disabled and read "✓ Request sent", and a polite live region SHALL say the simulated request was sent.

#### Scenario: Request already sent
- **WHEN** a quick view opens for a listing with a Pending or Accepted sent request
- **THEN** the request action is disabled and reads "✓ Request sent"

#### Scenario: Rejected request
- **WHEN** a quick view opens for a listing whose only sent request was rejected
- **THEN** the request action is enabled with its modality label

#### Scenario: Sending from the quick view
- **WHEN** a person sends a request from the request dialog
- **THEN** the dialog closes and the quick view shows the disabled "✓ Request sent" action
