import express from "express";
import httpServer from "http";
import socketio from "socket.io";
import { dirname } from "path";
import { fileURLToPath } from "url";

export const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

export const mapKey = (key, str) => {
  if (key === "Backspace") return str.substr(0, str.length - 1);
  else if (key.length === 1) return str + key;
  else return str;
};

export const textGenerator = (range) => {
  return new Array(Math.floor(Math.random() * range + 5))
    .fill(0)
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join("");
};

export function assignUniqueNickname(PlayerNickname) {
  if (!PlayerNickname || PlayerNickname.length === 0) PlayerNickname = "Guest";
  while (players.some((Player) => Player.nickname === PlayerNickname)) {
    PlayerNickname += Math.floor(Math.random() * 9 + 1);
  }
  return PlayerNickname;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const http = httpServer.createServer(app);
const io = socketio(http);

//Env
const PORT = process.env.PORT || 5000;

//Custom Variables
const textRange = 5;
const delay = 5000;

const textEmitter = (id, generator) => {
  rooms[id].text = generator(textRange);
  io.to(id).emit("text", rooms[id].text);
  console.log("Sent text:", rooms[id].text);
};

const textIntervalGenerator = (id, generator, delay) => {
  return setInterval(() => {
    textEmitter(id, generator);
  }, delay);
};

//DATA

/* Player structure:
  id: number;?
  socket: Socket;
  name: string;
  text: string;
  room: Room.id;
*/
let playerId = 1;
const players = {};

function playerCreate(id, name, roomId) {
  players[id] = {
    id,
    name,
    text: "",
    room: roomId,
  };
}

/* Room structure:
  id: number;
  name: string;
  owner: string;
  players: Player[];
  text: string;
  textInterval: Interval;
*/
let roomsId = 0;
const rooms = {};

function roomCreate(id, name) {
  rooms[id] = {
    id,
    name,
    owner: "",
    players: [],
    text: "",
    textInterval: textIntervalGenerator(id, textGenerator, 5000),
  };
}
function roomAddPlayer(id, playerId) {
  rooms[id].players.push(playerId);
}

//MIDDLEWARES
app.use(express.static("static"));
app.use(express.urlencoded());
app.use(express.json());

//ROUTES
app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/game", (req, res) => {
  res.sendFile(`${__dirname}/client/game.html`);
});

app.get("/home", (req, res) => {
  res.sendFile(`${__dirname}/client/home.html`);
});

app.get("/browse", (req, res) => {
  res.sendFile(`${__dirname}/client/browse.html`);
});

app.get("/rooms", (req, res) => {
  const mappedRooms = Object.values(rooms).map(
    ({ id, name, owner, players }) => ({
      id,
      name,
      owner,
      players: players.length,
    })
  );
  res.json(mappedRooms);
});

app.get("/room", (req, res) => {
  res.json(rooms[req.query.id]);
});

app.post("/roomCreate", (req, res) => {
  const id = roomsId++;
  const name = req.body.roomName ? req.body.roomName : `Room#${id}`;
  roomCreate(id, name);
  res.json({ id });
});

//SOCKET

io.on("connection", (socket) => {
  socket.on("user_join", (roomId) => {
    const id = playerId++;
    console.log(roomId);
    console.log("User joined to room: ", socket.id);
    playerCreate(socket.id, `Player#${id}`, roomId);
    roomAddPlayer(roomId, socket.id);
    socket.join(roomId);
    socket.emit("text", rooms[roomId].text);
  });

  socket.on("output", (val) => {
    const roomId = players[socket.id].room;
    const output = players[socket.id].text;
    players[socket.id].text = mapKey(val, output);
    socket.emit("output", players[socket.id].text);

    if (players[socket.id].text === rooms[roomId].text) {
      for (const playerId of rooms[roomId].players) {
        players[playerId].text = "";
      }
      io.to(roomId).emit("lose", players[socket.id].name);
      socket.emit("win");
      clearInterval(rooms[roomId].textInterval);
      rooms[roomId].textInterval = textIntervalGenerator(
        roomId,
        textGenerator,
        delay
      );
    }
  });

  socket.on("disconnect", () => {
    const roomId = players[socket.id] && players[socket.id].room;
    if (roomId) {
      rooms[roomId].players = rooms[roomId].players.filter(
        (id) => id !== socket.id
      );
      delete players[socket.id];
      if (Object.keys(rooms[roomId].length === 0)) {
        clearInterval(rooms[roomId].textInterval);
        delete rooms[roomId];
      }
    }
  });
});

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
