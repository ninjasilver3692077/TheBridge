import { createApp } from "./app.js";
import { readEnv } from "./env.js";

const { port } = readEnv();

createApp().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
