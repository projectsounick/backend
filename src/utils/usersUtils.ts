import UserModel from "../users/user.model";


function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
}
function removeCountryCode(phoneNumber: string): string {
  console.log(phoneNumber);

  if (phoneNumber.startsWith("91")) {
    return phoneNumber.slice(2); // remove the first two characters (91)
  }
  return phoneNumber;
}
export const userSchemaFields = [
  "phoneNumber",
  "otp",
  "onboarding",
  "email",
  "role",
  "name",
  "dob",
  "sex",
  "isActive",
  "createdAt",
  "updatedAt",
  "profilePic",
];
async function isUserPresent(data: Record<string, any>) {
  const { phoneNumber, email } = data;

  const message= [];
  let userPresent= false;

  if(phoneNumber) {
    const savedUser = await UserModel.findOne({phoneNumber: phoneNumber});
    if(savedUser) {
      userPresent = true;
      message.push("Duplicate phone number provided");
    }
  }
  if(email) {
    const savedUser = await UserModel.findOne({email: email});
    if(savedUser) {
      userPresent = true;
      message.push("Duplicate email provided");
    }
  }

  return { userPresent:userPresent, message:message.join(", ") };
}


export { generateOtp, removeCountryCode, isUserPresent };
