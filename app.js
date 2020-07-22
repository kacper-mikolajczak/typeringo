const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

//Env
const PORT = process.env.PORT || 5000;

//Custom Variables
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
const textRange = 0;
const delay = 5000;
var currentText = "";

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

var clientsOutputs = {};

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

io.on("connection", (socket) => {
  clientsOutputs[socket.id] = "";

  socket.on("output", (val) => {
    const output = clientsOutputs[socket.id];
    clientsOutputs[socket.id] =
      val !== "Backspace"
        ? output + val[0]
        : output.substr(output, output.length - 1);
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
