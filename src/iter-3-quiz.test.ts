/// ///////////////////////// IMPORTS //////////////////////////////////////////
// importing types from interfaces
import {
  ErrorObject, questionBody, TokenId, QuizId, QuestionId, SessionId, URL, PlayerId
} from './interfaces';
import {
  requestAdminAuthRegister, requestClear, v1requestStartQuizSession,
  v2requestAdminQuizCreate, v2requestCreateQuestion, requestAdminQuizCreate,
  v2requestAdminQuizDescriptionUpdate, requestViewTrash, requestAdminQuizRemove,
  v2requestQuizTrashRemove, v2requestUpdateQuizQuestion, requestQuizQuestionCreate,
  generateString, v1requestQuizUpdateThumbnail,
  requestAdminAuthLogout, v1requestPlayerJoin, v1requestPlayerStatus, v1requestPlayerInfo,
  v1requestSessionStateUpdate, v1requestPlayerSubmitAnswers, wait, v2requestadminQuizRemove,
  requestUpdateSessionState, sleepSync, v2RequestAdminQuizNameUpdate, v2RequestAdminQuizTransfer,
  v2RequestQuizRestore, v2RequestDeleteQuizQuestion, v2RequestTrashList,
  v2RequestAdminQuizInfo, v2RequestAdminQuizList, v1requestPlayerResults, requestAllowGuestPlayerToSession,
  v1requestViewChat, v1requestPostChat, requestGetSessionStatus, requestresultsInCSV, requestquestionResults, requestquizSessionFinalResults
} from './helper';
import { v4 as generateId } from 'uuid';

/// ///////////////////////////CONSTANTS /////////////////////////////////////
const ERROR_MESSAGE: ErrorObject = { error: expect.any(String) };
const OK = 200;
const INPUT_ERROR = 400;
const INVALID_TOKEN = 401;
const TOKEN_NOT_LOGGED_IN = 403;

/// ////////////////////////// WRAPPERS ////////////////////////////////////////
const bodyStrToObj: any = (res: any) => JSON.parse(res.body as string);
/// /////////////////////////////////////////////////////////////////////////////
describe('Tests for v2adminQuizList', () => {
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
    res = v2RequestAdminQuizList(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'spider' }] });
  });
  test('Restored Valid List', () => {
    res = requestAdminQuizRemove(user1, user1Quiz1);
    res = v2RequestQuizRestore(user1, user1Quiz1);
    res = v2RequestAdminQuizList(user1);
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
    res = v2RequestAdminQuizList(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'spider' }, { quizId: user1Quiz2, name: 'mathquiz2' }] });
  });

  test('If token does not exist', () => {
    res = v2RequestAdminQuizList(user1 + 1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('token not logged in', () => {
    res = v2RequestAdminQuizList(generateId());
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// /////////////////////// ADMINQUIZINFO //////////////////////////////////////

describe('Tests for adminQuizInfo', () => {
  let user1: string, user1Quiz1: number, user2: string, question1Id: number, res: any;
  const THUMBNAIL_URL = 'https://i.pinimg.com/originals/d6/cd/6a/d6cd6ac5e19d751b5507cfc6a10d9808.png';
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
    res = v2requestCreateQuestion(user1, user1Quiz1, {
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
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    question1Id = JSON.parse(res.body as string).questionId;
    v1requestQuizUpdateThumbnail(user1, user1Quiz1, THUMBNAIL_URL);
    expect(res.statusCode).toBe(OK);
  });
  test('Valid input', () => {
    res = v2RequestAdminQuizInfo(user1, user1Quiz1);
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
        thumbnailUrl: expect.any(String),
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
      duration: 5,
      thumbnailUrl: expect.any(String)
    });
  });

  test('If token does not exist', () => {
    res = v2RequestAdminQuizInfo(user1 + 1, user1Quiz1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('token not logged in', () => {
    res = v2RequestAdminQuizInfo(generateId(), user1Quiz1);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId', () => {
    res = v2RequestAdminQuizInfo(user1, user1Quiz1 + 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId(quiz deleted)', () => {
    res = requestAdminQuizRemove(user1, user1Quiz1);
    res = v2RequestAdminQuizInfo(user1, user1Quiz1);
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
    res = v2RequestAdminQuizInfo(user2, user1Quiz1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

// /// /////////////////////// TRASHLIST //////////////////////////////////////

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
    res = v2RequestTrashList(user1);
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
    res = v2RequestTrashList(user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({ quizzes: [{ quizId: user1Quiz1, name: 'mathquiz' }, { quizId: user1Quiz2, name: 'mathquiz2' }] });
  });

  test('If token does not exist', () => {
    res = v2RequestTrashList(user1 + 1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('token not logged in', () => {
    res = v2RequestTrashList(generateId());
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
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  test('If token does not exist', () => {
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1 + 1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('token not logged in', () => {
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id, generateId());
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId', () => {
    res = v2RequestDeleteQuizQuestion(user1Quiz1 + 1, question1Id, user1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId (Quiz Deleted)', () => {
    res = requestAdminQuizRemove(user1, user1Quiz1);
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('An invalid questionId', () => {
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id + 1, user1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('An invalid questionId (Already Deleted)', () => {
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id, user1);
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
    res = v2RequestDeleteQuizQuestion(user1Quiz1, question1Id, user2);
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
    res = v2RequestQuizRestore(user1, user1Quiz1);
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
    res = v2RequestQuizRestore(user2, user2Quiz1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Invalid token', () => {
    res = v2RequestQuizRestore(user1 + 1, user1Quiz1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Token does not belong to logged in session', () => {
    res = v2RequestQuizRestore(generateId(), user1Quiz1);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId input (1)', () => {
    res = v2RequestQuizRestore(user1, user1Quiz1 + 1);
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
    res = v2RequestQuizRestore(user2, user1Quiz1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Quiz id not in trash', () => {
    res = v2RequestQuizRestore(user1, user1Quiz1 + 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// //////////////////////// ADMINQUIZCREATE2 ////////////////////////////////////
describe('Valid inputs for adminQuizCreate', () => {
  let tokenId: TokenId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));
  });

  it('Should be a valid token', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'mathquiz',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with spaces', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'math quiz',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with alphanumeric characters (lowercase)', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'mathquiz',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with alphanumeric characters (uppercase)', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'MATHQUIZ',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with both lower/upper case alphanumeric characters', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'MATHQUIZ1',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with 3<= characters <= 30', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'MQZ',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid name with 3 <= characters <= 30', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token,
      'quizisamazingletsgocelebration', 'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  test('Valid unique quiz name for multiple quizzes', () => {
    const res1: any = v2requestAdminQuizCreate(tokenId.token, 'mathquiz1',
      'This is a math quiz for my students!');
    const res2: any = v2requestAdminQuizCreate(tokenId.token, 'mathquiz2',
      'This is a math quiz for my students!');

    const obj1: object = bodyStrToObj(res1);
    const obj2: object = bodyStrToObj(res2);
    expect(obj1).toStrictEqual({ quizId: expect.any(Number) });
    expect(obj2).toStrictEqual({ quizId: expect.any(Number) });
    expect(res1.statusCode).toStrictEqual(OK);
    expect(res2.statusCode).toStrictEqual(OK);
  });

  it('Has valid description with less than 100 characters', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'MathQuiz',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ quizId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Has valid empty description', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'math quiz', '');
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

    tokenId = tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));
  });

  it('If token is a JSON string', () => {
    const res: any = v2requestAdminQuizCreate(JSON.stringify(tokenId.token),
      'math quiz', 'This is a math quiz for my students!');
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('If name contains non-alphanumeric characters without spaces', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'MATH#*@#&$^@!',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('If name has less than 3 characters', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token, 'ly',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('If name exceeds 30 characters', () => {
    const res: any = v2requestAdminQuizCreate(tokenId.token,
      'mathquizmathquizmathquizmathquizmathquizmathquizmathquiz',
      'This is a math quiz for my students!');
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('When name already exists', () => {
    const res1: any = v2requestAdminQuizCreate(tokenId.token, 'mathquiz',
      'This is a math quiz for my students!');
    const res2: any = v2requestAdminQuizCreate(tokenId.token, 'mathquiz',
      'This is a math quiz for my students!');

    const obj1: object = bodyStrToObj(res1);
    const obj2: object = bodyStrToObj(res2);
    expect(obj1).toStrictEqual({ quizId: expect.any(Number) });
    expect(obj2).toStrictEqual(ERROR_MESSAGE);
    expect(res1.statusCode).toStrictEqual(OK);
    expect(res2.statusCode).toStrictEqual(INPUT_ERROR);
  });
});

describe('Valid input for startQuizSession', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));

    quiz = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token, 'mathquiz',
      'This is a math quiz for my students!'));
  });

  test('Start valid session', () => {
    v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    const res: any = v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({ sessionId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(OK);
  });
});

describe('Invalid input for startQuizSession', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));

    quiz = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token, 'mathquiz',
      'This is a math quiz for my students!'));
  });

  test('invalid token structure', () => {
    const res: any = v1requestStartQuizSession(quiz.quizId, JSON.stringify(tokenId.token), 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('User not logged in', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });

  test('invalid quizId', () => {
    v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    const res: any = v1requestStartQuizSession(quiz.quizId + 1, tokenId.token, 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('User does not own quiz', () => {
    v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    const tokenId2: TokenId = bodyStrToObj(requestAdminAuthRegister('kingbob@gmail.com',
      '123456789kl', 'king', 'bob'));
    const res: any = v1requestStartQuizSession(quiz.quizId, tokenId2.token, 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('autoStartNum is greater than 50', () => {
    v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    const res: any = v1requestStartQuizSession(quiz.quizId, tokenId.token, 51);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('No questions', () => {
    const res: any = v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('More than 10 active sessions exist', () => {
    v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    const res: any = v1requestStartQuizSession(quiz.quizId, tokenId.token, 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });
});

describe('v2adminQuizDescriptionUpdate', () => {
  let user1: string; let user2: string; let quiz1: number; let quiz2: number; let res: any;
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

  test('Invalid token (401)', () => {
    res = v2requestAdminQuizDescriptionUpdate('notanid', quiz1, 'Test descriptor');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('Invalid token (403)', () => {
    res = v2requestAdminQuizDescriptionUpdate(generateId(), quiz1, 'Test descriptor');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('Invalid quiz Id', () => {
    res = v2requestAdminQuizDescriptionUpdate(user1, -1, 'Test descriptor');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('User does not own quiz', () => {
    res = v2requestAdminQuizDescriptionUpdate(user1, quiz2, 'Test descriptor');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });
  test('Description is too long', () => {
    res = v2requestAdminQuizDescriptionUpdate(user1, quiz1, generateString(101));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string).error).toStrictEqual(expect.any(String));
  });

  test('Valid combination 1 (Base Case)', () => {
    res = v2requestAdminQuizDescriptionUpdate(user1, quiz1, 'Hello, this is my test description!');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid combination 2 (Base Case)', () => {
    res = v2requestAdminQuizDescriptionUpdate(user2, quiz2, 'Hello, this is my test description!');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid combination 3 (Empty Description)', () => {
    res = v2requestAdminQuizDescriptionUpdate(user1, quiz1, '');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid combination 4 (Description of 100 characters)', () => {
    const str: string = generateString(100);
    res = v2requestAdminQuizDescriptionUpdate(user1, quiz1, str);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
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
    removeRes = v2requestQuizTrashRemove(user1Token, [quiz1Id, quiz2Id, quiz3Id]);
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
    removeRes = v2requestQuizTrashRemove(user1Token, [quiz1Id, -9912381923, quiz3Id]);
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
    removeRes = v2requestQuizTrashRemove(user1Token, [quiz1Id, quiz5Id, quiz3Id]);
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
    removeRes = v2requestQuizTrashRemove(user1Token, [quiz1Id, quiz5Id, quiz3Id]);
    expect(removeRes.statusCode).toBe(INPUT_ERROR);
    // ensure that no quizzes in the trash were removed.
    removeRes = requestViewTrash(user1Token);
    expect(removeRes.statusCode).toBe(OK);
    quizArr = bodyStrToObj(removeRes).quizzes.map((obj: any) => obj.quizId);
    expect(quizArr).toStrictEqual([quiz1Id, quiz2Id, quiz3Id, quiz4Id]);
  });

  test('Invalid token structure', () => {
    removeRes = v2requestQuizTrashRemove('abacus', [quiz1Id, quiz3Id]);
    expect(removeRes.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('Token is not logged in', () => {
    removeRes = v2requestQuizTrashRemove(generateId(), [quiz1Id, quiz3Id]);
    expect(removeRes.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });
});

describe('UpdateQuizQuestion', () => {
  const THUMBNAIL_URL = 'https://i.pinimg.com/originals/d6/cd/6a/d6cd6ac5e19d751b5507cfc6a10d9808.png';
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id - 999, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz2Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id - 999, newQuestion, THUMBNAIL_URL);
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
    let res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
    // question too long
    newQuestion.question = 'furthermorefurthermorefurthermorefurthermorefurther';
    res = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    let res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);

    newQuestion.answers.push({ answer: 'Truman', correct: false });
    newQuestion.answers.push({ answer: 'Rushmore', correct: false });
    newQuestion.answers.push({ answer: 'Trump', correct: false });
    newQuestion.answers.push({ answer: 'Modi', correct: false });
    newQuestion.answers.push({ answer: 'Travis Scott', correct: false });
    newQuestion.answers.push({ answer: 'Drake', correct: false });
    // Too many answers
    res = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
      duration: 296,
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1SecondId, newQuestion, THUMBNAIL_URL);
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
    let res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
    newQuestion.points = 11;
    // points too many
    res = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    let res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);

    newQuestion.answers[0].answer = 'FurthermoreFurthermoreFurthermo';
    // answer too long
    res = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion('abacus', quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
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
    const res: any = v2requestUpdateQuizQuestion(generateId(), quiz1Id, question1Id, newQuestion, THUMBNAIL_URL);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Empty Thumbnail URL', () => {
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, '');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Invalid Thumbnail URL', () => {
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, 'abacus');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Thumbnail URL does not lead to correct file type', () => {
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
    const res: any = v2requestUpdateQuizQuestion(user1Token, quiz1Id, question1Id, newQuestion, 'https://i0.wp.com/www.printmag.com/wp-content/uploads/2021/02/4cbe8d_f1ed2800a49649848102c68fc5a66e53mv2.gif?resize=476%2C280&ssl=1');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyStrToObj(res)).toStrictEqual(ERROR_MESSAGE);
  });
});

describe('UpdateQuizThumbnail', () => {
  let userToken: string, quiz1Id: number, res: any;
  const testingUrl = 'http://www.thetechedvocate.org/wp-content/uploads/2023/05/PNG.png';
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister('abad@gmail.com', 'passw0rdd', 'Arnav', 'Badrish');
    expect(res.statusCode).toBe(OK);
    userToken = bodyStrToObj(res).token;
    res = v2requestAdminQuizCreate(userToken, 'Testing', 'My patience rn');
    expect(res.statusCode).toBe(OK);
    quiz1Id = bodyStrToObj(res).quizId;
  });

  test('Token is not valid form', () => {
    res = v1requestQuizUpdateThumbnail('userToken', quiz1Id, testingUrl);
    expect(res.statusCode).toBe(INVALID_TOKEN);
  });
  test('Token is not for logged in session', () => {
    res = v1requestQuizUpdateThumbnail(generateId(), quiz1Id, testingUrl);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
  });
  test('Quiz ID is invalid', () => {
    res = v1requestQuizUpdateThumbnail(userToken, -999, testingUrl);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Quiz ID is not owned by the user', () => {
    res = requestAdminAuthRegister('jluo@gmail.com', 'passw0rdder', 'Jonathan', 'Luo');
    expect(res.statusCode).toBe(OK);
    const user2Token: string = bodyStrToObj(res).token;
    res = v1requestQuizUpdateThumbnail(user2Token, quiz1Id, testingUrl);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Invalid thumbnailUrl', () => {
    res = v1requestQuizUpdateThumbnail(userToken, quiz1Id, 'testingUrl');
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('thumbnailUrl does not lead to valid file type', () => {
    res = v1requestQuizUpdateThumbnail(userToken, quiz1Id, 'https://i0.wp.com/www.printmag.com/wp-content/uploads/2021/02/4cbe8d_f1ed2800a49649848102c68fc5a66e53mv2.gif?resize=476%2C280&ssl=1');
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('valid test', () => {
    res = v1requestQuizUpdateThumbnail(userToken, quiz1Id, testingUrl);
    expect(res.statusCode).toBe(OK);
  });
});

describe('playerStatus', () => {
  let userToken: string, quizId: number, sessionId: number, playerId: number, res: any;
  beforeEach(() => {
    requestClear();
    userToken = bodyStrToObj(requestAdminAuthRegister('abad@gmail.com', 'passw0rdd', 'Arnav', 'Badrish')).token;
    quizId = bodyStrToObj(v2requestAdminQuizCreate(userToken, 'Barbie test', 'Do you have the right Kenergy')).quizId;
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    sessionId = bodyStrToObj(v1requestStartQuizSession(quizId, userToken, 10)).sessionId;
    playerId = bodyStrToObj(v1requestPlayerJoin(sessionId, 'aaaaaaa')).playerId;
    expect(userToken && quizId && sessionId && playerId).toBeTruthy();
  });

  test('Valid Test', () => {
    res = v1requestPlayerStatus(playerId);
    expect(res.statusCode).toBe(OK);
    expect(bodyStrToObj(res)).toStrictEqual({
      state: 'LOBBY',
      numQuestions: 1,
      atQuestion: 1
    });
  });

  test('Invalid Player Id', () => {
    res = v1requestPlayerStatus(-9241);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

describe('playerInfo', () => {
  let userToken: string, quizId: number, question1Id: number, sessionId: number, playerId: number, res: any;
  beforeEach(() => {
    requestClear();
    res = requestAdminAuthRegister('abad@gmail.com', 'passw0rdd', 'Arnav', 'Badrish');
    userToken = bodyStrToObj(res).token;
    quizId = bodyStrToObj(v2requestAdminQuizCreate(userToken, 'Barbie test', 'Do you have the right Kenergy')).quizId;
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });

    expect(res.statusCode).toBe(OK);
    question1Id = bodyStrToObj(res).questionId;
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'Am I sure I love computer science?',
      duration: 58,
      points: 6,
      answers: [
        {
          answer: 'CS FOREVER',
          correct: true
        },
        {
          answer: 'I need to shower',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    sessionId = bodyStrToObj(v1requestStartQuizSession(quizId, userToken, 10)).sessionId;
    playerId = bodyStrToObj(v1requestPlayerJoin(sessionId, '')).playerId;
    expect(userToken && quizId && sessionId && playerId).toBeTruthy();
  });

  test('Valid Test', () => {
    // This test is still black-box, since immediately after starting a session, the session should be at question 1, since the quiz has not started
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(OK);
    expect(bodyStrToObj(res)).toStrictEqual({
      questionId: question1Id,
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      thumbnailUrl: './thumbnails/default.png',
      answers: [
        {
          answerId: expect.any(Number),
          answer: 'your mum',
          colour: expect.any(String)
        },
        {
          answerId: expect.any(Number),
          answer: 'your dad',
          colour: expect.any(String)
        }
      ]
    });
  });

  test('Invalid Player ID', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(-999, 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Invalid QuestionPosition (for the given session)', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, -864);
    expect(res.statusCode).toBe(INPUT_ERROR);
    res = v1requestPlayerInfo(playerId, 3);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Session is not currently on this question', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 2);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Session in LOBBY or END states', () => {
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'END');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

describe('Player Submit Answers', () => {
  let userToken: string, quizId: number, sessionId: number, playerId: number, res: any;
  beforeEach(() => {
    requestClear();
    userToken = bodyStrToObj(requestAdminAuthRegister('abad@gmail.com', 'passw0rdd', 'Arnav', 'Badrish')).token;
    quizId = bodyStrToObj(v2requestAdminQuizCreate(userToken, 'Barbie test', 'Do you have the right Kenergy')).quizId;
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'Am I sure I love computer science?',
      duration: 58,
      points: 6,
      answers: [
        {
          answer: 'CS FOREVER',
          correct: true
        },
        {
          answer: 'I need to shower',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    sessionId = bodyStrToObj(v1requestStartQuizSession(quizId, userToken, 10)).sessionId;
    playerId = bodyStrToObj(v1requestPlayerJoin(sessionId, '')).playerId;
    expect(userToken && quizId && sessionId && playerId).toBeTruthy();
  });

  test('Valid Test', () => {
    res = v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(200);
    // Just get the answerId of the first answer to the question
    const answerId: number = bodyStrToObj(res).answers[0].answerId;
    wait(200);
    res = v1requestPlayerSubmitAnswers(playerId, 1, [answerId]);
    expect(res.statusCode).toBe(OK);
  });
  test('Player Id is not valid', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(200);
    // Just get the answerId of the first answer to the question
    const answerId: number = bodyStrToObj(res).answers[0].answerId;
    wait(200);
    res = v1requestPlayerSubmitAnswers(-99012, 1, [answerId]);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Question Position is not valid for the session', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(200);
    // Just get the answerId of the first answer to the question
    const answerId: number = bodyStrToObj(res).answers[0].answerId;
    wait(200);
    res = v1requestPlayerSubmitAnswers(playerId, 300, [answerId]);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Session is not in QUESTION_OPEN state', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(200);
    // Just get the answerId of the first answer to the question
    const answerId: number = bodyStrToObj(res).answers[0].answerId;
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'END');
    res = v1requestPlayerSubmitAnswers(playerId, 2, [answerId]);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Session is not yet up to this question', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(200);
    // Just get the answerId of the first answer to the question
    const answerId: number = bodyStrToObj(res).answers[0].answerId;
    wait(200);
    res = v1requestPlayerSubmitAnswers(playerId, 2, [answerId]);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Answer Id is invalid', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    wait(200);
    res = v1requestPlayerSubmitAnswers(playerId, 1, [-1]);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Duplicate answerIds', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(200);
    // Just get the answerId of the first answer to the question
    const answerId: number = bodyStrToObj(res).answers[0].answerId;
    wait(200);
    res = v1requestPlayerSubmitAnswers(playerId, 1, [answerId, answerId]);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Less than one answerId', () => {
    v1requestSessionStateUpdate(userToken, quizId, sessionId, 'NEXT_QUESTION');
    wait(200);
    res = v1requestPlayerSubmitAnswers(playerId, 1, []);
    expect(res.statusCode).toBe(INPUT_ERROR);
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

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));

    quiz = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token, 'mathquiz', 'sample'));
  });

  // TODO: Need to test that ownedQuizzes is changed
  it('Removes an existing quiz', () => {
    const res: any = v2requestadminQuizRemove(tokenId.token, quiz.quizId);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual({});
    expect(res.statusCode).toStrictEqual(OK);
  });

  it('Removes multiple quizzes', () => {
    const quiz2: QuizId = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token,
      'mathquiz2', 'sample'));
    // testing that adminQuizRemove actually removes the quiz from the user
    const res1: any = v2requestadminQuizRemove(tokenId.token, quiz.quizId);
    const res2: any = v2requestadminQuizRemove(tokenId.token, quiz2.quizId);
    const obj1: object = bodyStrToObj(res1);
    const obj2: object = bodyStrToObj(res2);
    expect(obj1).toStrictEqual({});
    expect(obj2).toStrictEqual({});
    expect(res1.statusCode).toStrictEqual(OK);
    expect(res2.statusCode).toStrictEqual(OK);

    // TODO: will add these extra test cases once the respective functions are implemented
    // expect(adminQuizList(tokenId.token)).toStrictEqual({ quizzes: [{ quizId: quiz2.quizId, name: 'mathquiz2' }] });
    // expect(adminQuizInfo(tokenId.token, quiz.quizId)).toStrictEqual(ERROR_MESSAGE);
    // expect(adminQuizList(tokenId.token)).toStrictEqual({ quizzes: [] });
  });
});

describe('Invalid inputs for adminQuizRemove', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));

    quiz = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token, 'mathquiz', 'sample'));
  });

  test('User is not logged in', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = v2requestadminQuizRemove(tokenId.token, quiz.quizId);

    const obj: Record<string, never> | ErrorObject = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });

  test('Invalid token', () => {
    const res: any = v2requestadminQuizRemove(tokenId.token + 1, quiz.quizId);

    const obj: Record<string, never> | ErrorObject = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('Invalid quizId', () => {
    const res: any = v2requestadminQuizRemove(tokenId.token, quiz.quizId + 1);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  it('Denies removal of another person\'s quiz', () => {
    const tokenId2: TokenId = bodyStrToObj(requestAdminAuthRegister(
      'kingbob@gmail.com', '123456789kl', 'king', 'bob'));

    const quiz2: QuizId = bodyStrToObj(v2requestAdminQuizCreate(tokenId2.token,
      'mathquiz', 'sample'));

    const res: any = v2requestadminQuizRemove(tokenId.token, quiz2.quizId);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });
});

/// /////////////////////// updateSessionState //////////////////////////////////////
describe('updateSessionState', () => {
  let user1: string, user1Quiz1: number, user1Quiz2: number,
    session1: number, user2: string,
    user2Quiz1: number, session2: number, res: any;
  beforeEach(() => {
    requestClear();
    // User 1, quizzes and session
    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = v2requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = v2requestAdminQuizCreate(
      user1,
      'tony',
      'I like Mr Stark! He is Ironman'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz2 = JSON.parse(res.body as string).quizId;

    res = v2requestCreateQuestion(user1, user1Quiz1, {
      question: 'I love computer science?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);

    res = v2requestCreateQuestion(user1, user1Quiz1, {
      question: 'I dont know computer science?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'I am cool',
          correct: true
        },
        {
          answer: 'I am not cool',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);

    res = v1requestStartQuizSession(user1Quiz1, user1, 5);
    expect(res.statusCode).toBe(OK);
    session1 = JSON.parse(res.body as string).sessionId;

    // User 2, quizzes and session
    res = requestAdminAuthRegister(
      'tonystark@gmail.com',
      'il0veU3000',
      'tony',
      'stark'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;

    res = v2requestAdminQuizCreate(
      user2,
      'Ironman',
      'I am Iron Man. The suit and I are one'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz1 = JSON.parse(res.body as string).quizId;
    res = v2requestAdminQuizCreate(
      user2,
      'tony',
      'I love you 3000'
    );
    expect(res.statusCode).toBe(OK);

    res = v2requestCreateQuestion(user2, user2Quiz1, {
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

    res = v1requestStartQuizSession(user2Quiz1, user2, 5);
    expect(res.statusCode).toBe(OK);
    session2 = JSON.parse(res.body as string).sessionId;
  });

  test('Invalid token (401)', () => {
    res = requestUpdateSessionState('invalid', user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid token (403)', () => {
    res = requestUpdateSessionState(generateId(), user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz Id is not valid (400)', () => {
    res = requestUpdateSessionState(user1, -1, session1, 'END');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Quiz Id is not owned by admin user (400)', () => {
    res = requestUpdateSessionState(user1, user2Quiz1, session2, 'END');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Non-existant or an invalid sessionId', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, -1, 'END');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('SessionId does not refer to the right quiz', () => {
    res = requestUpdateSessionState(user1, user1Quiz2, session1, 'END');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Invalid action is inputted', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'go home');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid action is inputted', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, '123');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid action is inputted', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, '828##snd');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Invalid actions for LOBBY
  test('Action cannot be applied to state LOBBY', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state LOBBY', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  // Valid actions for LOBBY
  test('NEXT_QUESTION action inputted to state LOBBY', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('END action inputted to state LOBBY', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // Invalid actions for FINAL RESULTS
  test('Action cannot be applied to state FINAL RESULTS', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(1200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state FINAL RESULTS', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(1200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state FINAL RESULTS', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(1200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  // Valid actions for FINAL_RESULTS
  test('END action inputted to state FINAL_RESULTS', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(1200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // Valid actions for QUESTION_CLOSE
  test('END actions inputted to state QUESTION CLOSE', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(1200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('GO_TO_ANSWER action inputted to state QUESTION CLOSE', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(1200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('NEXT_QUESTION action inputted to state QUESTION CLOSE', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(1200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // Invalid actions for QUESTION OPEN
  test('Action cannot be applied to state QUESTION OPEN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state QUESTION OPEN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  // Valid actions for QUESTION OPEN
  test('END action inputted to state QUESTION OPEN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('GO_TO_ANSWER action inputted to state QUESTION OPEN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // Invalid actions for QUESTION COUNTDOWN
  test('Action cannot be applied to state QUESTION COUNTDOWN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state QUESTION COUNTDOWN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  // Valid actions for QUESTION_COUNTDOWN
  test('END action inputted to state QUESTION COUNTDOWN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('NEXT_QUESTION action inputted to state QUESTION COUNTDOWN', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // Invalid actions for ANSWER SHOW
  test('Action cannot be applied to state ANSWER SHOW', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state ANSWER SHOW', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  // Valid actions for ANSWER_SHOW
  test('END action inputted to state ANSWER SHOW', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('GO_TO_FINAL_RESULTS action inputted to state ANSWER SHOW', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('NEXT_QUESTION action inputted to state ANSWER SHOW', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });

  // END
  test('Action cannot be applied to state END', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state END', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_FINAL_RESULTS');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state END', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Action cannot be applied to state END', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('NEXT_QUESTION action inputted to state END', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('NEXT_QUESTION action inputted to state END', () => {
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(OK);
    sleepSync(200);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'GO_TO_ANSWER');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'END');
    expect(res.statusCode).toBe(OK);
    res = requestUpdateSessionState(user1, user1Quiz1, session1, 'NEXT_QUESTION');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// ////////////////////// ADMINQUIZNAMEUPDATE ////////////////////////////////
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

    res = v2requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = v2requestAdminQuizCreate(
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
    res = v2RequestAdminQuizNameUpdate(user1, user1Quiz1, 'name update');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid parameter input (2)', () => {
    res = v2RequestAdminQuizNameUpdate(user1, user1Quiz1, 'new N4me');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid parameter input (3)', () => {
    res = v2RequestAdminQuizNameUpdate(user1, user1Quiz2, 'Thisisaveryverylongquizn4me100');
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

    res = v2requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;
    res = v2requestAdminQuizCreate(
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

    res = v2requestAdminQuizCreate(
      user2,
      'Ironman',
      'I am Iron Man. The suit and I are one'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz1 = JSON.parse(res.body as string).quizId;
    res = v2requestAdminQuizCreate(
      user2,
      'tony',
      'I love you 3000'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz2 = JSON.parse(res.body as string).quizId;
  });

  // Testing for invalid tokenId
  test('Invalid token (401)', () => {
    res = v2RequestAdminQuizNameUpdate('invalid', user1Quiz1, 'new');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid token (403)', () => {
    res = v2RequestAdminQuizNameUpdate(generateId(), user1Quiz1, 'new');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for invalid userId
  test('Invalid quizId input (1)', () => {
    res = v2RequestAdminQuizNameUpdate(user1, -2, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid quizId input (2)', () => {
    res = v2RequestAdminQuizNameUpdate(user1, -999, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Checking for when the authUserId does not own the quizId given
  test('quizId does not refer to authUserId (1)', () => {
    res = v2RequestAdminQuizNameUpdate(user1, user2Quiz1, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('quizId does not refer to authUserId (2)', () => {
    res = v2RequestAdminQuizNameUpdate(user2, user1Quiz2, 'new');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for invalid name input
  test('Name is less than 3 characters', () => {
    res = v2RequestAdminQuizNameUpdate(user1, user1Quiz1, 'hi');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name contains invalid characters', () => {
    res = v2RequestAdminQuizNameUpdate(user1, user1Quiz1, '1531$*^& <badname>#');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name is more than 30 characters', () => {
    res = v2RequestAdminQuizNameUpdate(user1, user1Quiz1, 'thisisaterribleandhorriblenameeee1');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for when the name of quiz already exists for the admin user
  test('Name already exists (1)', () => {
    res = v2RequestAdminQuizNameUpdate(user1, user1Quiz1, 'spiderman');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name already exists  (2)', () => {
    res = v2RequestAdminQuizNameUpdate(user2, user2Quiz2, 'Ironman');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// //////////////////////////ADMINQUIZTRANSFER///////////////////////////////////////
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
    res = v2RequestAdminQuizTransfer(user1, user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Valid parameter input (2)', () => {
    res = v2RequestAdminQuizTransfer(user2, user2Quiz1, 'peterparker@gmail.com');
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
  });
  test('Test successful quiz transfer, then transfer back to creator', () => {
    res = v2RequestAdminQuizTransfer(user2, user2Quiz1, 'peterparker@gmail.com');
    res = v2RequestAdminQuizTransfer(user1, user2Quiz1, 'tonystark@gmail.com');
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
    res = v2RequestAdminQuizTransfer('invalid', user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid token (403)', () => {
    res = v2RequestAdminQuizTransfer(generateId(), user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz Id is not valid (400)', () => {
    res = v2RequestAdminQuizTransfer(user1, -1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz Id is not owned by admin user (400)', () => {
    res = v2RequestAdminQuizTransfer(user1, user2Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Quiz Id is not owned by admin user (400)', () => {
    res = v2RequestAdminQuizTransfer(user2, user1Quiz1, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('userEmail is not a real user (400)', () => {
    res = v2RequestAdminQuizTransfer(user1, user1Quiz1, 'noOne@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('userEmail is the current logged in user (400)', () => {
    res = v2RequestAdminQuizTransfer(user1, user1Quiz1, 'peterparker@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  test('Name of quiz to be sent is equivalent to a quiz owned by receiver (400)', () => {
    res = v2RequestAdminQuizTransfer(user1, user1Quiz2, 'tonystark@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Name of quiz to be sent is equivalent to a quiz owned by receiver (400)', () => {
    res = v2RequestAdminQuizTransfer(user2, user2Quiz2, 'peterparker@gmail.com');
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
});

/// ////////////////////////// GETSESSIONSTATUS //////////////////////////////////////////
describe('getSessionStatus', () => {
  let user1: string, user1Quiz1: number, user1Quiz2: number, question: number, session1: number,
    user2: string, user2Quiz1: number, res: any;
  beforeEach(() => {
    requestClear();
    // User 1, their quizzes and sessions
    res = requestAdminAuthRegister(
      'peterparker@gmail.com',
      'gr8p0wergr8responsibility',
      'Peter',
      'Parker'
    );
    expect(res.statusCode).toBe(OK);
    user1 = JSON.parse(res.body as string).token;

    res = v2requestAdminQuizCreate(
      user1,
      'spider',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz1 = JSON.parse(res.body as string).quizId;

    res = v2requestAdminQuizCreate(
      user1,
      'spiderman',
      'I am a friendly neighborhood Spiderman!'
    );
    expect(res.statusCode).toBe(OK);
    user1Quiz2 = JSON.parse(res.body as string).quizId;

    v1requestQuizUpdateThumbnail(
      user1,
      user1Quiz1,
      'https://i.pinimg.com/originals/d6/cd/6a/d6cd6ac5e19d751b5507cfc6a10d9808.png'
    );
    expect(res.statusCode).toBe(OK);

    res = v2requestCreateQuestion(user1, user1Quiz1, {
      question: 'I love computer science?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: true
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    question = JSON.parse(res.body as string).questionId;

    res = v1requestStartQuizSession(user1Quiz1, user1, 4);
    expect(res.statusCode).toBe(OK);
    session1 = JSON.parse(res.body as string).sessionId;

    res = requestAllowGuestPlayerToSession(
      session1,
      'Mary Jane'
    );
    expect(res.statusCode).toBe(OK);

    // User 2 and their quizzes
    res = requestAdminAuthRegister(
      'tonystark@gmail.com',
      'il0veU3000',
      'tony',
      'stark'
    );
    expect(res.statusCode).toBe(OK);
    user2 = JSON.parse(res.body as string).token;

    res = v2requestAdminQuizCreate(
      user2,
      'Ironman',
      'I am Iron Man. The suit and I are one'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz1 = JSON.parse(res.body as string).quizId;
    res = v2requestAdminQuizCreate(
      user2,
      'tony',
      'I love you 3000'
    );
    expect(res.statusCode).toBe(OK);
    user2Quiz1 = JSON.parse(res.body as string).quizId;
  });

  // Testing for invalid tokenId
  test('Invalid token (401)', () => {
    res = requestGetSessionStatus('invalid', user1Quiz1, session1);
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('Invalid token (403)', () => {
    res = requestGetSessionStatus(generateId(), user1Quiz1, session1);
    expect(res.statusCode).toBe(TOKEN_NOT_LOGGED_IN);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  // Testing for invalid userId
  test('Invalid sessionId input (1)', () => {
    res = requestGetSessionStatus(user1, user1Quiz1, -1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for invalid userId
  test('Invalid quizId input', () => {
    res = requestGetSessionStatus(user1, -1, session1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('QuizId does not correspond to the one in session', () => {
    res = requestGetSessionStatus(user1, user1Quiz2, session1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Checking for when the authUserId does not own the quizId given
  test('quizId does not refer to userId (1)', () => {
    res = requestGetSessionStatus(user1, user2Quiz1, session1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });
  test('quizId does not refer to userId (2)', () => {
    res = requestGetSessionStatus(user2, user1Quiz2, session1);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(JSON.parse(res.body as string)).toStrictEqual(ERROR_MESSAGE);
  });

  // Testing for valid inputs
  test('Valid inputs for getSessionStatus', () => {
    res = requestGetSessionStatus(user1, user1Quiz1, session1);
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({
      state: 'LOBBY',
      atQuestion: expect.any(Number),
      players: ['Mary Jane'],
      metadata: {
        quizId: user1Quiz1,
        name: 'spider',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'I am a friendly neighborhood Spiderman!',
        numQuestions: 1,
        questions: [
          {
            questionId: question,
            question: 'I love computer science?',
            duration: 1,
            thumbnailUrl: './thumbnails/default.png',
            points: 2,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'your mum',
                colour: expect.any(String),
                correct: true
              },
              {
                answerId: expect.any(Number),
                answer: 'your dad',
                colour: expect.any(String),
                correct: true
              }
            ]
          }
        ],
        duration: expect.any(Number),
        thumbnailUrl: expect.any(String)
      }
    });
  });
});

/// //////////////////////////PLAYERRESULTS///////////////////////////////////////
describe('playerResults', () => {
  let user1: string, user1Quiz1: number, sessionId: number, playerId: number, res: any, question1Id: number;
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
    expect(res.statusCode).toBe(OK);
    res = v1requestStartQuizSession(
      user1Quiz1,
      user1,
      10
    );
    expect(res.statusCode).toBe(OK);
    sessionId = JSON.parse(res.body as string).sessionId;
    playerId = bodyStrToObj(requestAllowGuestPlayerToSession(sessionId, 'Hayden')).playerId;
    expect(user1 && user1Quiz1 && sessionId && playerId).toBeTruthy();
  });

  test('Valid Test', () => {
    res = v1requestSessionStateUpdate(user1, user1Quiz1, sessionId, 'NEXT_QUESTION');
    res = v1requestPlayerInfo(playerId, 1);
    expect(res.statusCode).toBe(200);
    // Just get the answerId of the first answer to the question
    const answerId: number = bodyStrToObj(res).answers[0].answerId;
    wait(1000);
    res = v1requestPlayerSubmitAnswers(playerId, 1, [answerId]);
    expect(res.statusCode).toBe(OK);
    res = v1requestSessionStateUpdate(user1, user1Quiz1, sessionId, 'GO_TO_ANSWER');
    res = v1requestSessionStateUpdate(user1, user1Quiz1, sessionId, 'GO_TO_FINAL_RESULTS');
    res = v1requestPlayerResults(playerId);
    expect(res.statusCode).toBe(OK);
    expect(bodyStrToObj(res)).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'Hayden',
          score: 5
        }
      ],
      questionResults: [
        {
          questionId: question1Id,
          questionCorrectBreakdown: [
            {
              answerId: expect.any(Number),
              playersCorrect: [
                'Hayden'
              ]
            }
          ],
          averageAnswerTime: 1,
          percentCorrect: 100
        }
      ]
    });
  });
  test('Session in incorrect state', () => {
    res = v1requestPlayerResults(playerId);
    expect(res.statusCode).toBe(INPUT_ERROR);
    requestUpdateSessionState(user1, user1Quiz1, sessionId, 'END');
    res = v1requestPlayerResults(playerId);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Invalid Player Id', () => {
    res = v1requestSessionStateUpdate(user1, user1Quiz1, sessionId, 'NEXT_QUESTION');
    res = v1requestSessionStateUpdate(user1, user1Quiz1, sessionId, 'GO_TO_ANSWER');
    res = v1requestSessionStateUpdate(user1, user1Quiz1, sessionId, 'GO_TO_FINAL_RESULTS');
    res = v1requestPlayerResults(-1);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});
describe('ChatInfo', () => {
  let userToken: string, quizId: number, sessionId: number, playerId: number, res: any;
  beforeEach(() => {
    requestClear();
    userToken = bodyStrToObj(requestAdminAuthRegister('johnwick12@gmail.com', 'jw1241241231231', 'johnnn', 'wickkkk')).token;
    quizId = bodyStrToObj(v2requestAdminQuizCreate(userToken, 'mathquiz', 'sample')).quizId;
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'Am I sure I love computer science?',
      duration: 58,
      points: 6,
      answers: [
        {
          answer: 'CS FOREVER',
          correct: true
        },
        {
          answer: 'I need to shower',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    sessionId = bodyStrToObj(v1requestStartQuizSession(quizId, userToken, 10)).sessionId;
    playerId = bodyStrToObj(requestAllowGuestPlayerToSession(sessionId, 'Hayden')).playerId;
    expect(userToken && quizId && sessionId && playerId).toBeTruthy();
    bodyStrToObj(v1requestPostChat(playerId, 'hi there'));

    expect(res.statusCode).toBe(OK);
  });
  test('Valid Message', () => {
    res = v1requestViewChat(playerId);
    expect(res.statusCode).toBe(OK);
    expect(bodyStrToObj(res)).toStrictEqual({
      messages: [
        {
          messageBody: 'hi there',
          playerId: playerId,
          playerName: 'Hayden',
          timeSent: expect.any(Number)
        },
      ]
    });
  });
  test('Multiple Messages', () => {
    bodyStrToObj(v1requestPostChat(playerId, 'this question is tough'));
    res = v1requestViewChat(playerId);
    expect(res.statusCode).toBe(OK);
    expect(bodyStrToObj(res)).toStrictEqual({
      messages: [
        {
          messageBody: 'hi there',
          playerId: playerId,
          playerName: 'Hayden',
          timeSent: expect.any(Number)
        },
        {
          messageBody: 'this question is tough',
          playerId: playerId,
          playerName: 'Hayden',
          timeSent: expect.any(Number)
        }
      ]
    });
  });

  test('Player Id is not valid', () => {
    res = v1requestViewChat(playerId + 1);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

describe('Send Messages in chat', () => {
  let userToken: string, quizId: number, sessionId: number, playerId: number, res: any;
  beforeEach(() => {
    requestClear();
    userToken = bodyStrToObj(requestAdminAuthRegister('abad@gmail.com', 'passw0rdd', 'Arnav', 'Badrish')).token;
    quizId = bodyStrToObj(v2requestAdminQuizCreate(userToken, 'Barbie test', 'Do you have the right Kenergy')).quizId;
    res = v2requestCreateQuestion(userToken, quizId, {
      question: 'I love computer science?',
      duration: 69,
      points: 2,
      answers: [
        {
          answer: 'your mum',
          correct: true
        },
        {
          answer: 'your dad',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    expect(res.statusCode).toBe(OK);
    sessionId = bodyStrToObj(v1requestStartQuizSession(quizId, userToken, 10)).sessionId;
    playerId = bodyStrToObj(requestAllowGuestPlayerToSession(sessionId, 'Hayden')).playerId;
  });

  test('Valid Chat', () => {
    res = v1requestPostChat(playerId, 'hi there!');
    expect(res.statusCode).toBe(OK);
    expect(bodyStrToObj(res)).toStrictEqual({});
  });
  test('Player Id is not valid', () => {
    res = v1requestPostChat(playerId + 1, 'hi there!');
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('Messages Length is out of bounds', () => {
    res = v1requestPostChat(playerId, 'hi there!djsbaduisabdsahc hsubduysabdsahbdnhsaubuasbdsuaybc shac hsabaduyas asu casiubdashfvhjshadbsdsuabdasd');
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

describe('resultsInCSV', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  let session: SessionId;
  let player1: PlayerId;
  let player1info: any;
  let answerId: number;
  // let question: QuestionId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));

    quiz = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token, 'mathquiz', 'sample'));
    bodyStrToObj(v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'You like romance?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'Hell yeah',
          correct: true
        },
        {
          answer: 'Oh no',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    }));
    session = bodyStrToObj(v1requestStartQuizSession(quiz.quizId, tokenId.token, 5));
    player1 = bodyStrToObj(v1requestPlayerJoin(session.sessionId, 'sample1'));
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION');
    sleepSync(101);
    player1info = bodyStrToObj(v1requestPlayerInfo(player1.playerId, 1));
    answerId = player1info.answers[0].answerId;
    v1requestPlayerSubmitAnswers(player1.playerId, 1, [answerId]);
    sleepSync(1001);
  });

  test.skip('success', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');
    const res: any = requestresultsInCSV(tokenId.token, quiz.quizId, session.sessionId);
    const obj: URL = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(OK);
    expect(obj.url).toStrictEqual(expect.any(String));
  });

  test('QuizId does not refer to a valid quiz', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');
    const res: any = requestresultsInCSV(tokenId.token, quiz.quizId + 1, session.sessionId);
    const obj: URL = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz does not belong to user', () => {
    const tokenId2: TokenId = bodyStrToObj(requestAdminAuthRegister('kingbob@gmail.com',
      '123456789kl', 'king', 'bob'));

    const quiz2: QuizId = bodyStrToObj(v2requestAdminQuizCreate(tokenId2.token, 'mathquiz', 'sample'));
    v2requestCreateQuestion(tokenId2.token, quiz2.quizId, {
      question: 'You like romance?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'Hell yeah',
          correct: true
        },
        {
          answer: 'Oh no',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    bodyStrToObj(v1requestStartQuizSession(quiz2.quizId, tokenId2.token, 5));
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');
    const res: any = requestresultsInCSV(tokenId.token, quiz2.quizId, session.sessionId);
    const obj: URL = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });

  test('Not a valid sessionId', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');
    const res: any = requestresultsInCSV(tokenId.token, quiz.quizId, session.sessionId + 1);
    const obj: URL = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });

  test('Session is not in FINAL RESULTS state', () => {
    const res: any = requestresultsInCSV(tokenId.token, quiz.quizId, session.sessionId);
    const obj: URL = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });
});

describe('questionResults', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  let session: SessionId;
  let player1: PlayerId;
  let player1info: any;
  let answerId: number;
  let question: QuestionId;
  // let question: QuestionId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));

    quiz = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token, 'mathquiz', 'sample'));
    question = bodyStrToObj(v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'You like romance?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'Hell yeah',
          correct: true
        },
        {
          answer: 'Oh no',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    }));
    bodyStrToObj(v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'Another question',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'Hell yeah',
          correct: true
        },
        {
          answer: 'Oh no',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    }));
    session = bodyStrToObj(v1requestStartQuizSession(quiz.quizId, tokenId.token, 5));
    player1 = bodyStrToObj(v1requestPlayerJoin(session.sessionId, 'user'));
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION');
    sleepSync(101);
    player1info = bodyStrToObj(v1requestPlayerInfo(player1.playerId, 1));
    answerId = player1info.answers[0].answerId;
    v1requestPlayerSubmitAnswers(player1.playerId, 1, [answerId]);
    sleepSync(1001);
  });

  test('PlayerId does not exist', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    const res: any = requestquestionResults(player1.playerId + 1, 1);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('QuestionPosition not valid', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    const res: any = requestquestionResults(player1.playerId, 3);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Session not up to this question', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    const res: any = requestquestionResults(player1.playerId, 2);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('Session not in ANSWER_SHOW state', () => {
    const res: any = requestquestionResults(player1.playerId, 1);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
  });

  test('SUCCESS', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    const res: any = requestquestionResults(player1.playerId, 1);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(
      {
        questionId: question.questionId,
        questionCorrectBreakdown: [
          {
            answerId: answerId,
            playersCorrect: ['user'],
          }
        ],
        averageAnswerTime: expect.any(Number),
        percentCorrect: expect.any(Number)
      }
    );
    expect(res.statusCode).toStrictEqual(OK);
  });
});

describe('QuizSessionFinalResults', () => {
  let tokenId: TokenId;
  let quiz: QuizId;
  let session: SessionId;
  let player1: PlayerId; let player2: PlayerId;
  let player1info: any; let player2info: any;
  let answerId1: number; let answerId2: number;
  let question: QuestionId;
  beforeEach(() => {
    requestClear();

    tokenId = bodyStrToObj(requestAdminAuthRegister('bobafette@gmail.com',
      '123456789kl', 'boba', 'fette'));

    quiz = bodyStrToObj(v2requestAdminQuizCreate(tokenId.token, 'mathquiz', 'sample'));
    question = bodyStrToObj(v2requestCreateQuestion(tokenId.token, quiz.quizId, {
      question: 'You like romance?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'Hell yeah',
          correct: true
        },
        {
          answer: 'Oh no',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    }));
    // bodyStrToObj(v2requestCreateQuestion(tokenId.token, quiz.quizId, {
    //   question: 'Another question',
    //   duration: 1,
    //   points: 2,
    //   answers: [
    //     {
    //       answer: 'Hell yeah',
    //       correct: true
    //     },
    //     {
    //       answer: 'Oh no',
    //       correct: false
    //     }
    //   ],
    //   thumbnailUrl: './thumbnails/default.png',
    // }));
    session = bodyStrToObj(v1requestStartQuizSession(quiz.quizId, tokenId.token, 5));
    player1 = bodyStrToObj(requestAllowGuestPlayerToSession(session.sessionId, 'user1'));
    player2 = bodyStrToObj(requestAllowGuestPlayerToSession(session.sessionId, 'user2'));
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION');
    sleepSync(101);

    player1info = bodyStrToObj(v1requestPlayerInfo(player1.playerId, 1));
    answerId1 = player1info.answers[0].answerId;
    v1requestPlayerSubmitAnswers(player1.playerId, 1, [answerId1]);

    player2info = bodyStrToObj(v1requestPlayerInfo(player2.playerId, 1));
    answerId2 = player2info.answers[1].answerId;
    v1requestPlayerSubmitAnswers(player2.playerId, 1, [answerId2]);

    sleepSync(1001);
  });

  test('Invalid token', () => {
    const res: any = requestquizSessionFinalResults(JSON.stringify(tokenId.token), quiz.quizId, session.sessionId);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(INVALID_TOKEN);
  });

  test('Token not logged in', () => {
    requestAdminAuthLogout(tokenId.token);
    const res: any = requestquizSessionFinalResults(tokenId.token, quiz.quizId, session.sessionId);
    const obj: object = bodyStrToObj(res);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
    expect(res.statusCode).toStrictEqual(TOKEN_NOT_LOGGED_IN);
  });

  test('QuizId does not refer to a valid quiz', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');
    const res: any = requestquizSessionFinalResults(tokenId.token, quiz.quizId + 1, session.sessionId);
    const obj: object = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });

  test('Quiz does not belong to user', () => {
    const tokenId2: TokenId = bodyStrToObj(requestAdminAuthRegister('kingbob@gmail.com',
      '123456789kl', 'king', 'bob'));

    const quiz2 = bodyStrToObj(v2requestAdminQuizCreate(tokenId2.token, 'mathquiz', 'sample'));
    v2requestCreateQuestion(tokenId2.token, quiz2.quizId, {
      question: 'You like romance?',
      duration: 1,
      points: 2,
      answers: [
        {
          answer: 'Hell yeah',
          correct: true
        },
        {
          answer: 'Oh no',
          correct: false
        }
      ],
      thumbnailUrl: './thumbnails/default.png',
    });
    bodyStrToObj(v1requestStartQuizSession(quiz2.quizId, tokenId2.token, 5));
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');
    const res: any = requestquizSessionFinalResults(tokenId.token, quiz2.quizId, session.sessionId);
    const obj: object = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    const res: any = requestquizSessionFinalResults(tokenId.token, quiz.quizId, session.sessionId);
    const obj: object = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });

  test('Not a valid session', () => {
    const res: any = requestquizSessionFinalResults(tokenId.token, quiz.quizId, session.sessionId + 1);
    const obj: object = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(INPUT_ERROR);
    expect(obj).toStrictEqual(ERROR_MESSAGE);
  });

  test('SUCCESS', () => {
    requestUpdateSessionState(tokenId.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');
    const res: any = requestquizSessionFinalResults(tokenId.token, quiz.quizId, session.sessionId);
    const obj: object = bodyStrToObj(res);
    expect(res.statusCode).toStrictEqual(OK);
    expect(obj).toStrictEqual(
      {
        usersRankedByScore: [
          {
            name: 'user1',
            score: expect.any(Number),
          },
          {
            name: 'user2',
            score: expect.any(Number),
          }
        ],
        questionResults: [
          {
            questionId: question.questionId,
            questionCorrectBreakdown: [
              {
                answerId: answerId1,
                playersCorrect: ['user1'],
              }
            ],
            averageAnswerTime: expect.any(Number),
            percentCorrect: 50
          }
        ]
      }
    );
  });
});
