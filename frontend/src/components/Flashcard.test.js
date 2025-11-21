import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Flashcard from "./Flashcard";
import "@testing-library/jest-dom";

describe("Flashcard Component", () => {
  const mockFlashcard = {
    _id: "1",
    question: "What is the capital of France?",
    answer: "Paris",
    sourceNotes: "Notes about Europe geography.",
  };

  it("renders flashcard front (question) initially", () => {
    render(<Flashcard flashcard={mockFlashcard} />);

    expect(screen.getByText("Q: What is the capital of France?")).toBeInTheDocument();
    expect(screen.queryByText("A: Paris")).not.toBeVisible(); // Answer should not be visible initially
    expect(screen.getByText("(Click to reveal answer)")).toBeInTheDocument();
  });

  it("flips to show the back (answer) when clicked", () => {
    render(<Flashcard flashcard={mockFlashcard} />);

    fireEvent.click(screen.getByText("Q: What is the capital of France?"));

    expect(screen.getByText("A: Paris")).toBeVisible();
    expect(screen.queryByText("Q: What is the capital of France?")).not.toBeVisible();
  });

  it("shows save button when showSaveButton prop is true", () => {
    const mockOnSave = jest.fn();
    render(<Flashcard flashcard={mockFlashcard} showSaveButton={true} onSave={mockOnSave} />);

    const saveButton = screen.getByRole("button", { name: /save card/i });
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it("shows delete button when showDeleteButton prop is true", () => {
    const mockOnDelete = jest.fn();
    render(<Flashcard flashcard={mockFlashcard} showDeleteButton={true} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole("button", { name: /delete card/i });
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("does not show action buttons by default", () => {
    render(<Flashcard flashcard={mockFlashcard} />);
    expect(screen.queryByRole("button", { name: /save card/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete card/i })).not.toBeInTheDocument();
  });

  it("shows source notes when showSourceNotes is true and card is flipped", () => {
    render(<Flashcard flashcard={mockFlashcard} showSourceNotes={true} />);

    fireEvent.click(screen.getByText("Q: What is the capital of France?")); // Flip card

    expect(screen.getByText(/Source: Notes about Europe geography./i)).toBeInTheDocument();
  });

  it("handles long source notes by truncating with ellipsis", () => {
    const longNotesFlashcard = {
      ...mockFlashcard,
      sourceNotes:
        "This is a very very very long source note that should definitely be truncated when displayed.",
    };
    render(<Flashcard flashcard={longNotesFlashcard} showSourceNotes={true} />);

    fireEvent.click(screen.getByText("Q: What is the capital of France?")); // Flip card

    expect(
      screen.getByText(/Source: This is a very very very long source note that should definitely be truncated when.../i),
    ).toBeInTheDocument();
  });
});