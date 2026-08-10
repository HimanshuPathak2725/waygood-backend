const Program = require("../models/Program");
const asyncHandler = require("../utils/asyncHandler");

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const listPrograms = asyncHandler(async (req, res) => {
  const {
    country,
    degreeLevel,
    intake,
    field,
    q,
    maxTuition,
    scholarshipAvailable,
    sortBy = "relevance",
    page = 1,
    limit = 10,
  } = req.query;

  const filters = {};

  if (country) {
    filters.country = country;
  }

  if (degreeLevel) {
    filters.degreeLevel = degreeLevel;
  }

  if (field) {
    filters.field = field;
  }

  if (intake) {
    filters.intakes = intake;
  }

  if (maxTuition) {
    filters.tuitionFeeUsd = { $lte: Number(maxTuition) };
  }

  const scholarshipFlag = parseBoolean(scholarshipAvailable);
  if (typeof scholarshipFlag === "boolean") {
    filters.scholarshipAvailable = scholarshipFlag;
  }

  if (q) {
    filters.$or = [
      { title: { $regex: q, $options: "i" } },
      { universityName: { $regex: q, $options: "i" } },
      { field: { $regex: q, $options: "i" } },
    ];
  }

  const pageNumber = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 50);

  const sortMap = {
    tuitionAsc: { tuitionFeeUsd: 1 },
    tuitionDesc: { tuitionFeeUsd: -1 },
    relevance: { scholarshipAvailable: -1, tuitionFeeUsd: 1 },
  };

  const [items, total] = await Promise.all([
    Program.find(filters)
      .sort(sortMap[sortBy] || sortMap.relevance)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Program.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

module.exports = {
  listPrograms,
};
