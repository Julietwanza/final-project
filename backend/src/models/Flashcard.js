import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    sourceNotes: {
      type: String,
      required: true,
    },
    // Spaced Repetition System fields
    nextReviewDate: {
      type: Date,
      default: Date.now, // Initially due immediately
    },
    interval: {
      type: Number, // In days
      default: 0,
    },
    easeFactor: {
      type: Number, // Anki's E-factor, typically starts at 2.5
      default: 2.5,
    },
    repetitions: {
      type: Number, // Number of times successfully recalled
      default: 0,
    },
    lastReviewDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "flashcards" },
);

const Flashcard = mongoose.model("Flashcard", flashcardSchema);

export default Flashcard;
