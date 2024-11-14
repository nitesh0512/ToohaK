import { getData, setData } from './dataStore';
import { validuserId, validquizname, chooseRandomColour } from './helper';
import {
  DataStore, ErrorObject, user, token, quiz, quizListItem, QuizList,
  QuizId, QuizDetails, answer, QuestionId, question, Colour, DuplicateQuestion, questionBody, trashlist, trashListItem
} from './interfaces';
import { validate as checkToken } from 'uuid';
import config from './config.json';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;

/// ///////////////////////////// CONSTANTS /////////////////////////////////////
const availableColours: Array<Colour> = ['red', 'green', 'blue', 'yellow', 'purple', 'brown', 'orange'];

/// /////////////////////////////////////////////////////////////////////////////

let data: DataStore = getData();
/** This function intakes token ID and
  * returns all of the existing quizzes (in an array)
  * @param {number} tokenId - takes in id as a string
  * @return {object} Object containing info about all the quizzes the user owns, or an error object.
  */
export function adminQuizList(tokenId: string): QuizList | ErrorObject {
  // gathering data
  data = getData();
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };

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
  * @returns {object} Object containing the new quiz's quizId, or an error object.
*/

export function adminQuizCreate(tokenId: string, name: string, description: string): QuizId | ErrorObject {
  data = getData();

  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) return { error: 'Invalid user ID' };

  // Check if authUserId is valid
  if (!validuserId(token.userId, data)) {
    return {
      error: 'Invalid authUserId'
    };
  }

  const regex = /[a-zA-Z0-9\s]/g;
  if (name.length !== name.match(regex).length) {
    return {
      error: 'Quiz name must be alphanumerical (spaces accepted)'
    };
  }

  if (name.length < 3 || name.length > 30) {
    return {
      error: 'Quiz name must be between 3 and 30 characters (inclusive)'
    };
  }

  // Checking if quiz name already exists
  if (validquizname(name, user, data) === false) {
    return {
      error: 'Quiz name already exists!'
    };
  }

  if (description.length > 100) {
    return {
      error: 'Description must be less than 100 characters (inclusive)'
    };
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
}

/** This function intakes User and Quiz ID
  * and returns nothing
  * Permanently removes the selected quiz
  * @param {number} authUserId
  * @param {number} quizId
  * @returns {object} Empty object if delete is successful, otherwise error object.
  */
export function adminQuizRemove(tokenId: string, quizId: number): Record<string, never> | ErrorObject {
  data = getData();
  // Check if authUserId is valid
  // if (!validuserId(authUserId, data)) {
  //   return {
  //     error: 'Invalid authUserId'
  //   };
  // }
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) return { error: 'Invalid user ID' };
  // find index of user
  // const user:user[] = data.users;
  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);

  let quizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  if (quizIndex === -1) {
    return {
      error: 'This user either does not have this quiz or the user' +
        ' does not own this quiz'
    };
  }

  // must check if property exists
  // if (!user.ownedQuizzes) return { error: 'This user either does not have' +
  //   'this quiz or the user does not own this quiz'}
  // const ownedQuiz: number | undefined = user.ownedQuizzes
  //   .find(ownedQuiz => ownedQuiz === quizId);
  // if (!ownedQuiz) return { error: 'This user either does not have' +
  //     'this quiz or the user does not own this quiz' }

  // user no longer owns quiz
  // data.users[userIndex].ownedQuizzes.splice(quizIndex, 1);
  quizIndex = data.quizzes.findIndex(obj => obj.quizId === quizId);
  if (quizIndex === -1) return { error: 'Invalid Quiz Id' };
  data.trash.push(data.quizzes[quizIndex]);
  // quiz is actually removed from quiz array
  data.quizzes.splice(quizIndex, 1);
  setData(data);
  return {};
}

/** This function returns all of the relevant
  * information about the current quiz.
  * @param {number} tokenId - takes in id as a string
  * @param {number} quizId
  * @returns {object} Object containing comprehensive information about the quiz, or an error object.
  */
export function adminQuizInfo(quizId: number, tokenId: string): QuizDetails | ErrorObject {
  data = getData();
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) return { error: 'Invalid user ID' };
  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);
  const quiz: quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  const ownquizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  const quizIndex: number = data.quizzes.findIndex(obj => obj.quizId === quizId);
  if (quizIndex === -1) {
    return {
      error: 'This user either does not have this quiz or the user' +
        ' does not own this quiz'
    };
  }
  if (ownquizIndex === -1) {
    return {
      error: 'This user either does not have this quiz or the user' +
        ' does not own this quiz'
    };
  }
  let sum = 0;
  const qArray: {
    questionId: number,
    question: string
    duration: number,
    points: number,
    answers: answer[]
  }[] = [];
  for (const ques of data.quizzes[quizIndex].questions) {
    sum = sum + ques.duration;
    qArray.push({
      questionId: ques.questionId,
      question: ques.question,
      duration: ques.duration,
      points: ques.points,
      answers: ques.answers
    });
  }
  let numQues = 0;

  numQues = data.quizzes[quizIndex].questions.length;
  const res: QuizDetails = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: numQues,
    questions: qArray,
    duration: sum
  };
  return res;
}

/** This function intakes User and Quiz ID and the new quiz name.
  * Updates the quiz name, returns nothing.
  * @param {number} authUserId
  * @param {number} quizId
  * @param {string} name
  * @return {object} Empty object if successful, error object if not.
  */
export function adminQuizNameUpdate(tokenId: string, quizId: number, name: string): Record<string, never> | ErrorObject {
  // Retrieving data relevent to parameters
  data = getData();

  // Testing if valid parameters are given
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
  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    return { error: 'Invalid quiz ID' };
  }
  if (!adminUser.ownedQuizzes.includes(quizId)) {
    return { error: 'Quiz not owned by you' };
  }

  //  Testing if the given quizId is owned by the admin user
  const ownership: boolean = adminUser.ownedQuizzes.includes(quizId);
  if (!ownership) {
    return { error: 'The quizId does not refer to a quiz that you own' };
  }

  // Testing conditions for name
  // Creating a array for alphanumeric characters in name,
  // then comparing length to eliminate other characters
  const nonAlphanumeric: string = name.replace(/[0-9A-Za-z\s]/g, '');
  if (nonAlphanumeric.length > 0) {
    return { error: 'Quiz name can only include alphanumeric characters with spaces' };
  }
  // Length of name must be 3 - 30 characters inclusive
  if (name.length < 3 || name.length > 30) {
    return { error: 'Name of quiz must be between 3 - 30 characters' };
  }

  // Checking if name of quiz already exists
  if (validquizname(name, adminUser, data) === false) {
    return { error: 'Quiz with the inputed name already exists' };
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

/** This function intakes User and Quiz ID and the new quiz description.
  * Updates the quiz description, returns nothing.
  * @param {string} tokenId
  * @param {number} quizId
  * @param {string} description
  * @return {object} Empty object if successful, error object if not.
  */
export function adminQuizDescriptionUpdate(tokenId: string, quizId: number, description: string): Record<string, never> | ErrorObject {
  data = getData();
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) return { error: 'Invalid user ID' };
  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) return { error: 'Invalid quiz ID' };
  if (!user.ownedQuizzes.includes(quizId)) return { error: 'Quiz not owned by you' };
  if (description.length > 100) return { error: 'Description is of invalid size' };
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

/// /////////////////////// CREATEQUESTION /////////////////////////////

/** This function creates a question, placing the question at the end of the
  * array
  * @param { number } quizId
  * @param { string } tokenId
  * @param { string } question
  * @return { object } Error || questionId
*/
export function createQuestion(quizId: number, tokenId: string, question: string,
  duration: number, points: number, answers: Array<answer>): QuestionId | ErrorObject {
  // FIXME: need to fix the typing of answers
  data = getData();

  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    return {
      error: 'Quiz does not exist'
    };
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    return {
      error: 'Invalid user ID'
    };
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: any | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    return {
      error: 'User does not own this quiz'
    };
  }

  if (question.length < 5 || question.length > 50) {
    return {
      error: 'Question must be between 5 and 50 characters'
    };
  }

  if (answers.length < 2 || answers.length > 6) {
    return {
      error: 'There must be between 2 and 6 answers'
    };
  }

  if (duration <= 0) {
    return {
      error: 'The duration must be a positive (non-negative) number'
    };
  }

  // assuming duration is always in seconds
  let totalDuration = 0;
  for (const qus of data.quizzes[quizIndex].questions) {
    totalDuration += qus.duration;
  }
  totalDuration += duration;

  if (totalDuration > 180) {
    return {
      error: 'Total duration of questions must not be greater than 3 minutes'
    };
  }

  if (points < 1 || points > 10) {
    return {
      error: 'Points must be given between 1 and 10'
    };
  }

  for (const obj of answers) {
    if (obj.answer.length < 1 || obj.answer.length > 30) {
      return {
        error: 'Answers must be between 1 and 30 characters'
      };
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
        return {
          error: 'Answers must not be duplicates (within the same question)'
        };
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
    return {
      error: 'There must be at least 1 correct answer'
    };
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
    thumbnailUrl: SERVER_URL + '/thumbnails/default.png'
  };

  // assumes that the quiz is pushed to the end of the array
  data.quizzes[quizIndex].questions.push(qusObj);
  data.nextQuestionId++;
  setData(data);
  return {
    questionId: qusObj.questionId,
  };
}

/** This function duplicates a question by placing the new duplicate
  * after the index of source.
  * @param { number } quizId
  * @param { number } questionId
  * @param { string } tokenId
  * @return { object } Contains error || newQuestionId
*/
export function duplicateQuestion(quizId: number, questionId: number,
  tokenId: string): DuplicateQuestion | ErrorObject {
  data = getData();

  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    return {
      error: 'Quiz does not exist'
    };
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    return {
      error: 'Invalid user ID'
    };
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: number | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    return {
      error: 'User does not own this quiz'
    };
  }

  // checks whether questionId exists
  const questionIndex: number = data.quizzes[quizIndex].questions
    .findIndex(question => question.questionId === questionId);
  if (questionIndex === -1) {
    return {
      error: 'QuestionId does not exist in this quiz'
    };
  }

  // these are just dummy values so type script does not go crazy
  const duplicateQuestion: question = {
    questionId: 1,
    question: 'a',
    duration: 1,
    points: 1,
    answers: [],
    correctAnswerCount: 1,
    thumbnailUrl: 'real'
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

/** This function moves a question at a designated locus in the questions array
 *  @param { number } quizId
 *  @param { number } questionId
 *  @param { string } tokenId
 *  @param { number } newPosition
 *  @return { object } error | empty
*/
export function moveQuestion(quizId: number, questionId: number,
  tokenId: string, newPosition: number): ErrorObject | Record<string, never> {
  data = getData();

  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens
    .find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };

  const quizIndex: number | undefined = data.quizzes
    .findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    return {
      error: 'Quiz does not exist'
    };
  }

  const userIndex: number | undefined = data.users
    .findIndex(user => user.userId === token.userId);
  if (userIndex === -1) {
    return {
      error: 'Invalid user ID'
    };
  }

  // checks for quizId in ownedQuizzes
  const ownedQuizIndex: number | undefined = data.users[userIndex].ownedQuizzes
    .findIndex(ownedQuiz => ownedQuiz === quizId);
  if (ownedQuizIndex === -1) {
    return {
      error: 'User does not own this quiz'
    };
  }

  // checks whether questionId exists
  const questionIndex: number = data.quizzes[quizIndex].questions
    .findIndex(question => question.questionId === questionId);
  if (questionIndex === -1) {
    return {
      error: 'QuestionId does not exist in this quiz'
    };
  }

  const numberOfQuestions = data.quizzes[quizIndex].questions.length;
  if (newPosition < 0 || newPosition > numberOfQuestions - 1) {
    return {
      error: 'newPosition must be between 0 and must not extend beyond ' +
        '(n - 1) for (n) number of questions'
    };
  }

  if (newPosition === questionIndex) {
    return {
      error: 'newPosition must not be the same position of the current question'
    };
  }

  // these are just dummy values so type script does not go crazy
  const duplicateQuestion: question = {
    questionId: 1,
    question: 'a',
    duration: 1,
    points: 1,
    answers: [],
    correctAnswerCount: 1,
    thumbnailUrl: 'real'
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

/** This function intakes User and Quiz ID and the new quiz name.
  * Updates the quiz name, returns nothing.
  * @param {number} tokenId
  * @param {number} quizId
  * @param {string} email
  * @return {object} Empty object if successful, error object if not.
  */
export function adminQuizTransfer(tokenId: string, quizId: number, email: string): Record<string, never> | ErrorObject {
  data = getData();

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
  const quiz: quiz | undefined = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    return { error: 'Invalid quiz ID' };
  }
  if (!user.ownedQuizzes.includes(quizId)) {
    return { error: 'Quiz not owned by you' };
  }

  const receiver: user | undefined = data.users.find(user => user.email === email);
  if (!receiver) {
    return { error: 'userEmail is not a real user' };
  }

  if (user.email === email) {
    return { error: 'Inputted email must be a email of another user' };
  }

  const ownedByReceiver: quiz[] = [];
  for (const currentQuiz of receiver.ownedQuizzes) {
    const newQuiz: quiz | undefined = data.quizzes.find(newQuiz => newQuiz.quizId === currentQuiz);
    if (newQuiz !== undefined) ownedByReceiver.push(newQuiz);
  }

  const current: quiz | undefined = ownedByReceiver.find((obj: any) => obj.name === quiz.name);
  if (current) {
    return { error: 'The name of quiz is already used by the receiver' };
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
/**
 * Given a valid token id, quiz id, question id and questionBody,
 * edits the question corresponding to the id in the quiz corresponding to that id.
 * @param tokenId
 * @param quizId
 * @param questionId
 * @param questionBody
 * @returns Empty object if successful, error object if not
 */
export function updateQuestion(tokenId: string, quizId: number,
  questionId: number, questionBody: questionBody): Record<string, never> | ErrorObject {
  data = getData();
  // check the structure of the token
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  // Check if tokenId refers to valid session
  const token: token = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  // Check if quizId refers to valid quiz
  const quiz: quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) return { error: 'Invalid Quiz Id' };
  // check if user owns quiz
  const user: user = data.users.find(user => user.userId === token.userId);
  if (!user.ownedQuizzes.find(quizIndex => quizIndex === quizId)) return { error: 'User does not own this quiz' };
  // check if questionId points to a valid question in the quiz
  const question: question = quiz.questions.find(question => question.questionId === questionId);
  if (!question) return { error: 'Invalid Question Id' };
  // check if question string has valid length
  if (!(questionBody.question.length >= 5 && questionBody.question.length <= 50)) return { error: 'Question string must be between 5 and 50 characters long' };
  // check if question has right amount of answers
  if (!(questionBody.answers.length >= 2 && questionBody.answers.length <= 6)) return { error: 'You must have between 2 and 6 answers' };
  // check if duration is valid
  if (questionBody.duration <= 0) return { error: 'Invalid question duration; it must be more than 0' };
  // check the quiz's total time
  let sumTime = 0;
  for (const obj of quiz.questions) {
    if (obj.questionId !== questionId) {
      sumTime += obj.duration;
    } else {
      sumTime += questionBody.duration;
    }
  }
  if (sumTime > 180) {
    return { error: "The quiz's total duration is more than 3 minutes" };
  }
  // check the question's points are valid
  if (!(questionBody.points >= 1 && questionBody.points <= 10)) return { error: 'A question must award between 1 to 10 points for a correct answer' };
  for (const obj of questionBody.answers) {
    // check that each answer's length is valid
    if (!(obj.answer.length >= 1 && obj.answer.length <= 30)) return { error: 'Every answer must be between 1 and 30 characters long.' };
  }
  // check for duplicate answers
  const answerStrings: string[] = questionBody.answers.map(answer => answer.answer);
  const duplicateFlag = answerStrings.filter((item, index) => answerStrings.indexOf(item) !== index);
  if (duplicateFlag.length > 0) {
    return { error: 'All answers must be unique' };
  }
  // check whether quiz has a correct answer
  if (!questionBody.answers.find(ans => ans.correct === true)) return { error: 'Question must have at least one correct answer.' };
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
  // update timeLastEdited
  quiz.timeLastEdited = Math.round(Date.now() / 1000);
  // update answer IDs
  setData(data);
  return {};
}
/**
 * Given a valid token id and an array of quiz IDs, removes the quizzes that correspond to those IDs
 * from the trash
 * @param tokenId
 * @param quizIds
 * @returns Empty object if successful, error object if not successful
 */
export function quizTrashEmpty(tokenId: string, quizIds: number[]): Record<string, never> | ErrorObject {
  data = getData();
  // check the structure of the token
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  // Check if tokenId refers to valid session
  const token: token = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  let currentQuiz: quiz;
  let currentQuizInTrashIndex: number;
  // loops through each quizId and runs checks on them
  for (const ID of quizIds) {
    currentQuiz = data.quizzes.find((quiz: quiz) => quiz.quizId === ID);
    currentQuizInTrashIndex = data.trash.findIndex((quiz: quiz) => quiz.quizId === ID);
    if (currentQuiz === undefined && currentQuizInTrashIndex === -1) return { error: 'One or more quizIds are invalid: ' + ID.toString() };
    if (currentQuiz !== undefined) {
      if (currentQuiz.userId !== token.userId) return { error: 'One or more quizzes do not belong to the user' };
    }
    if (currentQuizInTrashIndex !== -1) {
      if (data.trash[currentQuizInTrashIndex].userId !== token.userId) return { error: 'One or more quizzes do not belong to the user' };
    } else {
      return { error: 'One or more quizzes are currently not in the trash.' };
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
/** This function intakes token ID and
  * returns all of the existing quizzes in trash(in an array)
  * @param {number} tokenId - takes in id as a string
  * @return {object} Object containing info about all the quizzes the user has in trash, or an error object.
  */
export function trashList(tokenId: string): trashlist | ErrorObject {
  data = getData();
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  const user: user | undefined = data.users.find(user => user.userId === token.userId);

  const quiz: quiz[] | undefined = data.trash.filter(obj => user.ownedQuizzes.includes(obj.quizId));
  const quizzes: trashListItem[] = [];
  for (const element of quiz) {
    quizzes.push({
      quizId: element.quizId,
      name: element.name,
    });
  }
  setData(data);
  return { quizzes: quizzes };
}
export function deleteQuizQuestion(quizId: number, questionId: number, tokenId: string): Record<string, never> | ErrorObject {
  data = getData();
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) return { error: 'Invalid user ID' };
  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);
  const quizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  const quizIndex1: number = data.quizzes.findIndex(obj => obj.quizId === quizId);
  if (quizIndex === -1) {
    return {
      error: 'This user either does not have this quiz or the user' +
        ' does not own this quiz'
    };
  }
  if (quizIndex1 === -1) {
    return {
      error: 'This user either does not have this quiz or the user' +
        ' does not own this quiz'
    };
  }

  const questionIndex: number = data.quizzes[quizIndex1].questions
    .findIndex(question => question.questionId === questionId);

  if (questionIndex === -1) {
    return {
      error: 'This user either does not have this question or the user' +
        ' does not own this question'
    };
  }

  data.quizzes[quizIndex1].questions.splice(questionIndex, 1);
  setData(data);
  return {};
}
export function restoreQuiz(quizId: number, tokenId: string): Record<string, never> | ErrorObject {
  data = getData();
  if (!checkToken(tokenId)) return { error: 'Invalid token ID' };
  const token: token | undefined = data.tokens.find(token => token.tokenId === tokenId);
  if (!token) return { error: 'Token does not match active session' };
  const user: user | undefined = data.users.find(user => user.userId === token.userId);
  if (!user) return { error: 'Invalid user ID' };

  const userIndex: number = data.users.findIndex(user => user.userId === token.userId);

  const quiz: quiz = data.trash.find(quiz => quiz.quizId === quizId);
  let quizIndex: number = data.users[userIndex].ownedQuizzes.findIndex(obj => obj === quizId);
  if (!quiz) {
    return { error: 'Invalid quiz ID' };
  }
  if (quizIndex === -1) {
    return {
      error: 'This user either does not have this quiz or the user' +
        ' does not own this quiz'
    };
  }
  const trash: trashListItem = data.trash.find(trash => trash.quizId === quizId);
  if (trash === undefined) {
    return {
      error: 'QuizId is not in trash'
    };
  }

  quizIndex = data.trash.findIndex(obj => obj.quizId === quizId);
  data.quizzes.push(data.trash[quizIndex]);
  data.trash.splice(quizIndex, 1);
  setData(data);
  return {};
}
