import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import { clear } from './iter-3-other';
import {
  adminQuizDescriptionUpdate, adminQuizCreate, adminQuizRemove,
  createQuestion, duplicateQuestion, moveQuestion, updateQuestion,
  quizTrashEmpty, adminQuizNameUpdate,
  adminQuizTransfer, adminQuizList, adminQuizInfo,
  trashList, deleteQuizQuestion, restoreQuiz
} from './quiz';
import {
  adminAuthRegister, adminAuthLogout, adminAuthLogin,
  adminUserDetails, adminUserDetailsUpdate, adminUserPasswordUpdate
} from './auth';

import {
  adminQuizCreate2, adminQuizRemove2, duplicateQuestion2,
  moveQuestion2, v2adminQuizDescriptionUpdate, v2quizTrashEmpty,
  v2updateQuestion, createQuestion2, startQuizSession,
  v1quizUpdateThumbnail, sessionPlayerStatus, sessionPlayerQuestionInfo,
  playerSubmitAnswers, updateSessionState, v2AdminQuizNameUpdate, v2AdminQuizTransfer,
  v2QuizRestore, v2DeleteQuizQuestion, v2trashList, v2adminQuizList,
  v2adminQuizInfo, getSessionStatus, playerFinalResults, viewChat,
  postChat, quizSessionFinalResults, resultsInCSV, viewSessions, questionResults
} from './iter-3-quiz';
import {
  v2adminAuthLogout, allowGuestPlayerToSession, v2AdminUserDetails,
  v2AdminUserDetailsUpdate, v2AdminUserPasswordUpdate
} from './iter-3-auth';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for producing the docs that define the API
const file = fs.readFileSync('./swagger.yaml', 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file),
  { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// for logging errors (print to terminal)
app.use(morgan('dev'));

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  // console.log(`reqbodytoken is ${req.body.token}`)
  const ret: object = adminQuizCreate(req.body.token, req.body.name,
    req.body.description);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const ret: object = deleteQuizQuestion(parseInt(req.params.quizid), parseInt(req.params.questionid),
    req.query.token as string);

  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});
app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const ret: object = restoreQuiz(parseInt(req.params.quizid), req.body.token);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  const ret = adminAuthRegister(email, password, nameFirst, nameLast);
  return res.json(ret);
});

app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token } = req.query;
  const ret = adminUserDetails(token as string);
  if ('error' in ret) {
    if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(401);
    }
  }
  return res.json(ret);
});
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  console.log(req.query.token);
  const ret: object = trashList(req.query.token as string);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, name } = req.body;
  const ret = adminQuizNameUpdate(token, quizId, name);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, description } = req.body;
  const ret = adminQuizDescriptionUpdate(token, quizId, description);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const ret: object = adminQuizRemove(req.query.token as string,
    parseInt(req.params.quizid));

  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const ret: object = adminQuizList(req.query.token as string);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const ret: object = adminQuizInfo(parseInt(req.params.quizid),
    req.query.token as string
  );
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const { token, questionBody } = req.body;
  const ret: object = createQuestion(parseInt(req.params.quizid), token,
    questionBody.question, questionBody.duration, questionBody.points,
    questionBody.answers);

  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate',
  (req: Request, res: Response) => {
    const { quizid, questionid } = req.params;
    const { token } = req.body;
    const ret: any = duplicateQuestion(parseInt(quizid), parseInt(questionid), token);

    if ('error' in ret) {
      if (ret.error === 'Invalid token ID') {
        res.status(401);
      } else if (ret.error === 'Token does not match active session') {
        res.status(403);
      } else {
        res.status(400);
      }
    }
    return res.json(ret);
  });

app.put('/v1/admin/quiz/:quizid/question/:questionid/move',
  (req: Request, res: Response) => {
    const { quizid, questionid } = req.params;
    const { token, newPosition } = req.body;

    const ret: any = moveQuestion(parseInt(quizid), parseInt(questionid),
      token, parseInt(newPosition));

    if ('error' in ret) {
      if (ret.error === 'Invalid token ID') {
        res.status(401);
      } else if (ret.error === 'Token does not match active session') {
        res.status(403);
      } else {
        res.status(400);
      }
    }
    return res.json(ret);
  });

app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const { token } = req.body;

  const ret: any = adminAuthLogout(token);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});
app.delete('/v1/clear', (req: Request, res: Response) => {
  const ret = clear();
  res.json(ret);
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ret = adminAuthLogin(email, password);
  return res.json(ret);
});

app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const { quizid, questionid } = req.params;
  const { token, questionBody } = req.body;

  const ret = updateQuestion(token, parseInt(quizid), parseInt(questionid), questionBody);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});
app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token: any = req.query.token;
  const quizIds: any = req.query.quizIds;
  // const { token, quizIds } = req.query;
  for (const id in quizIds) {
    if (typeof quizIds[id] === 'string') quizIds[id] = parseInt(quizIds[id]);
  }
  console.log({ quizIds: quizIds });
  const ret = quizTrashEmpty(token, quizIds);

  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;
  const ret = adminUserDetailsUpdate(token, email, nameFirst, nameLast);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const ret = adminUserPasswordUpdate(token, oldPassword, newPassword);
  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, email } = req.body;
  console.log({ quizId: quizId, token: token, email: email });
  const ret = adminQuizTransfer(token, quizId, email);

  if ('error' in ret) {
    if (ret.error === 'Invalid token ID') {
      res.status(401);
    } else if (ret.error === 'Token does not match active session') {
      res.status(403);
    } else {
      res.status(400);
    }
  }
  return res.json(ret);
});

/// ////////////////////////////// V2 routes ////////////////////////////////////
app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token: any = req.header('token');
  const ret: any = v2adminQuizList(token);
  return res.json(ret);
});

app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token: any = req.header('token');
  const ret: any = v2trashList(token);
  return res.json(ret);
});

app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId: any = parseInt(req.params.quizid);
  const token: any = req.header('token');
  const ret: any = v2QuizRestore(quizId, token);
  return res.json(ret);
});

app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token: any = req.header('token');
  const ret = v2DeleteQuizQuestion(quizId, questionId, token);
  return res.json(ret);
});

app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const ret = adminQuizCreate2(token, req.body.name, req.body.description);
  return res.json(ret);
});

app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const ret = adminQuizRemove2(token, quizId);
  return res.json(ret);
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const { questionBody } = req.body;
  const ret = createQuestion2(token, quizId, questionBody.question,
    questionBody.duration, questionBody.points, questionBody.answers, questionBody.thumbnailUrl);
  return res.json(ret);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request,
  res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;
  const newPosition = req.body.newPosition;
  const ret = moveQuestion2(quizId, questionId, token, newPosition);
  return res.json(ret);
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (
  req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;
  const ret = duplicateQuestion2(quizId, questionId, token);
  return res.json(ret);
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request,
  res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const autoStartNum = req.body.autoStartNum;
  const ret = startQuizSession(quizId, token, autoStartNum);
  res.json(ret);
});

app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token: string = req.header('token');
  const { description } = req.body;
  const ret = v2adminQuizDescriptionUpdate(token, quizId, description);
  return res.json(ret);
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId: number = parseInt(req.params.playerid);
  const { message } = req.body;
  const ret = postChat(playerId, message);
  return res.json(ret);
});

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token: string = req.header('token');

  const ret: any = v2adminAuthLogout(token);
  return res.json(ret);
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token: any = req.header('token');
  const quizIds: any = req.query.quizIds;
  // const { token, quizIds } = req.query;
  for (const id in quizIds) quizIds[id] = parseInt(quizIds[id]);
  const ret = v2quizTrashEmpty(token, quizIds);

  return res.json(ret);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const { quizid, questionid } = req.params;
  const { questionBody, thumbnailUrl } = req.body;
  const token: string = req.header('token');

  const ret = v2updateQuestion(token, parseInt(quizid), parseInt(questionid), questionBody, thumbnailUrl);
  return res.json(ret);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const { quizid, sessionid } = req.params;
  const token = req.headers.token as string;

  const ret = quizSessionFinalResults(parseInt(quizid), parseInt(sessionid), token);
  res.json(ret);
});

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const quizId: number = parseInt(req.params.quizid);
  const tokenId: string = req.header('token');
  const newUrl: string = req.body.imgUrl;

  const ret = v1quizUpdateThumbnail(tokenId, quizId, newUrl);
  return res.json(ret);
});

app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId: any = parseInt(req.params.quizid);
  const token: any = req.header('token');
  const ret: any = v2adminQuizInfo(quizId, token);
  return res.json(ret);
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId: number = parseInt(req.params.playerid);
  const ret = sessionPlayerStatus(playerId);
  return res.json(ret);
});

app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId: number = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const ret = sessionPlayerQuestionInfo(playerId, questionPosition);
  return res.json(ret);
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId: number = parseInt(req.params.playerid);
  const questionPosition: number = parseInt(req.params.questionposition);
  const { answerIds } = req.body;
  for (const index in answerIds) answerIds[index] = parseInt(answerIds[index]);

  const ret = playerSubmitAnswers(playerId, questionPosition, answerIds);
  return res.json(ret);
});

app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const { quizid, sessionid } = req.params;
  const { action } = req.body;
  const token: string = req.header('token');
  const ret = updateSessionState(token, parseInt(quizid), parseInt(sessionid), action);
  return res.json(ret);
});

app.post('/v1/player/join', (req: Request, res: Response) => {
  const { sessionId, name } = req.body;
  const ret = allowGuestPlayerToSession(parseInt(sessionId), name);
  return res.json(ret);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  // const quizId: any = parseInt(req.params.quizId);
  // const sessionId: any = parseInt(req.params.sessionId);
  const { quizid, sessionid } = req.params;
  const token: any = req.header('token');
  const ret: any = getSessionStatus(token, parseInt(quizid), parseInt(sessionid));
  return res.json(ret);
});

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId: number = parseInt(req.params.playerid);
  const ret = playerFinalResults(playerId);
  return res.json(ret);
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId: number = parseInt(req.params.playerid);
  const ret = viewChat(playerId);
  return res.json(ret);
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token: any = req.header('token');
  const ret: any = v2AdminUserDetails(token);
  return res.json(ret);
});

app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId: any = parseInt(req.params.quizid);
  const token: any = req.header('token');
  const { name } = req.body;
  const ret: any = v2AdminQuizNameUpdate(token, quizId, name);
  return res.json(ret);
});

app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token: any = req.header('token');
  const { email, nameFirst, nameLast } = req.body;
  const ret: any = v2AdminUserDetailsUpdate(token, email, nameFirst, nameLast);
  return res.json(ret);
});

app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const token: any = req.header('token');
  const { oldPassword, newPassword } = req.body;
  const ret: any = v2AdminUserPasswordUpdate(token, oldPassword, newPassword);
  return res.json(ret);
});

app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId: any = parseInt(req.params.quizid);
  const token: any = req.header('token');
  const { email } = req.body;
  console.log({ quizId: quizId, token: token, email: email });
  const ret: any = v2AdminQuizTransfer(token, quizId, email);
  return res.json(ret);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', (req: Request, res: Response) => {
  const { quizid, sessionid } = req.params;
  const token = req.headers.token as string;

  const ret = resultsInCSV(token, parseInt(quizid), parseInt(sessionid));
  return res.json(ret);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const { quizid, sessionid } = req.params;
  const token = req.headers.token as string;

  const ret = quizSessionFinalResults(parseInt(quizid), parseInt(sessionid), token);
  return res.json(ret);
});

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const ret = viewSessions(token, quizId);
  res.json(ret);
});

app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const { playerid, questionposition } = req.params;
  const ret = questionResults(parseInt(playerid), parseInt(questionposition));
  return res.json(ret);
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
