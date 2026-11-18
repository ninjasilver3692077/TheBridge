# HW14 — TypeScript Migration

**Week 14 · DSAW · Universidad de La Sabana**

## Objective

Migrate key parts of your project to TypeScript and create a shared types file used by both frontend and backend.

## Setup

```bash
# Frontend (Vite already supports TS — rename files to .tsx)
# Backend
npm install --save-dev typescript @types/node @types/express
npx tsc --init
```

Configure `tsconfig.json` with at least `"strict": true`.

## Deliverables

### `src/types.ts` — shared types file

Define at least 2 interfaces representing your project's main entities, imported and used by **both** frontend and backend:

```typescript
export interface Project {
  _id: string;
  title: string;
  category: 'academic' | 'personal' | 'work';
  owner: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
}
```

### Frontend: 3 components migrated to `.tsx`

- Props typed with interfaces — no `any`, no PropTypes
- `useState<T>` with explicit types where the type is not obvious

### Backend: 2 route files migrated to `.ts`

- `Request` and `Response` typed with Express generics
- Request bodies typed with your interfaces from `types.ts`

### No `any`

`tsc --noEmit` must pass with zero errors. If you see `any` in your code, fix it.

### `deployment.txt`

Updated Vercel URL.

## Layer 2

Configure path aliases in `tsconfig.json` so imports read `@/types` instead of `../../types`.

## AI Log (`AI-LOG.md`)

- Did TypeScript catch any bugs you hadn't noticed? Describe them specifically.
- Which type was hardest to define correctly?

## Deployment

Vercel. Make sure the TypeScript build works in Vercel's pipeline.

## Autograding

The pipeline will check:
- ✅ `tsconfig.json`, `src/types.ts`, `deployment.txt`
- ✅ `tsc --noEmit` passes with no errors
- ✅ URL responds
- ✅ 3 typed .tsx components, 2 typed .ts routes, no `any`, shared types (reviewed by Claude)

> **Submission rule:** If it is not deployed and public on Vercel, it cannot be graded.
