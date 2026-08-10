process.env.JWT_SECRET = "test-secret";

const request = require("supertest");

const app = require("../src/app");
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

describe("Auth flow", () => {
  const newStudent = {
    fullName: "Test Student",
    email: "test.student@example.com",
    password: "SecurePass123!",
    targetCountries: ["Canada"],
    interestedFields: ["Computer Science"],
    maxBudgetUsd: 20000,
    preferredIntake: "Fall 2026",
    englishTest: { exam: "IELTS", score: 7 },
  };

  it("registers a new student and returns a token + sanitized user", async () => {
    const res = await request(app).post("/api/auth/register").send(newStudent);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(newStudent.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("logs in with correct credentials and accesses /me with the returned token", async () => {
    await request(app).post("/api/auth/register").send(newStudent);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: newStudent.email, password: newStudent.password });

    expect(loginRes.status).toBe(200);
    const { token } = loginRes.body.data;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(newStudent.email);
  });

  // Edge case: rejects login with a wrong password without leaking whether
  // the account exists.
  it("rejects login with an incorrect password", async () => {
    await request(app).post("/api/auth/register").send(newStudent);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: newStudent.email, password: "WrongPassword1!" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Edge case: duplicate registration is rejected with 409, not a 500 from
  // the unique index violation.
  it("rejects registering the same email twice", async () => {
    await request(app).post("/api/auth/register").send(newStudent);
    const res = await request(app).post("/api/auth/register").send(newStudent);

    expect(res.status).toBe(409);
  });

  it("rejects protected route access without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
