import React, { useState, useEffect } from "react";
import Flashcard from "../components/Flashcard";
import flashcardService from "../services/flashcardService";
import Notification from "../components/Notification";
import "./SavedCardsPage.css"; // Create this CSS file

const SavedCardsPage = () => {
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSavedFlashcards();
  }, []);

  const fetchSavedFlashcards = async () => {
    setLoading(true);
    setNotification(null);
    try {
      const response = await flashcardService.getSavedFlashcards();
      setSavedCards(response);
      if (response.length === 0) {
        setNotification({
          message: "You haven't saved any flashcards yet.",
          type: "info",
        });
      }
    } catch (err) {
      console.error("Error fetching saved flashcards:", err);
      setNotification({
        message: err.response?.data?.message || "Failed to fetch saved flashcards.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlashcard = async (id) => {
    setNotification(null);
    if (window.confirm("Are you sure you want to delete this flashcard?")) {
      try {
        await flashcardService.deleteFlashcard(id);
        setNotification({ message: "Flashcard deleted successfully!", type: "success" });
        fetchSavedFlashcards(); // Refresh the list
      } catch (err) {
        console.error("Error deleting flashcard:", err);
        setNotification({
          message: err.response?.data?.message || "Failed to delete flashcard.",
          type: "danger",
        });
      }
    }
  };

  const filteredCards = savedCards.filter(
    (card) =>
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.sourceNotes.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="saved-cards-page-container text-center">
        <p>Loading your flashcards...</p>
      </div>
    );
  }

  return (
    <div className="saved-cards-page-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <h1 className="page-title">My Saved Flashcards</h1>
      <p className="card-count">You have {savedCards.length} saved flashcards.</p>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search questions, answers, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="saved-cards-grid">
        {filteredCards.length === 0 && searchTerm ? (
          <p className="no-results-message">No flashcards match your search criteria.</p>
        ) : filteredCards.length === 0 && !searchTerm && !loading && (
          <p className="no-cards-message">No flashcards saved yet. Go to "Generate Cards" to create some!</p>
        )}
        {filteredCards.map((card) => (
          <Flashcard
            key={card._id}
            flashcard={card}
            onDelete={() => handleDeleteFlashcard(card._id)}
            showDeleteButton={true}
            showSourceNotes={true}
          />
        ))}
      </div>
    </div>
  );
};

export default SavedCardsPage;