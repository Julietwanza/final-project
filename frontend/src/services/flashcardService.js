import api from "../utils/api";

const generateFlashcards = async (notes, numQuestions = 5) => {
  const response = await api.post("/flashcards/generate", {
    notes,
    numQuestions,
  });
  return response.data;
};

const saveFlashcard = async (flashcardData) => {
  const response = await api.post("/flashcards", flashcardData);
  return response.data;
};

const getSavedFlashcards = async () => {
  const response = await api.get("/flashcards");
  return response.data;
};

const deleteFlashcard = async (id) => {
  const response = await api.delete(`/flashcards/${id}`);
  return response.data;
};

const getFlashcardsForReview = async () => {
  const response = await api.get("/flashcards/review");
  return response.data;
};

const updateFlashcardReview = async (id, qualityRating) => {
  const response = await api.put(`/flashcards/review/${id}`, {
    qualityRating,
  });
  return response.data;
};

const flashcardService = {
  generateFlashcards,
  saveFlashcard,
  getSavedFlashcards,
  deleteFlashcard,
  getFlashcardsForReview,
  updateFlashcardReview,
};

export default flashcardService;
