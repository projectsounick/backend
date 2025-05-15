import UserModel, { User, UserDetailsModel } from "./user.model";
import { userSchemaFields } from "../utils/usersUtils";
import { generateOtp, removeCountryCode } from "../utils/usersUtils";
import twilio from "twilio";
import { generateJWT, sendOtpUsingTwilio } from "../admin/admin.service";
import { access } from "fs";
import { UserInterface } from "../interface/otherInterface";
import mongoose from "mongoose";
const { adminLoginOtpEmailTemplate } = require("../template/otpEmail");
const { sendEmail } = require("../helpers/send-email");

///// Functions For Login Flow For Admin Panel Start////
export async function loginUser(number: string) {
  try {
    let user = await UserModel.findOne({ phoneNumber: number });
    // const otp = generateOtp();
    const otp = 1234;
    if (!user) {
      return { success: false, message: "User doen't found" };
    }
    if (user) {
      await UserModel.updateOne({ phoneNumber: number }, { $set: { otp } });
    } else {
      user = new UserModel({ phoneNumber: number, otp });
      await user.save();
    }
    ///// Function for sending the otp email to the user -------------------------/
    let response = await Promise.all([
      // sendEmail({
      //   email: "iness.numberonefitness@gmail.com",
      //   subject: `Admin panel - Login Otp`,
      //   to: "iness.numberonefitness@gmail.com",
      //   html: adminLoginOtpEmailTemplate(otp),
      // }),
      //  sendEmail({
      //    email: "founder@iness.fitness",
      //    subject: `Admin panel - Login Otp`,
      //    to: "surjojati@gmail.com",
      //    html: adminLoginOtpEmailTemplate(otp),
      //  }),
    ]);

    // Return success response
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    return { success: false, message: "User doen't found" };
  }
}
export async function adminPanelOtpVerification(
  otp: number,
  phoneNumber: string
) {
  try {
    const userResponse: any = await UserModel.findOne({
      phoneNumber: phoneNumber,
    });
    console.log(userResponse);
    let numberOtp = Number(otp);
    const token = generateJWT(userResponse._id);
    if (userResponse) {
      console.log(typeof numberOtp);

      if (numberOtp === 1234 && userResponse.role == "admin") {
        console.log("went here");

        ////finding the userDetails -------------------/
        const userDetailsResponse = await UserDetailsModel.findOne({
          userId: userResponse._id,
        });
        console.log(userDetailsResponse);

        return {
          message: "Login  successfull",
          success: true,
          data: {
            ...userResponse.toObject(),
            ...userDetailsResponse?.toObject?.(),
            accessToken: token,
          },
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
///// Functions For Login Flow For Admin Panel End////

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
      let userDetails = await UserDetailsModel.findOne({
        userId: userResponse._id,
      });

      /// Generating the jwt token ---------------------------/
      const jwtToken = generateJWT(userResponse._id);
      // Convert Mongoose Document to plain object to safely add custom properties
      const userData = userResponse.toObject();
      const userDetailsData = userDetails ? userDetails.toObject() : {};
      console.log("this is userdetailsdata");

      console.log(userDetailsData);

      // Attach jwt token
      userData.jwtToken = jwtToken;

      // Merge userDetails fields into userData (excluding _id and __v if desired)
      Object.entries(userDetailsData).forEach(([key, value]) => {
        if (key !== "_id" && key !== "__v" && key !== "userId") {
          userData[key] = value;
        }
      });

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
    const userData: Record<string, any> = {};
    const userDetailsData: Record<string, any> = {};

    // Separate the data
    for (const key in data) {
      if (userSchemaFields.includes(key)) {
        userData[key] = data[key];
      } else {
        userDetailsData[key] = data[key];
      }
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [updatedUser, updatedDetails] = await Promise.all([
      Object.keys(userData).length
        ? UserModel.findOneAndUpdate(
            { _id: userObjectId },
            { $set: userData },
            { new: true, upsert: true }
          )
        : UserModel.findById(userObjectId),

      Object.keys(userDetailsData).length
        ? UserDetailsModel.findOneAndUpdate(
            { userId: userObjectId },
            { $set: userDetailsData },
            { new: true, upsert: true }
          )
        : Promise.resolve(null),
    ]);

    // Convert documents to plain objects
    const userObj = updatedUser?.toObject?.() ?? {};
    const userDetailsObj = updatedDetails?.toObject?.() ?? {};

    // Remove userId from userDetails
    delete userDetailsObj.userId;

    // Merge both objects
    const mergedUser = { ...userObj, ...userDetailsObj };

    return {
      message: "User updated successfully",
      success: true,
      user: mergedUser,
    };
  } catch (error) {
    throw new Error(`Failed to update user: ${error}`);
  }
}

//// Function for fetching the single user data ------------------------------------------/
export async function getAllUsers() {
  try {
    // Fetch all users with their details
    const usersData = await UserModel.aggregate([
      {
        $lookup: {
          from: "userdetails", // Name of the userDetails collection
          localField: "_id", // Field from the User model (i.e., _id)
          foreignField: "userId", // Field in the UserDetails model (i.e., userId)
          as: "userDetails", // Alias for the result of the join
        },
      },
      {
        $unwind: {
          path: "$userDetails", // Unwind the userDetails array to a single object
          preserveNullAndEmptyArrays: true, // Keep users without details
        },
      },
      // No need for a $project stage — all fields will be included by default
    ]);

    if (usersData.length > 0) {
      return {
        message: "Users found",
        success: true,
        data: usersData, // Return the list of all users with their details
      };
    } else {
      return {
        message: "No users found",
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
//// Function for getting all the users ----------------------------------------------------/

//// Function for adding a new Trainer
export async function addTrainer(data: Record<string, any>) {
  try {
    const trainer = new UserModel({ ...data, role: "trainer" });
    const savedTrainer = await trainer.save();
    return {
      message: "Trainer added successfully",
      success: true,
      data: savedTrainer,
    };
  } catch (error) {
    throw new Error(error);
  }
}
//// Function for getting all the trainers
export async function getAllTrainers(
  isActive: boolean | null,
  search: string,
  page: number,
  limit: number
) {
  try {
    const queryObj: any = {
      role: "trainer",
    };
    if (isActive !== null) {
      queryObj["isActive"] = isActive;
    }
    if (search) {
      queryObj["$or"] = [
        { name: { $regex: search, $options: "i" } }, // Case-insensitive match
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (pageNumber - 1) * itemsPerPage;

    const savedTrainers = await UserModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: itemsPerPage },
      {
        $lookup: {
          from: "trainerdetails",
          localField: "_id",
          foreignField: "userId",
          as: "trainerDetails",
        },
      },
      {
        $project: {
          _id: 1,
          phoneNumber: 1,
          email: 1,
          name: 1,
          dob: 1,
          sex: 1,
          isActive: 1,
          createdAt: 1,
          achievements: {
            $ifNull: [
              { $arrayElemAt: ["$trainerDetails.achievements", 0] },
              [],
            ],
          },
        },
      },
    ]);

    const totalTrainers = await UserModel.countDocuments(queryObj);
    return {
      message: "Trainers fetched successfully",
      success: true,
      data: savedTrainers,
      pagination: {
        currentPage: pageNumber,
        totalItems: totalTrainers,
        totalPages: Math.ceil(totalTrainers / itemsPerPage),
      },
    };
  } catch (error) {
    throw new Error(error);
  }
}
