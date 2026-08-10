const asyncHandler = require("../utils/asyncHandler");

const getHealth = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      service: "waygood-evaluation-api",
      timestamp: new Date().toISOString(),
      status: "ok",
    },
  });
});

module.exports = {
  getHealth,
};
