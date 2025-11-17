import os

# === CONFIGURATION ===
MONGO_URI = "mongodb+srv://lmsfinal:lmsfinal@cluster0.jrpy03o.mongodb.net/?appName=Cluster0"

# === STRUCTURE DEFINITION ===
structure = {
    "backend": {
        "config": ["db.js"],
        "models": ["User.js", "Course.js", "Lesson.js", "Enrollment.js"],
        "routes": ["auth.js", "courses.js", "lessons.js", "enrollments.js"],
        "middleware": ["auth.js", "error.js"],
        "tests": [],
        ".env": None,
        "server.js": None,
        "package.json": None
    },
    "frontend": {
        "public": [],
        "src": {
            "components": [],
            "pages": [],
            "services": [],
            "context": [],
            "App.js": None,
            "index.js": None
        }
    }
}

# === BACKEND BOILERPLATES ===
db_js_template = f"""\
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {{
  try {{
    await mongoose.connect(process.env.MONGO_URI, {{
      useNewUrlParser: true,
      useUnifiedTopology: true
    }});
    console.log('MongoDB Connected Successfully');
  }} catch (err) {{
    console.error('MongoDB Connection Failed:', err.message);
    process.exit(1);
  }}
}};

module.exports = connectDB;
"""

server_js_template = """\
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/enrollments', require('./routes/enrollments'));

// Error handling middleware
app.use(require('./middleware/error'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
"""

env_template = f"""\
MONGO_URI={MONGO_URI}
PORT=5000
"""

package_json_template = """\
{
  "name": "lms-backend",
  "version": "1.0.0",
  "description": "Learning Management System Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
"""

# === FRONTEND BOILERPLATES ===
app_js_template = """\
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
"""

index_js_template = """\
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""

home_page_template = """\
import React from 'react';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to the LMS Frontend</h1>
      <p>Start building your learning platform here.</p>
    </div>
  );
}

export default Home;
"""

# === CREATE STRUCTURE FUNCTION ===
def create_structure(base_path, structure_dict):
    for folder, contents in structure_dict.items():
        folder_path = os.path.join(base_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        print(f"Created folder: {folder_path}")

        if isinstance(contents, dict):
            for key, value in contents.items():
                if isinstance(value, list):
                    subfolder_path = os.path.join(folder_path, key)
                    os.makedirs(subfolder_path, exist_ok=True)
                    for file_name in value:
                        file_path = os.path.join(subfolder_path, file_name)
                        open(file_path, "w", encoding="utf-8").close()
                        print(f"Created file: {file_path}")
                elif isinstance(value, dict):
                    create_structure(folder_path, {key: value})
                elif value is None:
                    file_path = os.path.join(folder_path, key)
                    with open(file_path, "w", encoding="utf-8") as f:
                        # Backend templates
                        if key == "db.js":
                            f.write(db_js_template)
                        elif key == "server.js":
                            f.write(server_js_template)
                        elif key == ".env":
                            f.write(env_template)
                        elif key == "package.json":
                            f.write(package_json_template)
                        # Frontend templates
                        elif key == "App.js":
                            f.write(app_js_template)
                        elif key == "index.js":
                            f.write(index_js_template)
                    print(f"Created file: {file_path}")

        elif isinstance(contents, list):
            for file_name in contents:
                file_path = os.path.join(folder_path, file_name)
                open(file_path, "w", encoding="utf-8").close()
                print(f"Created file: {file_path}")

# === MAIN EXECUTION ===
if __name__ == "__main__":
    base_directory = os.getcwd()
    create_structure(base_directory, structure)

    # Add a sample Home.js page
    home_page_path = os.path.join(base_directory, "frontend", "src", "pages", "Home.js")
    os.makedirs(os.path.dirname(home_page_path), exist_ok=True)
    with open(home_page_path, "w", encoding="utf-8") as f:
        f.write(home_page_template)
    print(f"Created file: {home_page_path}")

    print("\n✅ Full LMS folder structure (backend + frontend) created successfully!")
