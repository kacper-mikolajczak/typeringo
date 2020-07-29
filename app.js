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

export function assignUniqueNickname(userNickname) {
  if (!userNickname || userNickname.length === 0) userNickname = "Guest";
  while (users.some((user) => user.nickname === userNickname)) {
    userNickname += Math.floor(Math.random() * 9 + 1);
  }
  return userNickname;
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
var currentText = "";

const textEmitter = (generator) => {
  for (const client in clientsOutputs) clientsOutputs[client] = "";
  currentText = generator(textRange);
  io.emit("text", currentText);
  console.log("Sent text:", currentText);
};

const textIntervalGenerator = (generator, delay) => {
  return setInterval(() => {
    textEmitter(generator);
  }, delay);
};

var textInterval = textIntervalGenerator(textGenerator, delay);

const users = [];

var clientsOutputs = {};

app.use(express.static("static"));

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
  res.json([
    { id: 1, name: "Room #1", owner: "Marek", players: 3 },
    { id: 2, name: "Room #2", owner: "Teodor", players: 8 },
    { id: 3, name: "Room #3", owner: "Antek", players: 1 },
  ]);
});

io.on("connection", (socket) => {
  clientsOutputs[socket.id] = "";
  console.log("Device connected " + socket.id);

  socket.on("output", (val) => {
    const output = clientsOutputs[socket.id];
    clientsOutputs[socket.id] = mapKey(val, output);
    socket.emit("output", clientsOutputs[socket.id]);

    if (clientsOutputs[socket.id] === currentText) {
      for (const client in clientsOutputs) clientsOutputs[client] = "";
      const res = "";
      io.emit("lose", socket.id);
      socket.emit("win", res);
      clearInterval(textInterval);
      textInterval = textIntervalGenerator(delay);
    }
  });

  socket.on("disconnect", () => {
    clientsOutputs[socket.id] = null;
  });
});

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
