function checkPassword() {
  const password = document.getElementById("passwordInput").value;
  const result = document.getElementById("passwordResult");
  const tips = document.getElementById("passwordTips");

  let score = 0;
  let advice = [];

  if (password.length >= 12) score++;
  else advice.push("Use at least 12 characters.");

  if (/[A-Z]/.test(password)) score++;
  else advice.push("Add uppercase letters.");

  if (/[a-z]/.test(password)) score++;
  else advice.push("Add lowercase letters.");

  if (/[0-9]/.test(password)) score++;
  else advice.push("Add numbers.");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else advice.push("Add symbols like @, #, $, or !.");

  result.className = "result";

  if (password.length === 0) {
    result.textContent = "Result will appear here";
    tips.innerHTML = "";
    return;
  }

  if (score <= 2) {
    result.textContent = "Weak Password: Easy to guess.";
    result.classList.add("weak");
  } else if (score <= 4) {
    result.textContent = "Medium Password: Good, but can be improved.";
    result.classList.add("medium");
  } else {
    result.textContent = "Strong Password: Good security level.";
    result.classList.add("strong");
  }

  tips.innerHTML = advice.map(item => `<li>${item}</li>`).join("");
}

function detectPhishing() {
  const message = document.getElementById("messageInput").value.toLowerCase();
  const result = document.getElementById("phishingResult");

  const dangerWords = [
    "urgent", "verify", "blocked", "password", "click", "login",
    "bank", "otp", "winner", "prize", "limited time", "account suspended",
    "send money", "confirm payment"
  ];

  let found = dangerWords.filter(word => message.includes(word));
  let hasLink = message.includes("http") || message.includes("www.") || message.includes(".com");
  let hasUrgency = message.includes("urgent") || message.includes("immediately") || message.includes("limited time");

  let riskScore = found.length + (hasLink ? 2 : 0) + (hasUrgency ? 2 : 0);

  result.className = "result";

  if (message.trim() === "") {
    result.textContent = "Please paste a message first.";
    return;
  }

  if (riskScore >= 5) {
    result.classList.add("weak");
    result.innerHTML = `
      High Risk: This message looks suspicious.<br>
      Warning signs found: ${found.join(", ") || "suspicious link/urgency"}<br>
      Advice: Do not click links. Verify directly with the company or bank.
    `;
  } else if (riskScore >= 2) {
    result.classList.add("medium");
    result.innerHTML = `
      Medium Risk: Be careful with this message.<br>
      Warning signs found: ${found.join(", ") || "possible suspicious pattern"}<br>
      Advice: Confirm before responding.
    `;
  } else {
    result.classList.add("strong");
    result.innerHTML = `
      Low Risk: No major phishing signs detected.<br>
      Still be careful with unknown senders.
    `;
  }
}

function submitQuiz() {
  const form = document.getElementById("quizForm");
  const result = document.getElementById("quizResult");

  let score = 0;
  let total = 4;

  for (let i = 1; i <= total; i++) {
    const answer = form.querySelector(`input[name="q${i}"]:checked`);
    if (answer) score += Number(answer.value);
  }

  result.className = "result";

  if (score <= 1) {
    result.classList.add("weak");
    result.textContent = `Your score: ${score}/${total}. More cyber awareness training is needed.`;
  } else if (score <= 3) {
    result.classList.add("medium");
    result.textContent = `Your score: ${score}/${total}. Good attempt, but revise safety practices.`;
  } else {
    result.classList.add("strong");
    result.textContent = `Your score: ${score}/${total}. Excellent cyber awareness!`;
  }
}

function calculateAudit() {
  const checks = document.querySelectorAll(".auditCheck");
  const result = document.getElementById("auditResult");

  let checked = 0;
  checks.forEach(item => {
    if (item.checked) checked++;
  });

  let score = Math.round((checked / checks.length) * 100);

  result.className = "result";

  if (score < 40) {
    result.classList.add("weak");
    result.textContent = `Security Score: ${score}/100. High risk. Start with passwords, 2FA, and backups.`;
  } else if (score < 75) {
    result.classList.add("medium");
    result.textContent = `Security Score: ${score}/100. Moderate safety. Improve weak areas.`;
  } else {
    result.classList.add("strong");
    result.textContent = `Security Score: ${score}/100. Good security habits are in place.`;
  }
}