import React, { useState } from "react";
import "./Flashcard.css";

const Flashcard = ({
  flashcard,
  onSave,
  onDelete,
  showSaveButton,
  showDeleteButton,
  showSourceNotes,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (!flashcard) {
    return null;
  }

  const { question, answer, sourceNotes } = flashcard;

  return (
    <div className={`flashcard-container ${isFlipped ? "flipped" : ""}`}>
      <div className="flashcard-inner" onClick={handleFlip}>
        <div className="flashcard-front">
          <p className="flashcard-text question-text">
            <strong>Q:</strong> {question}
          </p>
          <span className="flip-indicator">(Click to reveal answer)</span>
        </div>
        <div className="flashcard-back">
          <p className="flashcard-text answer-text">
            <strong>A:</strong> {answer}
          </p>
          {showSourceNotes && sourceNotes && (
            <div className="source-notes">
              <small>
                <strong>Source:</strong>{" "}
                {sourceNotes.substring(0, Math.min(sourceNotes.length, 70))}
                {sourceNotes.length > 70 ? "..." : ""}
              </small>
            </div>
          )}
        </div>
      </div>
      {(showSaveButton || showDeleteButton) && (
        <div className="flashcard-actions">
          {showSaveButton && (
            <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="action-button save-button">
              Save Card
            </button>
          )}
          {showDeleteButton && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="action-button delete-button">
              Delete Card
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Flashcard;