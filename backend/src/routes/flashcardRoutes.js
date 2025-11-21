import express from "express";
import { spawn } from "child_process";
import Flashcard from "../models/Flashcard.js";
import auth from "../auth/authMiddleware.js"; // Import auth middleware
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { calculateNextReview, mapRatingToSM2Quality } from "../utils/srsAlgorithm.js";

dotenv.config();

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPythonScriptPath = () => {
  return process.env.PYTHON_SCRIPT_PATH || path.join(__dirname, "../../ai_flashcard_generator.py");
};

/**
 * @route POST /api/flashcards/generate
 * @desc Generates flashcards using AI from provided notes
 * @access Private (requires auth)
 */
router.post("/generate", auth, async (req, res) => {
  const { notes, numQuestions = 5 } = req.body; // numQuestions can be configured by frontend

  if (!notes || notes.trim() === "") {
    return res.status(400).json({ message: "Study notes cannot be empty." });
  }

  try {
    const pythonScript = getPythonScriptPath();
    // Pass notes and numQuestions to Python script
    const pythonProcess = spawn("python", [
      pythonScript,
      notes,
      numQuestions.toString(),
    ]);

    let pythonOutput = "";
    let pythonError = "";

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error(`Python Error: ${pythonError}`);
        return res.status(500).json({
          message: "Failed to generate flashcards using AI.",
          details: pythonError || "Unknown Python error.",
        });
      }

      try {
        const generatedFlashcards = JSON.parse(pythonOutput);
        res.json(generatedFlashcards);
      } catch (parseError) {
        console.error("Failed to parse Python output:", parseError);
        console.error("Python Output:", pythonOutput);
        return res
          .status(500)
          .json({ message: "Failed to parse AI response. Check Python script output format." });
      }
    });
  } catch (error) {
    console.error("Error calling Python script:", error);
    res.status(500).json({ message: "Server error during AI generation." });
  }
});

/**
 * @route POST /api/flashcards
 * @desc Saves a new flashcard to the database
 * @access Private
 */
router.post("/", auth, async (req, res) => {
  const { question, answer, sourceNotes } = req.body;

  if (!question || !answer || !sourceNotes) {
    return res
      .status(400)
      .json({ message: "Please provide question, answer, and source notes." });
  }

  try {
    const newFlashcard = new Flashcard({
      userId: req.user.id, // Set userId from authenticated user
      question,
      answer,
      sourceNotes,
      // Default SRS fields are set by the schema
    });

    const savedFlashcard = await newFlashcard.save();
    res.status(201).json(savedFlashcard);
  } catch (error) {
    console.error("Error saving flashcard:", error);
    res.status(500).json({ message: "Failed to save flashcard." });
  }
});

/**
 * @route GET /api/flashcards
 * @desc Get all flashcards for the authenticated user
 * @access Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(flashcards);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ message: "Failed to fetch flashcards." });
  }
});

/**
 * @route GET /api/flashcards/review
 * @desc Get flashcards due for review for the authenticated user
 * @access Private
 */
router.get("/review", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Consider cards due "today" from start of day

    const flashcardsToReview = await Flashcard.find({
      userId: req.user.id,
      nextReviewDate: { $lte: today }, // Cards whose nextReviewDate is today or earlier
    }).sort({ nextReviewDate: 1 }); // Order by oldest review date first

    res.json(flashcardsToReview);
  } catch (error) {
    console.error("Error fetching cards for review:", error);
    res.status(500).json({ message: "Failed to fetch cards for review." });
  }
});

/**
 * @route PUT /api/flashcards/review/:id
 * @desc Update SRS stats for a flashcard after review
 * @access Private
 */
router.put("/review/:id", auth, async (req, res) => {
  const { qualityRating } = req.body; // e.g., "again", "hard", "good", "easy"

  if (!qualityRating) {
    return res.status(400).json({ message: "Quality rating is required." });
  }

  try {
    const flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found." });
    }

    // Ensure the card belongs to the authenticated user
    if (flashcard.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized to update this flashcard." });
    }

    // Map frontend rating to SM-2 quality scale (0-5)
    const sm2Quality = mapRatingToSM2Quality(qualityRating);

    // Calculate new SRS parameters
    const { nextReviewDate, interval, easeFactor, repetitions } =
      calculateNextReview(
        flashcard.interval,
        flashcard.easeFactor,
        flashcard.repetitions,
        sm2Quality,
        flashcard.lastReviewDate || flashcard.createdAt, // Use creation date if no prior review
      );

    flashcard.nextReviewDate = nextReviewDate;
    flashcard.interval = interval;
    flashcard.easeFactor = easeFactor;
    flashcard.repetitions = repetitions;
    flashcard.lastReviewDate = new Date(); // Update last review date to now

    await flashcard.save();
    res.json({ message: "Flashcard review updated.", flashcard });
  } catch (error) {
    console.error("Error updating flashcard review:", error);
    res.status(500).json({ message: "Failed to update flashcard review." });
  }
});

/**
 * @route DELETE /api/flashcards/:id
 * @desc Delete a flashcard by ID for the authenticated user
 * @access Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found." });
    }

    // Ensure the card belongs to the authenticated user
    if (flashcard.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized." });
    }

    await Flashcard.deleteOne({ _id: req.params.id });
    res.json({ message: "Flashcard removed." });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    res.status(500).json({ message: "Failed to delete flashcard." });
  }
});

export default router;