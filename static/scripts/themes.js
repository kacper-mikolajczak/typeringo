//Get preferences from localStorage
const theme = localStorage.getItem("theme");

//REFERENCES
const body = document.querySelector("body");
body.classList.add(theme);
const darkBtn = document.querySelector("#toggleDark");

//EVENTS
darkBtn.addEventListener("click", (e) => {
  body.classList.toggle("dark");
  localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "");
});
