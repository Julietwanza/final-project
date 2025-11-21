// A simplified implementation of the SuperMemo 2 (SM-2) algorithm,
// which is the basis for Anki's spaced repetition.

export const calculateNextReview = (
    interval,
    easeFactor,
    repetitions,
    quality, // User rating: 0-5 (0-2: "Again", 3: "Hard", 4: "Good", 5: "Easy")
    lastReviewDate, // Optional: for calculating from specific date
  ) => {
    let newInterval = interval;
    let newEaseFactor = easeFactor;
    let newRepetitions = repetitions;
  
    const currentDay = new Date();
    let baseDate = lastReviewDate ? new Date(lastReviewDate) : currentDay;
  
    if (quality >= 3) {
      // Successful recall
      newRepetitions++;
  
      // Update ease factor
      newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (newEaseFactor < 1.3) newEaseFactor = 1.3; // Minimum ease factor
  
      if (newRepetitions === 1) {
        newInterval = 1; // First successful recall, review in 1 day
      } else if (newRepetitions === 2) {
        newInterval = 6; // Second successful recall, review in 6 days
      } else {
        newInterval = Math.round(newInterval * newEaseFactor);
      }
    } else {
      // Failed recall (quality 0-2)
      newRepetitions = 0; // Reset repetitions
      newInterval = 1; // Review in 1 day
    }
  
    // Calculate next review date
    const nextReviewDate = new Date(baseDate);
    nextReviewDate.setDate(baseDate.getDate() + newInterval);
  
    return {
      nextReviewDate,
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions,
    };
  };
  
  // Map typical UI ratings (e.g., "Again", "Hard", "Good", "Easy") to SM-2 quality scores (0-5)
  export const mapRatingToSM2Quality = (rating) => {
    switch (rating.toLowerCase()) {
      case "again":
        return 1; // A clear failure
      case "hard":
        return 3; // Recalled with difficulty
      case "good":
        return 4; // Recalled easily
      case "easy":
        return 5; // Recalled perfectly
      default:
        return 2; // Default to a slight failure if unrecognized
    }
  };
