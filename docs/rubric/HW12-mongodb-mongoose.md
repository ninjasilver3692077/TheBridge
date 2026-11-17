# HW12 — MongoDB + Mongoose

**Week 12 · DSAW · Universidad de La Sabana**

## Objective

Add real persistence to your API using MongoDB Atlas and Mongoose.

## Setup

```bash
npm install mongoose
```

Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas) and store your connection string in `.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dsaw
```

Add `.env` to `.gitignore`. **Never commit credentials to the repo.**

## Deliverables

### `models/` — Mongoose schemas

Define at least **2 models** with a relationship between them:

```javascript
// models/Project.js
const projectSchema = new mongoose.Schema({
  title:    { type: String, required: true, minlength: 3 },
  category: { type: String, enum: ['academic', 'personal', 'work'] },
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
```

**Validation required in at least one model:**
- `required` for critical fields
- `enum` or `minlength`/`maxlength` where it makes sense
- Sending invalid data must return a `400` with a descriptive error — not a 500 server crash

### `.env.example`

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db_name
PORT=3000
```

### `deployment.txt`

Updated Vercel URL with the API connected to MongoDB.

## Layer 2

Implement an endpoint that uses `populate()` to return related data in a single response. Example: `GET /api/projects` includes the `owner`'s data, not just their ID.

## AI Log (`AI-LOG.md`)

- Did you use AI to define the schemas? What validations did it suggest that you hadn't thought of?
- What happened when you sent data that violated the validations? Did you handle that error correctly?

## Deployment

Vercel + MongoDB Atlas. Set environment variables in the Vercel dashboard.

## Autograding

The pipeline will check:
- ✅ `routes/`, `models/` folders, `deployment.txt`, `.env.example`
- ✅ ESLint passes with no errors
- ✅ URL in `deployment.txt` responds
- ✅ 2 models with relationship, Mongoose validation, 400 on invalid data, data persisted (reviewed by Claude)

> **Submission rule:** If it is not deployed and public on Vercel, it cannot be graded.
