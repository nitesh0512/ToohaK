import HTTPError, { IsHttpError } from 'http-errors';
import { getData, setData } from './dataStore';
import { validate as checkToken } from 'uuid';
import isEmail from 'validator/lib/isEmail.js';
import { DataStore, session, PlayerId, Player, States, UserDetails, token, user } from './interfaces';
import { generateRandomName, getHashOf } from './helper';

let data:DataStore = getData();

/**
  * Lets the admin user logout
  * @param {string} tokenId
  * @returns {object} Empty object if successful, error object if not.
  *
  */
export function v2adminAuthLogout(tokenId: string):Record<string, never>|IsHttpError {
  data = getData();
  // check structure of token
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  // get index of token in the array
  const tokenIndex:number = data.tokens.findIndex(token => token.tokenId === tokenId);
  // check that token matches a session
  if (tokenIndex === -1) throw HTTPError(400, 'Token does not match active session');
  // delete the token from the tokens array
  data.tokens.splice(tokenIndex, 1);
  setData(data);
  return {};
}

/**
  * Given an admin user's authUserId, return details about the user.
  * @param {number} sessionId
  * @param {string} name
  * @returns {object} Object containing playerId
  *
  */
export function allowGuestPlayerToSession(sessionId: number, name: string): PlayerId | IsHttpError {
  data = getData();

  const session: session | undefined = data.sessions.find(session => session.sessionId === sessionId);
  if (!session) {
    throw HTTPError(400, 'No such session exists');
  }
  // Checking if session is in lobby state
  if (session.state !== States.LOBBY) {
    throw HTTPError(400, 'Session is not in LOBBY state');
  }

  const newPlayer: Player | undefined = session.players.find(player => player.name === name);
  if (newPlayer) {
    throw HTTPError(400, 'Name entered is not unique');
  }

  if (!name) {
    name = generateRandomName();
    while (session.players.find(player => player.name === name)) {
      name = generateRandomName();
    }
  }

  const finalPlayer: Player = {
    playerId: data.nextPlayerId,
    name: name,
    questionsAnswered: [],
    score: 0
  };

  data.nextPlayerId++;
  setData(data);
  for (const currentSession of data.sessions) {
    if (currentSession.sessionId === sessionId) {
      currentSession.players.push(finalPlayer);
      setData(data);
    }
  }

  return { playerId: finalPlayer.playerId };
}

/**
  * Given an admin user's authUserId, return details about the user.
  * @param {string} tokenId
  * @returns {object} Object containing comprehensive details about the user.
  *
  */
export function v2AdminUserDetails (tokenId: string): UserDetails | IsHttpError {
  data = getData();

  // Checks if the tokenId of the admin user is valid,
  // if not, returns an error message
  if (!checkToken(tokenId)) {
    throw HTTPError(401, 'Invalid token ID');
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    throw HTTPError(403, 'Token does not match active session');
  }
  const adminUser: user | undefined = data.users.find(user => user.userId === token.userId);
  // if (!adminUser) {
  //   return { error: 'Invalid user ID' };
  // }

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
  * Given a registered user's tokenId and
  * details such as email, nameFirst and nameLast
  * updates user detail according to parameter and returns {}.
  * @param {string} tokenId
  * @param {string} email
  * @param {string} nameFirst
  * @param {string} nameLast
  * @returns {object} Empty object if successful, error object if not.
  */
export function v2AdminUserDetailsUpdate(tokenId: string, email: string, nameFirst: string, nameLast: string): Record<string, never> | IsHttpError {
  data = getData();

  // Checks for valid tokenId and valid sessions
  if (!checkToken(tokenId)) {
    throw HTTPError(401, 'Invalid token ID');
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    throw HTTPError(403, 'Token does not match active session');
  }
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  // if (!user) {
  //   return { error: 'Invalid user ID' };
  // }

  // Checks to see if nameFirst and nameLast only contains
  // lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  if (nameFirst.match(/[^a-zA-Z \-']/g) || nameLast.match(/[^a-zA-Z \-']/g)) {
    throw HTTPError(400, 'First and last name can only include alphanumeric characters with spaces');
  }

  // Length of first and last name must be 2 - 20 characters inclusive
  if (nameFirst.length < 2 || nameFirst.length > 20 || nameLast.length < 2 || nameLast.length > 20) {
    throw HTTPError(400, 'First and last name must be between 2 - 20 characters');
  }

  // Checks to see if inputted email satisfies the isEmail
  if (!isEmail(email)) {
    throw HTTPError(400, 'Not a valid email');
  }

  // Checks to see that the email is unique
  // (excluding the current authorised user)
  if (data.users.find(user => user.email === email) && user.email !== email) {
    throw HTTPError(400, 'Email cannot be used by another existing user');
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
export function v2AdminUserPasswordUpdate(tokenId: string, oldPassword: string, newPassword: string): Record<string, never> | IsHttpError {
  data = getData();

  // Checks for valid tokenId and valid sessions
  if (!checkToken(tokenId)) {
    throw HTTPError(401, 'Invalid token ID');
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    throw HTTPError(403, 'Token does not match active session');
  }
  const user: user | undefined = data.users.find(user => user.userId === token.userId);

  // Checks if the given old password is equal to current user password
  if (user.password !== getHashOf(oldPassword)) {
    throw HTTPError(400, 'Invalid password');
  }

  // Checks if new Password has already been used before by this user
  for (const password of user.previousPasswords) {
    if (password === getHashOf(newPassword)) {
      throw HTTPError(400, 'New password cannot be the same as previous passwords');
    }
  }
  if (oldPassword === newPassword) {
    throw HTTPError(400, 'New password cannot be the same as previous passwords');
  }

  // Checks if New Password is less than 8 characters
  // and contains at least one number and at least one letter
  if (newPassword.length < 8 || !newPassword.match(/[a-z]/gi) || !newPassword.match(/[0-9]/)) {
    throw HTTPError(400, 'New password needs to be stronger');
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
