function animateText(current, formula, chance) {
  if (current.length === formula.length)
    return current.substr(
      0,
      Math.random() > 0.2
        ? formula.length
        : Math.floor(Math.random() * formula.length - 4)
    );
  else if (current.length === 0) return formula.substr(0, 1);
  else
    return Math.random() > 0.2
      ? current + formula[current.length]
      : current.substr(0, current.length - 1);
}

function animateTextWithMispelling(current, formula, chance) {
  if (current[current.length - 1] !== formula[current.length - 1])
    return current.substr(0, current.length - 1);
  if (current.length === formula.length)
    return Math.random() > 0.1 ? current : "";
  return Math.random() > 0.3
    ? current + formula[current.length]
    : current + formula[Math.floor(Math.random() * formula.length)];
}

function animateTextInterval(animationFun, target, formula, delay) {
  return setInterval(() => {
    target.textContent = animationFun(
      target.textContent ? target.textContent : "",
      formula
    );
  }, delay);
}
