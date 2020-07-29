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
