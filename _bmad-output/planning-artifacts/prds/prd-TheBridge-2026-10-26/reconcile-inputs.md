# Input reconciliation — TheBridge PRD

- **Brief:** covered (roles, scope, non-goals, success by week).
- **Rubric addendum:** gap — HW13 stores the token in browser storage, but NFR-16 says the theme is the only direct browser-storage use. Fix: limit NFR-16 to code outside `src/services/*`. Gap — HW13 "no hardcoded data files with arrays": `aboutContent.js` and `navigation.js` are arrays; add to Open Question 4.
- **README user stories US-01..US-06:** covered by FR-13, FR-13, FR-8, FR-10, FR-17, FR-19.
- **DECISIONS:** covered (Exchange "Open to offers", in-person handoff, services boundary).
- **Code:** Home summary = Community listings, Sharing modes, Exchange options, Books for sale, plus 4 newest listings; reflected in FR-16 fix.
