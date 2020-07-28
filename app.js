const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

//Env
const PORT = process.env.PORT || 5000;

//Custom Variables
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
const textRange = 5;
const delay = 5000;
var currentText = "";

//KeyboardMaps
function mapKey(key, str) {
  if (key === "Backspace") return str.substr(0, str.length - 1);
  else if (key.length === 1) return str + key;
  else return str;
}

const textGenerator = (range, alphabet) => {
  return new Array(Math.floor(Math.random() * range + 5))
    .fill(0)
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join("");
};

const textEmitter = () => {
  for (const client in clientsOutputs) clientsOutputs[client] = "";
  currentText = textGenerator(textRange, alphabet);
  io.emit("text", currentText);
  console.log("Sent text:", currentText);
};

const textIntervalGenerator = (delay) => {
  return setInterval(() => {
    textEmitter();
  }, delay);
};

var textInterval = textIntervalGenerator(delay);

const users = [];

var clientsOutputs = {};

app.use(express.static("static"));

app.get("/", (req, res) => {
  res.redirect("/home");
});

function assignUniqueNickname(userNickname) {
  if (userNickname.length === 0) userNickname = "Guest";
  while (users.some((user) => user.nickname === userNickname)) {
    userNickname += Math.floor(Math.random() * 9 + 1);
  }
  return userNickname;
}

app.get("/game", (req, res) => {
  const userNickname = assignUniqueNickname(req.query.nickname);
  console.log(userNickname);
  res.sendFile(`${__dirname}/client/game.html`);
});

app.get("/home", (req, res) => {
  res.sendFile(`${__dirname}/client/home.html`);
});

io.on("connection", (socket) => {
  clientsOutputs[socket.id] = "";

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
