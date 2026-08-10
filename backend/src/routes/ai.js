const express = require("express");
const { generateSopHelper } = require("../controllers/aiController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/sop-helper", requireAuth, generateSopHelper);

module.exports = router;
