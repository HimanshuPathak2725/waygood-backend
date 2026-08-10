process.env.JWT_SECRET = "test-secret";

const request = require("supertest");

const app = require("../src/app");
const Student = require("../src/models/Student");
const University = require("../src/models/University");
const Program = require("../src/models/Program");
const { connect, closeDatabase, clearDatabase } = require("./setup");

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

async function seedStudentAndProgram() {
  const student = await Student.create({
    fullName: "Aarav Sharma",
    email: "aarav.test@example.com",
    password: "SecurePass123!",
    targetCountries: ["Canada"],
    interestedFields: ["Data Science"],
    maxBudgetUsd: 25000,
    preferredIntake: "Fall 2026",
    englishTest: { exam: "IELTS", score: 7 },
  });

  const university = await University.create({
    name: "Test University",
    country: "Canada",
    city: "Toronto",
    partnerType: "direct",
    qsRanking: 300,
    scholarshipAvailable: true,
    popularScore: 80,
  });

  const program = await Program.create({
    university: university._id,
    universityName: university.name,
    country: "Canada",
    city: "Toronto",
    title: "MSc Data Science",
    field: "Data Science",
    degreeLevel: "master",
    tuitionFeeUsd: 20000,
    intakes: ["Fall 2026", "Winter 2027"],
    durationMonths: 18,
    minimumIelts: 6.5,
    scholarshipAvailable: true,
  });

  return { student, university, program };
}

describe("Application workflow", () => {
  it("creates an application in draft status with an initial timeline entry", async () => {
    const { student, program } = await seedStudentAndProgram();

    const res = await request(app).post("/api/applications").send({
      studentId: student._id.toString(),
      programId: program._id.toString(),
      intake: "Fall 2026",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.timeline).toHaveLength(1);
    expect(res.body.data.timeline[0].status).toBe("draft");
  });

  it("walks an application through a valid status transition and records history", async () => {
    const { student, program } = await seedStudentAndProgram();

    const createRes = await request(app).post("/api/applications").send({
      studentId: student._id.toString(),
      programId: program._id.toString(),
      intake: "Fall 2026",
    });

    const applicationId = createRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .send({ status: "submitted", note: "Submitted by student." });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe("submitted");
    expect(updateRes.body.data.timeline).toHaveLength(2);
    expect(updateRes.body.data.timeline[1].status).toBe("submitted");
  });

  // Edge case: the unique (student, program, intake) index should block a
  // duplicate application with a friendly 409, not a raw Mongo error.
  it("prevents duplicate applications for the same student, program, and intake", async () => {
    const { student, program } = await seedStudentAndProgram();

    await request(app).post("/api/applications").send({
      studentId: student._id.toString(),
      programId: program._id.toString(),
      intake: "Fall 2026",
    });

    const duplicateRes = await request(app).post("/api/applications").send({
      studentId: student._id.toString(),
      programId: program._id.toString(),
      intake: "Fall 2026",
    });

    expect(duplicateRes.status).toBe(409);
  });

  // Edge case: illegal status transitions (e.g. skipping straight to
  // "enrolled" from "draft") must be rejected.
  it("rejects an invalid status transition", async () => {
    const { student, program } = await seedStudentAndProgram();

    const createRes = await request(app).post("/api/applications").send({
      studentId: student._id.toString(),
      programId: program._id.toString(),
      intake: "Fall 2026",
    });

    const applicationId = createRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .send({ status: "enrolled" });

    expect(updateRes.status).toBe(409);
  });
});
