const { assert } = require('chai');
const { getUserByEmail, urlsForUser } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return null for an email not in database', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.isNull(user);
  });
});

describe('urlsForUser', function() {
  const urlDatabase = {
    "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "user1" },
    "9sm5xK": { longURL: "http://www.google.com", userID: "user2" },
    "a1b2c3": { longURL: "http://www.example.com", userID: "user1" }
  };

  it('should return urls that belong to the specified user', function() {
    const result = urlsForUser("user1", urlDatabase);
    const expected = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "user1" },
      "a1b2c3": { longURL: "http://www.example.com", userID: "user1" }
    };
    assert.deepEqual(result, expected);
  });

  it('should return an empty object if the user has no urls', function() {
    const result = urlsForUser("user3", urlDatabase);
    assert.deepEqual(result, {});
  });

  it('should return an empty object if the urlDatabase is empty', function() {
    const result = urlsForUser("user1", {});
    assert.deepEqual(result, {});
  });

  it('should not return urls that belong to other users', function() {
    const result = urlsForUser("user2", urlDatabase);
    const expected = {
      "9sm5xK": { longURL: "http://www.google.com", userID: "user2" }
    };
    assert.deepEqual(result, expected);
  });
});
