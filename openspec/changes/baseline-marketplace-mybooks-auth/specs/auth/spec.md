# Spec Delta

## Purpose

Defines which parts of TheBridge need a signed-in member and how the academic prototype signs a person in and keeps them signed in, so protected areas stay behind a clearly labeled, local-only access check.

## ADDED Requirements

### Requirement: Protected areas require a session
The My Books, Add Book, Create Listing, and Requests pages SHALL be shown only to a person with a member session. A person without one who opens any of them SHALL be sent to the sign-in page, and the protected page SHALL NOT flash before the redirect.

#### Scenario: Visiting a protected page without a session
- **WHEN** a person with no session opens the My Books page
- **THEN** the sign-in page is shown and My Books content is never rendered

#### Scenario: Every protected page redirects
- **WHEN** a person with no session opens Add Book, Create Listing, or Requests
- **THEN** each one shows the sign-in page

#### Scenario: Visiting a protected page with a session
- **WHEN** a person with a member session opens any of the four protected pages
- **THEN** that page is shown

#### Scenario: Back button after the redirect
- **WHEN** a person without a session is redirected to sign-in and presses the browser's back button
- **THEN** they do not return to the protected page, because the redirect replaced that history entry

### Requirement: Public areas need no session
Home, Marketplace, Listing Details, About, and the sign-in page SHALL be reachable without a session. An address that matches no page SHALL show the "Page not found" page, with or without a session.

#### Scenario: Public pages without a session
- **WHEN** a person with no session opens Home, Marketplace, a listing's details, About, or the sign-in page
- **THEN** the page is shown and no redirect happens

#### Scenario: Unknown address
- **WHEN** a person opens an address that matches no page
- **THEN** the "Page not found" page is shown and offers a "Return home" link

### Requirement: Navigation does not hide protected destinations
The navigation SHALL list the same entries whether or not a session exists. Choosing a protected entry without a session SHALL lead to the sign-in page.

#### Scenario: Protected entries without a session
- **WHEN** a person with no session views the navigation
- **THEN** My Books, Add Book, Create Listing, and Requests are listed like every other entry

#### Scenario: Choosing a protected entry without a session
- **WHEN** a person with no session chooses "Requests" in the navigation
- **THEN** the sign-in page is shown

### Requirement: Sign-in is a single member action
The sign-in page SHALL offer one action, "Continue as member", and SHALL NOT ask for an email, a password, or any other credential. Activating it SHALL start a member session and take the person to My Books, replacing the sign-in page in the browser history.

#### Scenario: Signing in
- **WHEN** a person activates "Continue as member"
- **THEN** a member session starts and the My Books page is shown

#### Scenario: No credential fields
- **WHEN** a person views the sign-in page
- **THEN** it shows no email, password, or other credential field

#### Scenario: Destination after sign-in
- **WHEN** a person is redirected to sign-in from the Requests page and then signs in
- **THEN** they land on My Books, not on Requests

### Requirement: Sign-in is disclosed as a prototype
The sign-in page SHALL state that the prototype uses a local authentication flag to demonstrate protected routes, so it does not present itself as real account security.

#### Scenario: Prototype disclosure
- **WHEN** a person views the sign-in page
- **THEN** the page says the prototype uses a local authentication flag to demonstrate protected routes

### Requirement: A session persists until browser data is cleared
A member session SHALL survive page reloads, new tabs, and browser restarts on the same browser profile. It SHALL NOT expire on a timer, and the application SHALL NOT offer a way to end it.

#### Scenario: Reload keeps the session
- **WHEN** a signed-in person reloads a protected page
- **THEN** the page is shown again without a redirect

#### Scenario: Session survives closing the browser
- **WHEN** a signed-in person closes and reopens the browser and opens a protected page
- **THEN** the page is shown without signing in again

#### Scenario: No sign-out control
- **WHEN** a signed-in person looks for a way to sign out in the header, navigation, or any page
- **THEN** no sign-out control exists

#### Scenario: Clearing site data ends the session
- **WHEN** a signed-in person clears the site's stored data and opens a protected page
- **THEN** the sign-in page is shown

### Requirement: Sign-in page is open to signed-in members
A signed-in person who opens the sign-in page SHALL still see it, and SHALL NOT be redirected away.

#### Scenario: Visiting sign-in while signed in
- **WHEN** a signed-in person opens the sign-in page
- **THEN** the sign-in page is shown with its "Continue as member" action
