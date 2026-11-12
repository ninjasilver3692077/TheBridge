import cors from "cors";
import express from "express";
import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { adminRouter } from "../routes/admin.js";
import { authRouter } from "../routes/auth.js";
import { favoritesRouter } from "../routes/favorites.js";
import { healthRouter } from "../routes/health.js";
import { listingsRouter } from "../routes/listings.js";
import { myBooksRouter } from "../routes/myBooks.js";
import { requestsRouter } from "../routes/requests.js";
import { readEnv } from "./env.js";
import { HttpError, handleErrors, handleNotFound, requireJsonBody } from "./errors.js";

const fifteenMinutes = 15 * 60 * 1000;

function authLimiter(limit: number): RequestHandler {
  return rateLimit({
    windowMs: fifteenMinutes,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many attempts. Try again later.", code: 429 });
    },
  });
}

export function createApp(): express.Express {
  const env = readEnv();
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.clientOrigins.includes(origin)) callback(null, true);
        else callback(new HttpError(403, "Origin not allowed."));
      },
    }),
  );
  app.use(helmet());
  app.use(requireJsonBody);
  app.use(express.json({ limit: "32kb" }));
  app.use("/api/auth/login", authLimiter(10));
  app.use("/api/auth/register", authLimiter(5));
  app.use("/api", healthRouter);
  app.use("/api", authRouter);
  app.use("/api", listingsRouter);
  app.use("/api", myBooksRouter);
  app.use("/api", adminRouter);
  app.use("/api", favoritesRouter);
  app.use("/api", requestsRouter);
  app.use("/api", handleNotFound);
  app.use(handleErrors);

  return app;
}
