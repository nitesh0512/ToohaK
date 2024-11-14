// modified iter 1 & 2 functions in here
// as well as server code for iter 3 functions

/*
import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import { clear } from './other';
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
*/
