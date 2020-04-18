// Imports
const express = require('express');
const webRoutes = require('./routes/web');
const faker = require('faker');

// Express app creation
const app = express();

// Connect socket io
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Configurations
const appConfig = require('./configs/app');

// View engine configs
const exphbs = require('express-handlebars');
const hbshelpers = require("handlebars-helpers");
const multihelpers = hbshelpers();
const extNameHbs = 'hbs';
const hbs = exphbs.create({
  extname: extNameHbs,
  helpers: multihelpers
});
app.engine(extNameHbs, hbs.engine);
app.set('view engine', extNameHbs);

// Receive parameters from the Form requests
app.use(express.urlencoded({ extended: true }));

app.use('/', express.static(__dirname + '/public'));

// Routes
app.use('/', webRoutes);

let players = [];
let waitingPlayers = [];
let currentLetter = 'A';
let bastaCounter = 0;
let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let charactersMix = "";
let basta = false;
let timeBasta = 10;
let round = 0;
let participants = 0;
let roundOngoing = false;
let playerScores = new Map();
let updateResults = false;
let winner = "";
let highestPoints = 0;
let charChecker = 0;

io.on('connection', (socket) => {
  // Recibe la conexión del cliente
  console.log('Client connected...');
  var username = faker.name.firstName()+" "+faker.hacker.abbreviation();
  socket.emit('toast', {message: "Conectado con el servidor: " + username});
  socket.emit('set-name', {message: username});
  socket.emit('set-player-count', {message: players.length+1});
  socket.emit('set-chars', {message: charactersMix});

  if(!roundOngoing){
    players.push(username);
  }else{
    waitingPlayers.push(username);
  }

  console.log(players);
  if(players.length > 1 && !roundOngoing){
    socket.emit('render-game', {message: false});
    prepareRound();
  }else if(roundOngoing){
    //send to wait
    socket.emit('render-wait-room', {message: false});

  }


  // Emite un mensaje
  setInterval(() => {

    if(updateResults){

      socket.emit('new-char', { message: round});

      charChecker--;
      if(charChecker <= 0){
        updateResults = false;
      }
    }
    //check if game is not rendered and more than 1 player
    if(players.length > 1 && !roundOngoing){
      socket.emit('check-game-status');
      if(waitingPlayers.length != 0){
        waitingPlayers.forEach(function(p){
          players.push(p);
          waitingPlayers.shift();
        });
      }
    }
    if(basta){
      socket.emit('toast', { message: "Basta " + timeBasta});
      timeBasta -= 1;
      if(timeBasta <= 0){
        playerScores.clear();
        socket.emit('toast', { message: "Acabo!"});
        //check points
        socket.emit('get-points', {message: round});

      }
    }
  }, 1000);

  // Recibe un mensaje
  socket.on('messageToServer', (data) => {
    console.log('messageReceivedFromClient: ', data.text);
    socket.emit('toast', {message: data.text});

  });

  socket.on('basta', (data) => {
    bastaCounter++;
    if(bastaCounter >= players.length){
      basta = false;
    }
      var username = data.message.username;
      var points = data.message.points;
      var currentRound = data.message.round;
  
      playerScores.set(username, points);
      console.log(playerScores);
  
      for(var [key, val] of playerScores){
          if(val > highestPoints){
            winner = key;
            highestPoints = val;
          }
        }

      charChecker++;
      round++;
      if(round - currentRound == 2){
        round--;
      }
      console.log("Round: " + round + ", curr: " + currentRound);
      updateResults = true;
      socket.emit('send-results', { message: winner+" with "+ highestPoints});
      roundOngoing = false;
      prepareRound();

  });

  socket.on('send-timer-msg', (data) => {
    basta = true;
    timeBasta = 10;

  });

});


function prepareRound(){
  setTimeout(function () {
    roundOngoing = true;
    console.log("Round ongoing");
    console.log(playerScores);
}, 2000);
}

String.prototype.shuffle = function () {
  //Credit to: https://stackoverflow.com/questions/3943772/how-do-i-shuffle-the-characters-in-a-string-in-javascript
  var a = this.split(""),
      n = a.length;

  for(var i = n - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
  }
  return a.join("");
}

// App init
server.listen(appConfig.expressPort, () => {
  charactersMix = characters.shuffle();
  console.log("Characters: " + charactersMix);
  console.log(`Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`);
});
