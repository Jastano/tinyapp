const express = require("express");
const cookieParser = require("cookie-parser"); // Import cookie-parser to manage cookies
const app = express();
const PORT = 8080;
const { getUserByEmail } = require("./helpers"); // Import helper to find user by email

// user database
const users = {
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

// Middleware setup
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); // parse cookies

// Set EJS as view engine for .ejs templates
app.set("view engine", "ejs");

// Helper to create a random string for user IDs and short URLs
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

// In-memory short URL database
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// ---------- ROUTES ----------


app.get("/", (req, res) => {
  res.send("Hello!");
});

// Test route
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Show new URL form — must be logged in
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId || !users[userId]) {
    return res.redirect("/login"); // If not logged in, send to login page
  }
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

// Show a specific short URL
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id, longURL, user };
  res.render("urls_show", templateVars);
});

// Show register form — redirect if already logged in
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId && users[userId]) {
    return res.redirect("/urls"); // Already logged in → go to dashboard
  }
  res.render("register");
});

// Show login form — redirect if already logged in
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId && users[userId]) {
    return res.redirect("/urls"); // Already logged in → go to dashboard
  }
  res.render("login");
});

// Handle short URL creation — must be logged in
app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId || !users[userId]) {
    // Prevent unauthenticated users from submitting form via curl/postman
    return res.status(403).send("<h3>Error: You must be logged in to shorten URLs.</h3>");
  }

  const id = generateRandomString(); // new short URL id
  urlDatabase[id] = req.body.longURL; // save long URL to database
  res.redirect(`/urls/${id}`); // redirect to the URL details page
});

// Handle updating long URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;
  }
  res.redirect("/urls");
});

//  Handle deleting a short URL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

// Public redirect route
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("<h3>Error: Short URL not found.</h3>"); // invalid short URL id
  }
});

// Handle login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users); // use helper to look up user

  if (!user || user.password !== password) {
    return res.status(403).send("Error: Invalid email or password.");
  }

  res.cookie("user_id", user.id); // set session cookie
  res.redirect("/urls");
});

// Handle logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id"); // clear login session
  res.redirect("/login"); // redirect to login screen
});

// Handle registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Error: Missing email or password
  if (!email || !password) {
    return res.status(400).send("Error: Email and password cannot be blank.");
  }

  // Error: Duplicate user
  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send("Error: A user with that email already exists.");
  }

  // Create new user and log them in
  const id = generateRandomString();
  users[id] = { id, email, password };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

// Start the server
app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});
