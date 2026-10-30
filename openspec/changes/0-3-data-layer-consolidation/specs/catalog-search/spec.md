# Spec Delta

## Purpose

Defines the rules shared by every book search that queries the external book catalog: the Marketplace catalog, Add Book, and the desired-book picker in Create Listing.

## ADDED Requirements

### Requirement: Search requires a meaningful query
Every catalog search SHALL reject an empty query with the message "Enter a title, author, or keyword." and a query shorter than 3 characters (after trimming) with the message "Use at least 3 characters.", without contacting the catalog.

#### Scenario: Empty query
- **WHEN** a user submits a catalog search with an empty or whitespace-only query
- **THEN** the search shows "Enter a title, author, or keyword." and no request is sent

#### Scenario: Two-character query in Add Book
- **WHEN** a user submits "ab" in the Add Book search
- **THEN** the search shows "Use at least 3 characters." and no request is sent

#### Scenario: Valid query
- **WHEN** a user submits a query of 3 or more characters in any catalog search
- **THEN** the catalog is queried and its results, empty state, or error state are shown

### Requirement: Search results show covers consistently
Every catalog search result, and every catalog book saved as a favorite, SHALL show its cover image when the catalog provides one, including favorites saved before this change.

#### Scenario: Previously saved favorite
- **WHEN** a user who saved a favorite before this change opens the Marketplace
- **THEN** that favorite still shows its cover

#### Scenario: Offline search after a successful one
- **WHEN** a user repeats a search while offline after it succeeded online
- **THEN** the saved results are shown with their covers and the saved-data notice
