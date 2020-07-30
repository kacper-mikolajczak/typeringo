//REFERENCES
const body = document.querySelector("body");
const darkBtn = document.querySelector("#toggleDark");

//EVENTS
darkBtn.addEventListener("click", (e) => {
  body.classList.toggle("dark");
});
