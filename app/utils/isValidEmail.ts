// Check if email is valid

export default function isValidEmail(email: string) {
  /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email);
}
