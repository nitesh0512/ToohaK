
import { DataStore, questionBody, Colour, user, States, session, Player } from './interfaces';

import { setData } from './dataStore';
import isURL from 'validator/lib/isURL.js';
import request from 'sync-request';
import config from './config.json';
import fs from 'fs';
const port = config.port;
const url = config.url;
export const SERVER_URL = `${url}:${port}`;

import crypto from 'crypto';

export function validuserId(authUserID: number, data: DataStore): boolean {
  for (const user of data.users) {
    if (user.userId === authUserID) {
      return true;
    }
  }
  return false;
}

export function validquizname(name: string, user: user, data: DataStore): boolean {
  for (const quizId of user.ownedQuizzes) {
    for (const quiz of data.quizzes) {
      if (quizId === quiz.quizId && name === quiz.name) {
        return false;
      }
    }
  }
  return true;
}

export const generateNewUserID = (searchArray: user[]) => {
  const seed: number = Number.MAX_VALUE;
  let ID: number = seed * Math.floor(Math.random()) * Math.floor(Math.random());
  while (searchArray.find(obj => obj.userId === ID)) {
    ID = seed * Math.floor(Math.random()) * Math.floor(Math.random());
  }

  return ID;
};

export const getHashOf = (str: string): string => crypto.createHash('sha256').update(str).digest('hex');

// Given a url, if the url isn't valid or if the url does not lead to a jpg or png file, returns undefined.
// Otherwise, downloads the image into the server and returns the url of the now downloaded image on the server.
export function imgData(url: string, newName: string): undefined | string {
  if (url === '' || newName === '' || !isURL(url)) return undefined;
  let res: any;
  try {
    res = request('GET', url);
  } catch (error) {
    return undefined;
  }

  if (res.statusCode !== 200) return undefined;
  if (res.headers['content-type'] !== 'image/png' && 'image/jpeg') return undefined;
  let filePath = res.headers['content-type'] === 'image/png' ? 'thumbnails/' + newName + '.png' : 'thumbnails/' + newName + '.jpg';
  const body: any = res.getBody();
  fs.writeFileSync(filePath, body);
  filePath = SERVER_URL + '/' + 'thumbnails/' + newName + '.png';
  return filePath;
}

export function csvLink(name: string, body: Array<any>): undefined | string {
  if (name === '' || !isURL(url)) return undefined;

  let filePath = './' + name + '.csv';
  fs.writeFileSync(filePath, JSON.stringify(body));
  filePath = SERVER_URL + '/' + name + '.csv';
  return filePath;
}

export function generateString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export const requestBase = (type: string, path: string, body: object) => {
  let obj: object = {};
  if (type === 'GET' || type === 'DELETE') {
    obj = { qs: body };
  } else if (type === 'POST' || type === 'PUT') {
    obj = { json: body };
  } else {
    return { error: 'type not valid' };
  }

  const res = request(type, SERVER_URL + path, obj);
  return res;
};

export const bodyStrToObj: any = (res: any) => JSON.parse(res.body as string);

export const requestAdminAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string) =>
  requestBase('POST', '/v1/admin/auth/register', { email: email, password: password, nameFirst: nameFirst, nameLast: nameLast });
export const requestAdminUserDetails = (tokenId: string) =>
  requestBase('GET', '/v1/admin/user/details', { token: tokenId });
export const requestAdminAuthLogin = (email: string, password: string) =>
  requestBase('POST', '/v1/admin/auth/login', { email: email, password: password });
export const requestAdminQuizNameUpdate = (tokenId: string, quizId: number, name: string) =>
  requestBase('PUT', '/v1/admin/quiz/' + quizId as string + '/name', { token: tokenId, name: name });
export const requestAdminQuizDescriptionUpdate = (tokenId: string, quizId: number, description: string) =>
  requestBase('PUT', '/v1/admin/quiz/' + quizId.toString() + '/description', { token: tokenId, description: description });
export const requestAdminQuizCreate = (tokenId: string, name: string, description: string) =>
  requestBase('POST', '/v1/admin/quiz/', { token: tokenId, name: name, description: description });
export const requestAdminUserDetailsUpdate = (tokenId: string, email: string, nameFirst: string, nameLast: string) =>
  requestBase('PUT', '/v1/admin/user/details', { token: tokenId, email: email, nameFirst: nameFirst, nameLast: nameLast });
export const requestAdminUserPasswordUpdate = (tokenId: string, oldPassword: string, newPassword: string) =>
  requestBase('PUT', '/v1/admin/user/password', { token: tokenId, oldPassword: oldPassword, newPassword: newPassword });
export const requestAdminQuizTransfer = (tokenId: string, quizId: number, email: string) =>
  requestBase('POST', '/v1/admin/quiz/' + quizId.toString() + '/transfer', { token: tokenId, email: email });
export const requestClear = () => requestBase('DELETE', '/v1/clear', {});
export const requestAdminAuthLogout = (tokenId: string) => requestBase('POST', '/v1/admin/auth/logout', { token: tokenId });
export const requestUpdateQuizQuestion = (tokenId: string, quizId: number, questionId: number, questionBody: questionBody) =>
  requestBase('PUT', '/v1/admin/quiz/' + quizId.toString() + '/question/' + questionId.toString(), { token: tokenId, questionBody: questionBody });
export const requestQuizQuestionCreate = (tokenId: string, quizId: number, questionBody: questionBody) =>
  requestBase('POST', '/v1/admin/quiz/' + quizId.toString() + '/question', { token: tokenId, questionBody: questionBody });
export const requestAdminQuizRemove = (tokenId: string, quizId: number) =>
  requestBase('DELETE', '/v1/admin/quiz/' + quizId.toString(), { token: tokenId });
export const requestViewTrash = (tokenId: string) =>
  requestBase('GET', '/v1/admin/quiz/trash', { token: tokenId });
export const requestQuizTrashRemove = (tokenId: string, quizIds: number[]) =>
  requestBase('DELETE', '/v1/admin/quiz/trash/empty', { token: tokenId, quizIds: quizIds });
export const v1RequestAdminQuizList = (tokenId: string) =>
  requestBase('GET', '/v1/admin/quiz/list', { token: tokenId });
export const v1RequestAdminQuizInfo = (tokenId: string, quizId: number) =>
  requestBase('GET', '/v1/admin/quiz/' + quizId.toString(), { token: tokenId });
export const v1RequestDeleteQuizQuestion = (quizId: number, questionId: number, tokenId: string) =>
  requestBase('DELETE', '/v1/admin/quiz/' + quizId.toString() + '/question/' + questionId.toString(), { token: tokenId });
export const v1RequestQuizRestore = (tokenId: string, quizId: number) =>
  requestBase('POST', '/v1/admin/quiz/' + quizId.toString() + '/restore', { token: tokenId });
export const chooseRandomColour = (availableColours: Array<Colour>) => {
  return availableColours[Math.floor(Math.random() * availableColours.length)];
};

export const generateSessionId = () => {
  const ID: number = Math.round(Math.random() * Math.random() * Date.now());
  return ID;
};

export const existingSessionId = (ID: number, data: DataStore) => {
  let counter = 0;
  for (const session of data.sessions) {
    if (session.sessionId === ID) counter++;
  }
  if (counter > 0) {
    return true;
  }
  return false;
};

// Making new req helpers for iteration 3
export const v2requestBase = (type: string, path: string, header: any, body: object) => {
  let obj: object = {};
  if (type === 'GET' || type === 'DELETE') {
    obj = { headers: header, qs: body };
  } else if (type === 'POST' || type === 'PUT') {
    obj = { headers: header, json: body };
  } else {
    return { error: 'type not valid' };
  }

  const res = request(type, SERVER_URL + path, obj);
  return res;
};

export const wait = (time: number): void => {
  const start: number = Date.now();
  while (Date.now() - start <= time);
};

export const v2requestAdminQuizDescriptionUpdate = (tokenId: string, quizId: number, description: string) =>
  v2requestBase('PUT', '/v2/admin/quiz/' + quizId.toString() + '/description', { token: tokenId }, { description: description });
export const v2requestAdminQuizCreate = (tokenId: string, name: string, description: string) =>
  v2requestBase('POST', '/v2/admin/quiz/', { token: tokenId }, { name: name, description: description });
export const v2requestAdminAuthLogout = (tokenId: string) => v2requestBase('POST', '/v2/admin/auth/logout', { token: tokenId }, {});
export const v2requestQuizTrashRemove = (tokenId: string, quizIds: number[]) => v2requestBase('DELETE', '/v2/admin/quiz/trash/empty', { token: tokenId }, { quizIds: quizIds });
export const v2requestUpdateQuizQuestion = (tokenId: string, quizId: number, questionId: number, questionBody: questionBody, thumbnailUrl: string) =>
  v2requestBase('PUT', '/v2/admin/quiz/' + quizId.toString() + '/question/' + questionId.toString(), { token: tokenId }, { questionBody: questionBody, thumbnailUrl: thumbnailUrl });
export const v2RequestAdminQuizList = (tokenId: string) =>
  v2requestBase('GET', '/v2/admin/quiz/list', { token: tokenId }, {});
export const v2RequestAdminQuizInfo = (tokenId: string, quizId: number) =>
  v2requestBase('GET', '/v2/admin/quiz/' + quizId.toString(), { token: tokenId }, {});
export const v2RequestTrashList = (tokenId: string) =>
  v2requestBase('GET', '/v2/admin/quiz/trash', { token: tokenId }, {});
export const v2RequestDeleteQuizQuestion = (quizId: number, questionId: number, tokenId: string) =>
  v2requestBase('DELETE', '/v2/admin/quiz/' + quizId.toString() + '/question/' + questionId.toString(), { token: tokenId }, {});
export const v2RequestQuizRestore = (tokenId: string, quizId: number) =>
  v2requestBase('POST', '/v2/admin/quiz/' + quizId.toString() + '/restore', { token: tokenId }, {});

export const v1requestStartQuizSession = (quizId: number, tokenId: string, autoStartNum: number) => v2requestBase('POST',
  `/v1/admin/quiz/${quizId}/session/start`, { token: tokenId }, { quizId: quizId, autoStartNum: autoStartNum });
export const v2requestCreateQuestion = (tokenId: string, quizId: number, questionBody: questionBody) =>
  v2requestBase('POST', `/v2/admin/quiz/${quizId}/question`, { token: tokenId }, { quizId: quizId, questionBody: questionBody });
export const v1requestQuizUpdateThumbnail = (tokenId: string, quizId: number, imgUrl: string) =>
  v2requestBase('PUT', '/v1/admin/quiz/' + quizId.toString() + '/thumbnail', { token: tokenId }, { imgUrl: imgUrl });
export const v1requestPlayerJoin = (sessionId: number, name: string) =>
  v2requestBase('POST', '/v1/player/join', {}, { sessionId: sessionId, name: name });
export const v1requestPlayerStatus = (playerId: number) =>
  v2requestBase('GET', '/v1/player/' + playerId.toString(), {}, {});
export const v1requestPlayerInfo = (playerId: number, questionPosition: number) =>
  v2requestBase('GET', '/v1/player/' + playerId.toString() + '/question/' + questionPosition.toString(), {}, {});
export const v1requestSessionStateUpdate = (tokenId: string, quizId: number, sessionId: number, action: string) =>
  v2requestBase('PUT', '/v1/admin/quiz/' + quizId.toString() + '/session/' + sessionId.toString(), { token: tokenId }, { action: action });
export const v1requestPlayerSubmitAnswers = (playerId: number, questionPosition: number, answerIds: number[]) =>
  v2requestBase('PUT', '/v1/player/' + playerId.toString() + '/question/' + questionPosition.toString() + '/answer', {}, { answerIds: answerIds });
export const v2requestadminQuizRemove = (tokenId: string, quizId: number) =>
  v2requestBase('DELETE', `/v2/admin/quiz/${quizId}`, { token: tokenId }, { quizId: quizId });
export const requestAllowGuestPlayerToSession = (sessionId: number, name: string) =>
  v2requestBase('POST', '/v1/player/join', {}, { sessionId: sessionId, name: name });
export const requestUpdateSessionState = (tokenId: string, quizId: number, sessionId: number, action: string) =>
  v2requestBase('PUT', '/v1/admin/quiz/' + quizId.toString() + '/session/' + sessionId.toString(), { token: tokenId }, { quizId: quizId, sessionId: sessionId, action: action });
export const v2RequestAdminUserDetails = (tokenId: string) =>
  v2requestBase('GET', '/v2/admin/user/details', { token: tokenId }, {});
export const v2RequestAdminQuizNameUpdate = (tokenId: string, quizId: number, name: string) =>
  v2requestBase('PUT', '/v2/admin/quiz/' + quizId as string + '/name', { token: tokenId }, { name: name });
export const v2RequestAdminUserDetailsUpdate = (tokenId: string, email: string, nameFirst: string, nameLast: string) =>
  v2requestBase('PUT', '/v2/admin/user/details', { token: tokenId }, { email: email, nameFirst: nameFirst, nameLast: nameLast });
export const v2RequestAdminUserPasswordUpdate = (tokenId: string, oldPassword: string, newPassword: string) =>
  v2requestBase('PUT', '/v2/admin/user/password', { token: tokenId }, { oldPassword: oldPassword, newPassword: newPassword });
export const v2RequestAdminQuizTransfer = (tokenId: string, quizId: number, email: string) =>
  v2requestBase('POST', '/v2/admin/quiz/' + quizId.toString() + '/transfer', { token: tokenId }, { email: email });
export const requestGetSessionStatus = (tokenId:string, quizId:number, sessionId:number) =>
  v2requestBase('GET', '/v1/admin/quiz/' + quizId.toString() + '/session/' + sessionId.toString(), { token: tokenId }, {});
export const v1requestPlayerResults = (playerId: number) =>
  v2requestBase('GET', '/v1/player/' + playerId.toString() + '/results', {}, {});
export const v1requestViewChat = (playerId: number) =>
  v2requestBase('GET', '/v1/player/' + playerId.toString() + '/chat', {}, {});
export const v1requestPostChat = (playerId: number, message: string) =>
  v2requestBase('POST', '/v1/player/' + playerId.toString() + '/chat', {}, { message: message });
export const requestresultsInCSV = (tokenId: string, quizId: number, sessionId: number) =>
  v2requestBase('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, { token: tokenId }, { quizId: quizId, sessionId: sessionId });
export const requestquestionResults = (playerId: number, questionposition: number) =>
  v2requestBase('GET', `/v1/player/${playerId}/question/${questionposition}/results`, {}, { playerId: playerId, questionposition: questionposition });
export const requestquizSessionFinalResults = (tokenId: string, quizId: number, sessionId: number) =>
  v2requestBase('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, { token: tokenId }, { quizId: quizId, sessionId: sessionId });

export function generateRandomName(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  const getRandomChar = (characters: string): string => characters[Math.floor(Math.random() * characters.length)];

  let name = '';

  // Generate 5 random letters
  while (name.length < 5) {
    const letter: string = getRandomChar(letters);
    if (!name.includes(letter)) {
      name += letter;
    }
  }

  // Generate 3 random numbers
  while (name.length < 8) {
    const number: string = getRandomChar(numbers);
    if (!name.includes(number)) {
      name += number;
    }
  }

  return name;
}

export function changeState(sessionId: number, state: string, data: DataStore): void {
  for (const session of data.sessions) {
    if (session.sessionId === sessionId) {
      session.state = state;
      setData(data);
    }
  }
}

export function updateToClose(sessionId: number, data: DataStore): Record<string, never> {
  const currentSession: session = data.sessions.find(session => session.sessionId === sessionId);
  if (currentSession.state === States.END) {
    clearTimeout(currentSession.timeoutId);
    return;
  }
  if (currentSession.state === States.ANSWER_SHOW) {
    clearTimeout(currentSession.timeoutId);
    return;
  }
  for (const session of data.sessions) {
    if (session.sessionId === sessionId) {
      session.state = States.QUESTION_CLOSE;
      setData(data);
      return {};
    }
  }
}

export function updateToOpen(sessionId: number, data: DataStore, duration: number): Record<string, never> {
  const currentSession: session = data.sessions.find(session => session.sessionId === sessionId);
  if (currentSession.state === States.END) {
    clearTimeout(currentSession.timeoutId);
    return;
  }
  if (currentSession.state === States.ANSWER_SHOW) {
    clearTimeout(currentSession.timeoutId);
    return;
  }
  for (const session of data.sessions) {
    if (session.sessionId === sessionId) {
      session.state = States.QUESTION_OPEN;
      session.timeQuestionOpen = Math.round(Date.now() / 1000);
      setData(data);
    }
  }
  currentSession.timeoutId = setTimeout(() => updateToClose(sessionId, data), duration);
  return {};
}

export function sleepSync(time: number) {
  const startTime = Date.now();
  while (Date.now() - startTime < time) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

export const modifyAnswerArray = (array: Array<any>) => {
  // removes incorrect answers
  // array.filter(answer => answer.correct === true);
  let i = 0;
  while (i < array.length) {
    if (array[i].correct === false) {
      array.splice(i, 1);
    }
    i++;
  }
  // delete all unncecessary keys not in spec
  array.map(answer => delete answer.colour);
  array.map(answer => delete answer.answer);
  array.map(answer => delete answer.correct);

  // adds the missing key to match the spec
  for (const element of array) {
    element.playersCorrect = [];
  }
  return array;
};

// this only works when data is an object, need to make it work for array
// export const csvmaker = (data: object) => {
//   const csvRows = [];

//   const headers = Object.keys(data);
//   csvRows.push(headers.join(','));

//   const values = Object.values(data).join(',');
//   csvRows.push(values);

//   return csvRows.join('\n');
// };

// export const download = function (data: any): string {
//   const blob = new Blob([data], { type: 'text/csv' });

//   const url = window.URL.createObjectURL(blob);

//   const a = document.createElement('a');
//   a.setAttribute('href', url);
//   a.setAttribute('download', 'download.csv');

//   a.click();
//   return url;
// };

export const convertToCSV = (arr: any) => {
  const array = [Object.keys(arr[0])].concat(arr);

  return array.map(it => {
    return Object.values(it).toString();
  }).join('\n');
};

// can assume no equal ranks
export const findPlayerRank = (players: Array<Player>, questionPosition: number, playerScore: number): number => {
  // if player did not attempt this question
  if (playerScore === undefined) {
    return 0;
  }
  players.sort((player1, player2) => player2.score - player1.score);
  let rank = players.findIndex(player => player.score === playerScore);
  // need to add one since arrays start at zero
  rank = rank + 1;
  return rank;
};

export const modifyPlayerArr = (array: Array<Player>) => {
  // delete unnecessary keys not specified in spec
  array.map(player => delete player.playerId);
  array.map(player => delete player.questionsAnswered);
  return array;
};
