const socket = io();

const urlSearchParams = new URLSearchParams(window.location.search);
const playerName = urlSearchParams.get('playerName');
const room = urlSearchParams.get('room');

/*
    WELCOME HEADER
*/
const mainHeadingTemplate = document.querySelector('#main-heading-template')
    .innerHTML;
const welcomeHeadingHTML = Handlebars.compile(mainHeadingTemplate);
document.querySelector('main').insertAdjacentHTML(
    'afterBegin',
    welcomeHeadingHTML({
        playerName,
    })
);

/*
    SOCKETIO JOIN EVENT EMITTER
*/
socket.emit('join', { playerName, room }, error => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});

/*
    SOCKETIO MESSAGE EVENT LISTENER
*/
socket.on('message', ({ playerName, text, createdAt }) => {
    const chatMessages = document.querySelector('.chat__messages');
    const messageTemplate = document.querySelector('#message-template').innerHTML;
    const template = Handlebars.compile(messageTemplate);

    const html = template({
        playerName,
        text,
        createdAt: moment(createdAt).format('h:mm a'),
    });
    chatMessages.insertAdjacentHTML('afterBegin', html);
});

/*
    SOCKETIO ROOM EVENT LISTENER
*/
socket.on('room', ({ room, players }) => {
    const gameInfo = document.querySelector('.game-info');
    const sidebarTemplate = document.querySelector('#game-info-template')
        .innerHTML;

    const template = Handlebars.compile(sidebarTemplate);

    const html = template({
        room,
        players,
    });

    gameInfo.innerHTML = html;
});

/*
    SOCKETIO QUESTION EVENT LISTENER
*/
const decodeHTMLEntities = text => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

socket.on('question', ({ answers, createdAt, playerName, question }) => {
    const triviaForm = document.querySelector('.trivia__form');
    const triviaQuestion = document.querySelector('.trivia__question');
    const triviaAnswers = document.querySelector('.trivia__answers');
    const triviaQuestionButton = document.querySelector('.trivia__question-btn');
    const triviaFormSubmitButton = triviaForm.querySelector(
        '.trivia__submit-btn'
    );

    const questionTemplate = document.querySelector('#trivia-question-template')
        .innerHTML;

    triviaQuestion.innerHTML = '';
    triviaAnswers.innerHTML = '';

    triviaQuestionButton.setAttribute('disabled', 'disabled');
    triviaFormSubmitButton.removeAttribute('disabled');

    const template = Handlebars.compile(questionTemplate);

    const html = template({
        playerName,
        createdAt: moment(createdAt).format('h:mm a'),
        question: decodeHTMLEntities(question),
        answers,
    });

    triviaQuestion.insertAdjacentHTML('beforeend', html);
});

/*
    SOCKETIO ANSWER EVENT LISTENER
*/

socket.on('answer', ({ playerName, isRoundOver, createdAt, text }) => {
    const triviaAnswers = document.querySelector('.trivia__answers');
    const triviaRevealAnswerButton = document.querySelector(
        '.trivia__answer-btn'
    );

    const messageTemplate = document.querySelector('#message-template').innerHTML;

    const template = Handlebars.compile(messageTemplate);

    const html = template({
        playerName: playerName,
        text,
        createdAt: moment(createdAt).format('h:mm a'),
    });

    triviaAnswers.insertAdjacentHTML('afterBegin', html);

    if (isRoundOver) {
        triviaRevealAnswerButton.removeAttribute('disabled');
    }
});

/*
    SOCKETIO CORRECTANSWER EVENT LISTENER
*/
socket.on('correctAnswer', ({ text }) => {
    const triviaAnswers = document.querySelector('.trivia__answers');
    const triviaQuestionButton = document.querySelector('.trivia__question-btn');
    const triviaRevealAnswerButton = document.querySelector(
        '.trivia__answer-btn'
    );
    const triviaFormSubmitButton = triviaForm.querySelector(
        '.trivia__submit-btn'
    );

    const answerTemplate = document.querySelector('#trivia-answer-template')
        .innerHTML;
    const template = Handlebars.compile(answerTemplate);

    const html = template({
        text,
    });

    triviaAnswers.insertAdjacentHTML('afterBegin', html);

    triviaQuestionButton.removeAttribute('disabled');
    triviaRevealAnswerButton.setAttribute('disabled', 'disabled');
    triviaFormSubmitButton.removeAttribute('disabled');
});

/*
    CHAT SECTION
*/
const chatForm = document.querySelector('.chat__form');

chatForm.addEventListener('submit', event => {
    event.preventDefault();

    const chatFormInput = chatForm.querySelector('.chat__message');
    const chatFormButton = chatForm.querySelector('.chat__submit-btn');

    chatFormButton.setAttribute('disabled', 'disabled');

    const message = event.target.elements.message.value;

    socket.emit('sendMessage', message, error => {
        chatFormButton.removeAttribute('disabled');
        chatFormInput.value = '';
        chatFormInput.focus();

        if (error) return alert(error);
    });
});

/*
    TRIVIA SECTION
*/
const triviaQuestionButton = document.querySelector('.trivia__question-btn');
triviaQuestionButton.addEventListener('click', () => {
    socket.emit('getQuestion', null, error => {
        if (error) return alert(error);
    });
});

const triviaRevealAnswerButton = document.querySelector('.trivia__answer-btn');
triviaRevealAnswerButton.addEventListener('click', () => {
    socket.emit('getAnswer', null, error => {
        if (error) return alert(error);
    });
});

const triviaForm = document.querySelector('.trivia__form');
triviaForm.addEventListener('submit', event => {
    event.preventDefault();

    const triviaFormSubmitButton = triviaForm.querySelector(
        '.trivia__submit-btn'
    );
    const triviaFormInputAnswer = triviaForm.querySelector('.trivia__answer');

    triviaFormSubmitButton.setAttribute('disabled', 'disabled');

    const answer = event.target.elements.answer.value;
    socket.emit('sendAnswer', answer, error => {
    triviaFormInputAnswer.value = '';
    triviaFormInputAnswer.focus();

    if (error) return alert(error.message);
  });
});