const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 300,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/waygood-evaluation",
  port: Number(process.env.PORT) || 4000,
  redisUrl: process.env.REDIS_URL || "",
};
