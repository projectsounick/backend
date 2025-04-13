import UserModel from "./user.model";
import { userUtils } from "../utils/usersUtils";
const { adminLoginOtpEmailTemplate } = require("../template/otpEmail");
const { sendEmail } = require("../helpers/send-email");
///// Function for the user to login ----------------------------------------------------------/
export async function loginUser(number: string) {
  try {
    // Get database connection

    // Check if the user already exists
    let user = await UserModel.findOne({ phoneNumber: number });

    // Generate a random OTP
    const otp = userUtils.generateOtp(); // e.g., function that returns a 6-digit random number
    if (!user) {
      return { success: false, message: "User doen't found" };
    }
    // if (user) {
    //   // If user exists, update OTP
    //   await UserModel.updateOne({ phoneNumber: number }, { $set: { otp } });
    // } else {
    //   // If user doesn't exist, create a new entry with phone number and OTP
    //   user = new UserModel({ phoneNumber: number, otp });
    //   await user.save();
    // }
    ///// Function for sending the otp email to the user -------------------------/
    // let response = await Promise.all([
    //   // sendEmail({
    //   //   email: "iness.numberonefitness@gmail.com",
    //   //   subject: `Admin panel - Login Otp`,
    //   //   to: "iness.numberonefitness@gmail.com",
    //   //   html: adminLoginOtpEmailTemplate(otp),
    //   // }),
    //   sendEmail({
    //     email: "founder@iness.fitness",
    //     subject: `Admin panel - Login Otp`,
    //     to: "surjojati@gmail.com",
    //     html: adminLoginOtpEmailTemplate(otp),
    //   }),
    // ]);

    // Return success response
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    return { success: false, message: "User doen't found" };
  }
}

//// Function for veryfing the otp of the user -------------------------------------------/
export async function userOtpVerify(otp: string, phoneNumber: string) {
  try {
    let collectedOtp = Number(otp);
    /// Finding the user --------------------/

    const userResponse = await UserModel.findOne({ phoneNumber: phoneNumber });
    if (userResponse) {
      if (userResponse.otp === collectedOtp) {
        /// Once otp has been matched we will make the otp in user table as null-/
        // await UserModel.findOneAndUpdate(
        //   { phoneNumber: phoneNumber },
        //   { $set: { otp: null } }
        // );
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

//// Function for updating the user data -----------------------------------------/
export async function updateUserData(
  userId: string,
  data: Record<string, any>
) {
  try {
    console.log(userId);
    console.log(data);

    const updatedUserResponse = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $set: data }, // Updates only the fields present in `data`
      { new: true, upsert: true } // Returns the updated document, creates one if it doesn't exist
    );

    if (updatedUserResponse) {
      return {
        message: "User updated successfully",
        success: true,
        user: updatedUserResponse,
      };
    } else {
      return {
        message: "User not found",
        success: false,
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}

//// Function for fetching the single user data ------------------------------------------/
export async function getUserData(userId: string) {
  try {
    const user = await UserModel.findById(userId);

    if (user) {
      return {
        message: "User found",
        success: true,
        data: user,
      };
    } else {
      return {
        message: "User not found",
        success: false,
      };
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "An error occurred",
      success: false,
    };
  }
}

///// Function for login in the admin panel with otp verficiation ----------------------------/
export async function adminPanelOtpVerification(
  otp: string,
  phoneNumber: string
) {
  try {
    let collectedOtp = Number(otp);
    /// Finding the user --------------------/

    const userResponse = await UserModel.findOne({ phoneNumber: phoneNumber });

    if (userResponse) {
      if (userResponse.otp === collectedOtp && userResponse.role == "admin") {
        /// Once otp has been matched we will make the otp in user table as null-/
        // let response = await UserModel.findOneAndUpdate(
        //   { phoneNumber: phoneNumber },
        //   { $set: { otp: null } }
        // );

        return {
          message: "Login  successfull",
          success: true,
          data: userResponse,
        };
      } else {
        return {
          message: "Otp is not matching",
          success: false,
          data: null,
        };
      }
    } else {
      return {
        message: "User doesn't exists",
        success: false,
        data: null,
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}

//// Function for getting all the users ----------------------------------------------------/
async function getAllUsers(userId: string) {
  try {
    /// Finding the user --------------------/

    //// First finding the user who is making this call------/
    const originalUserWhoIsMakingTheCallData = await UserModel.findById({
      userId,
    }).select("role");

    if (originalUserWhoIsMakingTheCallData.role === "admin") {
      const userResponse = await UserModel.find();
      if (userResponse) {
      }
    } else {
      return {
        message: "You are not authorized to use this",
        success: false,
        data: [],
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}
