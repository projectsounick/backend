///// Exporting all the utils function for the users -------------------------------------/
export const userUtils = {
  generateOtp,
};

//// Function for generating new otp -------------------/
export function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
}
