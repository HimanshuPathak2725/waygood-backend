const express = require("express");

const {
  createApplication,
  listApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");

const router = express.Router();

router.get("/", listApplications);
router.post("/", createApplication);
router.patch("/:id/status", updateApplicationStatus);

module.exports = router;
