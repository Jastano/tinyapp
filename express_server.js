const express = require("express");

const app = express();

const PORT = 8080;

// Function to generate a random 6-character string
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

// Middleware to parse incoming request bodies (from forms)
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// Default route - shows "Hello!" in browser
app.get("/", (req, res) => {
  res.send("Hello!");
});

// A basic test route that returns simple HTML
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route to show form for creating a new short URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Route to show all saved URLs in a table format
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Route to show a single short URL and its long URL
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id]; // get long URL for the short ID
  const templateVars = { id, longURL };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to handle form submissions for new short URLs
app.post("/urls", (req, res) => {
  const id = generateRandomString(); 
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`); 
});

// Route to update an existing short URL's long URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  
  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;  // Update the long URL in database
  }
  res.redirect("/urls");  // Redirect back to the list of URLs
});

// Deletes URL from your urlDatabase and then redirects back to /urls:
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];  // Remove the URL from database
  res.redirect("/urls");   // Redirect back to index page
});

// Route to redirect short URLs to their corresponding long URLs
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id]; 

  if (longURL) {
    res.redirect(longURL); // redirect to the long URL
  } else {
    res.status(404).send("Short URL not found."); // error if ID doesn't exist
  }
});

// Start the server and listen for connections
app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});
