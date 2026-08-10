const mongoose = require("mongoose");

const Application = require("../models/Application");
const Program = require("../models/Program");
const Student = require("../models/Student");
const { applicationStatuses, validStatusTransitions } = require("../config/constants");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const listApplications = asyncHandler(async (req, res) => {
  const { studentId, status } = req.query;
  const filters = {};

  if (studentId) {
    filters.student = studentId;
  }

  if (status) {
    filters.status = status;
  }

  const applications = await Application.find(filters)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: applications,
  });
});

const createApplication = asyncHandler(async (req, res) => {
  const { studentId, programId, intake } = req.body;

  if (!studentId || !programId || !intake) {
    throw new HttpError(400, "studentId, programId, and intake are required.");
  }

  if (
    !mongoose.isValidObjectId(studentId) ||
    !mongoose.isValidObjectId(programId)
  ) {
    throw new HttpError(400, "studentId and programId must be valid ids.");
  }

  const [student, program] = await Promise.all([
    Student.findById(studentId).lean(),
    Program.findById(programId).lean(),
  ]);

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  if (!program) {
    throw new HttpError(404, "Program not found.");
  }

  if (!program.intakes.includes(intake)) {
    throw new HttpError(
      400,
      `Program does not offer the "${intake}" intake. Available intakes: ${program.intakes.join(", ")}`
    );
  }

  try {
    const application = await Application.create({
      student: studentId,
      program: programId,
      university: program.university,
      destinationCountry: program.country,
      intake,
      status: "draft",
      timeline: [{ status: "draft", note: "Application created." }],
    });

    const populated = await application.populate([
      { path: "student", select: "fullName email role" },
      { path: "program", select: "title degreeLevel tuitionFeeUsd" },
      { path: "university", select: "name country city" },
    ]);

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    // Mongo duplicate key error from the unique (student, program, intake) index
    if (error.code === 11000) {
      throw new HttpError(
        409,
        "You have already applied to this program for the selected intake."
      );
    }
    throw error;
  }
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Invalid application id.");
  }

  if (!status || !applicationStatuses.includes(status)) {
    throw new HttpError(
      400,
      `status must be one of: ${applicationStatuses.join(", ")}`
    );
  }

  const application = await Application.findById(id);

  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  const currentStatus = application.status;

  if (currentStatus === status) {
    throw new HttpError(400, `Application is already in "${status}" status.`);
  }

  const allowedNextStatuses = validStatusTransitions[currentStatus] || [];

  if (!allowedNextStatuses.includes(status)) {
    throw new HttpError(
      409,
      `Invalid status transition from "${currentStatus}" to "${status}". Allowed next statuses: ${
        allowedNextStatuses.length ? allowedNextStatuses.join(", ") : "none (terminal status)"
      }`
    );
  }

  application.status = status;
  application.timeline.push({
    status,
    note: note || undefined,
    changedAt: new Date(),
  });

  await application.save();

  const populated = await application.populate([
    { path: "student", select: "fullName email role" },
    { path: "program", select: "title degreeLevel tuitionFeeUsd" },
    { path: "university", select: "name country city" },
  ]);

  res.json({
    success: true,
    data: populated,
  });
});

module.exports = {
  createApplication,
  listApplications,
  updateApplicationStatus,
};
