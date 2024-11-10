question_json_example = {

    "questions": [
        {
            'id': 1,
            'type': "multipleChoice",
            'text': "",
            'options': [
                'a',
                'b', 
                'c',
                'd...',
            ],
            'correctAnswer': "b"

        }
    ]

}

const jsonServerUrl = 'https://my-json-server.typicode.com/nrock34/1172-spa/questions'
const quizLength = 15
let firstFetch = true
let idsUsed = [0, 9]
let total
let quizOver = false
let inFeedback = false

//FETCH QUESTION
//  asyncronous function called to get question for specific id

async function fetchQuestion(questiondId) {

    if (firstFetch) {
        const response = await fetch(jsonServerUrl+"?_page=1");
        total = response.headers.get('X-Total-Count');
        total = Number(total)
        firstFetch=false
    }

    let randomId = 0
    while(idsUsed.includes(randomId)) {
        randomId = Math.floor(Math.random() * 21) + 1
        console.log(randomId)
    }
    
    const response = await fetch(jsonServerUrl+"/"+randomId);
    idsUsed.push(randomId);
    const question = await response.json();

    return question;

}

//RENDER WELCOME SCREEN
// function called to render welcome screen for spa

function renderWelcomeScreen() {
    const src = document.getElementById('welcome-screen-template').innerHTML;
    const temp = Handlebars.compile(src);
    const html = temp();

    document.getElementById('app').innerHTML = html;

    inFeedback = true
    quizOver = false

}


//RENDERING QUIZ VIEW
// function called to render the quiz view based contextual data passed

async function renderQuizView(data) {

    const question = await fetchQuestion(data.onQuestionNum);
    

    const ctx = {
        name: data.name,
        onQuestionNum: data.onQuestionNum,
        questionId: question.id,
        questionText: question.text,
        multipleChoice: question.type === "multipleChoice",
        imgMultipleChoice: question.type === "imgMultipleChoice",
        textResponse: question.type === "textResponse",
        options: question.options,
        imgOptions: question.type === "imgMultipleChoice" ? question.options : ''
    }

    const src = document.getElementById('quiz-template').innerHTML;
    const temp = Handlebars.compile(src);
    const html = temp(ctx);

    document.getElementById('app').innerHTML = html;
    inFeedback = false

    setupAnswerHandlers(question, data);

    
}

//RENDER FEEDBACK VIEW
// renders feedback after answering question

function renderFeedbackView(question, answer, data, correct) {

    const ctx = {
        name: data.name,
        onQuestionNum: data.onQuestionNum,
        questionId: question.id,
        questionText: question.text,
        multipleChoice: question.type === "multipleChoice",
        imgMultipleChoice: question.type === "imgMultipleChoice",
        textResponse: question.type === "textResponse",
        correctAnswer: question.correctAnswer,
        userAnswer: answer,
        rightAnswer: correct,
        explanation: question.explanation
    }

    const src = document.getElementById('feedback-template').innerHTML;
    const temp = Handlebars.compile(src);
    const html = temp(ctx)

    inFeedback = true
    document.getElementById('app').innerHTML = html;

}

//RENDER END SCREEN
//renders the end screen

function renderEndScreen(data) {

    curTime = (Math.floor(Date.now() / 1000) - data.timeStarted) - data.timeInFeedback

    timeMin = Math.floor(curTime / 60)
    timeSecs = curTime % 60

    const score = Math.floor((data.questionsCorrect / data.questionsAnswered) * 100);
    const ctx = {
        name: data.name,
        score: score,
        passed: score >= 80,
        questionsCorrect: data.questionsCorrect,
        questionsAnswered: data.questionsAnswered,
        elapsedTime: timeMin + ":" + (timeSecs < 10 ? "0" : "") + timeSecs, 

    }

    const src = document.getElementById('end-screen-template').innerHTML;
    const temp = Handlebars.compile(src)
    const html = temp(ctx)

    document.getElementById('app').innerHTML = html;

    quizOver = true

}


function renderTimeElapsed(data) {

    curTime = Math.floor(Date.now() / 1000) - data.timeStarted;

    curTime -= data.timeInFeedback

    timeMin = Math.floor(curTime / 60)
    timeSecs = curTime % 60

    ctx = {
        time: timeMin + ":" + (timeSecs < 10 ? "0" : "") + timeSecs
    }

    const src = document.getElementById('elapsed-time-template').innerHTML;
    const temp = Handlebars.compile(src)
    const html = temp(ctx)

    document.getElementById('time-passed').innerHTML = html;
}


//HANDLING ANSWERS
//  adds event listeners to all question answers based on question type and data

function setupAnswerHandlers(question, data) {

    String.low
    console.log(question.type)
    if (question.type === "multipleChoice") {
        document.querySelectorAll('.answer-option').forEach(
            button => {
                button.addEventListener('click', (e) => {
                    const userAnswer = e.target.innerText;
                    console.log(question)
                    checkAnswer(userAnswer, question.correctAnswer, data, question)
                });
            }
        );
    }

    if (question.type === "imgMultipleChoice") {
        document.querySelectorAll('.img-answer-option').forEach(
            imgButton => {
                imgButton.addEventListener('click', (e) => {
                    const userAnswer = e.target.id;
                    checkAnswer(userAnswer, question.correctAnswer, data, question);
                })
            }
        )
    }

    if (question.type === 'textResponse') {
        document.getElementById('submit-answer').addEventListener('click', () => {
            const userAnswer = document.getElementById('text-answer').value;
            checkAnswer(userAnswer, question.correctAnswer, data, question);
        })
    }

}

//CHECK ANSWER
//  fucntion to check answer

function checkAnswer(userAnswer, correctAnswer, data, question) {

    if (question.type === "imgMultipleChoice" ? Number(userAnswer) === Number(correctAnswer) : userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {

        renderFeedbackView(question, userAnswer, data, true)
        data.questionsAnswered++;
        data.questionsCorrect++;
        setTimeout(() => {
            data.onQuestionNum++;
            data.timeInFeedback += 1;
            if (data.questionsAnswered >= quizLength) {
                renderEndScreen(data)
            } else {
                renderQuizView(data)
            }
            
        }, 1000)

    } else {

        renderFeedbackView(question, userAnswer, data, false)
        data.questionsAnswered++;
        feedbackStartedTime = Math.floor(Date.now() / 1000);

        document.getElementById('next-question').addEventListener('click', () => {
            data.onQuestionNum++;
            feedbackEndedTime = Math.floor(Date.now() / 1000);
            data.timeInFeedback += feedbackEndedTime - feedbackStartedTime;
            if (data.questionsAnswered >= quizLength) {
                renderEndScreen(data)
            } else {
                renderQuizView(data)
            }
        })
    }
} 

document.addEventListener('submit', (e) => {

        if (e.target.id === 'start-quiz-form') {
            e.preventDefault()

            const userName = document.getElementById('name-field').value;
            const agreeBox = document.getElementById('agree-field').checked;

            quizOver = false

            data = {
                name: userName,
                agree: agreeBox,
                onQuestionNum: 1,
                questionsAnswered: 0,
                questionsCorrect: 0,
                timeStarted: Math.floor(Date.now() / 1000),
                timeInFeedback: 0,
            }
            renderQuizView(data)
            setInterval(() => {
                if (quizOver) {
                    document.getElementById('time-passed').innerHTML = "";
                } else if (!inFeedback) {
                    renderTimeElapsed(data)
                }
            }, 100)
            

        }
    }   
)

document.addEventListener('DOMContentLoaded', () => {
    renderWelcomeScreen();
});


