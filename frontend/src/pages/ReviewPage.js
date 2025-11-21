import React, { useState, useEffect } from "react";
import flashcardService from "../services/flashcardService";
import SpacedRepetitionCard from "../components/SpacedRepetitionCard";
import Notification from "../components/Notification";
import "./ReviewPage.css"; // Create this CSS file

const ReviewPage = () => {
  const [cardsToReview, setCardsToReview] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchCardsForReview();
  }, []);

  const fetchCardsForReview = async () => {
    setLoading(true);
    setNotification(null);
    try {
      const fetchedCards = await flashcardService.getFlashcardsForReview();
      setCardsToReview(fetchedCards);
      setReviewCount(fetchedCards.length);
      setCurrentCardIndex(0);
      if (fetchedCards.length === 0) {
        setNotification({
          message: "No cards due for review today! Great job!",
          type: "info",
        });
      }
    } catch (err) {
      console.error("Error fetching review cards:", err);
      setNotification({
        message: err.response?.data?.message || "Failed to load review cards.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRateCard = async (cardId, qualityRating) => {
    setNotification(null);
    try {
      await flashcardService.updateFlashcardReview(cardId, qualityRating);
      // Remove the card from the current review session
      setCardsToReview((prevCards) => prevCards.filter((card) => card._id !== cardId));
      setNotification({ message: "Card updated!", type: "success", duration: 1500 });

      // Move to next card, or finish if no more cards
      if (cardsToReview.length - 1 <= 0) {
        setNotification({ message: "Review session complete!", type: "success" });
      } else if (currentCardIndex >= cardsToReview.length - 1) {
        // If current card was the last, reset index for next fetch if cards are added
        setCurrentCardIndex(0); 
      }
      // If the card was not the last one and removed, the index might shift automatically
      // We don't need to increment index here as cards are filtered.
      // The next card will become the currentCardIndex if it exists.
    } catch (err) {
      console.error("Error rating card:", err);
      setNotification({
        message: err.response?.data?.message || "Failed to update card review.",
        type: "danger",
      });
    }
  };

  const handleSkipCard = () => {
    if (currentCardIndex < cardsToReview.length - 1) {
      setCurrentCardIndex((prevIndex) => prevIndex + 1);
    } else {
      // If it's the last card and skipped, wrap around or signify end
      setNotification({ message: "You skipped the last card. No more cards in this session.", type: "info" });
      setCurrentCardIndex(0); // Optionally reset or set to an invalid index to show "done" message
    }
  };


  if (loading) {
    return (
      <div className="review-page-container text-center">
        <p>Loading cards for review...</p>
      </div>
    );
  }

  return (
    <div className="review-page-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <h1 className="page-title">Review Flashcards</h1>
      <p className="review-count">You have {reviewCount} cards due for review today.</p>

      {cardsToReview.length > 0 ? (
        <SpacedRepetitionCard
          flashcard={cardsToReview[currentCardIndex]}
          onRate={handleRateCard}
          onSkip={handleSkipCard}
          currentCardIndex={currentCardIndex}
          totalCards={cardsToReview.length}
        />
      ) : (
        <div className="no-cards-message">
          <p>No cards due for review! </p>
          <p>You can generate new cards or check back later.</p>
          <button onClick={fetchCardsForReview} className="refresh-button">
            Check for new cards
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;