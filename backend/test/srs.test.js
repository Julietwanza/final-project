import { expect } from "chai";
import { calculateNextReview, mapRatingToSM2Quality } from "../src/utils/srsAlgorithm.js";

describe("SRS Algorithm Utilities", () => {
  describe("mapRatingToSM2Quality", () => {
    it("should correctly map 'again' to 1", () => {
      expect(mapRatingToSM2Quality("again")).to.equal(1);
    });

    it("should correctly map 'hard' to 3", () => {
      expect(mapRatingToSM2Quality("hard")).to.equal(3);
    });

    it("should correctly map 'good' to 4", () => {
      expect(mapRatingToSM2Quality("good")).to.equal(4);
    });

    it("should correctly map 'easy' to 5", () => {
      expect(mapRatingToSM2Quality("easy")).to.equal(5);
    });

    it("should default to 2 for unrecognized ratings", () => {
      expect(mapRatingToSM2Quality("unknown")).to.equal(2);
      expect(mapRatingToSM2Quality("")).to.equal(2);
    });
  });

  describe("calculateNextReview", () => {
    const today = new Date(); // Mock current date for predictable tests
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    it("should calculate initial review correctly for 'good' (first recall)", () => {
      const { nextReviewDate, interval, easeFactor, repetitions } =
        calculateNextReview(0, 2.5, 0, 4, yesterday); // initial state

      expect(repetitions).to.equal(1);
      expect(interval).to.equal(1); // 1 day for first successful recall
      expect(easeFactor).to.be.closeTo(2.6, 0.001); // 2.5 + (0.1 - 1*(0.08+1*0.02)) = 2.5 + (0.1 - 0.1) = 2.5
      // Correct formula is EF = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02))
      // For q=4, 5-q=1: EF = 2.5 + (0.1 - 1*(0.08+0.02)) = 2.5 + (0.1 - 0.1) = 2.5
      // Let's re-check the SM-2 formula. My calculation of 2.6 here was an assumption.
      // Based on Anki's typical behavior:
      // If quality >= 3: New EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      // For q=4: EF = 2.5 + (0.1 - 1 * (0.08 + 1*0.02)) = 2.5 + (0.1 - 0.1) = 2.5. This seems correct.
      // My function might have a slightly different implementation for 2.6.
      // Let's assume my function uses the implementation I wrote in `srsAlgorithm.js`.
      // 2.5 + (0.1 - (5-4) * (0.08 + (5-4)*0.02)) = 2.5 + (0.1 - 1 * (0.08 + 0.02)) = 2.5 + (0.1 - 0.1) = 2.5
      // The `srsAlgorithm.js` might have a slight variation, it's better to test against its actual output.
      // Testing with a slightly higher initial value based on the previous version of the `srsAlgorithm.js`.
      // It should be around 2.5 or slightly higher/lower based on implementation.

      // Recalculating easeFactor with exact `srsAlgorithm.js` code:
      // quality = 4, easeFactor = 2.5, repetitions = 0
      // newEaseFactor = 2.5 + (0.1 - (5-4) * (0.08 + (5-4)*0.02))
      // newEaseFactor = 2.5 + (0.1 - 1 * (0.08 + 0.02))
      // newEaseFactor = 2.5 + (0.1 - 0.1) = 2.5
      // So, if I update the algorithm's ease factor line, it should be 2.5
      // Let's make sure the algorithm is consistent. The provided code has `easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));`
      // Which for quality=4, is `2.5 + (0.1 - 1 * (0.08 + 0.02)) = 2.5`.
      // So it should actually be 2.5. I will adjust the test.
      expect(easeFactor).to.be.closeTo(2.5, 0.001);
      expect(nextReviewDate.getDate()).to.equal(today.getDate() + 1); // Review in 1 day
    });

    it("should calculate second review correctly for 'good'", () => {
      const { nextReviewDate, interval, easeFactor, repetitions } = calculateNextReview(
        1,
        2.5, // assuming EF didn't change for first 'good'
        1,
        4,
        new Date(today.setDate(today.getDate() - 1)) // reviewed 1 day ago
      );
      expect(repetitions).to.equal(2);
      expect(interval).to.equal(6); // 6 days for second successful recall
      expect(easeFactor).to.be.closeTo(2.5, 0.001); // Should remain 2.5
      expect(nextReviewDate.getDate()).to.equal(today.getDate() + 6);
    });

    it("should increase interval based on ease factor for subsequent 'good' reviews", () => {
      const { nextReviewDate, interval, easeFactor, repetitions } = calculateNextReview(
        6,
        2.5,
        2,
        4,
        new Date(today.setDate(today.getDate() - 6)) // reviewed 6 days ago
      );
      expect(repetitions).to.equal(3);
      expect(interval).to.equal(Math.round(6 * 2.5)); // 15 days
      expect(easeFactor).to.be.closeTo(2.5, 0.001);
      expect(nextReviewDate.getDate()).to.equal(today.getDate() + 15);
    });

    it("should reset repetitions and interval for 'again' (quality 1)", () => {
      const { nextReviewDate, interval, easeFactor, repetitions } = calculateNextReview(
        15,
        2.5,
        3,
        1, // 'again'
        new Date(today.setDate(today.getDate() - 15))
      );
      expect(repetitions).to.equal(0); // Reset
      expect(interval).to.equal(1); // Review in 1 day
      expect(easeFactor).to.be.lessThan(2.5); // Ease factor should decrease, for quality 1, (5-1)=4: EF = 2.5 + (0.1 - 4*(0.08+4*0.02)) = 2.5 + (0.1 - 4*(0.08+0.08)) = 2.5 + (0.1 - 4*0.16) = 2.5 + (0.1 - 0.64) = 2.5 - 0.54 = 1.96
      expect(easeFactor).to.be.closeTo(1.96, 0.001); // EF decreases for low quality
      expect(nextReviewDate.getDate()).to.equal(today.getDate() + 1);
    });

    it("should decrease ease factor for 'hard' (quality 3)", () => {
        const { easeFactor } = calculateNextReview(
            6,
            2.5,
            2,
            3, // 'hard'
            new Date(today.setDate(today.getDate() - 6))
        );
        // For quality 3, (5-3)=2: EF = 2.5 + (0.1 - 2*(0.08+2*0.02)) = 2.5 + (0.1 - 2*(0.08+0.04)) = 2.5 + (0.1 - 2*0.12) = 2.5 + (0.1 - 0.24) = 2.5 - 0.14 = 2.36
        expect(easeFactor).to.be.closeTo(2.36, 0.001);
    });

    it("should prevent ease factor from falling below 1.3", () => {
        let currentEaseFactor = 1.5;
        // Keep rating 'again' to drive EF down
        for (let i = 0; i < 5; i++) {
            const { easeFactor } = calculateNextReview(1, currentEaseFactor, 0, 0, today);
            currentEaseFactor = easeFactor;
        }
        expect(currentEaseFactor).to.be.at.least(1.3);
        expect(currentEaseFactor).to.be.closeTo(1.3, 0.001);
    });
  });
});
