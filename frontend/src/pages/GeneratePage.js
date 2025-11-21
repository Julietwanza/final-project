import React, { useState } from "react";
import Flashcard from "../components/Flashcard";
import FlashcardForm from "../components/FlashcardForm";
import flashcardService from "../services/flashcardService";
import Notification from "../components/Notification";
import "./GeneratePage.css"; // Create this CSS file

const GeneratePage = () => {
  const [notes, setNotes] = useState("");
  const [generatedCards, setGeneratedCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleGenerateFlashcards = async () => {
    setLoading(true);
    setNotification(null);
    setGeneratedCards([]);
    setCurrentCardIndex(0);

    try {
      const response = await flashcardService.generateFlashcards(notes, 5); // Default 5 questions
      setGeneratedCards(response);
      if (response.length === 0) {
        setNotification({
          message:
            "AI could not generate any flashcards from the provided notes. Try more detailed notes.",
          type: "danger",
        });
      } else {
        setNotification({
          message: `${response.length} flashcards generated!`,
          type: "success",
        });
      }
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setNotification({
        message:
          err.response?.data?.message ||
          "Failed to generate flashcards. Check backend and Python script. " +
          err.message,
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlashcard = async (flashcard) => {
    try {
      await flashcardService.saveFlashcard({
        question: flashcard.question,
        answer: flashcard.answer,
        sourceNotes: notes, // Store the original notes with the flashcard
      });
      setNotification({ message: "Flashcard saved successfully!", type: "success" });
    } catch (err) {
      console.error("Error saving flashcard:", err);
      setNotification({
        message: err.response?.data?.message || "Failed to save flashcard.",
        type: "danger",
      });
    }
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex === generatedCards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePreviousCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex === 0 ? generatedCards.length - 1 : prevIndex + 1
    );
  };

  return (
    <div className="generate-page-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <h1 className="page-title">Generate Flashcards</h1>

      <FlashcardForm
        notes={notes}
        setNotes={setNotes}
        onGenerate={handleGenerateFlashcards}
        loading={loading}
        error={notification?.type === "danger" ? notification.message : null}
      />

      {generatedCards.length > 0 && (
        <section className="generated-cards-section">
          <h2>Review & Save Generated Cards</h2>
          {generatedCards[currentCardIndex] && (
            <div className="card-carousel">
              <button onClick={handlePreviousCard} className="nav-button">
                &lt; Previous
              </button>
              <Flashcard
                key={`gen-${currentCardIndex}-${generatedCards[currentCardIndex]._id || ""}`}
                flashcard={generatedCards[currentCardIndex]}
                onSave={() => handleSaveFlashcard(generatedCards[currentCardIndex])}
                showSaveButton={true}
              />
              <button onClick={handleNextCard} className="nav-button">
                Next &gt;
              </button>
            </div>
          )}
          <div className="card-navigation-info">
            Card {currentCardIndex + 1} of {generatedCards.length}
          </div>
        </section>
      )}
    </div>
  );
};

export default GeneratePage;