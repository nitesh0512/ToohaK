// Registers a user with an email, password, and names,
// then returns their authUserId value.
import { getData, setData } from './dataStore';
import { DataStore, ErrorObject, user, UserDetails, TokenId, token } from './interfaces';
import isEmail from 'validator/lib/isEmail.js';
import { v4 as generateId, validate as checkToken } from 'uuid';
import HTTPError, { IsHttpError } from 'http-errors';
import { getHashOf } from './helper';

let data: DataStore = getData();

/**
  * Registers a user with an email, password, and names,
  * then returns their authUserId value.
  * @param {string} email
  * @param {string} password
  * @param {string} nameFirst
  * @param {string} nameLast

  * @returns {object} Object containing token, or an error object
  *
  */
export function adminAuthRegister (email:string, password:string, nameFirst:string, nameLast:string):TokenId|IsHttpError {
  data = getData();
  const res:user = {
    userId: 0,
    nameFirst: 'string',
    nameLast: 'string',
    email: 'string',
    password: 'string',
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    ownedQuizzes: [],
    previousPasswords: []
  };
  // Finds a unique id to assign to the new user
  const ID = data.nextUserId;
  res.userId = ID;
  // Checks whether the first and last names are between 3 and 30 characters long,
  // and also checks that they only have alphanumeric characters, spaces and dashes.
  if ((nameFirst.length >= 2 && nameFirst.length <= 20 && !nameFirst.match(/[^a-zA-Z \-']/g)) &&
      (nameLast.length >= 2 && nameLast.length <= 20 && !nameLast.match(/[^a-zA-Z \-']/g))) {
    res.nameFirst = nameFirst;
    res.nameLast = nameLast;
  } else {
    throw HTTPError(400, 'Invalid first or last name');
  }
  if (data.users.find(user => user.email === email)) throw HTTPError(400, 'Duplicate Email');
  // Checks to see that the email is unique and also roughly resembles an email
  if (!data.users.find(user => user.email === email) && isEmail(email)) {
    res.email = email;
  } else {
    throw HTTPError(400, 'Invalid Email');
  }

  // Checks to see if the password is long enough, and also contains atleast one
  // letter and one digit
  if (password.length >= 8 && password.match(/[a-z]/gi) && password.match(/[0-9]/)) {
    res.password = getHashOf(password);
  } else {
    throw HTTPError(400, 'Password needs to be stronger');
  }

  // After all the checks have been passed, declares a few more things,
  // inserts it into the data object and then updates the dataStore
  // to include the new user.
  res.numSuccessfulLogins = 1;
  res.numFailedPasswordsSinceLastLogin = 0;
  res.ownedQuizzes = [];
  data.nextUserId++;
  res.previousPasswords = [];
  data.users.push(res);

  // Creates a token to signify that this user has an active session (since we register a user then automatically log them in)
  const token:token = {
    tokenId: generateId(),
    userId: ID
  };

  data.tokens.push(token);
  setData(data);
  return {
    token: token.tokenId
  };
}

/**
  * Given a registered user's email and password returns
  * their authUserId value.
  * @param {string} email
  * @param {string} password
  * @returns {object} Object containing the userId of the user, or an error object.
  */
export function adminAuthLogin(email:string, password:string):TokenId|IsHttpError {
  data = getData();
  // Searches for the user that matches the email
  const searchUser:user|undefined = data.users.find((user) => user.email === email);

  // if return value from the find function is undefined then returns an error message
  if (!searchUser) {
    throw HTTPError(400, 'This email is not registered.');
  }

  // If return from find is undefined then the email is not registered
  if (searchUser.password !== getHashOf(password)) {
    searchUser.numFailedPasswordsSinceLastLogin++;
    setData(data);
    throw HTTPError(400, 'Password is invalid');
  }

  searchUser.numFailedPasswordsSinceLastLogin = 0;
  searchUser.numSuccessfulLogins++;
  // Creates a token to signify that this user has an active session (since we register a user then automatically log them in)
  const token:token = {
    tokenId: generateId(),
    userId: searchUser.userId
  };
  data.tokens.push(token);
  setData(data);
  return {
    token: token.tokenId
  };
}

/**
  * Given an admin user's authUserId, return details about the user.
  * @param {number} tokenId
  * @returns {object} Object containing comprehensive details about the user.
  *
  */

export function adminUserDetails (tokenId: string): UserDetails | ErrorObject {
  data = getData();

  // Checks if the tokenId of the admin user is valid,
  // if not, returns an error message
  if (!checkToken(tokenId)) {
    return { error: 'Invalid token ID' };
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    return { error: 'Token does not match active session' };
  }
  const adminUser: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!adminUser) {
    return { error: 'Invalid user ID' };
  }

  // Returns an object containing userId, name, email, number of
  // successful logins and unsuccessful logins since last login
  return {
    user: {
      userId: adminUser.userId,
      name: adminUser.nameFirst + ' ' + adminUser.nameLast,
      email: adminUser.email,
      numSuccessfulLogins: adminUser.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: adminUser.numFailedPasswordsSinceLastLogin
    }
  };
}
/**
 * Given a valid token id, ends the session corresponding to that id
 * @param tokenId
 * @returns Empty object if successful, error object if not.
 */
export function adminAuthLogout(tokenId: string) {
  data = getData();
  // check structure of token
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  // get index of token in the array
  const tokenIndex:number = data.tokens.findIndex(token => token.tokenId === tokenId);
  // check that token matches a session
  if (tokenIndex === -1) return { error: 'Token does not match active session' };
  // delete the token from the tokens array
  data.tokens.splice(tokenIndex, 1);
  setData(data);
  return {};
}

/**
  * Given a registered user's tokenId and
  * details such as email, nameFirst and nameLast
  * updates user detail according to parameter and returns {}.
  * @param {string} tokenId
  * @param {string} email
  * @param {string} nameFirst
  * @param {string} nameLast
  * @returns {object} Empty object if successful, error object if not.
  */
export function adminUserDetailsUpdate(tokenId: string, email: string, nameFirst: string, nameLast: string): Record<string, never> | ErrorObject {
  data = getData();

  // Checks for valid tokenId and valid sessions
  if (!checkToken(tokenId)) {
    return { error: 'Invalid token ID' };
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    return { error: 'Token does not match active session' };
  }
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) {
    return { error: 'Invalid user ID' };
  }

  // Checks to see if nameFirst and nameLast only contains
  // lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  if (nameFirst.match(/[^a-zA-Z \-']/g) || nameLast.match(/[^a-zA-Z \-']/g)) {
    return { error: 'First and last name can only include alphanumeric characters with spaces' };
  }

  // Length of first and last name must be 2 - 20 characters inclusive
  if (nameFirst.length < 2 || nameFirst.length > 20 || nameLast.length < 2 || nameLast.length > 20) {
    return { error: 'First and last name must be between 2 - 20 characters' };
  }

  // Checks to see if inputted email satisfies the isEmail
  if (!isEmail(email)) {
    return { error: 'Not a valid email' };
  }

  // Checks to see that the email is unique
  // (excluding the current authorised user)
  if (data.users.find(user => user.email === email) && user.email !== email) {
    return { error: 'Email cannot be used by another existing user' };
  }

  // Loops through to find current admin user then updates data
  for (const currentAdmin of data.users) {
    if (currentAdmin.userId === user.userId) {
      currentAdmin.email = email;
      currentAdmin.nameFirst = nameFirst;
      currentAdmin.nameLast = nameLast;
      setData(data);
      return {};
    }
  }
}

/**
  * Given a registered user's tokenId, oldPassword and newPassword,
  * updates user's password to newPassword from oldPassword and
  * returns empty object.
  * @param {string} tokenId
  * @param {string} oldPassword
  * @param {string} newPassword
  * @returns {object} Empty object if successful, error object if not.
  */
export function adminUserPasswordUpdate(tokenId: string, oldPassword: string, newPassword: string): Record<string, never> | ErrorObject {
  data = getData();

  // Checks for valid tokenId and valid sessions
  if (!checkToken(tokenId)) {
    return { error: 'Invalid token ID' };
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    return { error: 'Token does not match active session' };
  }
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) {
    return { error: 'Invalid user ID' };
  }

  // Checks if the given old password is equal to current user password
  if (user.password !== getHashOf(oldPassword)) {
    return { error: 'Invalid password' };
  }

  // Checks if new Password has already been used before by this user
  for (const password of user.previousPasswords) {
    if (password === getHashOf(newPassword)) {
      return { error: 'New password cannot be the same as previous passwords' };
    }
  }
  if (oldPassword === newPassword) {
    return { error: 'New password cannot be the same as previous passwords' };
  }

  // Checks if New Password is less than 8 characters
  // and contains at least one number and at least one letter
  if (newPassword.length < 8 || !newPassword.match(/[a-z]/gi) || !newPassword.match(/[0-9]/)) {
    return { error: 'New password needs to be stronger' };
  }

  // Updates user data in datastore
  for (const currentUser of data.users) {
    if (currentUser.userId === user.userId) {
      currentUser.previousPasswords.push(currentUser.password);
      currentUser.password = getHashOf(newPassword);
      setData(data);
      return {};
    }
  }
}
