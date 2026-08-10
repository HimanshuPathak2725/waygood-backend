const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
      index: true,
    },
    universityName: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    field: {
      type: String,
      required: true,
      index: true,
    },
    degreeLevel: {
      type: String,
      required: true,
      enum: ["bachelor", "master", "diploma", "certificate"],
      index: true,
    },
    tuitionFeeUsd: {
      type: Number,
      required: true,
      index: true,
    },
    intakes: {
      type: [String],
      default: [],
    },
    durationMonths: Number,
    minimumIelts: {
      type: Number,
      default: 0,
    },
    scholarshipAvailable: {
      type: Boolean,
      default: false,
    },
    stem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

programSchema.index({
  country: 1,
  degreeLevel: 1,
  field: 1,
  tuitionFeeUsd: 1,
});

module.exports = mongoose.model("Program", programSchema);
