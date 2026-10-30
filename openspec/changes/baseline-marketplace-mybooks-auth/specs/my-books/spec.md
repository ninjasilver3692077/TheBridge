# Spec Delta

## Purpose

Defines the member's personal library on the My Books page, with its statuses, filters, and request activity, and the Add Book flow that finds a book in the public catalog, records its condition, and adds it to the library.

## ADDED Requirements

### Requirement: Library combines sample, starter, and added books
My Books SHALL list the built-in sample books, the starter books described below, and every book the member added from this browser. Sample books SHALL be 7: 2 Available, 4 Published, and 1 Loaned.

#### Scenario: Library on a fresh browser
- **WHEN** a signed-in member opens My Books on a browser where nothing was added and the catalog could not be reached
- **THEN** the page lists the 7 sample books, with filter counts All 7, Available 2, Published 4, and Loaned 1

#### Scenario: Added book appears
- **WHEN** a member adds a book through Add Book and opens My Books
- **THEN** the new book is listed as Available

#### Scenario: Live update from another tab
- **WHEN** a book is added in another tab of the same browser while My Books is open
- **THEN** My Books shows it without a reload

### Requirement: Starter books are added once from the catalog
The first time the application loads in a browser, it SHALL try to add up to four books from the public catalog to the library, each Available, with a cover and a known author. If the catalog cannot be reached and no saved result exists, it SHALL add none and SHALL try again on a later load. Once added, they SHALL NOT be added again.

#### Scenario: Catalog reachable on first load
- **WHEN** the application loads for the first time and the catalog responds
- **THEN** up to four extra Available books appear in My Books, and the library stays the same on later loads

#### Scenario: Catalog unreachable on first load
- **WHEN** the application loads for the first time and the catalog cannot be reached
- **THEN** no starter books are added and the next load tries again

### Requirement: Each book shows its identity and status
Each library card SHALL show the cover, or "Cover unavailable" when there is none, a status badge reading Available, Published, or Loaned, the title, the author, and the genre and condition joined by a dot when present.

#### Scenario: Card content
- **WHEN** a book with a cover, genre "Fantasy", and condition "Good condition" is shown
- **THEN** its card shows the cover, its status badge, the title, the author, and "Fantasy · Good condition"

#### Scenario: Book without a cover
- **WHEN** a book has no cover image
- **THEN** its card shows "Cover unavailable" in place of the image

### Requirement: Library can be filtered by status
My Books SHALL offer the filters All, Available, Published, and Loaned in a group labeled "Filter personal books", each showing its count. The selected filter SHALL be marked as pressed, and counts SHALL cover the whole library regardless of the selected filter.

#### Scenario: Filtering by status
- **WHEN** a member selects "Published" with the 7 sample books
- **THEN** 4 books are shown and the "Published" filter is marked as pressed

#### Scenario: Counts ignore the selected filter
- **WHEN** a member selects "Loaned"
- **THEN** the counts on every filter stay the same

#### Scenario: Filter with no books
- **WHEN** a member selects a status that no book in the library has, such as "Loaned"
- **THEN** the grid is replaced by "No loaned books" with the advice to try another filter or add a new book

### Requirement: Library order is random per visit
My Books SHALL show the books in a random order chosen when the page opens, and SHALL keep that order while the page stays open, including when the filter changes.

#### Scenario: Order within a visit
- **WHEN** a member changes filters several times without leaving the page
- **THEN** the books that remain visible keep their relative order

### Requirement: Each status offers a suitable action
A free Available book SHALL offer a "Create Listing" action that opens Create Listing with that book selected. A Published book SHALL say "Listed as" followed by its modality and link to the Marketplace. A Loaned book SHALL say "Loaned to" followed by the borrower, or "Member" when unknown.

#### Scenario: Available book
- **WHEN** a member views an Available book with no activity
- **THEN** its card offers "Create Listing", which opens Create Listing for that book

#### Scenario: Published book
- **WHEN** a member views a book published as a Loan
- **THEN** its card says "Listed as Loan" and links to the Marketplace

#### Scenario: Loaned book
- **WHEN** a member views a book loaned to "Sara J."
- **THEN** its card says "Loaned to Sara J."

### Requirement: Requests change what a book shows
A book tied to a Pending or Accepted request SHALL show an activity badge and the other person's name, and an Accepted request SHALL outrank a Pending one. On an Available book the note replaces the "Create Listing" action; on a Published book it appears below the "Listed as" line. A received Pending request SHALL read "Request pending"; a sent exchange request SHALL read "Exchange request pending" when Pending and "Reserved for exchange" when Accepted. A Rejected request SHALL change nothing.

#### Scenario: Received request pending
- **WHEN** a Published book has a received Pending request from "Isabella C."
- **THEN** its card still says "Listed as" its modality and also shows "Request pending" with "with Isabella C."

#### Scenario: Sent exchange request
- **WHEN** an Available book is the offered book of a sent Pending exchange request to "David M."
- **THEN** its card shows "Exchange request pending" with "with David M." and no "Create Listing" action

#### Scenario: Sent exchange accepted
- **WHEN** that sent exchange request becomes Accepted
- **THEN** the card shows "Reserved for exchange"

#### Scenario: Accepted outranks pending
- **WHEN** a book has both a Pending and an Accepted received request
- **THEN** the card reflects the Accepted request and the person who sent it

#### Scenario: Rejected request
- **WHEN** a book's only request is Rejected
- **THEN** the card looks as it would with no request

### Requirement: Accepted requests set the outcome by modality
When a received request is Accepted, a Loan book SHALL become Loaned to the requester and move to the Loaned count. A Rental book SHALL show "Rental accepted". A Sale or Exchange book SHALL show "Reserved". The requester's name SHALL appear in each case.

#### Scenario: Accepted loan
- **WHEN** a member accepts a received request on a Published Loan book
- **THEN** the book's status becomes Loaned, the card says "Loaned to" followed by the requester, and the Loaned count rises by one

#### Scenario: Accepted rental
- **WHEN** a received request on a Published Rental book is Accepted
- **THEN** the card keeps the Published status and shows "Rental accepted" with the requester

#### Scenario: Accepted sale
- **WHEN** a received request on a Published Sale book is Accepted
- **THEN** the card keeps the Published status and shows "Reserved" with the requester

#### Scenario: Live update after a decision
- **WHEN** a request changes in another tab of the same browser while My Books is open
- **THEN** My Books shows the new activity without a reload

### Requirement: My Books leads to Add Book
The My Books page SHALL offer an "Add book" link to the Add Book page.

#### Scenario: Add book link
- **WHEN** a member activates "Add book"
- **THEN** the Add Book page opens

### Requirement: Add Book search validates its input
Add Book SHALL offer a search field labeled "Find a book to add" with a Search action, and SHALL credit the catalog as Open Library. A search shorter than two characters after trimming SHALL NOT run, SHALL show "Enter at least 2 characters to search." as an alert, and SHALL mark the field invalid until the person types again.

#### Scenario: Search too short
- **WHEN** a member submits "a" or only spaces
- **THEN** no search runs, the message "Enter at least 2 characters to search." appears, and the field is marked invalid

#### Scenario: Message clears on typing
- **WHEN** a member types in the field after seeing the message
- **THEN** the message disappears

### Requirement: Add Book search shows each state
Add Book SHALL show a distinct state for each stage of a search. Before any search it SHALL say "Search the catalog to find the physical book you want to add." While searching it SHALL say "Searching the catalog..." as a status. With results it SHALL say how many books were found for the query. With none it SHALL say no books were found for the query. After a failure it SHALL say "We could not complete the search." with a "Try again" action.

#### Scenario: Initial state
- **WHEN** a member opens Add Book
- **THEN** the page shows the prompt to search the catalog and no results

#### Scenario: Loading state
- **WHEN** a valid search is running
- **THEN** the page shows "Searching the catalog..." announced as a status

#### Scenario: Results state
- **WHEN** a search for "dune" returns 7 books
- **THEN** the page shows 7 result cards and the count 7 books found for "dune"

#### Scenario: Single result wording
- **WHEN** a search returns exactly one book
- **THEN** the count reads "1 book found" for that query

#### Scenario: No results
- **WHEN** a search returns nothing
- **THEN** the page says no books were found for the query and offers "Clear search"

#### Scenario: Error and retry
- **WHEN** a search fails and no saved result exists for that query
- **THEN** the page shows "We could not complete the search." and "Try again" runs the same search again

#### Scenario: Saved results as fallback
- **WHEN** a search fails but the same query succeeded earlier in this browser
- **THEN** the earlier results are shown instead of the error

#### Scenario: Clearing results
- **WHEN** a member uses "Clear" or "Clear search"
- **THEN** the field empties and the page returns to the initial state

### Requirement: Search results can be selected
Each result card SHALL show the cover or "Cover unavailable", the title, the author, and the year and publisher when known, with a "Select" action named "Select" followed by the title and author. A search SHALL show at most 20 results.

#### Scenario: Result card content
- **WHEN** a result has year 1965 and publisher "Ace"
- **THEN** its card shows "1965 · Ace" below the author

#### Scenario: Selecting a result
- **WHEN** a member selects a result
- **THEN** the "Confirm your copy" step opens for that book

### Requirement: Confirm step captures the physical copy
The confirm step SHALL show the selected book's cover, title, author, and its year, publisher, language (as its English name), and ISBN, omitting any that is unknown. It SHALL ask for a condition from "Like new", "Good condition", and "Used copy", none selected at first, and for optional notes limited to 300 characters with a live "n/300" counter.

#### Scenario: Confirm step content
- **WHEN** the confirm step opens
- **THEN** it shows the book's details, three unselected condition options, and an empty notes field showing "0/300"

#### Scenario: Notes limit
- **WHEN** a member types notes
- **THEN** the field accepts at most 300 characters and the counter shows the current length

#### Scenario: Back to search keeps results
- **WHEN** a member uses "← Back to search" from the confirm step
- **THEN** the previous query and results are still shown

### Requirement: Condition is required to add a book
Submitting the confirm step without a condition SHALL NOT add a book. It SHALL show "Select the condition of your copy." and mark the condition options invalid, and SHALL clear that error once a condition is chosen.

#### Scenario: Missing condition
- **WHEN** a member activates "Add to My Library" without choosing a condition
- **THEN** nothing is saved and the message "Select the condition of your copy." appears

#### Scenario: Error clears
- **WHEN** a member then chooses a condition
- **THEN** the message disappears

### Requirement: Adding a book saves it as Available
Submitting a valid confirm step SHALL save the book to the member's library with the chosen condition and the trimmed notes, with status Available. It SHALL show a success screen "Added to your library" stating the title and author and that the book is Available. The saved book SHALL stay after a reload.

#### Scenario: Successful add
- **WHEN** a member chooses "Like new" and activates "Add to My Library"
- **THEN** the success screen appears with "Added to your library" and the book is in My Books as Available with the condition "Like new"

#### Scenario: Notes are trimmed
- **WHEN** a member types "  highlighted  " as notes and adds the book
- **THEN** the saved book's notes are "highlighted"

#### Scenario: Same book twice
- **WHEN** a member adds the same catalog book twice
- **THEN** My Books lists it twice, as two separate copies

#### Scenario: Book persists
- **WHEN** a member reloads the application after adding a book
- **THEN** the book is still in My Books

### Requirement: Success screen offers next steps
The success screen SHALL offer "Go to My Books" and "Add another book". The page header SHALL be hidden on the success screen. "Add another book" SHALL return to an empty search.

#### Scenario: Going to My Books
- **WHEN** a member chooses "Go to My Books"
- **THEN** My Books opens

#### Scenario: Adding another book
- **WHEN** a member chooses "Add another book"
- **THEN** the Add Book search appears empty, in its initial state
