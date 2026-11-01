import { Router } from "express";
import { requireDatabase } from "../server/db.js";
import { methodNotAllowed } from "../server/errors.js";

export const healthRouter = Router();

healthRouter
  .route("/health")
  .get(requireDatabase, (_req, res) => {
    res.json({ data: { status: "ok" } });
  })
  .all(methodNotAllowed(["GET", "HEAD"]));
