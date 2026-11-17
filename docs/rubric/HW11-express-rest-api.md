# HW11 — Express REST API

**Week 11 · DSAW · Universidad de La Sabana**

## Objective

Design and implement the REST API for your project's backend. **Design comes before code.**

## Setup

```bash
mkdir hw11 && cd hw11
npm init -y
npm install express cors dotenv
```

For Vercel, you need a `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

## Deliverables

### `api-design.md` — **write this first**

Before writing a single line of Express, document all your endpoints:

```
GET    /api/items         → Returns all items
GET    /api/items/:id     → Returns one item by ID
POST   /api/items         → Creates an item (body: { name, type })
PUT    /api/items/:id     → Updates an item
DELETE /api/items/:id     → Deletes an item

Standard error response:
{ "error": "Description of the error", "code": 404 }
```

### REST API in `routes/`

- Full CRUD for your project's main entity
- Correct HTTP methods (GET/POST/PUT/DELETE)
- **Consistent error format on ALL endpoints:** `{ error: string, code: number }`
- Data in memory (arrays) for now — MongoDB comes in HW12

### `deployment.txt`

```
https://your-project.vercel.app
```

## Layer 2

Add pagination to your GET all endpoint: `/api/items?page=1&limit=10`.

## AI Log (`AI-LOG.md`)

- Did you use AI to generate the API design or did you think it through first?
- Which REST conventions did you not know and had to research?

## Deployment

Vercel. Test every endpoint with Postman or Thunder Client before submitting.

## Autograding

The pipeline will check:
- ✅ `api-design.md`, `deployment.txt`, `routes/` folder
- ✅ ESLint passes with no errors
- ✅ URL in `deployment.txt` responds with HTTP 200
- ✅ Full CRUD, correct HTTP methods, consistent error format, design doc (reviewed by Claude)

> **Submission rule:** If it is not deployed and public on Vercel, it cannot be graded.
