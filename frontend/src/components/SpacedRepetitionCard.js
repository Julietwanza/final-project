import React, { useState } from "react";
import "./SpacedRepetitionCard.css"; // Create this CSS file

const SpacedRepetitionCard = ({ flashcard, onRate, onSkip, currentCardIndex, totalCards }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating) => {
    setIsFlipped(false); // Flip back for next card
    onRate(flashcard._id, rating);
  };

  if (!flashcard) {
    return null;
  }

  return (
    <div className="srs-card-wrapper">
      <div className="card-info">
        Card {currentCardIndex + 1} of {totalCards}
      </div>
      <div className={`srs-flashcard-container ${isFlipped ? "flipped" : ""}`}>
        <div className="srs-flashcard-inner" onClick={handleFlip}>
          <div className="srs-flashcard-front">
            <p className="srs-flashcard-text srs-question-text">
              <strong>Q:</strong> {flashcard.question}
            </p>
            <span className="srs-flip-indicator">(Click to reveal answer)</span>
          </div>
          <div className="srs-flashcard-back">
            <p className="srs-flashcard-text srs-answer-text">
              <strong>A:</strong> {flashcard.answer}
            </p>
            {flashcard.sourceNotes && (
              <div className="srs-source-notes">
                <small>
                  <strong>Source:</strong>{" "}
                  {flashcard.sourceNotes.substring(0, Math.min(flashcard.sourceNotes.length, 70))}
                  {flashcard.sourceNotes.length > 70 ? "..." : ""}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
      {isFlipped && (
        <div className="srs-review-controls">
          <p>How well did you recall this card?</p>
          <div className="rating-buttons">
            <button onClick={() => handleRate("again")} className="btn-again">
              Again (1m)
            </button>
            <button onClick={() => handleRate("hard")} className="btn-hard">
              Hard (10m)
            </button>
            <button onClick={() => handleRate("good")} className="btn-good">
              Good (1d)
            </button>
            <button onClick={() => handleRate("easy")} className="btn-easy">
              Easy (4d)
            </button>
          </div>
        </div>
      )}
      {!isFlipped && (
        <button onClick={onSkip} className="skip-button">
          Skip Card
        </button>
      )}
    </div>
  );
};

export default SpacedRepetitionCard;