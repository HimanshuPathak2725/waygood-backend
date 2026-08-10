const jwt = require("jsonwebtoken");

const env = require("../config/env");
const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(student) {
  return jwt.sign({ sub: student._id.toString(), role: student.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function sanitizeStudent(student) {
  const plain = typeof student.toObject === "function" ? student.toObject() : student;
  delete plain.password;
  return plain;
}

const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    role,
    targetCountries,
    interestedFields,
    preferredIntake,
    maxBudgetUsd,
    englishTest,
  } = req.body;

  if (!fullName || !email || !password) {
    throw new HttpError(400, "fullName, email, and password are required.");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new HttpError(400, "A valid email address is required.");
  }

  if (String(password).length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long.");
  }

  if (role && !["student", "counselor"].includes(role)) {
    throw new HttpError(400, "role must be either 'student' or 'counselor'.");
  }

  const existing = await Student.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const student = await Student.create({
    fullName,
    email,
    password,
    role: role || "student",
    targetCountries,
    interestedFields,
    preferredIntake,
    maxBudgetUsd,
    englishTest,
  });

  const token = signToken(student);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: sanitizeStudent(student),
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "email and password are required.");
  }

  const student = await Student.findOne({ email: email.toLowerCase().trim() });

  if (!student) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const isMatch = await student.comparePassword(password);

  if (!isMatch) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = signToken(student);

  res.json({
    success: true,
    data: {
      token,
      user: sanitizeStudent(student),
    },
  });
});

const me = asyncHandler(async (req, res) => {
  // req.user is already password-free (populated by requireAuth middleware)
  res.json({
    success: true,
    data: req.user,
  });
});

module.exports = {
  register,
  login,
  me,
};
