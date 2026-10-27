# Spec Delta

## Purpose

Defines the primary navigation of TheBridge, the desktop sidebar and the mobile bottom bar: which section destinations it offers and how it tells the user where they are.

## ADDED Requirements

### Requirement: Navigation lists section destinations only
The desktop sidebar SHALL offer exactly these destinations, in order: Home, Marketplace, My Books, Add Book, Create Listing, Requests, About. The mobile bottom bar SHALL offer Home, Marketplace, My Books, Requests, About. No navigation entry SHALL point to a specific listing.

#### Scenario: Desktop sidebar entries
- **WHEN** a user views any page at a desktop width
- **THEN** the sidebar shows Home, Marketplace, My Books, Add Book, Create Listing, Requests, and About, and no "Listing Details" entry

#### Scenario: Mobile bottom bar entries
- **WHEN** a user views any page at a mobile width
- **THEN** the bottom bar shows Home, Marketplace, My Books, Requests, and About

### Requirement: Navigation marks the current section
The navigation entry whose destination equals the current route SHALL be visually highlighted and exposed to assistive technology as the current page. When the current route matches no entry, no entry SHALL be marked.

#### Scenario: Current section is highlighted
- **WHEN** a user is on the Marketplace page
- **THEN** the Marketplace entry is highlighted and announced as the current page, and no other entry is

#### Scenario: Listing detail page
- **WHEN** a user opens the detail page of any listing
- **THEN** no navigation entry is marked as the current page
