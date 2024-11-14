import {
  requestClear, requestAdminAuthRegister, v2requestAdminAuthLogout,
  requestAllowGuestPlayerToSession, v1requestStartQuizSession,
  v2requestCreateQuestion, requestUpdateSessionState, v2requestAdminQuizCreate,
  v2RequestAdminUserDetails, v2RequestAdminUserDetailsUpdate,
  v2RequestAdminUserPasswordUpdate
} from './helper';
import { v4 as generateId } from 'uuid';
const OK = 200;
const INPUT_ERROR = 400;
// commented out for linting
const TOKEN_NOT_LOGGED_IN = 403;
const INVALID_TOKEN = 401;
const ERROR = { error: expect.any(String) };

describe('/v2/admin/auth/logout', () => {
  let user1Token:string, res:any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister('arnavbadrish@gmail.com', 'passw0rdd', 'Arnav', 'Badrish');
    expect(res.statusCode).toBe(OK);
    user1Token = JSON.parse(res.body as string).token;
  });

  test('Valid Logout', () => {
    let res:any = v2requestAdminAuthLogout(user1Token);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
    res = v2requestAdminQuizCreate(user1Token, 'Testing the quiz', 'Testing Description');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
  });

  test('Invalid Token Structure', () => {
    const res:any = v2requestAdminAuthLogout('abacus');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  test('Token is not recognised as logged in', () => {
    let res:any = v2requestAdminAuthLogout(user1Token);
    expect(res.statusCode).toBe(OK);
    res = v2requestAdminAuthLogout(user1Token);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
});

describe('allowGuestPlayerToSession', () => {
  let user: string, quiz: number, session: number, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user = JSON.parse(res.body as string).token;

    res = v2requestAdminQuizCreate(
      user,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    quiz = JSON.parse(res.body as string).quizId;

    res = v2requestCreateQuestion(user, quiz, {
      question: 'What year is the next olympics held in?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'year 2024',
          correct: true
        },
        {
          answer: 'year 2025',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);

    res = v1requestStartQuizSession(quiz, user, 5);
    expect(res.statusCode).toBe(OK);
    session = JSON.parse(res.body as string).sessionId;
  });

  // Invalid inputs
  test('SessionId does not exist', () => {
    res = requestAllowGuestPlayerToSession(-1, 'Tony Stark');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Session is not in LOBBY state', () => {
    res = requestAllowGuestPlayerToSession(session, 'Tony Stark');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user, quiz, session, 'END');
    expect(res.statusCode).toBe(OK);
    res = requestAllowGuestPlayerToSession(session, 'Mary Jane');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Name entered is not unique', () => {
    res = requestAllowGuestPlayerToSession(session, 'Tony Stark');
    expect(res.statusCode).toBe(OK);
    res = requestAllowGuestPlayerToSession(session, 'Tony Stark');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Valid inputs
  test('All fields valid', () => {
    res = requestAllowGuestPlayerToSession(session, 'Tony Stark');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ playerId: expect.any(Number) });
  });
  test('Name entered is unique', () => {
    res = requestAllowGuestPlayerToSession(session, 'Tony Stark');
    expect(res.statusCode).toBe(OK);
    res = requestAllowGuestPlayerToSession(session, 'Mary Jane');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ playerId: expect.any(Number) });
  });
});

// Testing for adminUserDetails
describe('adminUserDetails', () => {
  // Setting up information for user
  let user1: string, user2: string, user3: string, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister(
      'harrypotter@gmail.com',
      'imaw1zard',
      'Harry',
      'Potter'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = requestAdminAuthRegister(
      'hermionegranger@gmail.com',
      'lev10sahh',
      'Heriome',
      'Granger'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;

    res = requestAdminAuthRegister(
      'ronweasley@gmail.com',
      'imwe4sley',
      'Ron',
      'Weasley'
    );
    expect(res.statusCode).toBe(OK);
    user3 = JSON.parse(res.body as string).token;
  });

  // Testing for inputs of invalid tokenId
  test('Invalid input of tokenId (401)', () => {
    res = v2RequestAdminUserDetails('invalid');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Invalid input of tokenId (403)', () => {
    res = v2RequestAdminUserDetails(generateId());
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing if the function returns the right object when input is correct
  test('Valid input of authUserId', () => {
    res = v2RequestAdminUserDetails(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual(
      {
        user: {
          userId: expect.any(Number),
          name: 'Harry Potter',
          email: 'harrypotter@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0
        }
      }
    );
  });
  test('Valid input of authUserId', () => {
    res = v2RequestAdminUserDetails(user2);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual(
      {
        user: {
          userId: expect.any(Number),
          name: 'Heriome Granger',
          email: 'hermionegranger@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0
        }
      }
    );
  });
  test('Valid input of authUserId', () => {
    res = v2RequestAdminUserDetails(user3);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual(
      {
        user: {
          userId: expect.any(Number),
          name: 'Ron Weasley',
          email: 'ronweasley@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0
        }
      }
    );
  });
});

describe('adminUserDetailsUpdate', () => {
  // Set up user information
  let user1: string, user2: string, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister(
      'harrypotter@gmail.com',
      'imaw1zard',
      'Harry',
      'Potter'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = requestAdminAuthRegister(
      'hermionegranger@gmail.com',
      'lev10sahh',
      'Heriome',
      'Granger'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;
  });

  // Testing for invalid tokenId inputs (401 and 403)
  test('Invalid token (401)', () => {
    res = v2RequestAdminUserDetailsUpdate('invalid', 'harrypotter@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Invalid token (403)', () => {
    res = v2RequestAdminUserDetailsUpdate(generateId(), 'harrypotter@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing for invalid email inputs (400)
  test('Email does not satisfy validator.isEmail', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Email is currently used by another user (2)', () => {
    res = v2RequestAdminUserDetailsUpdate(user2, 'harrypotter@gmail.com', 'Heriome', 'Weasley');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing for invalid name inputs (400)
  test('NameFirst contains characters other than alphabets, spaces, hyphens, or apostrophes', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Ha 2rry', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameLast contains characters other than alphabets, spaces, hyphens, or apostrophes', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'po-tt#r');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameFirst is less than 2 characters', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'H', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameLast is less than 2 characters', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'P');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameFirst is longer than 20 characters', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Verylonglonglongnamee', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameLast is longer than 20 characters)', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'Verylonglonglongnamee');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing when all inputs are valid (200)
  test('Valid inputs for adminUserDetailsUpdate (1)', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid inputs for adminUserDetailsUpdate (2)', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harryiswizard@gmail.com', 'ha rry', 'Potter');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid inputs for adminUserDetailsUpdate (3)', () => {
    res = v2RequestAdminUserDetailsUpdate(user1, 'harrywearsglasses@gmail.com', "Gl-asse's", 'potter');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
});

describe('adminUserPasswordUpdate', () => {
  // Set up user information
  let user1: string, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister(
      'harrypotter@gmail.com',
      'imaw1zard',
      'Harry',
      'Potter'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;
  });

  // Testing valid inputs for all parameters (200)
  test('Valid inputs for adminUserPasswordUpdate (1)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid inputs for adminUserPasswordUpdate (2)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', 'newsPE11');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // Testing for invalid tokenId input (401 and 403)
  test('Invalid token (401)', () => {
    res = v2RequestAdminUserPasswordUpdate('invalid', 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Invalid token (403)', () => {
    res = v2RequestAdminUserPasswordUpdate(generateId(), 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing when old password is not the same as current password (400)
  test('Invalid old password', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imawizard', 'expe11iarmus');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing for when password has already been used before (400)
  test('New password has already been used before by this user (1)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(OK);
    res = v2RequestAdminUserPasswordUpdate(user1, 'expe11iarmus', 'imaw1zard');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('New password has already been used before by this user (2)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(OK);
    res = v2RequestAdminUserPasswordUpdate(user1, 'expe11iarmus', 'Newc0rrectpw');
    expect(res.statusCode).toBe(OK);
    res = v2RequestAdminUserPasswordUpdate(user1, 'Newc0rrectpw', 'imaw1zard');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('New password has already been used before by this user (3)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', 'imaw1zard');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing when password complexity is unsatisfied
  test('Password length and complexity is not satisfied (1)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', 'new1pw');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Password length and complexity is not satisfied (2)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', 'alongerpassword');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Password length and complexity is not satisfied (2)', () => {
    res = v2RequestAdminUserPasswordUpdate(user1, 'imaw1zard', '123456789');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
});
