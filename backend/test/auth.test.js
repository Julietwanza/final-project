import chai from "chai";
import chaiHttp from "chai-http";
import app from "../src/app.js"; // Your Express app
import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

const expect = chai.expect;
chai.use(chaiHttp);

// Use a separate test database
const TEST_MONGO_URI = process.env.MONGO_URI.replace("studybuddy_expanded", "studybuddy_test_db");

describe("Auth API", () => {
  before(async () => {
    // Connect to a test database and clear it
    await mongoose.connect(TEST_MONGO_URI);
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    await User.deleteMany({});
  });

  after(async () => {
    // Disconnect from the database after all tests
    await mongoose.connection.close();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await chai.request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      expect(res).to.have.status(201);
      expect(res.body).to.have.property("token");
      expect(res.body.message).to.equal("Registration successful!");
    });

    it("should return 400 if user with email already exists", async () => {
      // Register once
      await chai.request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      // Try to register again with same email
      const res = await chai.request(app).post("/api/auth/register").send({
        username: "anotheruser",
        email: "test@example.com",
        password: "password123",
      });
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("User already exists with this email.");
    });

    it("should return 400 if username is already taken", async () => {
      await chai.request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "email1@example.com",
        password: "password123",
      });

      const res = await chai.request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "email2@example.com",
        password: "password123",
      });
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Username is already taken.");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Register a user first for login tests
      await chai.request(app).post("/api/auth/register").send({
        username: "loginuser",
        email: "login@example.com",
        password: "password123",
      });
    });

    it("should log in an existing user successfully", async () => {
      const res = await chai.request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "password123",
      });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("token");
      expect(res.body.message).to.equal("Login successful!");
    });

    it("should return 400 for invalid credentials (wrong password)", async () => {
      const res = await chai.request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "wrongpassword",
      });
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Invalid credentials.");
    });

    it("should return 400 for invalid credentials (user not found)", async () => {
      const res = await chai.request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Invalid credentials.");
    });
  });

  describe("GET /api/auth/user", () => {
    let authToken;

    beforeEach(async () => {
      // Register and login a user to get a token
      await chai.request(app).post("/api/auth/register").send({
        username: "authuser",
        email: "auth@example.com",
        password: "password123",
      });
      const loginRes = await chai.request(app).post("/api/auth/login").send({
        email: "auth@example.com",
        password: "password123",
      });
      authToken = loginRes.body.token;
    });

    it("should get user data for an authenticated user", async () => {
      const res = await chai.request(app)
        .get("/api/auth/user")
        .set("x-auth-token", authToken);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("username", "authuser");
      expect(res.body).to.have.property("email", "auth@example.com");
      expect(res.body).to.not.have.property("password"); // Password should be excluded
    });

    it("should return 401 if no token is provided", async () => {
      const res = await chai.request(app).get("/api/auth/user");
      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("No token, authorization denied.");
    });

    it("should return 401 if token is invalid", async () => {
      const res = await chai.request(app)
        .get("/api/auth/user")
        .set("x-auth-token", "invalidtoken123");
      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("Token is not valid.");
    });
  });
});
