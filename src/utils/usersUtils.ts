///// Exporting all the utils function for the users -------------------------------------/
export const userUtils = {
  generateOtp,
};

//// Function for generating new otp -------------------/
export function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
}
//// Funciton for removing country code from the mobile number---/

export function removeCountryCode(phoneNumber: string): string {
  console.log(phoneNumber);

  if (phoneNumber.startsWith("91")) {
    return phoneNumber.slice(2); // remove the first two characters (91)
  }
  return phoneNumber;
}
