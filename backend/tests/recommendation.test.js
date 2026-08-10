process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../src/app");
const Student = require("../src/models/Student");
const University = require("../src/models/University");
const Program = require("../src/models/Program");
const { connect, closeDatabase, clearDatabase } = require("./setup");

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

async function seedRecommendationData() {
  const student = await Student.create({
    fullName: "Aarav Sharma",
    email: "aarav.rec@example.com",
    password: "SecurePass123!",
    targetCountries: ["Canada", "USA"],
    interestedFields: ["Computer Science", "Data Science"],
    maxBudgetUsd: 25000,
    preferredIntake: "Fall 2026",
    englishTest: { exam: "IELTS", score: 7.5 },
  });

  const uni1 = await University.create({
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    partnerType: "direct",
    qsRanking: 25,
    popularScore: 95,
  });

  const uni2 = await University.create({
    name: "Oxford University",
    country: "UK",
    city: "Oxford",
    partnerType: "direct",
    qsRanking: 3,
    popularScore: 98,
  });

  // Perfect match: Canada + CS + budget ok + intake + IELTS
  const prog1 = await Program.create({
    university: uni1._id,
    universityName: uni1.name,
    country: "Canada",
    city: "Toronto",
    title: "BSc Computer Science",
    field: "Computer Science",
    degreeLevel: "bachelor",
    tuitionFeeUsd: 20000,
    intakes: ["Fall 2026", "Winter 2027"],
    minimumIelts: 6.5,
  });

  // Partial match: different country, different field
  const prog2 = await Program.create({
    university: uni2._id,
    universityName: uni2.name,
    country: "UK",
    city: "Oxford",
    title: "BA History",
    field: "History",
    degreeLevel: "bachelor",
    tuitionFeeUsd: 35000,
    intakes: ["Fall 2026"],
    minimumIelts: 7.0,
  });

  return { student, prog1, prog2 };
}

describe("Recommendation engine", () => {
  it("returns top matching programs with scores and reasons", async () => {
    const { student } = await seedRecommendationData();

    const res = await request(app).get(`/api/recommendations/${student._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.recommendations[0].country).toBe("Canada");
    expect(res.body.data.recommendations[0].matchScore).toBeGreaterThan(0);
    expect(res.body.data.recommendations[0].reasons.length).toBeGreaterThan(0);
    expect(res.body.data.meta.implementationStatus).toBe("mongodb-aggregation");
  });

  it("returns empty array when student has no matching preferences", async () => {
    const student = await Student.create({
      fullName: "No Match",
      email: "nomatch@example.com",
      password: "SecurePass123!",
      targetCountries: ["Antarctica"],
      interestedFields: ["Underwater Basket Weaving"],
      maxBudgetUsd: 100,
      preferredIntake: "Spring 2099",
      englishTest: { exam: "IELTS", score: 2 },
    });

    const res = await request(app).get(`/api/recommendations/${student._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.recommendations).toHaveLength(0);
  });

  it("returns 404 for non-existent student id", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app).get(`/api/recommendations/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid student id format", async () => {
    const res = await request(app).get("/api/recommendations/invalid-id");
    expect(res.status).toBe(400);
  });
});
