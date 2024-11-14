// Data types that are used to store the data

export type Colour = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'brown' | 'orange';

export interface URL {
  url: string
}
export interface answer {
  answerId: number,
  answer: string,
  colour: Colour,
  correct: boolean
}

export interface question {
  questionId: number,
  question: string
  duration: number,
  points: number,
  answers: answer[],
  // the number of correct answers
  correctAnswerCount: number,
  thumbnailUrl?: string
}

export interface quiz {
  quizId: number,
  userId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  questions: question[],
  thumbnailUrl?: string
}

export interface user {
  userId: number,
  nameFirst: string,
  nameLast: string,
  email: string,
  password: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  ownedQuizzes: number[],
  previousPasswords: string[]
}

export interface token {
  tokenId: string,
  userId: number
}

export interface QuestionsAnswered {
  questionId: number,
  correct: boolean,
  timeQuestionOpen: number,
  timeLastAnswered: number,
  answersCorrect: Array<number>,
  score: number,
  questionPosition: number
}

export interface Player {
  playerId: number,
  name: string,
  questionsAnswered: Array<QuestionsAnswered>,
  score: number
}

export interface Message {
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number
}
export interface MessageList {
  messages: Message[]
}
export interface session {
  sessionId: number,
  state: string,
  timeQuestionOpen: number,
  autoStartNum: number,
  numQuestions: number,
  atQuestion: number,
  messages: Array<Message>,
  players: Player[],
  quiz: quiz,
  timeoutId?: ReturnType<typeof setTimeout>
}

// Error object type (for easy reference and typing)
export interface ErrorObject {
  error: string
}

// Return types for functions in quiz.ts
export interface quizListItem {
  quizId: number,
  name: string
}

export interface QuizList {
  quizzes: quizListItem[]
}
export interface trashListItem {
  quizId: number,
  name: string
}

export interface trashlist {
  quizzes: quizListItem[]
}

export interface QuizId {
  quizId: number
}

export interface DuplicateQuestion {
  newQuestionId: number,
}
export interface QuizDetails {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: {
    questionId: number,
    question: string
    duration: number,
    points: number,
    answers: answer[]
  }[],
  duration: number,
  thumbnailUrl?: string
}
export interface QuizInfo {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string
}

// Return types for functions in auth.ts
export interface AuthUserId {
  authUserId: number
}
export interface UserDetails {
  user: {
    userId: number,
    name: string,
    email: string,
    numSuccessfulLogins: number,
    numFailedPasswordsSinceLastLogin: number
  }
}

export interface TokenId {
  token: string
}

export interface QuestionId {
  questionId: number,
}

export interface SessionId {
  sessionId: number,
}

export interface PlayerId {
  playerId: number,
}

export interface answerBasicInfo {
  answer: string,
  correct: boolean
}
export interface questionBody {
  question: string,
  duration: number,
  points: number,
  answers: answerBasicInfo[],
  thumbnailUrl?: string
}

export interface PlayerScore {
  name: string,
  score: number,
}

export interface questionCorrectBreakdown {
  answerId: number,
  playersCorrect: Array<string>,
}
export interface QuestionResults {
  questionId: number,
  questionCorrectBreakdown: Array<questionCorrectBreakdown>,
  averageAnswerTime: number,
  percentCorrect: number,
}

export interface quizSessionResults {
  usersRankedByScore?: Array<PlayerScore>,
  questionResults?: Array<QuestionResults>;
}

export interface SessionList {
  activeSessions: Array<number>,
  inactiveSessions: Array<number>
}
export interface playerStatus {
  state: string,
  numQuestions: number,
  atQuestion: number
}

export interface playerQuestionInfo {
  questionId: number,
  question: string,
  duration: number,
  thumbnailUrl: string,
  points: number,
  answers: { answerId: number, answer: string, colour: Colour }[]
}

export interface DataStore {
  users: user[],
  quizzes: quiz[],
  tokens: token[],
  trash: quiz[],
  sessions?: session[],
  nextQuizId: number,
  nextUserId: number,
  nextQuestionId: number,
  nextPlayerId: number
}

export enum States {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END',
}
// FIXME: this is a tentative enum. Change as needed
export enum Action {
  NEXT_QUESTION = 'NEXT_QUESTION',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END',
}

export interface metadata {
  description: string,
  duration: number,
  name: string,
  numQuestions: number,
  questions: {
    answers: answer[],
    duration: number,
    points: number,
    question: string,
    questionId: number,
    thumbnailUrl: string
  }[],
  quizId:number,
  thumbnailUrl: string,
  timeCreated: number,
  timeLastEdited: number
}
export interface SessionStatus {
  state: string,
  atQuestion: number,
  players: string[],
  metadata: metadata
}
