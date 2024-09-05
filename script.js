var move = 9;
var box = document.getElementById("box");
var container = document.getElementById("container");
var pointsdisplay = document.getElementById("pointsDisplay");
var fallingelements = [];
var points = 0;
var gameactive = false;
var fallinginterval;
var collisioncheckinterval;

const video = document.getElementById('video');

window.onload = () => {
    const startbutton = document.getElementById('startButton');
    startbutton.addEventListener('click', startgame);
};

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadHandPoseModel() {
    await tf.setBackend('webgl');
    const model = await handpose.load();
    return model;
}

async function detectHands(model) {
    const predictions = await model.estimateHands(video);
    if (predictions.length > 0) {
        const hand = predictions[0];
        const indexFinger = hand.landmarks[8]; 

        
        const circleX = Math.min(Math.max(0, indexFinger[0]), window.innerWidth - 110);
        const circleY = Math.min(Math.max(0, indexFinger[1]), window.innerHeight - 110);

        box.style.left = circleX + 'px';
        box.style.top = circleY + 'px';
    }

    requestAnimationFrame(() => detectHands(model));
}

function startgame() {
    const instructionspage = document.getElementById('instructions');
    instructionspage.style.display = 'none';
    const gamecontainer = document.getElementById('game');
    gamecontainer.style.display = 'block';

    box.style.position = "absolute";
    box.style.top = "0px";
    box.style.left = "0px";

    points = 0;
    updatepointsdisplay();

    
    setupCamera().then(() => {
        loadHandPoseModel().then(model => {
            detectHands(model);
        });
    });

    fallinginterval = setInterval(createfallingelement, 500);
    collisioncheckinterval = setInterval(checkcollisions, 100);

    gameactive = true;
}

function getrandomcolor() {
    const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const randomindex = Math.floor(Math.random() * colors.length);
    return colors[randomindex];
}

function createfallingelement() {
    if (!gameactive) return;

    const element = document.createElement('div');
    const color = getrandomcolor();
    element.classList.add('falling-element');
    element.style.backgroundColor = color;
    element.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    element.style.top = '-100px';

    container.appendChild(element);

    fallingelements.push({
        element: element,
        color: color,
    });

    const duration = Math.random() * 3 + 3;
    element.style.animation = `fall ${duration}s linear`;

    element.addEventListener('animationend', () => {
        container.removeChild(element);
        fallingelements = fallingelements.filter(f => f.element !== element);
    });
}

function iscolliding(el1, el2) {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const radius1 = 50;
    const radius2 = 55;

    const dx = (rect1.left + radius1) - (rect2.left + radius2);
    const dy = (rect1.top + radius1) - (rect2.top + radius2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < (radius1 + radius2);
}

function checkcollisions() {
    if (!gameactive) return;

    for (let i = 0; i < fallingelements.length; i++) {
        const e1 = fallingelements[i];

        if (iscolliding(box, e1.element)) {
            if (e1.color === '#FFFFFF') {
                gameover();
                return;
            } else {
                points++;
                updatepointsdisplay();
                container.removeChild(e1.element);
                fallingelements = fallingelements.filter(f => f.element !== e1.element);
            }
        }
    }
}

function updatepointsdisplay() {
    pointsdisplay.textContent = `Points: ${points}`;
}

function gameover() {
    gameactive = false;

    fallingelements.forEach(f => container.removeChild(f.element));
    fallingelements.length = 0;

    let gameovermessage = document.getElementById('gameOverMessage');
    if (!gameovermessage) {
        gameovermessage = document.createElement('div');
        gameovermessage.id = 'gameOverMessage';
        gameovermessage.textContent = `Game Over! Final Points: ${points}`;
        gameovermessage.style.position = 'absolute';
        gameovermessage.style.top = '50%';
        gameovermessage.style.left = '50%';
        gameovermessage.style.transform = 'translate(-50%, -50%)';
        gameovermessage.style.color = '#fff';
        gameovermessage.style.fontSize = '3rem';
        gameovermessage.style.fontFamily = '"Jersey 10", sans-serif';
        gameovermessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        gameovermessage.style.padding = '20px';
        gameovermessage.style.borderRadius = '10px';

        const startoverbutton = document.createElement('button');
        startoverbutton.textContent = 'Start Over';
        startoverbutton.style.padding = '10px 20px';
        startoverbutton.style.fontSize = '1rem';
        startoverbutton.style.cursor = 'pointer';
        startoverbutton.style.fontFamily = '"Jersey 10", sans-serif';
        startoverbutton.style.margin = '20px';
        startoverbutton.style.borderBlockStyle = 'solid';
        startoverbutton.style.borderRadius = '50px';
        
        startoverbutton.onclick = startover;
        gameovermessage.appendChild(startoverbutton);

        document.body.appendChild(gameovermessage);
    }

    clearInterval(fallinginterval);
    clearInterval(collisioncheckinterval);
}

function startover() {
    const gameovermessage = document.getElementById('gameOverMessage');
    if (gameovermessage) {
        document.body.removeChild(gameovermessage);
    }

    gameactive = true;
    points = 0;
    updatepointsdisplay();

    fallinginterval = setInterval(createfallingelement, 500);
    collisioncheckinterval = setInterval(checkcollisions, 100);

    fallingelements.forEach(f => container.removeChild(f.element));
    fallingelements.length = 0;
}

setInterval(updateposition, 100);


