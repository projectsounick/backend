import UserModel, {
  User,
  UserDetailsModel,
  TrainerDetailsModel,
  HRDetailsModel,
} from "./user.model";
import { userSchemaFields } from "../utils/usersUtils";
import { generateOtp, removeCountryCode } from "../utils/usersUtils";
import twilio from "twilio";
import { generateJWT, sendOtpUsingTwilio } from "../admin/admin.service";
import { access } from "fs";
import { UserInterface } from "../interface/otherInterface";
import mongoose from "mongoose";
import CompanyModel from "../company/company.model";
import CommunityModel from "../community/community.model";
import { postSupportChat } from "../SupportChat/supportchat.service";
const { adminLoginOtpEmailTemplate } = require("../template/otpEmail");
const { sendEmail } = require("../helpers/send-email");

///// Functions For Login Flow For Admin Panel Start////
export async function loginUser(number: string) {
  try {
    let user = await UserModel.findOne({ phoneNumber: number });
    if (!user) {
      return {
        success: false,
        message: "User with given phone number not found",
      };
    }
    // const otp = generateOtp();
    const otp = 1234;
    await UserModel.updateOne({ phoneNumber: number }, { $set: { otp } });
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
    if (!userResponse) {
      return {
        success: false,
        message: "User with given phone number not found",
        data: null,
      };
    }
    let parsedOTP = Number(otp);
    if (parsedOTP !== userResponse.otp) {
      return {
        message: "Otp is not matching",
        success: false,
        data: null,
      };
    }
    let userOtherDetails;
    if (userResponse.role == "trainer") {
      userOtherDetails = await TrainerDetailsModel.findOne({
        userId: userResponse._id,
      });
    } else {
      userOtherDetails = await HRDetailsModel.findOne({
        userId: userResponse._id,
      });
    }
    const token = generateJWT(userResponse._id);
    return {
      message: "Login successfullf",
      success: true,
      data: {
        ...userResponse.toObject(),
        ...userOtherDetails?.toObject(),
        accessToken: token,
      },
    };
  } catch (error) {
    throw new Error(error);
  }
}
///// Functions For Login Flow For Admin Panel End////

///// Functions For Login Flow For App Start////
export async function loginUserApp(email: string): Promise<{
  data: User;
  message: string;
  success: boolean;
}> {
  try {
    // Find or create user
    // let user: any = await UserModel.findOne({ phoneNumber: number });

    // if (!user) {
    //   user = await new UserModel({ phoneNumber: number, role: "user" }).save();
    // }
    try {
      await UserModel.collection.dropIndex("phoneNumber_1");
      console.log("Index 'phoneNumber_1' dropped successfully");
    } catch (err: any) {
      if (
        err.codeName === "IndexNotFound" ||
        err.message.includes("index not found")
      ) {
        console.log("Index 'phoneNumber_1' does not exist. Skipping drop.");
      } else {
      }
    }
    let user: any = await UserModel.findOne({ email: email });

    if (!user) {
      user = await new UserModel({ email: email, role: "user" }).save();
    }

    if (email === "test@gmail.com") {
      return {
        success: true,
        message: "OTP sent successfully",
        data: user,
      };
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
    //// email base login -------------------------------------------------------/
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    //// Storing the otp in user table ---------------------/
    const response = await UserModel.findOneAndUpdate(
      { email: email },
      { $set: { otp: otp } }
    );
    if (!response) {
      throw new Error("Some error has happened generating the otp");
    }
    await sendEmail({
      email: "founder@iness.fitness",
      subject: `Iness - Login otp`,
      to: email,
      html: adminLoginOtpEmailTemplate(otp),
    });
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
export async function loginUserAppNew(
  email: string
): Promise<{ data: User; message: string; success: boolean }> {
  try {
    try {
      await UserModel.collection.dropIndex("phoneNumber_1");
      console.log("Index 'phoneNumber_1' dropped successfully");
    } catch (err: any) {
      if (
        err.codeName === "IndexNotFound" ||
        err.message.includes("index not found")
      ) {
        console.log("Index 'phoneNumber_1' does not exist. Skipping drop.");
      } else {
      }
    }
    let user: any = await UserModel.findOne({ email: email });

    if (!user) {
      // first check if the email is froma company or not
      const emailDomain = email.split("@")[1]?.toLowerCase();
      const companyDetails = await CompanyModel.findOne({
        allowedDomains: emailDomain,
        isActive: true,
      });
      if (companyDetails) {
        // check how many employees are allowed and how many are already registered
        const registeredEmployeesCount = await UserModel.countDocuments({
          email: { $regex: new RegExp(`@${emailDomain}$`, "i") },
          isActive: true,
        });
        if (registeredEmployeesCount >= companyDetails.allowedEmployees) {
          return {
            success: false,
            message:
              "Employee limit reached for this company, Please contact your HR",
            data: null,
          };
        }
        // company stil has space for employees
        // Create a new user with the provided email and default role
        user = await new UserModel({ email: email, role: "user" }).save();
        // create a userDetails entry with the companyId
        await new UserDetailsModel({
          userId: user._id,
          companyId: companyDetails._id,
        }).save();
        // get the community for the company
        const community = await CommunityModel.findOne({
          company: companyDetails._id,
          isCorporate: true,
          isActive: true,
        });
        // add the user to the community
        community.members.push(user._id);
        await community.save();
      } else {
        // If not from a company
        // Create a new user with the provided email and default role
        user = await new UserModel({ email: email, role: "user" }).save();
        // find the default community
        const community = await CommunityModel.findOne({
          isDefault: true,
          isActive: true,
        });
        community.members.push(user._id);
        await community.save();
      }

      await postSupportChat(
        {
          role: "support",
          content: `Welcome to INESS! 💪\n
        Your fitness journey just got a whole lot better.\n
        We're thrilled to have you on board! Whether you're here to lose fat, gain strength, or simply feel your best—we’re with you every step of the way. From personalized plans and expert coaches to tasty meal guidance and powerful tracking tools, INESS is your all-in-one fitness partner.\n
        Let’s crush your goals—one rep, one meal, one day at a time.\n
        Your transformation starts NOW.\n
        Tap below to get started with your plan!`,
        },
        user._id
      );
    }
    console.log("went outside");

    if (email === "test@gmail.com") {
      return {
        success: true,
        message: "OTP sent successfully",
        data: user,
      };
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
    //// email base login -------------------------------------------------------/
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("this is otp");
    console.log(otp);

    //// Storing the otp in user table ---------------------/
    const response = await UserModel.findOneAndUpdate(
      { email: email },
      { $set: { otp: otp } }
    );
    if (!response) {
      throw new Error("Some error has happened generating the otp");
    }
    await sendEmail({
      email: "founder@iness.fitness",
      subject: `Iness - Login otp`,
      to: email,
      html: adminLoginOtpEmailTemplate(otp),
    });
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

export async function userOtpVerify(
  email: string,
  otp: string,
  expoPushToken: string
): Promise<{
  data: any;
  message: string;
  success: boolean;
}> {
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

    //// Email based otp login setup -------------------------------------/
    const userResponse: any = await UserModel.findOne({ email: email });
    if (Number(otp) === userResponse.otp) {
      // OTP is correct

      let userDetails = await UserDetailsModel.findOne({
        userId: userResponse._id,
      });

      if (expoPushToken) {
        /// Update call for the expoPushToken update in user table ------------------/
        await UserModel.findOneAndUpdate(
          { _id: userResponse._id },
          { $set: { expoPushToken: expoPushToken } }
        );
      }

      /// Generating the jwt token ---------------------------/
      const jwtToken = generateJWT(userResponse._id);
      // Convert Mongoose Document to plain object to safely add custom properties
      const userData = userResponse.toObject();
      const userDetailsData = userDetails ? userDetails.toObject() : {};

      // Attach jwt token
      userData.jwtToken = jwtToken;

      // Merge userDetails fields into userData (excluding _id and __v if desired)
      Object.entries(userDetailsData).forEach(([key, value]) => {
        if (key !== "_id" && key !== "__v" && key !== "userId") {
          userData[key] = value;
        }
      });
      if (email !== "test@gmail.com") {
        /// Setting the otp to null --------------------------/
        await UserModel.findOneAndUpdate(
          { email: email },
          { $set: { otp: null } }
        );
      }

      return {
        message: "Login successful",
        success: true,
        data: { ...userData, accessToken: jwtToken },
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
      message: `Unable to verify the otp${error.message}`,
      success: false,
      data: null,
    };
  }
}
///// Functions For Login Flow For App End////

///// Functions For Getting Loggedin User Profile using token Start////
export async function getUserProfile(userId: string) {
  try {
    const savedUser: any = await UserModel.findById(userId);
    if (!savedUser) {
      return { success: false, message: "User data not found" };
    }
    let userOtherDetails;
    if (savedUser.role == "trainer") {
      userOtherDetails = await TrainerDetailsModel.findOne({
        userId: savedUser._id,
      });
    }
    if (savedUser.role == "user") {
      userOtherDetails = await UserDetailsModel.findOne({
        userId: savedUser._id,
      });
    }
    if (savedUser.role == "hr") {
      userOtherDetails = await HRDetailsModel.findOne({
        userId: savedUser._id,
      });
    }
    return {
      message: "Profile fetched successfully",
      success: true,
      data: {
        ...savedUser.toObject(),
        ...userOtherDetails?.toObject(),
      },
    };
  } catch (error) {
    return {
      message: "Internal Server Error",
      success: false,
    };
  }
}
///// Functions For Getting Loggedin User Profile using token End////

//// Function for updating the user data -----------------------------------------/
export async function updateUserData(
  userId: string,
  data: Record<string, any>
) {
  try {
    console.log(data);

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
    console.log("this is userdetails data");

    console.log(userDetailsData);

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

///// Functions For Getting All User Data Start////
export async function getAllUsers(query: Record<string, any>) {
  try {
    const gender = query.gender?.split(",") || [];
    const age = query.age?.split(",").map(Number) || [];
    const isCorporateUser = query.isCorporateUser === "true";
    const search = query.search || "";

    const queryObj: any = { role: "user" };

    if (gender.length > 0) {
      queryObj["sex"] = { $in: gender };
    }
    if (age.length > 0) {
      queryObj["$expr"] = {
        $and: [
          {
            $gte: [
              { $subtract: [new Date().getFullYear(), { $year: "$dob" }] },
              Math.min(...age),
            ],
          },
          {
            $lte: [
              { $subtract: [new Date().getFullYear(), { $year: "$dob" }] },
              Math.max(...age),
            ],
          },
        ],
      };
    }
    if (isCorporateUser) {
      queryObj["userDetails.companyId"] = { $exists: true };
    }
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };

      queryObj["$or"] = [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        {
          _id: {
            $eq: search.match(/^[0-9a-fA-F]{24}$/)
              ? new mongoose.Types.ObjectId(search)
              : null,
          },
        },
      ];
    }

    // Fetch all users with their details
    const savedUsers = await UserModel.aggregate([
      {
        $match: queryObj,
      },
      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return {
      message: "Users fetched successfully found",
      success: true,
      data: savedUsers,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "An error occurred",
      success: false,
    };
  }
}
export async function getTrainerAssignedUsers(
  trainerId: string,
  query: Record<string, any>
) {
  try {
    const gender = query.gender?.split(",") || [];
    const age = query.age?.split(",").map(Number) || [];
    const isCorporateUser = query.isCorporateUser === "true";
    const search = query.search || "";

    const queryObj: any = { role: "user" };

    if (gender.length > 0) {
      queryObj["sex"] = { $in: gender };
    }
    if (age.length > 0) {
      queryObj["$expr"] = {
        $and: [
          {
            $gte: [
              { $subtract: [new Date().getFullYear(), { $year: "$dob" }] },
              Math.min(...age),
            ],
          },
          {
            $lte: [
              { $subtract: [new Date().getFullYear(), { $year: "$dob" }] },
              Math.max(...age),
            ],
          },
        ],
      };
    }
    if (isCorporateUser) {
      queryObj["userDetails.companyId"] = { $exists: true };
    }
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };

      queryObj["$or"] = [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        {
          _id: {
            $eq: search.match(/^[0-9a-fA-F]{24}$/)
              ? new mongoose.Types.ObjectId(search)
              : null,
          },
        },
      ];
    }

    // Fetch all users with their details
    const savedUsers = await UserModel.aggregate([
      {
        $match: queryObj, // ✅ Apply filters to the query
      },
      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return {
      message: "Users fetched successfully found",
      success: true,
      data: savedUsers,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "An error occurred",
      success: false,
    };
  }
}
///// Functions For Getting All User Data End////

//// Function for adding a new Trainer
export async function addTrainer(data: Record<string, any>) {
  try {
    console.log("this is data");

    console.log(data);

    const achievements = data.achievements || [];
    delete data.achievements;

    const trainer = new UserModel({ ...data, role: "trainer" });
    const savedTrainer = await trainer.save();

    // Create a new TrainerDetails document
    const trainerDetails = new TrainerDetailsModel({
      userId: savedTrainer._id,
      achievements: achievements,
    });
    await trainerDetails.save();

    // Return success response
    return {
      message: "Trainer added successfully",
      success: true,
      data: { ...savedTrainer.toObject(), achievements: achievements },
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
          profilePic: 1,
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
//// Function for updating a trainer's details
export async function updateTrainers(
  trainerId: string,
  data: Record<string, any>
) {
  try {
    console.log("this is data");
    console.log(data);

    const achievements = data.achievements || [];
    delete data.achievements;

    const trainerToBeUpdated = await UserModel.findById(trainerId);
    if (!trainerToBeUpdated) {
      return {
        message: "Trainer with given id is not found",
        success: false,
      };
    }
    const updatedTrainer = await UserModel.findByIdAndUpdate(
      trainerId,
      { ...data },
      { new: true }
    );

    const respObj = {
      ...updatedTrainer.toObject(),
    };
    if (achievements.length > 0) {
      const updatedTrainerDetails = await TrainerDetailsModel.findOneAndUpdate(
        { userId: trainerId },
        { achievements },
        { new: true }
      );
      respObj["achievements"] = updatedTrainerDetails.toObject().achievements;
    }

    return {
      message: "Trainer updated successfully",
      success: true,
      data: respObj,
    };
  } catch (error) {
    throw new Error(error);
  }
}

export async function deleteUser(userId: string) {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        message: "User not found",
        success: false,
      };
    }

    // Delete associated user details based on role
    if (user.role === "trainer") {
      await TrainerDetailsModel.deleteOne({ userId: user._id });
    } else if (user.role === "hr") {
      await HRDetailsModel.deleteOne({ userId: user._id });
    } else if (user.role === "user") {
      await UserDetailsModel.deleteOne({ userId: user._id });
    }

    // Remove from any communities (optional cleanup)
    await CommunityModel.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    // Finally, delete the user
    await UserModel.deleteOne({ _id: user._id });

    return {
      message: "User deleted successfully",
      success: true,
    };
  } catch (error) {
    return {
      message: `Failed to delete user: ${
        error instanceof Error ? error.message : error
      }`,
      success: false,
    };
  }
}
