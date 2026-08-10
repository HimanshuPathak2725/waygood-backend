const express = require("express");

const {
  listPopularUniversities,
  listUniversities,
} = require("../controllers/universityController");

const router = express.Router();

router.get("/", listUniversities);
router.get("/popular", listPopularUniversities);

module.exports = router;
