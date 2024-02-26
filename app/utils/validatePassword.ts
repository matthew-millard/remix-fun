export default function validatePassword(password: string): boolean {
  // Regular expression to match the password criteria
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>.,?\/~`-]).{8,}$/.test(password);
}

//   It is at least 8 characters long.s
//   Contains at least one uppercase letter.
//   Contains at least one special character.
//   Contains at least one number.
