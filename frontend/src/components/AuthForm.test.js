import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import AuthForm from "./AuthForm";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Notification from "./Notification"; // Mocking Notification
import "@testing-library/jest-dom"; // For extended matchers

// Mock react-router-dom useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedUsedNavigate,
}));

// Mock AuthContext login and register functions
const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock("../context/AuthContext", () => ({
  ...jest.requireActual("../context/AuthContext"),
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null,
    login: mockLogin,
    register: mockRegister,
  }),
}));

// Mock Notification component to prevent actual rendering issues in tests
jest.mock("./Notification", () => ({ message, type, onClose }) => (
  <div data-testid="notification" className={`notification ${type}`}>
    <span>{message}</span>
    <button onClick={onClose}>x</button>
  </div>
));

describe("AuthForm Component", () => {
  beforeEach(() => {
    mockedUsedNavigate.mockClear();
    mockLogin.mockClear();
    mockRegister.mockClear();
  });

  it("renders login form correctly", () => {
    render(
      <Router>
        <AuthForm type="login" />
      </Router>,
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders register form correctly", () => {
    render(
      <Router>
        <AuthForm type="register" />
      </Router>,
    );
    expect(screen.getByText("Register")).toBeInTheTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls login function and redirects on successful login", async () => {
    render(
      <Router>
        <AuthForm type="login" />
      </Router>,
    );

    mockLogin.mockResolvedValueOnce({ token: "fake-token" });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123"));
    await waitFor(() => expect(mockedUsedNavigate).toHaveBeenCalledWith("/dashboard"));
    expect(screen.getByText("Login successful!")).toBeInTheDocument();
  });

  it("displays error notification on failed login", async () => {
    render(
      <Router>
        <AuthForm type="login" />
      </Router>,
    );

    mockLogin.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials." } },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    expect(screen.getByText("Invalid credentials.")).toBeInTheDocument();
    expect(screen.getByTestId("notification")).toHaveClass("danger");
  });

  it("calls register function and redirects on successful registration", async () => {
    render(
      <Router>
        <AuthForm type="register" />
      </Router>,
    );

    mockRegister.mockResolvedValueOnce({ token: "fake-token" });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith("newuser", "newuser@example.com", "securepassword"),
    );
    await waitFor(() => expect(mockedUsedNavigate).toHaveBeenCalledWith("/dashboard"));
    expect(screen.getByText("Registration successful!")).toBeInTheDocument();
  });

  it("displays error notification on failed registration", async () => {
    render(
      <Router>
        <AuthForm type="register" />
      </Router>,
    );

    mockRegister.mockRejectedValueOnce({
      response: { data: { message: "Username is already taken." } },
    });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "existinguser" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    expect(screen.getByText("Username is already taken.")).toBeInTheDocument();
    expect(screen.getByTestId("notification")).toHaveClass("danger");
  });
});