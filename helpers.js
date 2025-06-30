// This helper function searches the users object for a user with a given email.
// If it finds one, it returns that user object.
// If not, it returns null.
const getUserByEmail = (email, users) => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
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

// Helper to create a random string for user IDs and short URLs
const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };
