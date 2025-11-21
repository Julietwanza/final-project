import app from "./app.js";
import connectDB from "./config/db.js"; // Import the database connection

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));