const Application = require("../models/Application");
const Program = require("../models/Program");
const Student = require("../models/Student");
const cacheService = require("../services/cacheService");
const asyncHandler = require("../utils/asyncHandler");

const getOverview = asyncHandler(async (req, res) => {
  const cacheKey = "dashboard-overview";
  const cachedPayload = cacheService.get(cacheKey);

  if (cachedPayload) {
    return res.json({
      success: true,
      data: cachedPayload,
      meta: { cache: "hit" },
    });
  }

  const [totalStudents, totalPrograms, totalApplications, statusBreakdown, topCountries] =
    await Promise.all([
      Student.countDocuments(),
      Program.countDocuments(),
      Application.countDocuments(),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Application.aggregate([
        { $group: { _id: "$destinationCountry", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

  const payload = {
    totalStudents,
    totalPrograms,
    totalApplications,
    statusBreakdown,
    topCountries,
  };

  cacheService.set(cacheKey, payload);

  res.json({
    success: true,
    data: payload,
    meta: { cache: "miss" },
  });
});

module.exports = {
  getOverview,
};
