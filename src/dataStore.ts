import { DataStore, session } from './interfaces';
import fs from 'fs';

// YOU SHOULD MODIFY THIS OBJECT BELOW
let data:DataStore = {
  users: [],
  quizzes: [],
  tokens: [],
  trash: [],
  sessions: [],
  nextQuizId: 1,
  nextUserId: 1,
  nextQuestionId: 1,
  nextPlayerId: 1
};

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

// Use get() to access the data (modified to read the .json file before returning data)
function getData():DataStore {
  if (!fs.existsSync('src/dbstore.json')) setData(data);
  const newData:DataStore = JSON.parse(load());
  newData.sessions = data.sessions;
  Object.assign(data, newData);
  return data;
}

export const save = () => {
  const jsonstr = JSON.stringify(data, null, 2);
  fs.writeFileSync('src/dbstore.json', jsonstr, { flag: 'w' });
};

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData:DataStore):void {
  data = newData;
  // Preventing saving of sessions
  const sessions:session[] = data.sessions;
  data.sessions = [];
  save();
  data.sessions = sessions;
}

// Reads the dbstore.json file and returns its contents (as JSON string, not a buffer)
export const load = () => fs.readFileSync('src/dbstore.json', { encoding: 'utf8' });
export const clearTimes = ():void => {
  for (const obj of data.sessions) {
    clearTimeout(obj.timeoutId);
  }
};
export { getData, setData };
