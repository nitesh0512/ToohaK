```javascript
// Data structure to store information regarding
// users and created quizzes. 
const data = {
    // User data stored in an array
    users: [{
        // Unique identifier for user
        userId: 1,
        // Name of user, split into first and last name
        nameFirst: 'FirstName',
        nameLast: 'LastName',
        // Email of the user
        email: 'firstName.lastName@unsw.edu.au',
        // Current password for user
        password: 'passw0rd',
        // Number of times account has been logged into
        numSuccessfulLogins: 42,
        // Number of times account login has failed (since last logged in)
        numFailedPasswordsSinceLastLogin: 1,
        // Array containing quizIds of all the quizzes owned by user
        ownedQuizzes: [1],
        // Array containing all previous password used by user
        previousPasswords: ['prev1ous']
    }],
    // Quiz data also stored in an array
    quizzes: [{
        // Unique identifier for quiz
        quizId: 1,
        // Name of quiz
        userId: 1
        name: 'My Quiz',
        // When the quiz was created
        timeCreated: 1683125870,
        // When the quiz was last edited
        timeLastEdited: 1683125871,
        // Description of quiz
        description: 'This is my quiz',
        // Questions for the quiz stored in an array
        // Questions stored as separate objects in this array
        questions: [{
            // Unique identifier
            questionId: 1,
            // Question to be asked
            question: 'Who is the Monarch of England?'
            // The time you are given to answer the question
            duration: 4,
            // The number of points you get from answering correctly
            points: 5,
            // The possible answers
            thumbnail: ./thumnails/default.png
            answers: [
                {
                    answer: 'Prince Charles',
                    answerId: 69,
                    correct: true,
                    colour: blue
                }
            ],
            // number of correct answers
            correctAnswers: 3,
        }]
    }], 
    // array containing token objects
    tokens: [{
        tokenId: 'sample', 
        userId: 666
    }],
    // array containing unwanted quizzes
    trash: [
        // quizzes here
    ],
    // Array contains all quiz sessions 
    sessions: [{
        // Unique identifier 
        sessionId: 'session',
        state: 'question open',
        // This time only updates every time the state changes to question_open
        // and when user changes to next question (for any question)
        timeQuestionOpen: 69696969
        autoStartNum: 20
        numQuestions: 10,
        atQuestion: 3,
        messages: 
                [
                    {
                    messageBody: 'This is a message body',
                    playerId: 5546,
                    playerName: 'Yuchao Jiang',
                    timeSent: 69696969
                },
                ]
        players: [{
            playerId: 1,
            name: 'name',
            questionsAnswered: [{
                questionId: 1,
                correct: true,
                timeQuestionOpen: 13,
                timeLastAnswered: 21213,
                answersCorrect: [1,2],
                score: 82,
                questionPosition: 1
            }]
            score: 8,
            
        }],
        
        // the active session uses a copy of the quiz
        quiz: copyOfQuiz,
        timeoutId: 3 //(Don't worry about this one)
    }],
    
}
```

[Optional] short description: 
