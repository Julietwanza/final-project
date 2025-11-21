AI Study Buddy: Smart Flashcard Generator with Spaced Repetition


Table of Contents

1. About the Project

2. Features

3. Technology Stack

4. Project Structure

5. Getting Started
	- Prerequisites

	- Backend Setup

	- Frontend Setup


6. Usage

7. Testing
	- Backend Tests

	- Frontend Tests

	- Python AI Script Tests


8. Contributing

9. License

10. Contact


---

1. About the Project


The AI Study Buddy is an intelligent web application designed to revolutionize the way students and lifelong learners create and review flashcards. Users can paste their study notes, and our AI-powered backend will automatically generate insightful question-and-answer pairs. These flashcards are then integrated into a personalized Spaced Repetition System (SRS) to optimize memory retention and enhance learning efficiency.

This project demonstrates a full-stack MERN (MongoDB, Express.js, React.js, Node.js) application combined with advanced Natural Language Processing (NLP) capabilities provided by Hugging Face and SpaCy.

2. Features

- AI-Powered Flashcard Generation: Paste any text-based study notes, and the AI will automatically create relevant flashcards (questions and answers).

- Intelligent Question Framing: Leverages Named Entity Recognition (NER) to generate diverse and targeted questions around key concepts, people, dates, organizations, and events.

- User Authentication (JWT): Secure user registration and login system. Flashcards and study progress are personalized and saved to individual accounts.

- Spaced Repetition System (SRS): An adaptive learning algorithm (inspired by SuperMemo 2) schedules flashcards for review at optimal intervals based on your recall performance, maximizing long-term retention.

- Personalized Flashcard Library: View, manage, and search all your saved flashcards.

- Interactive Flashcards: Engaging UI with card flipping animation for an intuitive review experience.

- Responsive and Modern UI: Built with React.js for a smooth and user-friendly experience across devices.

3. Technology Stack

Frontend

- React.js: A JavaScript library for building user interfaces.

- React Router DOM: For declarative routing in React applications.

- Axios: A promise-based HTTP client for making API requests.

- CSS3: Styling and animations, utilizing CSS variables for maintainability.

Backend

- Node.js: JavaScript runtime for server-side logic.

- Express.js: Fast, unopinionated, minimalist web framework for Node.js.

- MongoDB: A NoSQL database for storing user data and flashcards.

- Mongoose: An Object Data Modeling (ODM) library for MongoDB and Node.js.

- bcryptjs: For hashing passwords securely.

- jsonwebtoken (JWT): For secure user authentication.

- morgan: HTTP request logger middleware for Node.js.

- cors: Middleware to enable Cross-Origin Resource Sharing.

AI / NLP Engine

- Python: Scripting language for AI integration.

- Hugging Face transformers: Provides state-of-the-art pre-trained models for:
	- Question Generation (QG): valhalla/t5-base-qg-hl (or similar) to create questions from text.

	- Question Answering (QA): distilbert-base-cased-distilled-squad (or similar) to extract precise answers from context.


- SpaCy: An industrial-strength natural language processing library for:
	- Named Entity Recognition (NER): To identify and categorize key entities (persons, organizations, dates, locations, etc.) in the study notes, enabling more targeted question generation.


Testing

- Backend: Mocha, Chai, Chai-HTTP, Sinon.js.

- Frontend: Jest, React Testing Library.

- Python: pytest.

4. Project Structure

	study-buddy-app/
	├── study-buddy-backend/
	│   ├── src/
	│   │   ├── auth/                      # Authentication middleware
	│   │   ├── config/                    # Database connection setup
	│   │   ├── models/                    # Mongoose schemas (User, Flashcard)
	│   │   ├── routes/                    # API routes (auth, flashcards)
	│   │   ├── utils/                     # SRS algorithm implementation
	│   │   ├── app.js                     # Express app configuration
	│   │   └── server.js                  # Server entry point
	│   ├── test/                      # Backend tests
	│   │   ├── auth.test.js
	│   │   ├── flashcards.test.js
	│   │   └── srs.test.js
	│   ├── ai_flashcard_generator.py      # Python script for AI logic
	│   ├── tests/                     # Python AI script tests
	│   │   └── test_ai_flashcard_generator.py
	│   ├── .env                       # Environment variables
	│   ├── package.json
	│   └── babel.config.json          # Babel configuration for Mocha
	├── study-buddy-frontend/
	│   ├── src/
	│   │   ├── assets/                    # Static assets (e.g., logos)
	│   │   ├── components/                # Reusable React components
	│   │   ├── context/                   # React Context for authentication
	│   │   ├── pages/                     # Main application pages
	│   │   ├── services/                  # API service calls
	│   │   ├── utils/                     # Frontend utility functions
	│   │   ├── App.js                     # Main React app component
	│   │   ├── index.js                   # React entry point
	│   │   └── index.css                  # Global styles
	│   ├── .env                       # Environment variables
	│   └── package.json

5. Getting Started


Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites


Before you begin, ensure you have the following installed:


- Node.js (LTS recommended): nodejs.org

- npm (comes with Node.js):

- Python 3.8+: python.org

- pip (comes with Python):

- MongoDB: mongodb.com (Ensure it's running locally)

Backend Setup

1. 


Clone the repository:



	git clone https://github.com/yourusername/AI-Study-Buddy.git
	cd AI-Study-Buddy/study-buddy-backend



2. 
Install Node.js dependencies:



	npm install



3. 
Install Python dependencies:



	pip install transformers torch spacy pytest sentencepiece sinon
	# Download SpaCy English model (essential for NER)
	python -m spacy download en_core_web_sm


(Note: torch is for Hugging Face models; you can use tensorflow instead if preferred. sinon is for backend testing.)



4. 
Create .env file:

In the study-buddy-backend directory, create a file named .env and add the following content, replacing placeholders:



	PORT=5000
	MONGO_URI=mongodb://localhost:27017/studybuddy_expanded
	PYTHON_SCRIPT_PATH=./ai_flashcard_generator.py
	JWT_SECRET=your_super_secret_jwt_key_replace_me_with_something_stronger


	- MONGO_URI: Ensure your MongoDB server is running. You can change studybuddy_expanded to any database name you prefer.

	- PYTHON_SCRIPT_PATH: Verify the path to your Python script is correct relative to the backend's root.

	- JWT_SECRET: Generate a strong, random string for JWT token signing.


5. 
Start the Backend Server:



	npm run dev


The backend server will start on http://localhost:5000. You should see "MongoDB Connected..." and "Server running on port 5000" in your console.



Frontend Setup

1. 


Navigate to the frontend directory:



	cd ../study-buddy-frontend



2. 
Install Node.js dependencies:



	npm install



3. 
Create .env file:

In the study-buddy-frontend directory, create a file named .env and add:



	REACT_APP_API_URL=http://localhost:5000/api


	- This tells the React app where to find your backend API.


4. 
Start the Frontend Development Server:



	npm start


The React development server will start and open the application in your browser (usually http://localhost:3000).



6. Usage

1. Register/Login: Upon opening the frontend, you will be redirected to the login page. Register a new account or log in if you already have one.

2. Dashboard: After logging in, you'll see your personalized dashboard.

3. Generate Cards: Navigate to the "Generate Cards" section.
	- Paste your study notes into the text area.

	- Click "Generate Flashcards." The AI will process your notes and display generated Q&A pairs.

	- Review the generated cards and use the "Save Card" button to add them to your collection.


4. Review Cards: Go to the "Review Cards" section to start a spaced repetition session.
	- The system will present cards that are due for review today.

	- Flip the card to reveal the answer.

	- Rate your recall ("Again," "Hard," "Good," "Easy") to update the card's SRS statistics and schedule its next review.


5. My Cards: Visit the "My Cards" page to view all your saved flashcards.
	- You can search your cards by question, answer, or original source notes.

	- Delete cards you no longer need.


7. Testing


This project includes tests for the backend, frontend, and the Python AI script.

Backend Tests

1. Ensure your MONGO_URI in study-buddy-backend/.env points to a test database (e.g., mongodb://localhost:27017/studybuddy_test_db) so that your main data is not affected.

2. Navigate to study-buddy-backend/.

3. Run the tests:

	npm test



Frontend Tests

1. Navigate to study-buddy-frontend/.

2. Run the tests:

	npm test


(Press q to quit the watch mode after tests run)

Python AI Script Tests

1. Navigate to study-buddy-backend/.

2. Run the tests:

	pytest tests/



8. Contributing


Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks again!


1. Fork the Project

2. Create your Feature Branch (git checkout -b feature/AmazingFeature)

3. Commit your Changes (git commit -m 'Add some AmazingFeature')

4. Push to the Branch (git push origin feature/AmazingFeature)

5. Open a Pull Request

9. License


Distributed under the MIT License. See LICENSE for more information.

10. Contact


Your Name/Company Name - [Your Email]

Project Link: [https://github.com/julietwanza/AI-Study-Buddy]


---
