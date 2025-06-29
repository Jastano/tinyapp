// This helper function searches the users object for a user with a given email.
// If it finds one, it returns that user object.
// If not, it returns null.

const getUserByEmail = function(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;// Found the user with matching email, return user object
    }
  }
  return null;// No user found with this email
};

module.exports = { getUserByEmail };
