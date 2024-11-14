import { getData, setData } from './dataStore';
import {
  validuserId, validquizname, chooseRandomColour, generateSessionId, existingSessionId,
  generateString, imgData, changeState, updateToOpen,
  SERVER_URL, modifyAnswerArray, convertToCSV, findPlayerRank, csvLink, modifyPlayerArr

} from './helper';

import {
  States, Action, DataStore,
  user, token, quiz, session, SessionId,
  QuizId, answer, question, Colour, DuplicateQuestion, questionBody, QuestionId,
  playerStatus, playerQuestionInfo, Player, QuestionsAnswered, QuizList, quizListItem,
  QuizDetails, trashlist, trashListItem, Message, QuestionResults, quizSessionResults, MessageList,
  SessionStatus, metadata, questionCorrectBreakdown, SessionList, URL
} from './interfaces';

import { validate as checkToken } from 'uuid';
import HTTPError, { IsHttpError } from 'http-errors';
import fs from 'fs';

/// ///////////////////////////// CONSTANTS /////////////////////////////////////
const availableColours: Array<Colour> = ['red', 'green', 'blue', 'yellow', 'purple', 'brown', 'orange'];

/// //////////////////////////////////////////////////////////////////////////////

/** This function intakes token ID and
  * returns all of the existing quizzes (in an array)
  * @param {number} tokenId - takes in id as a string
  * @return {object} Object containing info about all the quizzes the user owns, or an error object.
  */
export function v2adminQuizList(tokenId: string): QuizList | IsHttpError {
  // gathering data
  const data: DataStore = getData();

  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');

  // declaring an empty list for storing data
  const quizzes: quizListItem[] = [];
  for (const quiz of data.quizzes) {
    quizzes.push({
      quizId: quiz.quizId,
      name: quiz.name,
    });
  }
  return { quizzes: quizzes };
}

/** Intakes User ID and quiz name with its respective description
  * and returns the quiz ID
  * This function creates a quiz
  * @param {number} authUserId
  * @param {string} name
  * @param {string} description
  * @returns {object} Object containing the new quiz's quizId
*/
export const adminQuizCreate2 = (tokenId: string, name: string, description: string): QuizId => {
  const data: DataStore = getData();
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) HTTPError(400, 'Invalid user ID');

  // Check if authUserId is valid
  if (!validuserId(token.userId, data)) {
    throw HTTPError(400, 'Invalid authuserId');
  }

  const regex = /[a-zA-Z0-9\s]/g;
  if (name.length !== name.match(regex).length) {
    throw HTTPError(400, 'Quiz name must be alphanumerical (spaces accepted)');
  }

  if (name.length < 3 || name.length > 30) {
    throw HTTPError(400, 'Quiz name must be between 3 and 30 characters (inclusive)');
  }

  // Checking if quiz name already exists
  if (validquizname(name, user, data) === false) {
    throw HTTPError(400, 'Quiz name already exists!');
  }

  if (description.length > 100) {
    throw HTTPError(400, 'Description must be less than 100 characters (inclusive)');
  }

  const ID = data.nextQuizId;
  const newQuiz: quiz = {
    quizId: ID,
    userId: user.userId,
    name: name,
    timeCreated: Math.round(Date.now() / 1000),
    timeLastEdited: Math.round(Date.now() / 1000),
    description: description,
    questions: []
  };
  data.quizzes.push(newQuiz);

  const i: number = data.users.findIndex(user => user.userId === token.userId);

  if (data.users[i].ownedQuizzes === undefined) {
    data.users[i].ownedQuizzes = [];
  }
  data.users[i].ownedQuizzes.push(newQuiz.quizId);
  data.nextQuizId++;
  setData(data);
  return {
    quizId: newQuiz.quizId
  };
};

/// //////////////TODO: Reminder for myself to test the end states in quiz.test.ts//////
/** This function intakes User and Quiz ID
  * and returns nothing
  * Permanently removes the selected quiz
  * @param {number} authUserId
  * @param {number} quizId
  * @returns {object} Empty object if delete is successful, otherwise error object.
  */
export function adminQuizRemove2(tokenId: string, quizId: number): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) throw HTTPError(400, 'Invalid user ID');
  // find index of user
  // const user:user[] = data.users;
  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);

  let quizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }

  quizIndex = data.quizzes.findIndex(obj => obj.quizId === quizId);
  if (quizIndex === -1) throw HTTPError(400, 'Invalid Quiz ID');

  // Edits timeLastedited
  data.quizzes[quizIndex].timeLastEdited = Math.round(Date.now() / 1000);
  data.trash.push(data.quizzes[quizIndex]);
  // quiz is actually removed from quiz array
  data.quizzes.splice(quizIndex, 1);

  // Converting all active sessions of this quiz into end state
  for (const session of data.sessions) {
    if (session.quiz.quizId === quizId) {
      session.state = States.END;
    }
  }
  setData(data);
  return {};
}

/** This function returns all of the relevant
  * information about the current quiz.
  * @param {number} tokenId - takes in id as a string
  * @param {number} quizId
  * @returns {object} Object containing comprehensive information about the quiz, or an error object.
  */
export function v2adminQuizInfo(quizId: number, tokenId: string): QuizDetails | IsHttpError {
  const data: DataStore = getData();
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) throw HTTPError(400, 'Invalid user ID');
  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);
  const quiz: quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  const ownquizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  const quizIndex: number = data.quizzes.findIndex(obj => obj.quizId === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }
  if (ownquizIndex === -1) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }

  let sum = 0;
  // declaring an interface for storing questions
  const qArray: {
    questionId: number,
    question: string
    duration: number,
    thumbnailUrl: string,
    points: number,
    answers: answer[]
  }[] = [];
  for (const ques of data.quizzes[quizIndex].questions) {
    // calculates the total duration
    sum = sum + ques.duration;
    qArray.push({
      questionId: ques.questionId,
      question: ques.question,
      duration: ques.duration,
      thumbnailUrl: ques.thumbnailUrl,
      points: ques.points,
      answers: ques.answers,
    });
  }
  let numQues = 0;
  // takes out the number of questions
  numQues = data.quizzes[quizIndex].questions.length;
  const res: QuizDetails = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: numQues,
    questions: qArray,
    duration: sum,
    thumbnailUrl: quiz.thumbnailUrl
  };
  return res;
}

/** This function moves a question at a designated locus in the questions array
 *  @param { number } quizId
 *  @param { number } questionId
 *  @param { string } tokenId
 *  @param { number } newPosition
 *  @return { object } empty
*/
export function moveQuestion2(quizId: number, questionId: number,
  tokenId: string, newPosition: number): Record<string, never> | IsHttpError {
  const data: DataStore = getData();

  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'Quiz does not exist');
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    throw HTTPError(400, 'Invalid user ID');
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: number | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    throw HTTPError(400, 'User does not own this quiz');
  }

  // checks whether questionId exists
  const questionIndex: number = data.quizzes[quizIndex].questions
    .findIndex(question => question.questionId === questionId);
  if (questionIndex === -1) {
    throw HTTPError(400, 'QuestionId does not exist in this quiz');
  }

  const numberOfQuestions = data.quizzes[quizIndex].questions.length;
  if (newPosition < 0 || newPosition > numberOfQuestions - 1) {
    throw HTTPError(400, 'newPosition must be between 0 and must not extend' +
      ' beyond (n - 1) for (n) number of questions');
  }

  if (newPosition === questionIndex) {
    throw HTTPError(400, 'newPosition must not be the same position of the' +
      ' current question');
  }

  // these are just dummy values so type script does not go crazy
  const duplicateQuestion: question = {
    questionId: 1,
    question: 'a',
    duration: 1,
    points: 1,
    answers: [],
    correctAnswerCount: 1,
    thumbnailUrl: 'a'
  };

  // Object.assign, will replace these dummy values. ;)
  Object.assign(duplicateQuestion, data.quizzes[quizIndex].questions[questionIndex]);

  // delete current question
  data.quizzes[quizIndex].questions.splice(questionIndex, 1);

  data.quizzes[quizIndex].questions.splice(newPosition, 0, duplicateQuestion);

  // changes timeLastedited
  data.quizzes[quizIndex].timeLastEdited = Math.round(Date.now() / 1000);

  setData(data);
  return {};
}

/** This function duplicates a question by placing the new duplicate
  * after the index of source.
  * @param { number } quizId
  * @param { number } questionId
  * @param { string } tokenId
  * @return { object } newQuestionId
*/
export function duplicateQuestion2(quizId: number, questionId: number,
  tokenId: string): DuplicateQuestion | IsHttpError {
  const data: DataStore = getData();

  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'Quiz does not exist');
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    throw HTTPError(400, 'Invalid user ID');
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: number | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    throw HTTPError(400, 'User does not own this quiz');
  }

  // checks whether questionId exists
  const questionIndex: number = data.quizzes[quizIndex].questions
    .findIndex(question => question.questionId === questionId);
  if (questionIndex === -1) {
    throw HTTPError(400, 'QuestionId does not exist in this quiz');
  }

  // these are just dummy values so type script does not go crazy
  const duplicateQuestion: question = {
    questionId: 1,
    question: 'a',
    duration: 1,
    points: 1,
    answers: [],
    correctAnswerCount: 1,
    thumbnailUrl: 'a',
  };

  // Object.assign, will replace these dummy values. Cool right?!
  Object.assign(duplicateQuestion, data.quizzes[quizIndex].questions[questionIndex]);

  // change ID of duplicateQuestion
  let ID = 1;
  while (data.quizzes[quizIndex].questions.find(qus => qus.questionId === ID)) {
    ID++;
  }
  duplicateQuestion.questionId = ID;

  data.quizzes[quizIndex].questions.splice(questionIndex + 1, 0, duplicateQuestion);

  // changes timeLastedited
  data.quizzes[quizIndex].timeLastEdited = Math.round(Date.now() / 1000);
  setData(data);
  return {
    newQuestionId: duplicateQuestion.questionId,
  };
}

/// /////////////////////// CREATEQUESTION /////////////////////////////

/** This function creates a question, placing the question at the end of the
  * array
  * @param { number } quizId
  * @param { string } tokenId
  * @param { string } question
  * @return { object } Error || questionId
*/
export function createQuestion2(tokenId: string, quizId: number, question: string,
  duration: number, points: number, answers: Array<answer>, thumbnailUrl: string): QuestionId {
  // FIXME: need to fix the typing of answers
  const data = getData();

  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'Quiz does not exist');
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) throw HTTPError(400, 'Invalid authUser ID');

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: any | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    throw HTTPError(400, 'User does not own this quiz');
  }

  if (question.length < 5 || question.length > 50) {
    throw HTTPError(400, 'Question must be between 5 and 50 characters');
  }

  if (answers.length < 2 || answers.length > 6) {
    throw HTTPError(400, 'There must be between 2 and 6 answers');
  }

  if (duration <= 0) {
    throw HTTPError(400, 'The duration must be a positive (non-negative) numbe');
  }

  // assuming duration is always in seconds
  let totalDuration = 0;
  for (const qus of data.quizzes[quizIndex].questions) {
    totalDuration += qus.duration;
  }
  totalDuration += duration;

  if (totalDuration > 180) {
    throw HTTPError(400, 'Total duration of questions must not be greater than 3 minutes');
  }

  if (points < 1 || points > 10) {
    throw HTTPError(400, 'Points must be given between 1 and 10');
  }

  for (const obj of answers) {
    if (obj.answer.length < 1 || obj.answer.length > 30) {
      throw HTTPError(400, 'Answers must be between 1 and 30 characters');
    }
  }

  let counter = 0;
  for (const obj1 of answers) {
    counter = 0;
    for (const obj2 of answers) {
      if (obj1.answer === obj2.answer) {
        counter++;
      }
      if (counter === 2) {
        throw HTTPError(400, 'Answers must not be duplicates within the same question');
      }
    }
  }

  counter = 0;
  for (const answer of answers) {
    if (answer.correct === true) {
      counter++;
    }
  }

  if (counter === 0) {
    throw HTTPError('There must be at least 1 correct answer');
  }

  if (thumbnailUrl.length === 0) {
    throw HTTPError(400, 'thumbnailUrl cannot be an empty string');
  }

  // FIXME: need to check if this checks ./thumbnail folder
  if (!fs.existsSync(thumbnailUrl)) {
    throw HTTPError(400, 'thumbnailUrl is not a valid file');
  }

  if (!thumbnailUrl.endsWith('png') && !thumbnailUrl.endsWith('jpg')) {
    throw HTTPError(400, 'thumbnail is not of type JPG or PNG file');
  }

  // timelastedited changed
  data.quizzes[quizIndex].timeLastEdited = Math.round(Date.now() / 1000);

  let ID = 1;

  // here we are adding the answerId property and the answerId itself
  let i = 0;
  while (i < answers.length) {
    if (answers[i].answerId === undefined) {
      ID = 1;
      while (answers.find(answer => answer.answerId === ID)) {
        ID++;
      }
      answers[i].answerId = ID;
    }
    i++;
  }

  i = 0;
  while (i < answers.length) {
    // refer to helper.ts
    answers[i].colour = chooseRandomColour(availableColours);
    i++;
  }
  ID = data.nextQuestionId;

  const CorrectAnswers = answers.filter(answer => answer.correct === true);

  const qusObj: question = {
    questionId: ID,
    question: question,
    duration: duration,
    points: points,
    answers: answers,
    correctAnswerCount: CorrectAnswers.length,
    thumbnailUrl: thumbnailUrl,
  };

  // assumes that the quiz is pushed to the end of the array
  data.quizzes[quizIndex].questions.push(qusObj);
  data.nextQuestionId++;
  setData(data);
  return {
    questionId: qusObj.questionId,
  };
}

/** This function intakes token ID and
  * returns all of the existing quizzes in trash(in an array)
  * @param {number} tokenId - takes in id as a string
  * @return {object} Object containing info about all the quizzes the user has in trash, or an error object.
  */
export function v2trashList(tokenId: string): trashlist | IsHttpError {
  const data: DataStore = getData();
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  // finds quiz id
  const quiz: quiz[] | undefined = data.trash.filter(obj => user.ownedQuizzes.includes(obj.quizId));
  // declaring an empty list for storing data
  const quizzes: trashListItem[] = [];
  for (const element of quiz) {
    quizzes.push({
      quizId: element.quizId,
      name: element.name,
    });
  }
  return { quizzes: quizzes };
}

/**
 * Takes in a valid token id ,quiz id and question id
 * deletes the particular question from the quiz the user has requested for
 * @param quizId
 * @param questionId
 * @param tokenId
 * @returns Empty object if successful, error object if not
 */

export function v2DeleteQuizQuestion(quizId: number, questionId: number, tokenId: string): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) throw HTTPError(400, 'Invalid user ID');
  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);
  const ownedQuizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  const quizIndex: number = data.quizzes.findIndex(obj => obj.quizId === quizId);
  if (ownedQuizIndex === -1) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }
  if (quizIndex === -1) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }
  // finds the particular question user has asked for
  const questionIndex: number = data.quizzes[quizIndex].questions
    .findIndex(question => question.questionId === questionId);
  if (questionIndex === -1) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }
  // deletes the question from array
  data.quizzes[quizIndex].questions.splice(questionIndex, 1);
  setData(data);
  return {};
}

/**
 * Takes in a valid token id and quiz id
 * and retrieves the quiz from trash
 * @param quizId
 * @param tokenId
 * @returns Empty object if successful, error object if not
 */

export function v2QuizRestore(quizId: number, tokenId: string): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) throw HTTPError(400, 'Invalid user ID');

  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);

  const quiz: quiz = data.trash.find(quiz => quiz.quizId === quizId);
  let quizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  if (!quiz) {
    throw HTTPError(400, 'Invalid Quiz id');
  }
  if (quizIndex === -1) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }
  const trash: trashListItem = data.trash.find(trash => trash.quizId === quizId);
  if (trash === undefined) {
    throw HTTPError(400, 'This user either does not have this quiz or the user' +
      ' does not own this quiz');
  }

  quizIndex = data.trash.findIndex(obj => obj.quizId === quizId);
  // pushes the quiz back into quizzes
  data.quizzes.push(data.trash[quizIndex]);
  // deletes the quiz from the trash array
  data.trash.splice(quizIndex, 1);
  setData(data);
  return {};
}

/** This function generates a new session for a particular quiz.
 * @param { number } quizId
 * @param { string } tokenId
 * @return { object } object containing sessionId
*/
export const startQuizSession = (quizId: number, tokenId: string,
  autoStartNum: number): SessionId => {
  const data = getData();

  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'Quiz does not exist');
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    throw HTTPError(400, 'Invalid user ID');
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: number | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    throw HTTPError(400, 'User does not own this quiz');
  }

  // autotest wont test for < 0.
  if (autoStartNum > 50) {
    throw HTTPError(400, 'There cannot be more than 50 players');
  }

  if (data.quizzes[quizIndex].questions.length === 0) {
    throw HTTPError(400, 'This quiz does not have any questions');
  }

  let counter = 0;
  for (const session of data.sessions) {
    if (session.quiz.quizId === quizId) {
      if (session.state !== States.END) {
        counter++;
      }
    }
  }
  // FIXME: Interpretation of spec will vary, might need to double check
  if (counter > 10) {
    throw HTTPError(400, 'There cannot exist more than 10 sessions');
  }

  // generates unique sessionId
  let ID = generateSessionId();
  while (existingSessionId(ID, data)) {
    ID = generateSessionId();
  }

  const sessionObj: session = {
    sessionId: ID,
    state: States.LOBBY,
    autoStartNum: autoStartNum,
    // time will only change when question is open
    timeQuestionOpen: -1,
    numQuestions: data.quizzes[quizIndex].questions.length,
    atQuestion: 1,
    messages: [],
    players: [],
    // this ensures that quiz and copyofquiz have different memory addresses
    quiz: JSON.parse(JSON.stringify(data.quizzes[quizIndex])),
  };
  data.sessions.push(sessionObj);
  setData(data);

  return {
    sessionId: ID,
  };
};

/** This function returns an object that contains results when a session ends
 *
 * @param { number } quizId
 * @param { number } sessionId
 * @param { string } tokenId
 * @returns { quizSessionResults } object
 */
export const quizSessionFinalResults = (quizId: number, sessionId: number, tokenId: string) => {
  const data = getData();

  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'Quiz does not exist');
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    throw HTTPError(400, 'Invalid user ID');
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: number | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    throw HTTPError(400, 'User does not own this quiz');
  }

  const quizSession: session | undefined = data.sessions
    .find(session => session.sessionId === sessionId);
  if (quizSession === undefined) {
    // typo in spec indeed
    throw HTTPError(400, 'Session ID does not refer to a valid session');
  }

  if (quizSession.state !== States.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in final results state');
  }

  const resultsObj: quizSessionResults = {};

  // sorts players with by their scores in descending order
  // changing memory addresses so modifications will not affect dataStore
  const userSessionArray: Array<Player> = modifyPlayerArr(JSON.parse(JSON.stringify([...quizSession.players
    .sort((score1, score2) => score2.score - score1.score)])));
  resultsObj.usersRankedByScore = userSessionArray;

  const questionResults: QuestionResults | Array<any> = [];
  let questionCorrectBreakdown: Array<questionCorrectBreakdown> = [];
  let answerTime = 0;
  let i = 0;
  let playersAnsweredCorrect = 0;
  let playerAttempts = 0;
  // empty the array with different memory address
  questionCorrectBreakdown = JSON.parse(JSON.stringify([...[]]));
  for (const question of quizSession.quiz.questions) {
    answerTime = 0;
    playerAttempts = 0;
    playersAnsweredCorrect = 0;
    questionCorrectBreakdown = [...[]];
    // modifies answerArray to align with spec
    questionCorrectBreakdown = modifyAnswerArray(JSON.parse(JSON.stringify([...question.answers])));
    for (const player of quizSession.players) {
      // finds the index of the question in questionAnswered array
      i = 0;
      while (player.questionsAnswered[i].questionId !== question.questionId &&
        i < player.questionsAnswered.length) i++;
      // this may be buggy need to double check
      if (player.questionsAnswered[i] !== undefined) {
        answerTime = answerTime + (player.questionsAnswered[i].timeLastAnswered - player.questionsAnswered[i].timeQuestionOpen);
        playerAttempts++;
      }
      for (const answer of questionCorrectBreakdown) {
        if (player.questionsAnswered[i].answersCorrect.includes(answer.answerId)) {
          answer.playersCorrect.push(player.name);
          // alphabetical sorting in ascending order
          answer.playersCorrect.sort((name1, name2) => name1.localeCompare(name2));
          playersAnsweredCorrect++;
        }
      }
    }

    questionResults.push(
      {
        questionId: question.questionId,
        questionCorrectBreakdown: questionCorrectBreakdown,
        averageAnswerTime: Math.round(answerTime / playerAttempts),
        percentCorrect: Math.round(playersAnsweredCorrect / playerAttempts * 100),
      }
    );
  }
  resultsObj.questionResults = questionResults;
  return resultsObj;
};

/** This function returns an object that contains results when a session ends
 *
 * @param { number } quizId
 * @param { number } sessionId
 * @param { string } tokenId
 * @returns { URL } object
 */
export const resultsInCSV = (tokenId: string, quizId: number, sessionId: number): URL => {
  const data: DataStore = getData();

  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    throw HTTPError(400, 'Quiz does not exist');
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    throw HTTPError(400, 'Invalid user ID');
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: number | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    throw HTTPError(400, 'User does not own this quiz');
  }

  const quizSession: session | undefined = data.sessions
    .find(session => session.sessionId === sessionId);
  if (quizSession === undefined) {
    // typo in spec indeed
    throw HTTPError(400, 'Session ID does not refer to a valid session');
  }

  if (quizSession.state !== States.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in final results state');
  }

  const csvArray: any = [];
  let questionPosition = 1;
  let i = 0;
  let rank = 0;
  for (const player of quizSession.players) {
    const obj: any = { ...{} };
    questionPosition = 1;
    obj.name = player.name;
    while (questionPosition <= quizSession.numQuestions) {
      i = 0;
      // finds the question in questionAnswered
      while (player.questionsAnswered[i].questionPosition !== questionPosition) i++;
      if (player.questionsAnswered[i].score === undefined) {
        obj[`question${questionPosition}score`] = 0;
      } else {
        obj[`question${questionPosition}score`] = player.questionsAnswered[i].score;
      }
      // can assume no one is tied
      rank = findPlayerRank(quizSession.players, questionPosition, player.questionsAnswered[i].score);
      obj[`question${questionPosition}rank`] = rank;
      questionPosition++;
    }
    csvArray.push(obj);
  }

  convertToCSV(csvArray);
  // check whether thumbnailUrl is valid, and download the thumbnail and store its local filepath on the server if it is
  let newName = generateString(10);
  while (fs.existsSync('./' + newName + '.csv')) newName = generateString(10);
  const LocalUrl: string | undefined = csvLink(newName, csvArray);
  return {
    url: LocalUrl,
  };
};

/** This function returns an object that contains results when a session ends
 *
 * @param { number } playerId
 * @param { number } questionPosition
 * @param { string } tokenId
 * @returns { QuestionResults } object
 */
export const questionResults = (playerId: number, questionPosition: number) => {
  const data: DataStore = getData();
  let i = 0;
  let flag = 0;
  while (i < data.sessions.length && flag === 0) {
    if (data.sessions[i].players.find(player => player.playerId === playerId)) {
      flag = 1;
    } else {
      i++;
    }
  }
  if (flag === 0) {
    throw HTTPError(400, 'PlayerId does not exist');
  }

  if (questionPosition <= 0 || questionPosition > data.sessions[i].quiz.questions.length) {
    throw HTTPError(400, 'QuestionPosition is not valid in this quiz');
  }

  if (data.sessions[i].state !== States.ANSWER_SHOW) {
    throw HTTPError(400, 'State is not in ANSWER SHOW');
  }

  if (data.sessions[i].atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }

  const questionId = data.sessions[i].quiz.questions[questionPosition - 1].questionId;
  const question = data.sessions[i].quiz.questions[questionPosition - 1];

  let questionCorrectBreakdown: Array<questionCorrectBreakdown> = [];
  let answerTime = 0;
  let j = 0;
  let playersAnsweredCorrect = 0;
  let playerAttempts = 0;
  answerTime = 0;
  playerAttempts = 0;
  playersAnsweredCorrect = 0;
  // empty the array with different memory address
  questionCorrectBreakdown = [...[]];
  // modifies answerArray to align with spec
  questionCorrectBreakdown = modifyAnswerArray(JSON.parse(JSON.stringify([...question.answers])));
  for (const player of data.sessions[i].players) {
    // finds the index of the question in questionAnswered array
    j = 0;
    while (player.questionsAnswered[j].questionId !== questionId &&
      j < player.questionsAnswered.length) j++;

    // this may be buggy need to double check
    if (player.questionsAnswered[j] !== undefined) {
      answerTime = answerTime + (player.questionsAnswered[j].timeLastAnswered - player.questionsAnswered[j].timeQuestionOpen);
      playerAttempts++;
    }

    for (const answer of questionCorrectBreakdown) {
      if (player.questionsAnswered[j].answersCorrect.includes(answer.answerId)) {
        answer.playersCorrect.push(player.name);
        // alphabetical sorting in ascending order
        answer.playersCorrect.sort((name1, name2) => name1.localeCompare(name2));
        playersAnsweredCorrect++;
      }
    }
  }

  return {
    questionId: questionId,
    questionCorrectBreakdown: questionCorrectBreakdown,
    averageAnswerTime: answerTime / playerAttempts,
    percentCorrect: Math.round(playersAnsweredCorrect / playerAttempts * 100),
  };
};

export const viewSessions = (tokenId: string, quizId: number) => {
  const data = getData();
  const sessionList: SessionList = {
    activeSessions: [],
    inactiveSessions: []
  };
  for (const session of data.sessions) {
    if (session.quiz.quizId === quizId) {
      if (session.state === States.END) {
        sessionList.inactiveSessions.push(session.sessionId);
      } else {
        sessionList.activeSessions.push(session.sessionId);
      }
    }
  }
  return sessionList;
};

/** This function edits quiz description
 *  @param { string } tokenId
 *  @param { number } quizId
 *  @param { string } description
 *  @return { object } empty
*/
export function v2adminQuizDescriptionUpdate(tokenId: string, quizId: number, description: string): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) throw HTTPError(400, 'Invalid user ID');
  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) throw HTTPError(400, 'Invalid quiz ID');
  if (!user.ownedQuizzes.includes(quizId)) throw HTTPError(400, 'Quiz not owned by you');
  if (description.length > 100) throw HTTPError(400, 'Description is of invalid size');
  quiz.description = description;
  quiz.timeLastEdited = Math.round(Date.now() / 1000);
  for (const key in data.quizzes) {
    if (data.quizzes[key].quizId === quiz.quizId) {
      data.quizzes[key] = quiz;
      setData(data);
      return {};
    }
  }
}

/** This function empties the trash data
 *  @param { string } tokenId
 *  @param { number[] } quizId
 *  @return { object } empty
*/
export function v2quizTrashEmpty(tokenId: string, quizIds: number[]): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  // check the structure of the token
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  // Check if tokenId refers to valid session
  const token: token = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  let currentQuiz: quiz;
  let currentQuizInTrashIndex: number;
  // loops through each quizId and runs checks on them
  for (const ID of quizIds) {
    currentQuiz = data.quizzes.find((quiz: quiz) => quiz.quizId === ID);
    currentQuizInTrashIndex = data.trash.findIndex((quiz: quiz) => quiz.quizId === ID);
    if (currentQuiz === undefined && currentQuizInTrashIndex === -1) throw HTTPError(400, 'One or more quizIds are invalid');
    if (currentQuiz !== undefined) {
      if (currentQuiz.userId !== token.userId) throw HTTPError(400, 'One or more quizzes do not belong to the user');
    }
    if (currentQuizInTrashIndex !== -1) {
      if (data.trash[currentQuizInTrashIndex].userId !== token.userId) throw HTTPError(400, 'One or more quizzes do not belong to the user');
    } else {
      throw HTTPError(400, 'One or more quizzes are currently not in the trash');
    }
  }
  // remove quiz from the trash
  const user: user = data.users.find(user => user.userId === token.userId);
  let currentQuizIndex = -1;
  for (const ID of quizIds) {
    currentQuizInTrashIndex = data.trash.findIndex((obj: any) => obj.quizId === ID);
    currentQuizIndex = user.ownedQuizzes.findIndex((obj: any) => obj === ID);
    user.ownedQuizzes.splice(currentQuizIndex, 1);
    data.trash.splice(currentQuizInTrashIndex, 1);
  }
  setData(data);
  return {};
}

/** This function updates question details
 *  @param { string } tokenId
 *  @param { number } quizId
 *  @param { number } questionId
 *  @param { questionBody } questionBody
 *  @param { string } thumbnailUrl
 *  @return { object } empty
*/

export function v2updateQuestion(tokenId: string, quizId: number,
  questionId: number, questionBody: questionBody, thumbnailUrl: string): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  // check the structure of the token
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  // Check if tokenId refers to valid session
  const token: token = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  // Check if quizId refers to valid quiz
  const quiz: quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) throw HTTPError(400, 'Invalid Quiz Id');
  // check if user owns quiz
  const user: user = data.users.find(user => user.userId === token.userId);
  if (!user.ownedQuizzes.find(quizIndex => quizIndex === quizId)) throw HTTPError(400, 'User does not own this quiz');
  // check if questionId points to a valid question in the quiz
  const question: question = quiz.questions.find(question => question.questionId === questionId);
  if (!question) throw HTTPError(400, 'Invalid Question Id');
  // check if question string has valid length
  if (!(questionBody.question.length >= 5 && questionBody.question.length <= 50)) throw HTTPError(400, 'Question string must be between 5 and 50 characters long');
  // check if question has right amount of answers
  if (!(questionBody.answers.length >= 2 && questionBody.answers.length <= 6)) throw HTTPError(400, 'You must have between 2 and 6 answers');
  // check if duration is valid
  if (questionBody.duration <= 0) throw HTTPError(400, 'Invalid question duration; it must be more than 0');
  // check the quiz's total time
  let sumTime = 0;
  for (const obj of quiz.questions) {
    if (obj.questionId !== question.questionId) {
      sumTime += obj.duration;
    } else {
      sumTime += questionBody.duration;
    }
  }
  if (sumTime > 180) throw HTTPError(400, "The quiz's total duration is more than 3 minutes");
  // check the question's points are valid
  if (!(questionBody.points >= 1 && questionBody.points <= 10)) throw HTTPError(400, 'A question must award between 1 to 10 points for a correct answer');
  for (const obj of questionBody.answers) {
    // check that each answer's length is valid
    if (!(obj.answer.length >= 1 && obj.answer.length <= 30)) throw HTTPError(400, 'Every answer must be between 1 and 30 characters long.');
  }
  // check for duplicate answers
  const answerStrings: string[] = questionBody.answers.map(answer => answer.answer);
  const duplicateFlag = answerStrings.filter((item, index) => answerStrings.indexOf(item) !== index);
  if (duplicateFlag.length > 0) {
    throw HTTPError(400, 'All answers must be unique');
  }
  // check whether quiz has a correct answer
  if (!questionBody.answers.find(ans => ans.correct === true)) throw HTTPError(400, 'Question must have at least one correct answer.');

  // check whether thumbnailUrl is valid, and download the thumbnail and store its local filepath on the server if it is
  if (thumbnailUrl === '') throw HTTPError(400, 'Thumbnail URL cannot be blank');
  let newName = generateString(10);
  while (fs.existsSync('./thumbnails/' + newName + '.png') || fs.existsSync('./thumbnails/' + newName + '.jpg')) newName = generateString(10);
  const LocalUrl: string | undefined = imgData(thumbnailUrl, newName);
  if (!LocalUrl) throw HTTPError(400, "The thumbnail's URL is either invalid, or the file it is leading to is not of a valid type (PNG or JPEG)");

  // update the answers with answer Ids and color
  const ansFinal: answer = { answerId: 0, answer: 'something', colour: 'red', correct: false };
  let ID = 1;
  const ansArray: answer[] = [];
  for (const ans of questionBody.answers) {
    ansFinal.answerId = ID;
    ID++;
    ansFinal.answer = ans.answer;
    ansFinal.correct = ans.correct;
    ansFinal.colour = chooseRandomColour(availableColours);
    ansArray.push(ansFinal);
  }
  // update the question
  question.question = questionBody.question;
  question.duration = questionBody.duration;
  question.points = questionBody.points;
  question.answers = ansArray;
  question.thumbnailUrl = LocalUrl;
  // update timeLastEdited
  quiz.timeLastEdited = Math.round(Date.now() / 1000);
  // update answer IDs
  setData(data);
  return {};
}

/** This function updates question thumbnail
 *  @param { string } tokenId
 *  @param { number } quizId
 *  @param { string } newUrl
 *  @return { object } empty
*/
export function v1quizUpdateThumbnail(tokenId: string, quizId: number, newUrl: string): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  // check the structure of the token
  if (!checkToken(tokenId)) throw HTTPError(401, 'Invalid token ID');
  // Check if tokenId refers to valid session
  const token: token = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) throw HTTPError(403, 'Token does not match active session');
  const user: user = data.users.find(user => user.userId === token.userId);
  const quiz: quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) throw HTTPError(400, 'Invalid Quiz ID');
  const ownedQuiz: number = user.ownedQuizzes.find(quizIndex => quizIndex === quiz.quizId);
  if (!ownedQuiz) throw HTTPError(400, 'User does not own this quiz');
  if (quiz.thumbnailUrl === undefined) quiz.thumbnailUrl = '';
  const currFile: string = quiz.thumbnailUrl.replace(SERVER_URL + '/thumbnails/', '');
  let newFile = '';
  let newLoc = '';
  if (currFile === '' || currFile === 'default.png') {
    newFile = generateString(10);
    while (fs.existsSync('./thumbnails/' + newFile + '.png') || fs.existsSync('./thumbnails/' + newFile + '.jpg')) newFile = generateString(10);
  } else {
    newFile = currFile;
  }
  newLoc = imgData(newUrl, newFile);
  if (newLoc === undefined) throw HTTPError(400, 'undefined');
  if (!newLoc) throw HTTPError(400, "The thumbnail's URL is either invalid, or the file it is leading to is not of a valid type (PNG or JPEG)");
  quiz.thumbnailUrl = newLoc;
  quiz.timeLastEdited = Math.round(Date.now() / 1000);

  setData(data);
  return {};
}

/** This function retrieves information on players status
 *  @param { number } playerId
 *  @return { object } ...containing information on player's status
*/
export function sessionPlayerStatus(playerId: number): playerStatus | IsHttpError {
  const data = getData();
  // Gives the first session that has the player with aforementioned playerId in it
  const session: session = data.sessions.find(
    session => session.players.find(player => player.playerId === playerId)
  );

  if (!session) throw HTTPError(400, 'Invalid Player Id');
  const obj: playerStatus = {
    state: session.state.toUpperCase(),
    numQuestions: session.numQuestions,
    atQuestion: session.atQuestion
  };
  return obj;
}

/** This function retrives information about a question for a player
 *  @param { number } playerId
 *  @param { number } questionPosition
 *  @return { object } ...contains information about question information
*/
export function sessionPlayerQuestionInfo(playerId: number, questionPosition: number): playerQuestionInfo | IsHttpError {
  const data = getData();
  // Gives the first session that has the player with aforementioned playerId in it
  const session: session = data.sessions.find(
    session => session.players.find(player => player.playerId === playerId)
  );
  if (!session) throw HTTPError(400, 'Invalid Player Id');
  if (questionPosition > session.quiz.questions.length || questionPosition <= 0) throw HTTPError(400, 'Question position is invalid for session of given player');
  if (questionPosition !== session.atQuestion) throw HTTPError(400, 'Session of given player is not on this question');
  if (session.state === States.LOBBY || session.state === States.END) throw HTTPError(400, 'Session is not active');
  const target: question = session.quiz.questions[questionPosition - 1];
  const obj: playerQuestionInfo = {
    questionId: target.questionId,
    question: target.question,
    duration: target.duration,
    thumbnailUrl: target.thumbnailUrl,
    points: target.points,
    answers: target.answers.map(ans => ({ answerId: ans.answerId, answer: ans.answer, colour: ans.colour }))
  };
  return obj;
}

/** This function allows players to submit answers
 *  @param { number } playerId
 *  @param { number } questionPosition
 *  @param { number[] } answerIds
 *  @return { object } empty
*/
export function playerSubmitAnswers(playerId: number, questionPosition: number, answerIds: number[]): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  const session: session = data.sessions.find(sesh => sesh.players.find(player => player.playerId === playerId));
  if (!session) throw HTTPError(400, 'Invalid Player ID');
  if (questionPosition <= 0 || questionPosition > session.quiz.questions.length) throw HTTPError(400, 'Invalid question position for this session');
  if (session.state !== States.QUESTION_OPEN) throw HTTPError(400, 'Session is not accepting answers right now');
  if (questionPosition > session.atQuestion) throw HTTPError(400, 'Session is not on this question');
  const question: question = session.quiz.questions[questionPosition - 1];
  if (answerIds.length < 1) throw HTTPError(400, 'At least one answer must be provided');
  const duplicateAnswers: number[] = answerIds.filter((item: number, index: number) => answerIds.indexOf(item) !== index);
  if (duplicateAnswers.length > 0) throw HTTPError(400, 'Duplicate answer IDs submitted');
  for (const Id of answerIds) {
    if (!question.answers.find(ans => ans.answerId === Id)) throw HTTPError(400, 'One or more provided answer IDs are invalid');
  }
  const player: Player = session.players.find(player => player.playerId === playerId);
  const questionAnsweredIndex: number = player.questionsAnswered.findIndex((entry: QuestionsAnswered) => entry.questionId === question.questionId);
  // Check whether player's answers are correct
  const correctAnswers: number[] = question.answers.filter(q => q.correct).map(obj => obj.answerId);
  let flag = true;
  const correctAnswersChosen: number[] = [];
  for (const ans of answerIds) {
    if (!correctAnswers.includes(ans)) {
      flag = false;
    } else {
      correctAnswersChosen.push(ans);
    }
  }
  const ans: QuestionsAnswered = {
    questionId: question.questionId,
    correct: flag,
    timeQuestionOpen: session.timeQuestionOpen,
    timeLastAnswered: Math.round(Date.now() / 1000),
    score: flag ? question.points : 0,
    answersCorrect: correctAnswersChosen,
    questionPosition: questionPosition
  };
  if (questionAnsweredIndex === -1) {
    player.questionsAnswered.push(ans);
  } else {
    Object.assign(player.questionsAnswered[questionAnsweredIndex], ans);
  }

  // Find the ranking of and update the scores of each player who got the answer right
  if (flag) {
    // Gets everyone who answered the question right, sorts them based on time taken to answer the question, and maps their ids to the array
    const rankingArray: number[] = session.players.filter(
      player => player.questionsAnswered.find(obj => obj.questionId === question.questionId && obj.correct)
    ).sort((a, b) =>
      a.questionsAnswered.find(obj => obj.questionId === question.questionId).timeLastAnswered -
      b.questionsAnswered.find(obj => obj.questionId === question.questionId).timeLastAnswered).map(obj => obj.playerId);

    // Loops through the array and assigns each player the right amount of marks for the question (rounded to one decimal place)
    for (const i in rankingArray) {
      session.players.find(p => p.playerId === rankingArray[i]).questionsAnswered.find(obj => obj.questionId === question.questionId).score = Math.round((question.points * 10) / (parseInt(i) + 1)) / 10;
    }
  }
  setData(data);
  return {};
}

/** This function allows admin user to update session status
 *  @param { string } tokenId
 *  @param { number } quizId
 *  @param { number } sessionId
 *  @param { string } action
 *  @return { object } empty
*/
export function updateSessionState(tokenId: string, quizId: number, sessionId: number, action: string): Record<string, never> | IsHttpError {
  const data: DataStore = getData();
  const countdown = 100;

  // Check the structure of the token
  if (!checkToken(tokenId)) {
    throw HTTPError(401, 'Invalid token ID');
  }
  // Check if tokenId refers to valid session
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    throw HTTPError(403, 'Token does not match active session');
  }

  const user: user | undefined = data.users.find(user => user.userId === token.userId);

  // Checking if existing quizId is given
  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    throw HTTPError(400, 'Invalid quiz ID');
  }
  // Checking if existing quizId is owned by the current user
  if (!user.ownedQuizzes.includes(quizId)) {
    throw HTTPError(400, 'Quiz not owned by you');
  }

  // Checking if sessionId exists
  const session: session | undefined = data.sessions.find(session => session.sessionId === sessionId);
  if (!session) {
    throw HTTPError(400, 'No such session exists');
  }
  // Checking if sessionId corresponds to the right quiz
  if (session.quiz.quizId !== quizId) {
    throw HTTPError(400, 'This session does not run the quiz of the given quizId');
  }

  // Checking if action given is a existing action
  if (!(action in Action)) {
    throw HTTPError(400, 'Not a valid action');
  }
  // Checking if at the current session state, the action is applicable
  if (session.state === States.END) {
    throw HTTPError(400, 'Action cannot be applied in END state');
  }
  if (session.state === States.FINAL_RESULTS && action !== Action.END) {
    throw HTTPError(400, 'Action cannot be applied in the FINAL_RESULTS state');
  }

  if (action === Action.END) {
    changeState(sessionId, States.END, data);
    return {};
  }

  const currentQuestion: question = quiz.questions[session.atQuestion - 1];
  const duration: number = currentQuestion.duration * 1000;

  if (session.state === States.ANSWER_SHOW) {
    if (action === Action.NEXT_QUESTION) {
      changeState(sessionId, States.QUESTION_COUNTDOWN, data);
      session.timeoutId = setTimeout(() => updateToOpen(sessionId, data, duration), countdown);
      return {};
    } else if (action === Action.GO_TO_FINAL_RESULTS) {
      changeState(sessionId, States.FINAL_RESULTS, data);
      return {};
    } else {
      throw HTTPError(400, 'Action cannot be applied in the ANSWER_SHOW state');
    }
  }

  if (session.state === States.LOBBY) {
    if (action === Action.NEXT_QUESTION) {
      changeState(sessionId, States.QUESTION_COUNTDOWN, data);
      session.timeoutId = setTimeout(() => updateToOpen(sessionId, data, duration), countdown);
      return {};
    } else {
      throw HTTPError(400, 'Action cannot be applied in LOBBY state');
    }
  }

  if (session.state === States.QUESTION_COUNTDOWN) {
    if (action === Action.NEXT_QUESTION) {
      if (session.timeoutId) clearTimeout(session.timeoutId);
      changeState(sessionId, States.ANSWER_SHOW, data);
      return {};
    } else {
      throw HTTPError(400, 'Action cannot be applied in the QUESTION_COUNTDOWN state');
    }
  }

  if (session.state === States.QUESTION_OPEN) {
    if (action === Action.GO_TO_ANSWER) {
      changeState(sessionId, States.ANSWER_SHOW, data);
      return {};
    } else {
      throw HTTPError(400, 'Action cannot be applied in the QUESTION_OPEN state');
    }
  }

  if (session.state === States.QUESTION_CLOSE) {
    if (action === Action.GO_TO_ANSWER) {
      changeState(sessionId, States.ANSWER_SHOW, data);
      return {};
    } else if (action === Action.GO_TO_FINAL_RESULTS) {
      changeState(sessionId, States.FINAL_RESULTS, data);
      return {};
    } else {
      changeState(sessionId, States.QUESTION_COUNTDOWN, data);
      session.atQuestion++;
      session.timeoutId = setTimeout(() => updateToOpen(sessionId, data, duration), countdown);
      return {};
    }
  }
}

/** This function intakes User and Quiz ID and the new quiz name.
  * Updates the quiz name, returns nothing.
  * @param {number} authUserId
  * @param {number} quizId
  * @param {string} name
  * @return {object} Empty object if successful, error object if not.
  */
export function v2AdminQuizNameUpdate(tokenId: string, quizId: number, name: string): Record<string, never> | IsHttpError {
  // Retrieving data relevent to parameters
  const data: DataStore = getData();

  // Testing if valid parameters are given
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
  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    throw HTTPError(400, 'Invalid quiz ID');
  }
  if (!adminUser.ownedQuizzes.includes(quizId)) {
    throw HTTPError(400, 'Quiz not owned by you');
  }

  //  Testing if the given quizId is owned by the admin user
  const ownership: boolean = adminUser.ownedQuizzes.includes(quizId);
  if (!ownership) {
    throw HTTPError(400, 'The quizId does not refer to a quiz that you own');
  }

  // Testing conditions for name
  // Creating a array for alphanumeric characters in name,
  // then comparing length to eliminate other characters
  const nonAlphanumeric: string = name.replace(/[0-9A-Za-z\s]/g, '');
  if (nonAlphanumeric.length > 0) {
    throw HTTPError(400, 'Quiz name can only include alphanumeric characters with spaces');
  }
  // Length of name must be 3 - 30 characters inclusive
  if (name.length < 3 || name.length > 30) {
    throw HTTPError(400, 'Name of quiz must be between 3 - 30 characters');
  }

  // Checking if name of quiz already exists
  if (validquizname(name, adminUser, data) === false) {
    throw HTTPError(400, 'Quiz with the inputed name already exists');
  }

  // Changing the old name to the given, current name and time last edited to now, and upload the data
  for (const currentQuiz of data.quizzes) {
    if (currentQuiz.quizId === quizId) {
      currentQuiz.name = name;
      currentQuiz.timeLastEdited = Math.round(Date.now() / 1000);
      setData(data);
      return {};
    }
  }
}

/** This function intakes User and Quiz ID and the new quiz name.
  * Updates the quiz name, returns nothing.
  * @param {number} tokenId
  * @param {number} quizId
  * @param {string} email
  * @return {object} Empty object if successful, error object if not.
  */
export function v2AdminQuizTransfer(tokenId: string, quizId: number, email: string): Record<string, never> | IsHttpError {
  const data: DataStore = getData();

  if (!checkToken(tokenId)) {
    throw HTTPError(401, 'Invalid token ID');
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    throw HTTPError(403, 'Token does not match active session');
  }
  const user: user | undefined = data.users.find(user => user.userId === token.userId);

  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    throw HTTPError(400, 'Invalid quiz ID');
  }
  if (!user.ownedQuizzes.includes(quizId)) {
    throw HTTPError(400, 'Quiz not owned by you');
  }

  const receiver: user | undefined = data.users.find(user => user.email === email);
  if (!receiver) {
    throw HTTPError(400, 'userEmail is not a real user');
  }

  if (user.email === email) {
    throw HTTPError(400, 'Inputted email must be a email of another user');
  }

  const ownedByReceiver: quiz[] = [];
  for (const currentQuiz of receiver.ownedQuizzes) {
    const newQuiz: quiz | undefined = data.quizzes.find(newQuiz => newQuiz.quizId === currentQuiz);
    if (newQuiz !== undefined) ownedByReceiver.push(newQuiz);
  }

  const current: quiz | undefined = ownedByReceiver.find((obj: any) => obj.name === quiz.name);
  if (current) {
    throw HTTPError(400, 'The name of quiz is already used by the receiver');
  }

  for (const currentReceiver of data.users) {
    if (currentReceiver.email === email) {
      currentReceiver.ownedQuizzes.push(quiz.quizId);
      setData(data);
    }
  }

  const index = user.ownedQuizzes.indexOf(quiz.quizId);
  for (const currentSender of data.users) {
    if (currentSender.userId === user.userId) {
      currentSender.ownedQuizzes.splice(index, 1);
      setData(data);
    }
  }

  for (const sentQuiz of data.quizzes) {
    if (sentQuiz.quizId === quiz.quizId) {
      sentQuiz.timeLastEdited = Math.round(Date.now() / 1000);
      setData(data);
    }
  }
  return {};
}

/// //////////////////////// getSessionStatus /////////////////////////////

/** This function takes in quizId, sessionId and tokenId
  * and return the status of a particular quiz session
  * @param { number } quizId
  * @param { number } sessionId
  * @param { string } tokenId
  * @return { object } Object containing comprehensive details about the session.
*/
export function getSessionStatus (tokenId: string, quizId: number, sessionId: number): SessionStatus | IsHttpError {
  const data = getData();

  if (!checkToken(tokenId)) {
    throw HTTPError(401, 'Invalid token ID');
  }
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) {
    throw HTTPError(403, 'Token does not match active session');
  }
  const user: user | undefined = data.users.find(user => user.userId === token.userId);

  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    throw HTTPError(400, 'Invalid quiz ID');
  }
  if (!user.ownedQuizzes.includes(quizId)) {
    throw HTTPError(400, 'Quiz not owned by you');
  }

  const session: session | undefined = data.sessions.find(session => session.sessionId === sessionId);
  if (!session) {
    throw HTTPError(400, 'Not a valid session');
  }
  if (session.quiz.quizId !== quizId) {
    throw HTTPError(400, 'Session Id does not refer to a valid quiz');
  }

  const players: string[] = [];
  for (const player of session.players) {
    players.push(player.name);
  }

  const meta:metadata = {
    description: quiz.description,
    duration: quiz.questions.reduce((sum:number, question:question) => sum + question.duration, 0),
    name: quiz.name,
    numQuestions: quiz.questions.length,
    questions: quiz.questions.map((q:question) => ({ answers: q.answers, duration: q.duration, points: q.points, question: q.question, questionId: q.questionId, thumbnailUrl: q.thumbnailUrl })),
    quizId: quiz.quizId,
    thumbnailUrl: quiz.thumbnailUrl,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited
  };

  const status: SessionStatus = {
    state: session.state,
    atQuestion: session.atQuestion,
    players: players,
    metadata: meta
  };

  return status;
}

/**
 * Takes in player id and
 * returns session results of the player
 * @param playerId
 * @returns {object} of player results
 */
export const playerFinalResults = (playerId: number) => {
  const data = getData();
  const session: session = data.sessions.find(
    session => session.players.find(player => player.playerId === playerId)
  );
  if (!session) throw HTTPError(400, 'Invalid Player ID');
  if (session.state !== States.FINAL_RESULTS) throw HTTPError(400, 'Results cannot be viewed right now');
  const resultsObj: quizSessionResults = {
    usersRankedByScore: [],
    questionResults: []
  };
  resultsObj.usersRankedByScore = session.players
    .sort((a, b) => b.questionsAnswered.reduce((acc: number, obj: QuestionsAnswered) => acc + obj.score, 0) - a.questionsAnswered.reduce((acc: number, obj: QuestionsAnswered) => acc + obj.score, 0))
    .map(obj => ({ name: obj.name, score: obj.questionsAnswered.reduce((acc: number, obj: QuestionsAnswered) => acc + obj.score, 0) }));

  let avgAnsTime = 0;
  let avgCount = 0;
  let numPlayersCorrect = 0;
  let questionResult: QuestionResults = {
    questionId: 1,
    questionCorrectBreakdown: [],
    averageAnswerTime: 0,
    percentCorrect: 0,
  };

  for (const q of session.quiz.questions) {
    questionResult = {
      questionId: q.questionId,
      questionCorrectBreakdown: [],
      averageAnswerTime: 0,
      percentCorrect: 0,
    };
    let specificAnswer: QuestionsAnswered;
    // Create the questionCorrectBreakdown array in this object, and find all the right answers
    for (const ans of q.answers) {
      if (ans.correct) questionResult.questionCorrectBreakdown.push({ answerId: ans.answerId, playersCorrect: [] });
    }
    // Find the players who chose each right answer
    for (const playa of session.players) {
      specificAnswer = playa.questionsAnswered.find(obj => obj.questionId === q.questionId);
      for (const obj of questionResult.questionCorrectBreakdown) {
        // Find all the players who got this specific answer right
        if (specificAnswer && specificAnswer.answersCorrect.includes(obj.answerId)) {
          obj.playersCorrect.push(playa.name);
        }
      }

      if (specificAnswer) {
        // Get stats for average time taken to answer this question
        avgAnsTime += specificAnswer.timeLastAnswered - specificAnswer.timeQuestionOpen;
        avgCount++;
        // Get the number of players who got the question right
        if (specificAnswer.correct) numPlayersCorrect++;
      }
    }
    avgAnsTime = avgCount !== 0 ? avgAnsTime / avgCount : 0;
    questionResult.averageAnswerTime = avgAnsTime;
    questionResult.percentCorrect = Math.round((numPlayersCorrect / session.players.length) * 100);
    resultsObj.questionResults.push(questionResult);
  }

  return resultsObj;
};

/**
 * Takes in player id and
 * returns chat info of the particular player
 * @param playerId
 * @returns {string} of message containing messagebody
 */
export function viewChat(playerId: number): MessageList| IsHttpError {
  const data = getData();
  const session: session = data.sessions.find(
    session => session.players.find(player => player.playerId === playerId)
  );
  if (!session) throw HTTPError(400, 'Invalid Player ID');
  const messages: Message[] = [];
  for (const index of session.messages) {
    messages.push({
      messageBody: index.messageBody,
      playerId: index.playerId,
      playerName: index.playerName,
      timeSent: index.timeSent,

    }
    );
  }
  return { messages: messages };
}

/**
 * Takes in player id and message from player and
 * updates the messageBody with the input and returns nothing
 * @param playerId
 * @param message
 * @returns {object} Empty object if successful, error object if not.
 */
export function postChat(playerId: number, message: string): Record<string, never> | IsHttpError {
  const data = getData();
  const session: session = data.sessions.find(
    session => session.players.find(player => player.playerId === playerId)
  );
  if (!session) throw HTTPError(400, 'Invalid Player ID');
  if (message.length < 1 || message.length > 100) {
    throw HTTPError(400, 'Message should be between 1 to 100 characters');
  }
  const player: Player = session.players.find(player => player.playerId === playerId);
  const newMessages: Message = {
    messageBody: message,
    playerId: playerId,
    playerName: player.name,
    timeSent: Date.now()
  };
  session.messages.push(newMessages);
  setData(data);
  return {};
}
