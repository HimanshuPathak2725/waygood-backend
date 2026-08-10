const OpenAI = require("openai");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "demo",
});

const generateSopHelper = asyncHandler(async (req, res) => {
  const { programTitle, universityName, studentBackground } = req.body;

  if (!programTitle || !universityName) {
    throw new HttpError(400, "programTitle and universityName are required.");
  }

  // Graceful fallback when no real API key is configured (assignment/demo mode)
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "demo") {
    return res.json({
      success: true,
      data: {
        programTitle,
        universityName,
        outline: [
          "Paragraph 1: Hook – Why this field excites you (personal story).",
          "Paragraph 2: Academic background & how it prepared you.",
          "Paragraph 3: Why this university & program specifically.",
          "Paragraph 4: Career goals & how this degree bridges the gap.",
          "Paragraph 5: Closing – confident summary & gratitude.",
        ],
        tips: [
          "Keep it under 1,000 words.",
          "Be specific: mention professors, labs, or courses by name.",
          "Avoid clichés like 'I have always been passionate about...'",
          "Proofread twice; grammar mistakes create a poor impression.",
        ],
      },
      meta: { source: "demo-fallback" },
    });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a study-abroad counselor with 10+ years of experience helping students write winning Statements of Purpose.",
      },
      {
        role: "user",
        content: `Help me draft an SOP outline for ${programTitle} at ${universityName}. Student background: ${studentBackground || "Not provided"}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  res.json({
    success: true,
    data: {
      suggestion: completion.choices[0].message.content,
    },
    meta: { source: "openai", model: "gpt-4o-mini" },
  });
});

module.exports = { generateSopHelper };
