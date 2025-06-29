const express = require("express");
const cookieParser = require("cookie-parser"); //  Import cookie-parser
const app = express();
const PORT = 8080;
const { getUserByEmail } = require("./helpers");

const users = { // data store
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // <-- Use cookie-parser

app.set("view engine", "ejs");

// Helper function
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

// Our URL database
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Show new URL form with user info
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// Show all URLs with user info
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_index", templateVars);
});

// Show a specific URL with user info
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id, longURL, user };
  res.render("urls_show", templateVars);
});

// Registration page
app.get("/register", (req, res) => {
  res.render("register");
});

// Create new short URL
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// Edit long URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;
  }
  res.redirect("/urls");
});

// Delete a short URL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

// Redirect short URL to long URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found.");
  }
});

// Login route to set username cookie
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username); // <- this will be updated later
  res.redirect("/urls");
});

// Logout route to clear username cookie
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Handle registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Error: Empty email or password
  if (!email || !password) {
    return res.status(400).send("Error: Email and password cannot be blank.");
  }

  // Error: Email already exists
  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send("Error: A user with that email already exists.");
  }

  // Create new user
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };

  res.cookie("user_id", id);
  res.redirect("/urls");
});

// Start server
app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});
