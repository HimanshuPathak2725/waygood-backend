const asyncHandler = require("../utils/asyncHandler");
const { buildProgramRecommendations } = require("../services/recommendationService");

const getRecommendations = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const payload = await buildProgramRecommendations(studentId);

  res.json({
    success: true,
    ...payload,
  });
});

module.exports = {
  getRecommendations,
};
