import { setData, clearTimes } from './dataStore';
import fs from 'fs';

// Record<string, never> is a definition of an empty object
/** This function resets the state of the application back to the start.
  * @returns {object} Empty object
  */

export function clear ():Record<string, never> {
// sets data to empty arrays
  clearTimes();
  setData({ users: [], quizzes: [], tokens: [], trash: [], nextUserId: 1, nextQuizId: 1, nextQuestionId: 1, sessions: [], nextPlayerId: 1 });
  // removes every single thumbnail file apart from the default image
  fs.readdirSync('./thumbnails')
    .filter((file:any) => !(/^default\.png$/.test(file)))
    .forEach((file:any) => {
      fs.unlinkSync('./thumbnails/' + file);
    });
  return {};
}
