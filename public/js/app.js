function makeToast() {
  $.toast({
    text: 'This is called a toast!',
    position: 'top-right'
  });
}

function makeToastMessage(message) {
  $.toast({
    text: message,
    position: 'top-right'
  });
}

window.socket = null;

let characters = '';
let firstPlayer = true;

function connectToSocketIo() {
  let server = window.location.protocol + "//" + window.location.host; //servidor de socket.io
  window.socket = io.connect(server);

  window.socket.on('set-name', function (data) {
    // Establece username random
    $('#currentname').html(data.message);

  });

  window.socket.on('set-player-count', function (data) {
    $('#players-connected').html(data.message);

  });

  window.socket.on('set-chars', function (data) {
    characters = data.message;
    
  });

  window.socket.on('new-char', function (data) {
    console.log("new char ---------------- " + characters.charAt(data.message));
    $('#current-letter').html("Letra: " + characters.charAt(data.message));
    document.getElementById('nombreInput').value = characters.charAt(data.message);
    document.getElementById('colorInput').value = characters.charAt(data.message);
    document.getElementById('frutoInput').value = characters.charAt(data.message);

  });

  window.socket.on('check-game-status', function (data) {
    if(firstPlayer){
      renderGame();
      firstPlayer = false;
    }
  });

  window.socket.on('render-game', function (data) {
    firstPlayer = data.message;

    renderGame();
  });


  window.socket.on('toast', function (data) {
    // Muestra el mensaje
    makeToastMessage(data.message);
  });

  window.socket.on('timer', function (data) {
    $('#timer').html('Basta acabó');
  });

  window.socket.on('send-results', function (data) {
    console.log("RESULTS: ");
    console.log(data.message);
    $('#timer').html("Ganador: " + data.message);
  });

  window.socket.on('render-wait-room', function (data) {
    renderWaitingRoom();
  });

  window.socket.on('get-points', function (data) {
    let currentRound = data.message;
    console.log("getting points");
    let username = document.getElementById("currentname").innerHTML;
    let nombre = $('#nombreInput').val();
    let color = $('#colorInput').val();
    let fruto = $('#frutoInput').val();
    let points = nombre.length + color.length + fruto.length;
    window.socket.emit('basta', {
      message: {
        username: username,
        points: points,
        round: currentRound
      }
    });
  });

}

function renderGame(){
  console.log("Letter: " + characters.charAt(0));

  $('#current-letter').html("Letra: " + characters.charAt(0));
  document.getElementById('nombreInput').value = characters.charAt(0);
  document.getElementById('colorInput').value = characters.charAt(0);
  document.getElementById('frutoInput').value = characters.charAt(0);

  var element = document.getElementById("waiting-msg");
  element.classList.add("gone");

  var element2 = document.getElementById("game");
  element2.classList.remove("gone");

}

function renderWaitingRoom(){
  var element = document.getElementById("waiting-msg");
  element.innerHTML = "Waiting for round to be over...";
}

function basta(){
  console.log("starting countdown");
  window.socket.emit('send-timer-msg', function (data) {
  });
}

function emitEventToSocketIo() {
  let text = $('#messageToServer').val();
  // Envía un mensaje
  window.socket.emit('messageToServer', { text: text });
}

$(function () { //cuando terminen de cargar los scripts de main.hbs
  connectToSocketIo();
});
