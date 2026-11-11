import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express from "express";
import mongoose from "mongoose";
import { handleErrors } from "../server/errors.js";

test("transaction errors distinguish uncertain commit, confirmed contention and storage loss", async () => {
  const app = express();
  app.get("/:kind", (req, _res, next) => {
    if (req.params.kind === "uncertain") {
      const error = new mongoose.mongo.MongoServerError({ message: "private database details" });
      error.addErrorLabel("UnknownTransactionCommitResult");
      next(error);
    } else if (req.params.kind === "conflict") next(new mongoose.mongo.MongoServerError({ message: "private details", code: 112 }));
    else next(new mongoose.mongo.MongoNetworkError("private database hostname"));
  });
  app.use(handleErrors);
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    for (const [kind, expected] of [["uncertain", 503], ["conflict", 409], ["network", 503]] as const) {
      const response = await fetch(`${base}/${kind}`);
      assert.equal(response.status, expected);
      const body = await response.json() as { error: string; code: number };
      assert.equal(body.code, expected);
      assert.doesNotMatch(body.error, /private/);
      if (kind === "uncertain") assert.match(body.error, /uncertain/);
    }
  } finally { server.close(); }
});
