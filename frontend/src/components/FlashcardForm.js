import React from "react";
import "./FlashcardForm.css";

const FlashcardForm = ({ notes, setNotes, onGenerate, loading, error }) => {
  return (
    <div className="flashcard-form-container">
      <h3>Paste Your Study Notes Here:</h3>
      <textarea
        className="notes-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="E.g., 'The capital of France is Paris. The Eiffel Tower is a famous landmark there. World War II ended in 1945.'"
        rows="10"
      ></textarea>
      <button
        onClick={onGenerate}
        disabled={loading || notes.trim() === ""}
        className="generate-button"
      >
        {loading ? "Generating..." : "Generate Flashcards"}
      </button>
      {error && <p className="error-message">{error}</p>}
      {loading && (
        <p className="loading-message">
          AI is generating questions. This might take a moment...
        </p>
      )}
    </div>
  );
};

export default FlashcardForm;