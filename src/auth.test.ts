// Put your tests here!
import { v4 as generateId } from 'uuid';
import {
  requestAdminAuthRegister, requestClear, requestAdminQuizCreate, requestAdminAuthLogout,
  requestAdminAuthLogin, requestAdminUserDetails, requestAdminUserDetailsUpdate,
  requestAdminUserPasswordUpdate
} from './helper';
const OK = 200;
const INPUT_ERROR = 400;
const TOKEN_NOT_LOGGED_IN = 403;
const INVALID_TOKEN = 401;

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
});

describe('adminAuthRegister', () => {
  test.each([
    { email: 'test@@@gmail.cod', password: 'passw0rdd', nameFirst: 'Test', nameLast: 'Test' },
    { email: 'test@gmail.com', password: 'pas', nameFirst: 'Test', nameLast: 'Test' },
    { email: 'test@gmail.com', password: 'testPassw0rd', nameFirst: 'T3st', nameLast: 'Test' },
    { email: 'test@gmail.com', password: 'testPassw0rd', nameFirst: 'Test', nameLast: 'T3st' },
    { email: 'test@gmail.com', password: 'testPassw0rd', nameFirst: 'TestTestTestTestTestTest', nameLast: 'Test' },
    { email: 'test@gmail.com', password: 'testPassw0rd', nameFirst: 'Test', nameLast: 'TestTestTestTestTestTest' },
    { email: 'test@gmail.com', password: 'testPassw0rd', nameFirst: '', nameLast: 'Test' },
    { email: 'test@gmail.com', password: 'testPassw0rd', nameFirst: 'Test', nameLast: '' }
  ])('Invalid combinations ($email, $password, $nameFirst, $nameLast)',
    ({ email, password, nameFirst, nameLast }) => {
      const res:any = requestAdminAuthRegister(email, password, nameFirst, nameLast);
      const bodyObj = JSON.parse(res.body as string);
      expect(res.statusCode).toBe(INPUT_ERROR);
      expect(bodyObj.error).toStrictEqual(expect.any(String));
    });

  test.each([
    { email: 'arnavbadrish@gmail.com', password: 'passw0rdd', nameFirst: 'Arnav', nameLast: 'Badrish' },
    { email: 'testing@gmail.com', password: 'TestP0ss', nameFirst: 'Te', nameLast: 'TestTestTestTest' },
    { email: 'rhythm@gmail.com', password: 'passw0rd', nameFirst: 'Rhythm', nameLast: 'Adlakha' },
    { email: 'jonathan@gmail.com', password: 'very str0ng', nameFirst: 'Jonathan', nameLast: 'Luo' }
  ])('Valid combinations ($email, $password, $nameFirst, $nameLast)',
    ({ email, password, nameFirst, nameLast }) => {
      const res:any = requestAdminAuthRegister(email, password, nameFirst, nameLast);
      const bodyObj = JSON.parse(res.body as string);
      expect(res.statusCode).toBe(OK);
      expect(bodyObj.token).toStrictEqual(expect.anything());
    });

  test('Duplicate Testing (Invalid)', () => {
    requestAdminAuthRegister('arnavbadrish@gmail.com', 'passw0rdd', 'Arnav', 'Badrish');
    const res:any = requestAdminAuthRegister('arnavbadrish@gmail.com', 'testPassw0rd', 'Duplicate', 'Arnav');
    const bodyObj = JSON.parse(res.body as string);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});

describe('/v1/admin/auth/logout', () => {
  let user1Token:string, res:any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister('arnavbadrish@gmail.com', 'passw0rdd', 'Arnav', 'Badrish');
    expect(res.statusCode).toBe(OK);
    user1Token = JSON.parse(res.body as string).token;
  });

  test('Valid Logout', () => {
    let res:any = requestAdminAuthLogout(user1Token);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
    res = requestAdminQuizCreate(user1Token, 'Testing the quiz', 'Testing Description');
    expect(res.statusCode).toBe(403);
  });

  test('Invalid Token Structure', () => {
    const res:any = requestAdminAuthLogout('abacus');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  test('Token is not recognised as logged in', () => {
    let res:any = requestAdminAuthLogout(user1Token);
    expect(res.statusCode).toBe(OK);
    res = requestAdminAuthLogout(user1Token);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
});

describe('adminAuthLogin', () => {
  test('Valid Test 1', () => {
    let res:any = requestAdminAuthRegister('rhythm@gmail.com', 'passw0rd', 'Rhythm', 'Adlakha');
    expect(res.statusCode).toBe(OK);
    res = requestAdminAuthLogin('rhythm@gmail.com', 'passw0rd');
    expect(res.statusCode).toBe(OK);
    const bodyObj = JSON.parse(res.body as string);
    expect(bodyObj.token).toStrictEqual(expect.anything());
  });
  test('Valid Test 2', () => {
    let res:any = requestAdminAuthRegister('arnavbadrish@gmail.com', 'passw0rd2', 'Arnav', 'Badrish');
    expect(res.statusCode).toBe(OK);
    res = requestAdminAuthLogin('arnavbadrish@gmail.com', 'passw0rd2');
    expect(res.statusCode).toBe(OK);
    const bodyObj = JSON.parse(res.body as string);
    expect(bodyObj.token).toStrictEqual(expect.anything());
  });
  test('Invalid Email', () => {
    let res:any = requestAdminAuthRegister('arnavbadrish@gmail.com', 'thisisAp4W', 'Arnav', 'Badrish');
    expect(res.statusCode).toBe(OK);
    res = requestAdminAuthLogin('notemail@gmail.com', 'thisisAp4W');
    expect(res.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(res.body as string);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
  test('Invalid Password', () => {
    let res:any = requestAdminAuthRegister('arnavbadrish@gmail.com', 'passw0rd2', 'Arnav', 'Badrish');
    expect(res.statusCode).toBe(OK);
    res = requestAdminAuthLogin('arnavbadrish@gmail.com', 'notpassword');
    expect(res.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(res.body as string);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
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
    res = requestAdminUserDetails('invalid');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Invalid input of tokenId (403)', () => {
    res = requestAdminUserDetails(generateId());
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing if the function returns the right object when input is correct
  test('Valid input of authUserId', () => {
    res = requestAdminUserDetails(user1);
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
    res = requestAdminUserDetails(user2);
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
    res = requestAdminUserDetails(user3);
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
    res = requestAdminUserDetailsUpdate('invalid', 'harrypotter@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Invalid token (403)', () => {
    res = requestAdminUserDetailsUpdate(generateId(), 'harrypotter@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing for invalid email inputs (400)
  test('Email does not satisfy validator.isEmail', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Email is currently used by another user (2)', () => {
    res = requestAdminUserDetailsUpdate(user2, 'harrypotter@gmail.com', 'Heriome', 'Weasley');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing for invalid name inputs (400)
  test('NameFirst contains characters other than alphabets, spaces, hyphens, or apostrophes', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Ha 2rry', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameLast contains characters other than alphabets, spaces, hyphens, or apostrophes', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'po-tt#r');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameFirst is less than 2 characters', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'H', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameLast is less than 2 characters', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'P');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameFirst is longer than 20 characters', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Verylonglonglongnamee', 'Potter');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('NameLast is longer than 20 characters)', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'Verylonglonglongnamee');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing when all inputs are valid (200)
  test('Valid inputs for adminUserDetailsUpdate (1)', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrypotter@gmail.com', 'Harry', 'Potter');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid inputs for adminUserDetailsUpdate (2)', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harryiswizard@gmail.com', 'ha rry', 'Potter');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid inputs for adminUserDetailsUpdate (3)', () => {
    res = requestAdminUserDetailsUpdate(user1, 'harrywearsglasses@gmail.com', "Gl-asse's", 'potter');
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
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid inputs for adminUserPasswordUpdate (2)', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', 'newsPE11');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // Testing for invalid tokenId input (401 and 403)
  test('Invalid token (401)', () => {
    res = requestAdminUserPasswordUpdate('invalid', 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Invalid token (403)', () => {
    res = requestAdminUserPasswordUpdate(generateId(), 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing when old password is not the same as current password (400)
  test('Invalid old password', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imawizard', 'expe11iarmus');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing for when password has already been used before (400)
  test('New password has already been used before by this user (1)', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(OK);
    res = requestAdminUserPasswordUpdate(user1, 'expe11iarmus', 'imaw1zard');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('New password has already been used before by this user (2)', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', 'expe11iarmus');
    expect(res.statusCode).toBe(OK);
    res = requestAdminUserPasswordUpdate(user1, 'expe11iarmus', 'Newc0rrectpw');
    expect(res.statusCode).toBe(OK);
    res = requestAdminUserPasswordUpdate(user1, 'Newc0rrectpw', 'imaw1zard');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('New password has already been used before by this user (3)', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', 'imaw1zard');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });

  // Testing when password complexity is unsatisfied
  test('Password length and complexity is not satisfied (1)', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', 'new1pw');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Password length and complexity is not satisfied (2)', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', 'alongerpassword');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
  test('Password length and complexity is not satisfied (2)', () => {
    res = requestAdminUserPasswordUpdate(user1, 'imaw1zard', '123456789');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR);
  });
});
