import express from "express";
import cors from "cors";
import morgan from "morgan";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import authRoutes from "./routes/authRoutes.js"; // Import auth routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes); // Auth routes
app.use("/api/flashcards", flashcardRoutes); // Flashcard routes (now protected)

app.get("/", (req, res) => {
  res.send("AI Study Buddy Backend is running!");
});

export default app;