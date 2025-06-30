const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;
const { getUserByEmail } = require("./helpers");

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

// Helper to get all URLs that belong to a specific user
const urlsForUser = function(id, urlDatabase) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

// Helper to create a random string for user IDs and short URLs
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

// In-memory short URL database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};

// ---------- ROUTES ----------

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Show new URL form — must be logged in
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId || !users[userId]) {
    return res.redirect("/login");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// Show all URLs for the logged-in user only
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (!user) {
    return res.status(401).send("<h3>Error: Please <a href='/login'>log in</a> to view your URLs.</h3>");
  }

  const userUrls = urlsForUser(userId, urlDatabase);
  const templateVars = {
    urls: userUrls,
    user,
  };
  res.render("urls_index", templateVars);
});

// Show a specific short URL — must own the URL
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
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

// Show register form
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  res.render("register");
});

// Show login form
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  res.render("login");
});

// Handle short URL creation — must be logged in
app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
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

// Handle updating long URL — only owner can update
app.post("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
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
  const userId = req.cookies["user_id"];
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

// Redirect short URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const url = urlDatabase[id];
  if (url) {
    res.redirect(url.longURL);
  } else {
    res.status(404).send("<h3>Error: Short URL not found.</h3>");
  }
});

// Handle login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || user.password !== password) {
    return res.status(403).send("Error: Invalid email or password.");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// Handle logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Handle registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Error: Email and password cannot be blank.");
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send("Error: A user with that email already exists.");
  }

  const id = generateRandomString();
  users[id] = { id, email, password };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

// Start the server
app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});
