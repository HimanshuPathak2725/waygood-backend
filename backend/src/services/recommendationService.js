const mongoose = require("mongoose");

const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

/**
 * Recommendation weighting. Kept as constants so the scoring logic is easy
 * to tune/inspect without digging through the pipeline stages below.
 */
const WEIGHTS = {
  country: 35,
  field: 30,
  budget: 20,
  intake: 10,
  ielts: 5,
};

/**
 * Builds a MongoDB aggregation pipeline that scores every candidate program
 * against a single student's preferences, entirely inside the database.
 *
 * Why aggregation instead of the previous "fetch + score in JS" approach:
 *  - Scoring, sorting, and limiting all happen in MongoDB, so only the
 *    top N documents are ever sent back to Node (candidate sets for a
 *    catalog this size are cheap, but this keeps the same code correct
 *    if the catalog grows to hundreds of thousands of programs).
 *  - We can lean on the existing indexes (country, field, degreeLevel,
 *    tuitionFeeUsd) for the initial $match instead of a full collection
 *    scan, since aggregation pipelines still use indexes on early $match
 *    stages.
 */
function buildRecommendationPipeline(student) {
  const targetCountries = student.targetCountries || [];
  const interestedFields = student.interestedFields || [];
  const maxBudgetUsd =
    typeof student.maxBudgetUsd === "number" ? student.maxBudgetUsd : null;
  const preferredIntake = student.preferredIntake || null;
  const ieltsScore = student.englishTest?.score || 0;

  return [
    // Narrow the candidate set first so downstream stages work on less data
    // and can use the country/field indexes defined on Program.
    {
      $match: {
        $or: [
          { country: { $in: targetCountries } },
          { field: { $in: interestedFields } },
        ],
      },
    },
    {
      $addFields: {
        countryMatch: { $in: ["$country", targetCountries] },
        fieldMatch: {
          $anyElementTrue: {
            $map: {
              input: interestedFields,
              as: "interest",
              in: {
                $regexMatch: {
                  input: "$field",
                  regex: { $concat: ["", "$$interest"] },
                  options: "i",
                },
              },
            },
          },
        },
        budgetMatch:
          maxBudgetUsd === null
            ? false
            : { $lte: ["$tuitionFeeUsd", maxBudgetUsd] },
        intakeMatch: preferredIntake
          ? { $in: [preferredIntake, "$intakes"] }
          : false,
        ieltsMatch: { $gte: [ieltsScore, "$minimumIelts"] },
      },
    },
    {
      $addFields: {
        matchScore: {
          $add: [
            { $cond: ["$countryMatch", WEIGHTS.country, 0] },
            { $cond: ["$fieldMatch", WEIGHTS.field, 0] },
            { $cond: ["$budgetMatch", WEIGHTS.budget, 0] },
            { $cond: ["$intakeMatch", WEIGHTS.intake, 0] },
            { $cond: ["$ieltsMatch", WEIGHTS.ielts, 0] },
          ],
        },
      },
    },
    // Only keep programs that matched on at least one dimension.
    { $match: { matchScore: { $gt: 0 } } },
    { $sort: { matchScore: -1, tuitionFeeUsd: 1 } },
    { $limit: 5 },
    {
      $project: {
        title: 1,
        universityName: 1,
        university: 1,
        country: 1,
        city: 1,
        field: 1,
        degreeLevel: 1,
        tuitionFeeUsd: 1,
        intakes: 1,
        minimumIelts: 1,
        scholarshipAvailable: 1,
        matchScore: 1,
        countryMatch: 1,
        fieldMatch: 1,
        budgetMatch: 1,
        intakeMatch: 1,
        ieltsMatch: 1,
      },
    },
  ];
}

function buildReasons(program, student) {
  const reasons = [];

  if (program.countryMatch) {
    reasons.push(`Preferred country match: ${program.country}`);
  }

  if (program.fieldMatch) {
    reasons.push(`Field alignment: ${program.field}`);
  }

  if (program.budgetMatch) {
    reasons.push(
      `Within budget range (tuition $${program.tuitionFeeUsd} <= budget $${student.maxBudgetUsd})`
    );
  }

  if (program.intakeMatch) {
    reasons.push(`Preferred intake available: ${student.preferredIntake}`);
  }

  if (program.ieltsMatch) {
    reasons.push(
      `English test score meets requirement (${student.englishTest?.score || 0} >= ${program.minimumIelts})`
    );
  }

  return reasons;
}

async function buildProgramRecommendations(studentId) {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new HttpError(400, "Invalid student id.");
  }

  const student = await Student.findById(studentId).lean();

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  const pipeline = buildRecommendationPipeline(student);
  const results = await Program.aggregate(pipeline);

  const recommendations = results.map((program) => {
    const { countryMatch, fieldMatch, budgetMatch, intakeMatch, ieltsMatch, ...rest } =
      program;

    return {
      ...rest,
      matchScore: program.matchScore,
      reasons: buildReasons(program, student),
    };
  });

  return {
    data: {
      student: {
        id: student._id,
        fullName: student.fullName,
        targetCountries: student.targetCountries,
        interestedFields: student.interestedFields,
        maxBudgetUsd: student.maxBudgetUsd,
        preferredIntake: student.preferredIntake,
      },
      recommendations,
    },
    meta: {
      implementationStatus: "mongodb-aggregation",
      weights: WEIGHTS,
    },
  };
}

module.exports = {
  buildProgramRecommendations,
};
