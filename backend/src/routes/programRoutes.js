const express = require("express");

const { listPrograms } = require("../controllers/programController");

const router = express.Router();

router.get("/", listPrograms);

module.exports = router;
