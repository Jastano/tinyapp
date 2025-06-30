// in-memory user database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$hashedpasswordhere", 
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$hashedpasswordhere", 
  },
};

// in-memory short URL database
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

module.exports = { users, urlDatabase };
