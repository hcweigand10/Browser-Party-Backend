const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const app = express();
const { v4: uuidv4 } = require('uuid');

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

const joinRoom = (socket, room) => {
  room.sockets.push(socket);
  socket.join(room.name)
  // store the room id in the socket for future use
  socket.roomId = room.name;
  console.log(socket.id, "Joined", room.name);
};


const leaveRooms = (socket) => {
  const roomsToDelete = [];
  const players = [];
  let roomName = "";
  for (const id in rooms) {
    const room = rooms[id];
    // check to see if the socket is in the current room
    if (room.sockets.includes(socket)) {
      socket.leave(id);
      roomName = room.name
      // remove the socket from the room object
      room.sockets = room.sockets.filter((item) => item !== socket);
      room.sockets.forEach(element => {
        const player = {
          id: element.id,
          roomName: element.roomId,
          username: element.username,
          score: element.score
        }
        players.push(player)
      });
    }
    // Prepare to delete any rooms that are now empty
    if (room.sockets.length == 0) {
      roomsToDelete.push(room);
    }
  }
  // Delete all the empty rooms that we found earlier
  for (const room of roomsToDelete) {
    delete rooms[room.id];
  }
  io.emit(`player-left${roomName}`, players)
};

const newPlayer = (socket, room) => {
  console.log(`newplayer in room: ${room.name}`)
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
  io.emit(`new-player${room.name}`, players)
}

const incrementRound = (socket, room) => {
    console.log(`increment round in room ${room}`)
    io.in(room).emit("increment-round")
}

const showScoreboard = (socket, room) => {
    io.emit(`scoreboard${room}`, true)
    setTimeout(() => {
        io.emit(`scoreboard${room}`, false)
    }, 7000);
}

const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

const runGame = async (socket, room) => {
    showScoreboard(socket, room);
    await wait(5000);
    incrementRound(socket, room);
    io.emit(`start-whack${room}`)
    await wait(35000);
    showScoreboard(socket, room)
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
    newPlayer(socket, room)
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
    newPlayer(socket, room);
  });

  socket.on('leave-room', (room, username) => {
    leaveRooms(socket, room);
    console.log(`${username} left room ${room}`)
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    leaveRooms(socket);
  });

  socket.on('increment-round', (room) => {
    incrementRound(socket, room)
  });

  socket.on('start-game', (room) => {
    runGame(socket, room)
  });

  socket.on("send-score", (roundScore) => {
    console.log(roundScore)
    socket.score += roundScore;
  })

  socket.on('getRoomNames', (callback) => {
    const roomNames = [];
    for (const id in rooms) {
      const {name} = rooms[id];
      const room = {name, id};
      roomNames.push(room);
    }

    callback({
      rooms: roomNames
    })
  });

  socket.on('get-data', (code, callback) => {
    console.log("getData")
    console.log(socket.adapter.rooms)
    let name = ""
    for (const room in rooms) {
      if (room.code === code) {
        name = room.name
      }
    }
    console.log(name)
    callback({
      roomName: name
    });
  })
})

theServer.listen(PORT, function () {
  console.log(`listening on port ${PORT}`)
})
