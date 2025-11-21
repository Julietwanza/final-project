import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";

// Pages
import DashboardPage from "./pages/DashboardPage";
import GeneratePage from "./pages/GeneratePage";
import ReviewPage from "./pages/ReviewPage";
import SavedCardsPage from "./pages/SavedCardsPage";

import "./App.css"; // Global App CSS (kept minimal as index.css handles most)

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<AuthForm type="login" />} /> {/* Default to Login */}
              <Route path="/login" element={<AuthForm type="login" />} />
              <Route path="/register" element={<AuthForm type="register" />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
              <Route path="/generate" element={<PrivateRoute />}>
                <Route path="/generate" element={<GeneratePage />} />
              </Route>
              <Route path="/review" element={<PrivateRoute />}>
                <Route path="/review" element={<ReviewPage />} />
              </Route>
              <Route path="/saved-cards" element={<PrivateRoute />}>
                <Route path="/saved-cards" element={<SavedCardsPage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
