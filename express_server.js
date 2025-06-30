const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080;
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");
const { users, urlDatabase } = require("./data");
const bcrypt = require("bcryptjs"); // hash passwords

// --------MIDDLEWARE------

app.use(express.urlencoded({ extended: true }));

// handle cookie-based sessions
app.use(cookieSession({
  name: 'session',
  keys: ['secretKey1', 'secretKey2'],
}));

// use EJS as the templating engine
app.set("view engine", "ejs");

// ---------- ROUTES ----------

// Home page route — redirect to /urls if logged in, otherwise to /login
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

// Simple hello test route
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Show form to create new URL — must be logged in
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId || !users[userId]) {
    return res.redirect("/login");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// Show all URLs that belong to the logged-in user
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.redirect("/login");
  }
  const userUrls = urlsForUser(userId, urlDatabase);
  const templateVars = {
    urls: userUrls,
    user,
  };
  res.render("urls_index", templateVars);
});

// Show page for a specific short URL — must own the URL
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    return res.status(404).send("<h3>Error: Short URL not found.</h3>");
  }

  if (!user) {
    return res.status(401).send("<h3>Error: You must be logged in to view this URL.</h3>");
  }

  if (url.userID !== userId) {
    return res.status(403).send("<h3>Error: You do not have permission to view this URL.</h3>");
  }

  const templateVars = { id, longURL: url.longURL, user };
  res.render("urls_show", templateVars);
});

// Show registration form
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = { user: null }; // 👈 Important: pass user for header partials
  res.render("register", templateVars);
});

// Show login form
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = { user: null }; // 👈 Important: pass user for header partials
  res.render("login", templateVars);
});

// Handle new short URL creation — must be logged in
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId || !users[userId]) {
    return res.status(403).send("<h3>Error: You must be logged in to shorten URLs.</h3>");
  }

  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: userId,
  };
  res.redirect(`/urls/${id}`);
});

// Handle updating a long URL — only owner can update
app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    return res.status(404).send("<h3>Error: Short URL not found.</h3>");
  }

  if (!userId || !users[userId]) {
    return res.status(401).send("<h3>Error: You must be logged in to edit this URL.</h3>");
  }

  if (url.userID !== userId) {
    return res.status(403).send("<h3>Error: You do not have permission to edit this URL.</h3>");
  }

  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Handle deleting a short URL — only owner can delete
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    return res.status(404).send("<h3>Error: Short URL not found.</h3>");
  }

  if (!userId || !users[userId]) {
    return res.status(401).send("<h3>Error: You must be logged in to delete this URL.</h3>");
  }

  if (url.userID !== userId) {
    return res.status(403).send("<h3>Error: You do not have permission to delete this URL.</h3>");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

// Redirect short URL to its long URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const url = urlDatabase[id];
  if (url) {
    res.redirect(url.longURL);
  } else {
    res.status(404).send("<h3>Error: Short URL not found.</h3>");
  }
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  // bcrypt password check
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Error: Invalid email or password.");
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

// Handle logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Handle registration form submission
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Error: Email and password cannot be blank.");
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send("Error: A user with that email already exists.");
  }

  // hash password before saving
  const hashedPassword = bcrypt.hashSync(password, 10);

  const id = generateRandomString();
  users[id] = { id, email, password: hashedPassword };
  req.session.user_id = id;
  res.redirect("/urls");
});

// Start the server
app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});
