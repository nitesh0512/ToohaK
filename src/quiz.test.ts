/// ///////////////////////// IMPORTS //////////////////////////////////////////
// importing types from interfaces
import {
  ErrorObject, TokenId, questionBody,
  QuestionId, QuizId
} from './interfaces';
import request from 'sync-request';
import config from './config.json';
import {
  requestAdminQuizDescriptionUpdate, requestAdminAuthRegister,
  requestAdminQuizCreate, requestClear, requestQuizQuestionCreate,
  requestUpdateQuizQuestion, requestAdminQuizRemove, requestViewTrash,
  requestAdminQuizNameUpdate, requestAdminQuizTransfer,
  requestAdminAuthLogout, bodyStrToObj, v1RequestAdminQuizList, v1RequestAdminQuizInfo,
  v1RequestDeleteQuizQuestion, v1RequestQuizRestore, requestQuizTrashRemove
} from './helper';
import { v4 as generateId } from 'uuid';

/// ///////////////////////////CONSTANTS /////////////////////////////////////
const ERROR_MESSAGE: ErrorObject = { error: expect.any(String) };
const URL = config.url;
const port = config.port;
const SERVER_URL = `${URL}:${port}`;
const OK = 200;
const INPUT_ERROR = 400;
const INVALID_TOKEN = 401;
const TOKEN_NOT_LOGGED_IN = 403;

/// ////////////////////////// WRAPPERS ////////////////////////////////////////

const postRequest = (url: string, data: any) => {
  const res = request(
    'POST',
    url,
    {
      json: data,
    }
  );

  return res;
};

const putRequest = (url: string, data: any) => {
  const res = request(
    'PUT',
    url,
    {
      json: data,
    }
  );

  return res;
};

const deleteRequest = (url: string, data: any) => {
  const res = request(
    'DELETE',
    url,
    {
      qs: data,
    }
  );
  return res;
};
/// //////////////////////// ADMINQUIZLIST //////////////////////////////////////
describe('Tests for adminQuizList', () => {
  let user1: string, user1Quiz1: number, user1Quiz2: number, res: any;
  beforeEach(() => {
    requestClear();

    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    expect(res.statusCode).toBe(OK);
  });

  test('Valid List 1', () => {
    res = v1RequestAdminQuizList(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'spider' }] });
  });
  test('Restored Valid List', () => {
    res = requestAdminQuizRemove(user1, user1Quiz1);
    res = v1RequestQuizRestore(user1, user1Quiz1);
    res = v1RequestAdminQuizList(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'spider' }] });
  });
  test('Valid List 2', () => {
    res = requestAdminQuizCreate(
      user1,
      'mathquiz2',
      'sample'
    );
    user1Quiz2 = JSON.parse(res.body as string).quizId;
    res = v1RequestAdminQuizList(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'spider' }, { quizId: user1Quiz2, name: 'mathquiz2' }] });
  });

  test('If token does not exist', () => {
    res = v1RequestAdminQuizList(user1 + 1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('token not logged in', () => {
    res = v1RequestAdminQuizList(generateId());
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// //////////////////////// ADMINQUIZCREATE ////////////////////////////////////
describe('Valid inputs for adminQuizCreate', () => {
  let tokenId: TokenId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));
  });

  it('Should be a valid token', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'This is a math quiz for my students!'
      });

    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({
      quizId: expect.any(Number),
    });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with spaces', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'math quiz',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with alphanumeric characters (lowercase)', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'mathquiz',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with alphanumeric characters (uppercase)', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'MATHQUIZ',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with both lower/upper case alphanumeric characters', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'MathQuiz1',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with 3<= characters <= 30', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'MQZ',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with 3 <= characters <= 30', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'quizisamazingletsgocelebration',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  test('Valid unique quiz name for multiple quizzes', () => {
    const res1: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'mathquiz1',
      description: 'This is a math quiz for my students!'
    });

    const res2: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'mathquiz2',
      description: 'This is a math quiz for my students!'
    });
    const obj1: object = bodyStrToObj(res1);
    const obj2: object = bodyStrToObj(res2);
    expect(obj1).toStrictEqual({ quizId: expect.any(Number) });
    expect(obj2).toStrictEqual({ quizId: expect.any(Number) });
    expect(res1.statusCode).toStrictEqual(OK);
    expect(res2.statusCode).toStrictEqual(OK);
  });

  it('Has valid description with less than 100 characters', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'MathQuiz',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid empty description', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'math quiz',
      description: ''
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });
});

// These tests should be testing invalid entries and print out the error message
describe('Invalid inputs for adminQuizCreate', () => {
  let tokenId: TokenId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));
  });

  test('User is not logged in', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'math quiz',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });

  it('If token is a JSON string', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: JSON.stringify(tokenId.token),
      name: 'math quiz',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('If name contains non-alphanumeric characters without spaces', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'Math$$&%&%^#&',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('If name has less than 3 characters', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'ly',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('If name exceeds 30 characters', () => {
    const res: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'mathquizmathquizmathquizmathquizmathquizmathquiz',
      description: 'This is a math quiz for my students!'
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('When name already exists', () => {
    const res1: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'mathquiz',
      description: 'This is a math quiz for my students!'
    });

    const res2: any = postRequest(SERVER_URL + '/v1/admin/quiz', {
      token: tokenId.token,
      name: 'mathquiz',
      description: 'This is a math quiz for my students!'
    });
    const obj1: object = bodyStrToObj(res1);
    const obj2: object = bodyStrToObj(res2);
    expect(obj1).toStrictEqual({ quizId: expect.any(Number) });
    expect(obj2).toStrictEqual(ERROR_MESSAGE);
    expect(res1.statusCode).toStrictEqual(OK);
    expect(res2.statusCode).toStrictEqual(INPUT_ERROR);
  });
});

/// ////////////////////// ADMINQUIZREMOVE //////////////////////////////////////
// TODO:
// FIXME: Need to check whether the removed quiz is present in the trash bin
// Test cases:
// - Not valid authUserId
// - not valid quizId
// - quiz is not owned by user
// removing multiple quizzes

describe('Valid inputs for adminQuizRemove', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));

    quiz = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'sample'
      }));
  });

  // TODO: Need to test that ownedQuizzes is changed
  it('Removes an existing quiz', () => {
    const res: any = deleteRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}`,
      {
        token: tokenId.token,
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({});
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Removes multiple quizzes', () => {
    const quiz2: QuizId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz2',
        description: 'sample'
      }));
    // testing that adminQuizRemove actually removes the quiz from the user
    const res1: any = deleteRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}`,
      {
        token: tokenId.token,
      });
    const res2: any = deleteRequest(SERVER_URL + `/v1/admin/quiz/${quiz2.quizId}`,
      {
        token: tokenId.token,
      });
    const obj1: object = bodyStrToObj(res1);
    const obj2: object = bodyStrToObj(res2);
    expect(obj1).toStrictEqual({});
    expect(obj2).toStrictEqual({});
    expect(res1.statusCode).toStrictEqual(OK);
    expect(res2.statusCode).toStrictEqual(OK);
  });
});

describe('Invalid inputs for adminQuizRemove', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));

    quiz = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'sample'
      }));
  });

  test('User is not logged in', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = deleteRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}`,
      {
        token: tokenId.token,
      });

    const obj: Record<string, never> | ErrorObject = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });
  test('Invalid token', () => {
    const res: any = deleteRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}`,
      {
        token: tokenId.token + 1,
      });

    const obj: Record<string, never> | ErrorObject = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('Invalid quizId', () => {
    const res: any = deleteRequest(SERVER_URL + '/v1/admin/quiz/:quizid',
      {
        token: tokenId.token,
        quizId: quiz.quizId + 1
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  it('Denies removal of another person\'s quiz', () => {
    const tokenId2: TokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'kingbob@gmail.com',
        password: '123456789kl',
        nameFirst: 'king',
        nameLast: 'bob'
      }));

    const quiz2: QuizId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId2.token,
        name: 'mathquiz',
        description: 'sample'
      }));

    const res: any = deleteRequest(SERVER_URL + `/v1/admin/quiz/${quiz2.quizId}`,
      {
        token: tokenId.token,
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });
});

/// /////////////////////// ADMINQUIZINFO //////////////////////////////////////

describe('Tests for adminQuizInfo', () => {
  let user1: string, user1Quiz1: number, user2: string, question1Id: number, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister(
      'bobafette@gmail.com',
      '123456789kl',
      'boba',
      'fette'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;
    res = requestAdminQuizCreate(
      user1,
      'mathquiz',
      'sample'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestQuizQuestionCreate(user1, user1Quiz1, {
      question: 'Thinking about life?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'YAY',
          correct: true
        },
        {
          answer: 'NAY',
          correct: false
        }
      ],
    });
    expect(res.statusCode).toBe(OK);
    question1Id = JSON.parse(res.body as string).questionId;
  });
  test('Valid input', () => {
    res = v1RequestAdminQuizInfo(user1, user1Quiz1);
    expect(res.statusCode).toBe(OK);

    expect(JSON.parse(res.body as string)).toStrictEqual({
      quizId: user1Quiz1,
      name: 'mathquiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'sample',
      numQuestions: 1,
      questions: [{
        questionId: question1Id,
        question: 'Thinking about life?',
        duration: 5,
        points: 5,
        answers: [
          {
            answerId: expect.any(Number),
            answer: 'YAY',
            colour: expect.any(String),
            correct: true,
          },
          {
            answerId: expect.any(Number),
            answer: 'NAY',
            colour: expect.any(String),
            correct: false,
          }
        ],
      }],
      duration: 5
    });
  });

  test('If token does not exist', () => {
    res = v1RequestAdminQuizInfo(user1 + 1, user1Quiz1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('token not logged in', () => {
    res = v1RequestAdminQuizInfo(generateId(), user1Quiz1);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId', () => {
    res = v1RequestAdminQuizInfo(user1, user1Quiz1 + 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId(quiz deleted)', () => {
    res = requestAdminQuizRemove(user1, user1Quiz1);
    res = v1RequestAdminQuizInfo(user1, user1Quiz1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('QuizId that does not belong to user', () => {
    res = requestAdminAuthRegister(
      'johnwick12@gmail.com',
      'jw1241241231231',
      'johnnn',
      'wickkkk'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;
    res = v1RequestAdminQuizInfo(user2, user1Quiz1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// ///////////////////// ADMINQUIZNAMEUPDATE ////////////////////////////////
describe('Valid inputs for adminQuizNameUpdate', () => {
  let user1: string, user1Quiz1: number, user1Quiz2: number, res: any;

  beforeEach(() => {
    requestClear();
    // User 1 and their quizzes
    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizCreate(
      user1,
      'spiderman',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz2 = JSON.parse(res.body as string).quizId;
  });

  // Testing for when all inputted parameters are valid
  // i.e authUserId and quizId is valid and names satify given conditions
  test('Valid parameter input (1)', () => {
    res = requestAdminQuizNameUpdate(user1, user1Quiz1, 'name update');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid parameter input (2)', () => {
    res = requestAdminQuizNameUpdate(user1, user1Quiz1, 'new N4me');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid parameter input (3)', () => {
    res = requestAdminQuizNameUpdate(user1, user1Quiz2, 'Thisisaveryverylongquizn4me100');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
});

describe('Invalid inputs for adminQuizNameUpdate', () => {
  let user1: string, user1Quiz1: number, user1Quiz2: number, user2: string, user2Quiz1: number, user2Quiz2: number, res: any;

  beforeEach(() => {
    requestClear();
    // User 1 and their quizzes
    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizCreate(
      user1,
      'spiderman',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz2 = JSON.parse(res.body as string).quizId;

    // User 2 and their quizzes
    res = requestAdminAuthRegister(
      'tonystark@gmail.com',
      'il0veU3000',
      'tony',
      'stark'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user2,
      'Ironman',
      'I am Iron Man. The suit and I are one'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizCreate(
      user2,
      'tony',
      'I love you 3000'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz2 = JSON.parse(res.body as string).quizId;
  });

  // Testing for invalid tokenId
  test('Invalid token (401)', () => {
    res = requestAdminQuizNameUpdate('invalid', user1Quiz1, 'new');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid token (403)', () => {
    res = requestAdminQuizNameUpdate(generateId(), user1Quiz1, 'new');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for invalid userId
  test('Invalid quizId input (1)', () => {
    res = requestAdminQuizNameUpdate(user1, -2, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId input (2)', () => {
    res = requestAdminQuizNameUpdate(user1, -999, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Checking for when the authUserId does not own the quizId given
  test('quizId does not refer to authUserId (1)', () => {
    res = requestAdminQuizNameUpdate(user1, user2Quiz1, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('quizId does not refer to authUserId (2)', () => {
    res = requestAdminQuizNameUpdate(user2, user1Quiz2, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for invalid name input
  test('Name is less than 3 characters', () => {
    res = requestAdminQuizNameUpdate(user1, user1Quiz1, 'hi');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name contains invalid characters', () => {
    res = requestAdminQuizNameUpdate(user1, user1Quiz1, '1531$*^& <badname>#');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name is more than 30 characters', () => {
    res = requestAdminQuizNameUpdate(user1, user1Quiz1, 'thisisaterribleandhorriblenameeee1');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for when the name of quiz already exists for the admin user
  test('Name already exists (1)', () => {
    res = requestAdminQuizNameUpdate(user1, user1Quiz1, 'spiderman');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name already exists  (2)', () => {
    res = requestAdminQuizNameUpdate(user2, user2Quiz2, 'Ironman');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// /////////////////// ADMINQUIZDESCRIPTIONUPDATE////////////////////////////
describe('adminQuizDescriptionUpdate', () => {
  let user1: string, user2: string, quiz1: number, quiz2: number, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister('firstName@unsw.edu.au', 'passw0rd', 'FirstName', 'LastName');
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;
    res = requestAdminQuizCreate(user1, 'Quiz1', 'This is a placeholder for adminQuizCreate');
    expect(res.statusCode).toBe(OK);
    quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminAuthRegister('second@gmail.com', 'p2ssword', 'Another', 'User');
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;
    res = requestAdminQuizCreate(user2, 'Quiz2', 'Also another placeholder');
    expect(res.statusCode).toBe(OK);
    quiz2 = JSON.parse(res.body as string).quizId;
  });
  function generateString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  test('Invalid token (401)', () => {
    res = requestAdminQuizDescriptionUpdate('notanid', quiz1, 'Test descriptor');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('Invalid token (403)', () => {
    res = requestAdminQuizDescriptionUpdate(generateId(), quiz1, 'Test descriptor');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('Invalid quiz Id', () => {
    res = requestAdminQuizDescriptionUpdate(user1, -1, 'Test descriptor');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('User does not own quiz', () => {
    res = requestAdminQuizDescriptionUpdate(user1, quiz2, 'Test descriptor');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('Description is too long', () => {
    res = requestAdminQuizDescriptionUpdate(user1, quiz1, generateString(101));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });

  test('Valid combination 1 (Base Case)', () => {
    res = requestAdminQuizDescriptionUpdate(user1, quiz1, 'Hello, this is my test description!');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid combination 2 (Base Case)', () => {
    res = requestAdminQuizDescriptionUpdate(user2, quiz2, 'Hello, this is my test description!');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid combination 3 (Empty Description)', () => {
    res = requestAdminQuizDescriptionUpdate(user1, quiz1, '');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid combination 4 (Description of 100 characters)', () => {
    const str: string = generateString(100);
    res = requestAdminQuizDescriptionUpdate(user1, quiz1, str);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
});

/// ////////////////////////CREATEQUESTION///////////////////////////////////////
describe('Valid inputs for createQuestion', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));

    quiz = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'sample'
      }));
  });

  it('Should be a valid quiz with valid token/quizId', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,

            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ questionId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });
});

describe('Invalid inputs for createQuestion', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));

    quiz = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'sample'
      }));
  });

  test('User is not logged in', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });

  test('Invalid token', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: JSON.stringify(tokenId.token),
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('Invalid quizId', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId + 1}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Quiz that user does not own', () => {
    const tokenId2: TokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'kingbob@gmail.com',
        password: '123456789kl',
        nameFirst: 'king',
        nameLast: 'bob'
      }));

    const quiz2: QuizId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId2.token,
        name: 'mathquiz2',
        description: 'sample'
      }));

    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz2.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Question with less than 5 characters', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Beep',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Question with more than 50 characters', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'ILOVECOMPUTERSCIENCEILOVECOMPUTERSCIENCEILOVECOMPUTERSCIENCEILOVECOMPUTERSCIENCE' +
            'ILOVECOMPUTERSCIENCEILOVECOMPUTERSCIENCEILOVECOMPUTERSCIENCEILOVECOMPUTERSCIENCE',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Question contains less than 2 answers', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Question containining more than 6 answers', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            { answer: 'YAY', correct: true }, { answer: 'NAY', correct: false },
            { answer: 'YO', correct: false }, { answer: 'HEE', correct: false },
            { answer: 'HAH', correct: false }, { answer: 'LOL', correct: false },
            { answer: 'KEKW', correct: false }, { answer: 'TIRED', correct: false }

          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Quiz has longer duration than 3 minutes', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 181,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Total duration for multiple questions that is over 3 minutes', () => {
    const res1: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 69,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const res2: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about success',
          duration: 120,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj1: object = bodyStrToObj(res1);
    const obj2: object = bodyStrToObj(res2);
    expect(obj1).toStrictEqual({ questionId: expect.any(Number) });
    expect(res1.statusCode).toStrictEqual(OK);
    expect(obj2).toStrictEqual(ERROR_MESSAGE);
    expect(res2.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Points less than 1', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 0,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Points greater than 10', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 69,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Answers less than a character long', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: '',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Answers greater than 30 characters', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'ARIN CHOI IS CUTE FRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Duplicate answers', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,
            },
            {
              answer: 'YAY',
              correct: true,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('No correct answers', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: false,
            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });
});

/// /////////////////////////ADMINQUIZTRANSFER///////////////////////////////////////
describe('Valid inputs for adminQuizTransfer', () => {
  let user1: string, user1Quiz1: number, user2: string, user2Quiz1: number, res: any;
  beforeEach(() => {
    requestClear();
    // User 1 and their quizzes
    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;

    // User 2 and their quizzes
    res = requestAdminAuthRegister(
      'tonystark@gmail.com',
      'il0veU3000',
      'tony',
      'stark'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user2,
      'Ironman',
      'I am Iron Man. The suit and I are one'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz1 = JSON.parse(res.body as string).quizId;
  });

  test('Valid parameter input (1)', () => {
    res = requestAdminQuizTransfer(user1, user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid parameter input (2)', () => {
    res = requestAdminQuizTransfer(user2, user2Quiz1, 'peterparker@gmail.com');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Test successful quiz transfer, then transfer back to creator', () => {
    res = requestAdminQuizTransfer(user2, user2Quiz1, 'peterparker@gmail.com');
    res = requestAdminQuizTransfer(user1, user2Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
});

describe('Invalid inputs for adminQuizTransfer', () => {
  let user1: string, user1Quiz1: number, user1Quiz2: number, user2: string, user2Quiz1: number, user2Quiz2: number, res: any;
  beforeEach(() => {
    requestClear();
    // User 1 and their quizzes
    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizCreate(
      user1,
      'tony',
      'I like Mr Stark! He is Ironman'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz2 = JSON.parse(res.body as string).quizId;

    // User 2 and their quizzes
    res = requestAdminAuthRegister(
      'tonystark@gmail.com',
      'il0veU3000',
      'tony',
      'stark'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;

    res = requestAdminQuizCreate(
      user2,
      'Ironman',
      'I am Iron Man. The suit and I are one'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizCreate(
      user2,
      'tony',
      'I love you 3000'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz2 = JSON.parse(res.body as string).quizId;
  });

  // Testing for invalid authUserId
  test('Invalid token (401)', () => {
    res = requestAdminQuizTransfer('invalid', user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid token (403)', () => {
    res = requestAdminQuizTransfer(generateId(), user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz Id is not valid (400)', () => {
    res = requestAdminQuizTransfer(user1, -1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz Id is not owned by admin user (400)', () => {
    res = requestAdminQuizTransfer(user1, user2Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Quiz Id is not owned by admin user (400)', () => {
    res = requestAdminQuizTransfer(user2, user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('userEmail is not a real user (400)', () => {
    res = requestAdminQuizTransfer(user1, user1Quiz1, 'noOne@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('userEmail is the current logged in user (400)', () => {
    res = requestAdminQuizTransfer(user1, user1Quiz1, 'peterparker@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Name of quiz to be sent is equivalent to a quiz owned by receiver (400)', () => {
    res = requestAdminQuizTransfer(user1, user1Quiz2, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name of quiz to be sent is equivalent to a quiz owned by receiver (400)', () => {
    res = requestAdminQuizTransfer(user2, user2Quiz2, 'peterparker@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

describe('UpdateQuizQuestion', () => {
  let user1Token: string, user2Token: string, quiz1Id: number, quiz2Id: number, question1Id: number, testVar: any;
  let newQuestion: questionBody;
  beforeEach(() => {
    requestClear();
    user1Token = bodyStrToObj(requestAdminAuthRegister('abad@gmail.com', 'str0ngpass', 'Arnav', 'Bad')).token;
    user2Token = bodyStrToObj(requestAdminAuthRegister('jluo@gmail.com', 'str0ngerpass', 'Jonathan', 'Luo')).token;
    quiz1Id = bodyStrToObj(requestAdminQuizCreate(user1Token, 'A Test Quiz', 'For a testing world')).quizId;
    quiz2Id = bodyStrToObj(requestAdminQuizCreate(user2Token, 'Another Test Quiz', 'For another world')).quizId;
    testVar = requestQuizQuestionCreate(user1Token, quiz1Id, {
      question: 'Thinking about life?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'YAY',
          correct: true,
        },
        {
          answer: 'NAY',
          correct: false,
        }
      ],
    }
    );
    expect(testVar).toStrictEqual(expect.anything());
    question1Id = bodyStrToObj(testVar).questionId;
    requestQuizQuestionCreate(user1Token, quiz1Id, {
      question: 'Are we testing?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'YAY',
          correct: true,
        },
        {
          answer: 'NAY',
          correct: false,
        }
      ],
    }
    );
  });

  test('Valid Input', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(OK);
    expect(bodyStrToObj(res)).toStrictEqual({});
  });

  test('Invalid QuizId', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz1Id - 999, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz Id not owned by user', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz2Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Question Id not valid', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id - 999, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Question length issues', () => {
    newQuestion = {
      question: 'Pass',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    // question too short
    let res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
    // question too long
    newQuestion.question = 'furthermorefurthermorefurthermorefurthermorefurther';
    res = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('No. of answer issues', () => {
    newQuestion = {
      question: 'Pass',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        }
      ]
    };
    // Not enough answers
    let res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);

    newQuestion.answers.push({ answer: 'Truman', correct: false });
    newQuestion.answers.push({ answer: 'Rushmore', correct: false });
    newQuestion.answers.push({ answer: 'Trump', correct: false });
    newQuestion.answers.push({ answer: 'Modi', correct: false });
    newQuestion.answers.push({ answer: 'Travis Scott', correct: false });
    newQuestion.answers.push({ answer: 'Drake', correct: false });
    // Too many answers
    res = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Question duration negative', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: -4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Question Sum would exceed 3 minutes', () => {
    const question1SecondId = bodyStrToObj(requestQuizQuestionCreate(user1Token, quiz1Id, {
      question: 'Are you using jest?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'YAY',
          correct: true,
        },
        {
          answer: 'NAY',
          correct: false,
        }
      ],
    }
    )).questionId;
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 171,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1SecondId, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Points issue', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 5,
      points: 0,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    // points too few
    let res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
    newQuestion.points = 11;
    // points too many
    res = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Answer length issues', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: '',
          correct: true
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    // answer too short
    let res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);

    newQuestion.answers[0].answer = 'FurthermoreFurthermoreFurthermo';
    // answer too long
    res = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Duplicate answers', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('No correct answers', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: false
        },
        {
          answer: 'Narendra Modi',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Invalid Token Structure', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion('abacus', quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Valid token but not logged in', () => {
    newQuestion = {
      question: 'Who is the Monarch of England?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles',
          correct: false
        }
      ]
    };
    const res: any = requestUpdateQuizQuestion(generateId(), quiz1Id, question1Id, newQuestion);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });
});

describe('tests for trashList', () => {
  let user1: string, user1Quiz1: number, res: any, user1Quiz2: number;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister(
      'bobafette@gmail.com',
      '123456789kl',
      'boba',
      'fette'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;
    res = requestAdminQuizCreate(
      user1,
      'mathquiz',
      'sample'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizRemove(user1, user1Quiz1);
    expect(res.statusCode).toBe(OK);
  });

  test('Valid List 1', () => {
    res = requestViewTrash(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'mathquiz' }] });
  });
  test('Valid List 2', () => {
    res = requestAdminQuizCreate(
      user1,
      'mathquiz2',
      'sample'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz2 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizRemove(user1, user1Quiz2);
    expect(res.statusCode).toBe(OK);
    res = requestViewTrash(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'mathquiz' }, { quizId: user1Quiz2, name: 'mathquiz2' }] });
  });

  test('If token does not exist', () => {
    res = requestViewTrash(user1 + 1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('token not logged in', () => {
    res = requestViewTrash(generateId());
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

// /// /////////////////////// DELETEQUIZQUESTION //////////////////////////////////////

describe('Tests for deleteQuizQuestion', () => {
  let user1: string, user1Quiz1: number, user2: string, question1Id: number, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister(
      'bobafette@gmail.com',
      '123456789kl',
      'boba',
      'fette'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;
    res = requestAdminQuizCreate(
      user1,
      'mathquiz',
      'sample'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestQuizQuestionCreate(user1, user1Quiz1, {
      question: 'Thinking about life?',
      duration: 5,
      points: 5,
      answers: [
        {
          answer: 'YAY',
          correct: true,
        },
        {
          answer: 'NAY',
          correct: false,
        }
      ],
    }
    );
    expect(res.statusCode).toBe(OK);
    question1Id = JSON.parse(res.body as string).questionId;
  });
  test('Removes a question', () => {
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  test('If token does not exist', () => {
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1 + 1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('token not logged in', () => {
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id, generateId());
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId', () => {
    res = v1RequestDeleteQuizQuestion(user1Quiz1 + 1, question1Id, user1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId (Quiz Deleted)', () => {
    res = requestAdminQuizRemove(user1, user1Quiz1);
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('An invalid questionId', () => {
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id + 1, user1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('An invalid questionId (Already Deleted)', () => {
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('QuizId that does not belong to user', () => {
    res = requestAdminAuthRegister(
      'johnwick12@gmail.com',
      'jw1241241231231',
      'johnnn',
      'wickkkk'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;
    res = v1RequestDeleteQuizQuestion(user1Quiz1, question1Id, user2);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

// /// /////////////////////// RESTOREQUIZ //////////////////////////////////////

describe('Tests for restoreQuiz', () => {
  let user1: string, user1Quiz1: number, user2Quiz1: number, user2: string, res: any;
  beforeEach(() => {
    requestClear();

    res = requestAdminAuthRegister(
      'bobafette@gmail.com',
      '123456789kl',
      'boba',
      'fette'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;
    res = requestAdminQuizCreate(
      user1,
      'mathquiz',
      'sample'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizRemove(user1, user1Quiz1);
  });

  test('Restore a quiz(1)', () => {
    res = v1RequestQuizRestore(user1, user1Quiz1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  test('Restore a quiz(2)', () => {
    res = requestAdminAuthRegister(
      'johnwick12@gmail.com',
      'jw1241241231231',
      'johnnn',
      'wickkkk'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;
    res = requestAdminQuizCreate(
      user2,
      'algebraquiz',
      'contains 10 algebra questions'
    );
    user2Quiz1 = JSON.parse(res.body as string).quizId;
    res = requestAdminQuizRemove(user2, user2Quiz1);
    res = v1RequestQuizRestore(user2, user2Quiz1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Invalid token', () => {
    res = v1RequestQuizRestore(user1 + 1, user1Quiz1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Token does not belong to logged in session', () => {
    res = v1RequestQuizRestore(generateId(), user1Quiz1);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId input (1)', () => {
    res = v1RequestQuizRestore(user1, user1Quiz1 + 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('QuizId that does not belong to user', () => {
    res = requestAdminAuthRegister(
      'kingbob@gmail.com',
      '123456789kl',
      'king',
      'bob'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;
    res = v1RequestQuizRestore(user2, user1Quiz1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Quiz id not in trash', () => {
    res = v1RequestQuizRestore(user1, user1Quiz1 + 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// //////////////////////// DUPLICATEQUESTION /////////////////////////////////
describe('Valid inputs for duplicateQuestion', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  let question: QuestionId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));

    quiz = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'sample'
      }));

    question = bodyStrToObj(postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,

            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      }));
  });

  it('Should be a valid token', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question.questionId}/duplicate`, {
      token: tokenId.token,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });
  // TODO: Will test for every other valid case later if necessary
});

describe('Invalid inputs for duplicateQuestion', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  let question: QuestionId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));

    quiz = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'sample'
      }));

    question = bodyStrToObj(postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,

            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      }));
  });

  test('User not logged', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question.questionId}/duplicate`, {
      token: tokenId.token,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });

  test('An Invalid jsonified token', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question.questionId}/duplicate`, {
      token: JSON.stringify(tokenId.token),
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('An invalid token structure', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question.questionId}/duplicate`, {
      token: 'aaaaaaaaaaaaa',
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('An invalid quizId', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId + 1}/question/${question.questionId}/duplicate`, {
      token: tokenId.token,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('An invalid questionId', () => {
    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question.questionId + 1}/duplicate`, {
      token: tokenId.token,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('QuizId that does not belong to user', () => {
    const tokenId2: TokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'kingbob@gmail.com',
        password: '123456789kl',
        nameFirst: 'king',
        nameLast: 'bob'
      }));

    const quiz2: QuizId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId2.token,
        name: 'mathquiz2',
        description: 'sample'
      }));

    const res: any = postRequest(SERVER_URL + `/v1/admin/quiz/${quiz2.quizId}/question/${question.questionId}/duplicate`, {
      token: tokenId2.token,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });
});

describe('QuizTrashEmpty', () => {
  let user1Token: string, quiz1Id: number, quiz2Id: number, quiz3Id: number, quiz4Id: number, removeRes: any, quizArr: number[];
  beforeEach(() => {
    requestClear();
    user1Token = bodyStrToObj(requestAdminAuthRegister('abad@gmail.com', 'passw0rdd', 'Arnav', 'Badrish')).token;
    expect(user1Token).toStrictEqual(expect.any(String));
    quiz1Id = bodyStrToObj(requestAdminQuizCreate(user1Token, 'First Quiz', 'First Description')).quizId;
    expect(quiz1Id).toStrictEqual(expect.any(Number));
    quiz2Id = bodyStrToObj(requestAdminQuizCreate(user1Token, 'Second Quiz', 'Second Description')).quizId;
    expect(quiz2Id).toStrictEqual(expect.any(Number));
    quiz3Id = bodyStrToObj(requestAdminQuizCreate(user1Token, 'Third Quiz', 'Third Description')).quizId;
    expect(quiz3Id).toStrictEqual(expect.any(Number));
    quiz4Id = bodyStrToObj(requestAdminQuizCreate(user1Token, 'Fourth Quiz', 'Fourth Description')).quizId;
    expect(quiz4Id).toStrictEqual(expect.any(Number));
    quizArr = [quiz1Id, quiz2Id, quiz3Id, quiz4Id];
    for (const ID of quizArr) {
      removeRes = requestAdminQuizRemove(user1Token, ID);
      expect(removeRes.statusCode).toBe(OK);
    }
  });
  test('Valid Test', () => {
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
    removeRes = requestQuizTrashRemove(user1Token, [quiz1Id, quiz2Id, quiz3Id]);
    expect(removeRes.statusCode).toBe(OK);
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz4Id]);
  });
  test('One or more invalid Ids', () => {
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
    removeRes = requestQuizTrashRemove(user1Token, [quiz1Id, -9912381923, quiz3Id]);
    expect(removeRes.statusCode).toBe(INPUT_ERROR);
    // ensure that no quizzes in the trash were removed.
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
  });

  test('User does not own one or more quizzes', () => {
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
    const user2Token: string = bodyStrToObj(requestAdminAuthRegister('jluo@gmail.com', 'passw0rdd3', 'Jonathan', 'Luo')).token;
    expect(user2Token).toStrictEqual(expect.any(String));
    const quiz5Id: number = bodyStrToObj(requestAdminQuizCreate(user2Token, 'Fifth Quiz', 'Fifth Description')).quizId;
    expect(quiz5Id).toStrictEqual(expect.any(Number));
    removeRes = requestAdminQuizRemove(user2Token, quiz5Id);
    expect(removeRes.statusCode).toBe(OK);
    removeRes = requestQuizTrashRemove(user1Token, [quiz1Id, quiz5Id, quiz3Id]);
    expect(removeRes.statusCode).toBe(INPUT_ERROR);
    // ensure that no quizzes in the trash were removed.
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
  });

  test('One or more quizzes are not in the trash', () => {
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
    // create a new quiz and then don't delete it
    const quiz5Id: number = bodyStrToObj(requestAdminQuizCreate(user1Token, 'Fifth Quiz', 'Fifth Description')).quizId;
    expect(quiz5Id).toStrictEqual(expect.any(Number));
    removeRes = requestQuizTrashRemove(user1Token, [quiz1Id, quiz5Id, quiz3Id]);
    expect(removeRes.statusCode).toBe(INPUT_ERROR);
    // ensure that no quizzes in the trash were removed.
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
  });

  test('Invalid token structure', () => {
    removeRes = requestQuizTrashRemove('abacus', [quiz1Id, quiz3Id]);
    expect(removeRes.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('Token is not logged in', () => {
    removeRes = requestQuizTrashRemove(generateId(), [quiz1Id, quiz3Id]);
    expect(removeRes.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });
});

/// /////////////////////////// MOVEQUESTION ////////////////////////////////////
describe('moveQuestion', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  let question1: QuestionId;
  let question2: QuestionId;
  let question3: QuestionId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/auth/register',
      {
        email: 'bobafette@gmail.com',
        password: '123456789kl',
        nameFirst: 'boba',
        nameLast: 'fette'
      }));

    quiz = bodyStrToObj(postRequest(SERVER_URL + '/v1/admin/quiz',
      {
        token: tokenId.token,
        name: 'mathquiz',
        description: 'sample'
      }));

    question1 = bodyStrToObj(postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,

            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      }));
    question2 = bodyStrToObj(postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life? Again?',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,

            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      }));
    question3 = bodyStrToObj(postRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question`,
      {
        token: tokenId.token,
        questionBody: {
          question: 'Thinking about life?? Bruh',
          duration: 5,
          points: 5,
          answers: [
            {
              answer: 'YAY',
              correct: true,

            },
            {
              answer: 'NAY',
              correct: false,
            }
          ],
        }
      }));
  });

  it('Can move question with valid input', () => {
    const res: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question1.questionId}/move`, {
      token: tokenId.token,
      newPosition: 2,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({});
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Can move multiple questions with valid input', () => {
    const res1: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question1.questionId}/move`, {
      token: tokenId.token,
      newPosition: 2,
    });
    const obj1: object = bodyStrToObj(res1);
    expect(obj1).toStrictEqual({});
    expect(res1.statusCode).toStrictEqual(OK);

    const res2: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question2.questionId}/move`, {
      token: tokenId.token,
      newPosition: 1,
    });
    const obj2: object = bodyStrToObj(res2);
    expect(obj2).toStrictEqual({});
    expect(res2.statusCode).toStrictEqual(OK);

    const res3: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question3.questionId}/move`, {
      token: tokenId.token,
      newPosition: 2,
    });
    const obj3: object = bodyStrToObj(res3);
    expect(obj3).toStrictEqual({});
    expect(res3.statusCode).toStrictEqual(OK);
  });

  test('User not logged in', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question1.questionId}/move`, {
      token: tokenId.token,
      newPosition: 2,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });

  test('Invalid tokenId', () => {
    const res: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question1.questionId}/move`, {
      token: JSON.stringify(tokenId.token),
      newPosition: 2,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('Invalid newPosition (> n - 1) for moveQuestion', () => {
    const res: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question1.questionId}/move`, {
      token: tokenId.token,
      newPosition: 3,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Invalid newPosition (< 0) for moveQuestion', () => {
    const res: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question1.questionId}/move`, {
      token: tokenId.token,
      newPosition: 0,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Invalid quizId for moveQuestion', () => {
    const res: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId + 1}/question/${question1.questionId}/move`, {
      token: tokenId.token,
      newPosition: 2,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Invalid questionId for moveQuestion', () => {
    const res: any = putRequest(SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/question/${question1.questionId + 3}/move`, {
      token: tokenId.token,
      newPosition: 2,
    });
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });
});
