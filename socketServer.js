const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');

const app = express();

// if we don't run this we get a CORS error
// LOCAL
app.use(cors());


const PORT = process.env.PORT || 4000;
const URL = process.env.URL || "http://localhost:3000";

// for now, take this as boilerplate
const theServer = createServer();
const io = new Server(theServer, {
  cors: {
    origin: URL,
    credentials: true
  }
});

let rooms = {}

const generateTrivia = async (category, socket, roomName) => {
    console.log("trivia")
    let categoryCode = ""
    if (category === "geography") {
        categoryCode = 22
    }
    let response = await axios({
        method: 'get',
        url: `https://opentdb.com/api.php?amount=1&category=22&difficulty=medium&type=multiple`,
      })
    const results = response.data.results[0];
    console.log(results)
    const triviaObj = {
        question: results.question,
        correct_answer: results.correct_answer,
        incorrect_answers: results.incorrect_answers,
        category: results.category,
        difficulty: results.difficulty
    }
    
    console.log(triviaObj)
    io.emit(`trivia${roomName}`,triviaObj)
}


const joinRoom = (socket, room) => {
  room.sockets.push(socket);
  socket.join(room.name)
  // store the room id in the socket for future use
  socket.roomId = room.name;
  console.log(socket.id, "Joined", room.name);
};


const leaveRooms = (socket, roomName) => {
  const roomsToDelete = [];
  for (const id in rooms) {
    const room = rooms[id];
    if (room.sockets.includes(socket)) {
      socket.leave(id);
      roomName = room.name
      // remove the socket from the room object
      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    // Prepare to delete any rooms that are now empty
    if (room.sockets.length == 0) {
      roomsToDelete.push(room);
    } else {
      updatePlayers(socket, room)
    }
  }
  // Delete all the empty rooms that we found earlier
  for (const room of roomsToDelete) {
    delete rooms[room.id];
  }
//   io.emit(`player-left${roomName}`, players)
};

// const leaveRoom = (socket) => {
//   for (const id in rooms) {
//     const room = rooms[id];
//     if (room.sockets.includes(socket)) {

//     }
//   room.sockets = room.sockets.filter((item) => item !== socket)
//   if (room.sockets.length > 0) {
//     updatePlayers(socket, room)
//   } else {
//     delete rooms(room.name)
//   }
//   console.log(rooms)
// }

const updatePlayers = (socket, room) => {
  const players = []
  room.sockets.forEach(element => {
    const player = {
      id: element.id,
      roomName: element.roomId,
      username: element.username,
      score: element.score
    }
    players.push(player)
  });
  io.emit(`update-players${room.name}`, players)
}

// const newPlayer = (socket, room) => {
//   console.log(`newplayer in room: ${room.name}`)
//   const players = []
//   room.sockets.forEach(element => {
//     const player = {
//       id: element.id,
//       roomName: element.roomId,
//       username: element.username,
//       score: element.score
//     }
//     players.push(player)
//   });
//   io.emit(`new-player${room.name}`, players)
// }

const incrementRound = (socket, roomName) => {
    console.log(`increment round in room ${roomName}`)
    io.in(roomName).emit("increment-round")
}

const showScoreboard = (socket, room) => {
    io.emit(`scoreboard${room}`, true)
    setTimeout(() => {
        io.emit(`scoreboard${room}`, false)
    }, 5000);
}

const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

const runGame = async (socket, room) => {
    // pregame scoreboard
    showScoreboard(socket, room.name);
    await wait(5000);
    // start round 1
    incrementRound(socket, room.name);
    io.emit(`start-whack${room.name}`)
    await wait(35000);
    // end round 1, update scores and show scoreboard
    updatePlayers(socket, room);
    showScoreboard(socket, room.name);
    await wait(5000);
    // start round 2
    incrementRound(socket, room.name);
    await wait(3000);
    io.emit(`start-memory${room.name}`)
    await wait(35000);
    // end round 2, update scores and show scoreboard
    updatePlayers(socket, room);
    endGame(socket, room.name)
    // start round 3
    // generateTrivia(geography, socket, room.name);
    // incrementRound(socket, room.name);
}

const endGame = (socket, roomName) => {
  io.in(roomName).emit(`end-game`)
}


io.on('connection', socket => {
    // when a user connects
    console.log("You are now connected. This socket ID is unique everytime: " + socket.id);
    
    socket.on('join-room', (roomName, username) => {
      socket.username = username;
      socket.score = 0
      console.log(`attempting to join room ${roomName}`)
      const room = rooms[roomName];
      joinRoom(socket, room);
      console.log(room)
      updatePlayers(socket, room)
    });

  socket.on('create-room', (roomName, username) => {
    socket.username = username
    socket.isHost = roomName
    socket.score = 0
    const room = {
      // id: uuidv4(), // generate a unique id for the new room, that way we don't need to deal with duplicates.
      name: roomName,
      sockets: [],
    };
    rooms[roomName] = room;
    // have the socket join the room they've just created.
    joinRoom(socket, room);
    console.log(room);
    updatePlayers(socket, room);
  });

  socket.on('leave-room', (roomName, username) => {
    const room = rooms[roomName]
    leaveRooms(socket, room);
    console.log(`${username} left room ${room}`)
  });

  socket.on('disconnect', () => {
    leaveRooms(socket);
  });

  socket.on('increment-round', (roomName) => {
    incrementRound(socket, roomName)
  });

  socket.on('start-game', (roomName) => {
    const room = rooms[roomName]
    runGame(socket, room)
  });

  socket.on("send-score", (roundScore) => {
    socket.score = (socket.score + roundScore);
  })

})

theServer.listen(PORT, function () {
  console.log(`listening on port ${PORT}`)
})
