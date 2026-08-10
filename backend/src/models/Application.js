const mongoose = require("mongoose");

const { applicationStatuses } = require("../config/constants");

const applicationTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: applicationStatuses,
      required: true,
    },
    note: String,
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    destinationCountry: {
      type: String,
      required: true,
      index: true,
    },
    intake: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: applicationStatuses,
      default: "draft",
      index: true,
    },
    timeline: {
      type: [applicationTimelineSchema],
      default: [{ status: "draft", note: "Application created." }],
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ student: 1, program: 1, intake: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
