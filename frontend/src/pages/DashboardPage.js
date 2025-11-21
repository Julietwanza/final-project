import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardPage.css"; // Create this CSS file

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-welcome">Welcome, {user?.username || "Guest"}!</h1>
      <p className="dashboard-intro">Your AI Study Buddy is ready to help you learn.</p>

      <div className="dashboard-actions">
        <Link to="/generate" className="dashboard-card generate-card">
          <h2>Generate New Flashcards</h2>
          <p>Paste your notes and let AI create questions and answers for you.</p>
          <span className="card-icon">🧠</span>
        </Link>

        <Link to="/review" className="dashboard-card review-card">
          <h2>Review Your Flashcards</h2>
          <p>Practice with spaced repetition to master your topics.</p>
          <span className="card-icon">📚</span>
        </Link>

        <Link to="/saved-cards" className="dashboard-card saved-card">
          <h2>View All Saved Cards</h2>
          <p>Browse, edit, and manage all your personalized flashcards.</p>
          <span className="card-icon">🗂️</span>
        </Link>
      </div>

      <div className="dashboard-tip">
        <h3>Pro Tip:</h3>
        <p>
          The more detailed your notes, the better the AI will be at generating relevant and
          challenging flashcards. Try to include key terms, definitions, and important concepts!
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;