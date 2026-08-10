const app = require("./app");
const connectDatabase = require("./config/database");
const env = require("./config/env");

async function startServer() {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Waygood evaluation API running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
