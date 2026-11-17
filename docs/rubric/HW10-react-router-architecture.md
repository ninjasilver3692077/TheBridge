# HW10 — React Router + Architecture

**Week 10 · DSAW · Universidad de La Sabana**

## Objective

Complete the frontend of your project with routing and a clean component architecture. This is Milestone 2.

## Deliverables

### Complete React frontend

All screens from your Figma wireframes implemented in React with working routing.

#### Routing (React Router v6)

```bash
npm install react-router-dom
```

Requirements:
- `BrowserRouter` + `Routes` + `Route`
- **At least 3 distinct routes**
- **At least 1 dynamic route** using `useParams`:  
  Example: `/items/:id` that shows the detail of a specific item
- **404 page:** any undefined URL shows a Not Found page
- **Protected route:** if the user is not "authenticated" (flag in `localStorage`), redirect to `/login`

#### Architecture

- `src/pages/` or `src/views/` for page-level components (one per route)
- `src/components/` for reusable components
- **No mock data inside components** — move it to separate `src/data/` files
- No component should exceed ~80 lines — extract if necessary

## Layer 2

Implement breadcrumbs or a navigation bar that visually marks the current route using `useLocation`.

## AI Log (`AI-LOG.md`)

- Did you ask AI for the folder structure? Did you follow it exactly or modify it?
- Which architecture decision was hardest to make and why?

## Deployment

GitHub Pages. Note: `BrowserRouter` requires special configuration on GitHub Pages. Research how to handle it or use `HashRouter` as an alternative.

## Autograding

The pipeline will check:
- ✅ `package.json` with react-router-dom, `src/App.jsx`, `src/components/` and `src/pages/` folders
- ✅ ESLint passes with no errors
- ✅ GitHub Pages responds
- ✅ Complete routing, dynamic route, 404, protected route, all screens (reviewed by Claude)

> **Submission rule:** If it is not deployed and public, it cannot be graded.
> **This is Milestone 2:** your team will present this frontend in class (oral defense).
