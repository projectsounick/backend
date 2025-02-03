import { getInessDb } from "../helpers/azure-cosmosdb-mongodb";
import { UserModel } from "./user.model";
import { userUtils } from "../utils/usersUtils";

///// Function for the user to login ----------------------------------------------------------/
export async function loginUser(number: string) {
  try {
    // Get database connection
    const dbConnection = getInessDb();
    const User = UserModel(dbConnection);

    // Check if the user already exists
    let user = await User.findOne({ phoneNumber: number });
    console.log("went till here");
    console.log(user);

    // Generate a random OTP
    const otp = userUtils.generateOtp(); // e.g., function that returns a 6-digit random number
    console.log("this is otp");
    console.log(otp);

    if (user) {
      // If user exists, update OTP
      await User.updateOne({ phoneNumber: number }, { $set: { otp } });
    } else {
      // If user doesn't exist, create a new entry with phone number and OTP
      user = new User({ phoneNumber: number, otp });
      await user.save();
    }

    // Return success response
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    throw new Error(error);
  }
}

//// Function for veryfing the otp of the user -------------------------------------------/
export async function userOtpVerify(otp: string, userId: string) {
  try {
    let collectedOtp = Number(otp);
    /// Finding the user --------------------/
    const dbConnection = getInessDb();
    const User = UserModel(dbConnection);

    const userResponse = await User.findById(userId);
    if (userResponse) {
      if (userResponse.otp === collectedOtp) {
        /// Once otp has been matched we will make the otp in user table as null-/
        await User.findOneAndUpdate({ _id: userId }, { $set: { otp: null } });
        return {
          message: "Login successfull",
          success: true,
        };
      } else {
        return {
          message: "Otp is not matching",
          success: false,
        };
      }
    } else {
      return {
        message: "User doesn't exists",
        success: false,
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}
