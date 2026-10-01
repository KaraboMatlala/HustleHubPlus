// Mirrors the server's password rules so people get instant feedback.
export function passwordProblem(password) {
  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain an uppercase letter and a number.";
  }

  return "";
}
