import chai from "chai";
import chaiHttp from "chai-http";
import app from "../src/app.js";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Flashcard from "../src/models/Flashcard.js";
import dotenv from "dotenv";
import { spawn } from "child_process"; // To mock python script
import { beforeEach } from "mocha";

dotenv.config();

const expect = chai.expect;
chai.use(chaiHttp);

const TEST_MONGO_URI = process.env.MONGO_URI.replace("studybuddy_expanded", "studybuddy_test_db");

// Mock the child_process.spawn function
// This is crucial because we don't want to actually run the Python script during backend tests.
import * as childProcess from "child_process";
import sinon from "sinon";

describe("Flashcard API", () => {
  let authToken;
  let userId;
  let spawnStub;

  before(async () => {
    await mongoose.connect(TEST_MONGO_URI);

    // Stub childProcess.spawn
    spawnStub = sinon.stub(childProcess, 'spawn');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Flashcard.deleteMany({});

    // Register and login a user to get a token and user ID for protected routes
    const registerRes = await chai.request(app).post("/api/auth/register").send({
      username: "carduser",
      email: "card@example.com",
      password: "password123",
    });
    const loginRes = await chai.request(app).post("/api/auth/login").send({
      email: "card@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;

    const user = await User.findOne({ email: "card@example.com" });
    userId = user._id;

    // Reset the stub before each test
    spawnStub.reset();
  });

  after(async () => {
    await mongoose.connection.close();
    spawnStub.restore(); // Restore original spawn after all tests
  });

  describe("POST /api/flashcards/generate", () => {
    it("should generate flashcards using AI script and return them", async () => {
      const mockPythonOutput = JSON.stringify([
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
      ]);

      // Mock the Python process
      const mockChild = {
        stdout: { on: sinon.stub().yields(mockPythonOutput) },
        stderr: { on: sinon.stub() },
        on: sinon.stub().yields(0), // Simulate successful exit
      };
      spawnStub.returns(mockChild);

      const res = await chai.request(app)
        .post("/api/flashcards/generate")
        .set("x-auth-token", authToken)
        .send({ notes: "Some study notes for generation." });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(2);
      expect(res.body[0]).to.have.property("question", "Q1");
      expect(res.body[0]).to.have.property("answer", "A1");
    });

    it("should return 400 if notes are empty", async () => {
      const res = await chai.request(app)
        .post("/api/flashcards/generate")
        .set("x-auth-token", authToken)
        .send({ notes: "" });
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Study notes cannot be empty.");
    });

    it("should return 500 if AI script fails", async () => {
      // Mock Python script exiting with an error code
      const mockChild = {
        stdout: { on: sinon.stub().yields("") },
        stderr: { on: sinon.stub().yields("Python error message") },
        on: sinon.stub().yields(1), // Simulate error exit
      };
      spawnStub.returns(mockChild);

      const res = await chai.request(app)
        .post("/api/flashcards/generate")
        .set("x-auth-token", authToken)
        .send({ notes: "Some notes." });
      expect(res).to.have.status(500);
      expect(res.body.message).to.equal("Failed to generate flashcards using AI.");
      expect(res.body.details).to.equal("Python error message");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await chai.request(app)
        .post("/api/flashcards/generate")
        .send({ notes: "Notes without auth." });
      expect(res).to.have.status(401);
    });
  });

  describe("POST /api/flashcards", () => {
    it("should save a new flashcard for the authenticated user", async () => {
      const res = await chai.request(app)
        .post("/api/flashcards")
        .set("x-auth-token", authToken)
        .send({
          question: "Test Question",
          answer: "Test Answer",
          sourceNotes: "Test Notes",
        });
      expect(res).to.have.status(201);
      expect(res.body).to.have.property("question", "Test Question");
      expect(res.body).to.have.property("userId", userId.toString());
      const savedCard = await Flashcard.findById(res.body._id);
      expect(savedCard).to.not.be.null;
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await chai.request(app)
        .post("/api/flashcards")
        .set("x-auth-token", authToken)
        .send({ question: "Only Q" });
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Please provide question, answer, and source notes.");
    });
  });

  describe("GET /api/flashcards", () => {
    beforeEach(async () => {
      await Flashcard.create([
        { userId: userId, question: "Q1", answer: "A1", sourceNotes: "N1" },
        { userId: userId, question: "Q2", answer: "A2", sourceNotes: "N2" },
      ]);
    });

    it("should get all flashcards for the authenticated user", async () => {
      const res = await chai.request(app)
        .get("/api/flashcards")
        .set("x-auth-token", authToken);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(2);
      expect(res.body[0]).to.have.property("question");
    });
  });

  describe("DELETE /api/flashcards/:id", () => {
    let cardIdToDelete;

    beforeEach(async () => {
      const card = await Flashcard.create({
        userId: userId,
        question: "Delete Q",
        answer: "Delete A",
        sourceNotes: "Delete N",
      });
      cardIdToDelete = card._id;
    });

    it("should delete a flashcard by ID for the authenticated user", async () => {
      const res = await chai.request(app)
        .delete(`/api/flashcards/${cardIdToDelete}`)
        .set("x-auth-token", authToken);
      expect(res).to.have.status(200);
      expect(res.body.message).to.equal("Flashcard removed.");
      const deletedCard = await Flashcard.findById(cardIdToDelete);
      expect(deletedCard).to.be.null;
    });

    it("should return 404 if flashcard not found", async () => {
      const res = await chai.request(app)
        .delete("/api/flashcards/60d0fe4f77732a001c9a8a70") // Non-existent ID
        .set("x-auth-token", authToken);
      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Flashcard not found.");
    });

    it("should return 401 if user is not authorized to delete the flashcard", async () => {
      // Create a card for a different user
      const otherUser = await User.create({
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
      });
      const otherCard = await Flashcard.create({
        userId: otherUser._id,
        question: "Other Q",
        answer: "Other A",
        sourceNotes: "Other N",
      });

      const res = await chai.request(app)
        .delete(`/api/flashcards/${otherCard._id}`)
        .set("x-auth-token", authToken); // Try to delete with our user's token
      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("User not authorized.");
    });
  });

  describe("GET /api/flashcards/review", () => {
    it("should retrieve cards due for review for the authenticated user", async () => {
      // Create a card due today
      await Flashcard.create({
        userId: userId,
        question: "Review Q1",
        answer: "Review A1",
        sourceNotes: "Review N1",
        nextReviewDate: new Date(), // Due today
      });
      // Create a card due in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      await Flashcard.create({
        userId: userId,
        question: "Review Q2",
        answer: "Review A2",
        sourceNotes: "Review N2",
        nextReviewDate: futureDate,
      });

      const res = await chai.request(app)
        .get("/api/flashcards/review")
        .set("x-auth-token", authToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1); // Only Q1 should be due
      expect(res.body[0].question).to.equal("Review Q1");
    });
  });

  describe("PUT /api/flashcards/review/:id", () => {
    let cardIdToReview;
    let initialCard;

    beforeEach(async () => {
      initialCard = await Flashcard.create({
        userId: userId,
        question: "SRS Q",
        answer: "SRS A",
        sourceNotes: "SRS N",
        nextReviewDate: new Date(new Date().setDate(new Date().getDate() - 1)), // Due yesterday
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lastReviewDate: null,
      });
      cardIdToReview = initialCard._id;
    });

    it("should update SRS stats for a flashcard with 'good' rating", async () => {
      const res = await chai.request(app)
        .put(`/api/flashcards/review/${cardIdToReview}`)
        .set("x-auth-token", authToken)
        .send({ qualityRating: "good" });

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal("Flashcard review updated.");
      expect(res.body.flashcard).to.have.property("repetitions", 1);
      expect(res.body.flashcard.interval).to.be.at.least(1); // Should be 1 day for first successful recall
      expect(new Date(res.body.flashcard.nextReviewDate)).to.be.greaterThan(new Date());
    });

    it("should reset repetitions and interval for 'again' rating", async () => {
        // First, make some progress on the card
        await Flashcard.findByIdAndUpdate(cardIdToReview, {
            repetitions: 2,
            interval: 6,
            easeFactor: 2.6
        });

      const res = await chai.request(app)
        .put(`/api/flashcards/review/${cardIdToReview}`)
        .set("x-auth-token", authToken)
        .send({ qualityRating: "again" });

      expect(res).to.have.status(200);
      expect(res.body.flashcard).to.have.property("repetitions", 0); // Reset
      expect(res.body.flashcard).to.have.property("interval", 1); // Review in 1 day
      expect(new Date(res.body.flashcard.nextReviewDate)).to.be.greaterThan(new Date());
    });
  });
});
