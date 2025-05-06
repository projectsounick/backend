import UserModel, { User } from "./user.model";
import { userUtils } from "../utils/usersUtils";
import twilio from "twilio";
import { generateJWT, sendOtpUsingTwilio } from "../admin/admin.service";
import { UserInterface } from "../interface/otherInterface";
import mongoose from "mongoose";
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

/// Function for login on the app side and sending otp to mobile number -------------------/
export async function loginUserApp(number: string): Promise<{
  data: User;
  message: string;
  success: boolean;
}> {
  try {
    // Find or create user
    let user: any = await UserModel.findOne({ phoneNumber: number });

    if (!user) {
      user = await new UserModel({ phoneNumber: number, role: "user" }).save();
    }

    // Send OTP using Twilio
    // const otpResponse = await sendOtpUsingTwilio(user._id, number);

    // if (!otpResponse) {
    //   return {
    //     success: false,
    //     message: "Unable to send OTP",
    //     data: null,
    //   };
    // }

    return {
      success: true,
      message: "OTP sent successfully",
      data: user,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      data: null,
    };
  }
}

//// Function for veryfing the otp of the user -------------------------------------------/
export async function userOtpVerify(
  phoneNumber: string,
  otp: string
): Promise<{ data: any; message: string; success: boolean }> {
  try {
    // const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    // const authToken = process.env.TWILIO_AUTH_TOKEN!;
    // const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

    // const client = twilio(accountSid, authToken);
    // // Verify the OTP using Twilio Verify API
    // const verificationCheck = await client.verify.v2
    //   .services(verifyServiceSid)
    //   .verificationChecks.create({ to: phoneNumber, code: otp });

    // console.log(verificationCheck, "this is the verificationCheck response");

    // if (verificationCheck.status === "approved") {
    //   // OTP is correct

    //   // Now find the user if needed
    //   let userResponse: UserInterface = await UserModel.findOne({
    //     phoneNumber: phoneNumber,
    //   });

    if (otp.toString() === "123456") {
      // OTP is correct

      // Now find the user if needed
      let userResponse: UserInterface = await UserModel.findOne({
        phoneNumber: phoneNumber,
      });
      /// Generating the jwt token ---------------------------/
      const jwtToken = generateJWT(userResponse._id);
      // Convert Mongoose Document to plain object to safely add custom properties
      const userData = userResponse.toObject();
      userData.jwtToken = jwtToken;

      console.log("this is userData");
      console.log(userData);

      return {
        message: "Login successful",
        success: true,
        data: userData,
      };
    } else {
      return {
        message: "Invalid or expired OTP",
        success: false,
        data: null,
      };
    }
  } catch (error: any) {
    console.error(error);
    return {
      message: "Unable to verify the otp",
      success: false,
      data: null,
    };
  }
}
//// Function for updating the user data -----------------------------------------/
export async function updateUserData(
  userId: string,
  data: Record<string, any>
) {
  try {
    const updatedUserResponse = await UserModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: data }, // Updates only the fields present in `data`
      { new: true, upsert: true } // Returns the updated document, creates one if it doesn't exist
    );
    console.log(updatedUserResponse);

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
        message: "You are not authorized to use this.",
        success: false,
        data: [],
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}
