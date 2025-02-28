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

    // Generate a random OTP
    const otp = userUtils.generateOtp(); // e.g., function that returns a 6-digit random number

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
export async function userOtpVerify(otp: string, phoneNumber: string) {
  try {
    let collectedOtp = Number(otp);
    /// Finding the user --------------------/
    const dbConnection = getInessDb();
    const User = UserModel(dbConnection);

    const userResponse = await User.findOne({ phoneNumber: phoneNumber });
    if (userResponse) {
      if (userResponse.otp === collectedOtp) {
        /// Once otp has been matched we will make the otp in user table as null-/
        await User.findOneAndUpdate(
          { phoneNumber: phoneNumber },
          { $set: { otp: null } }
        );
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

    const dbConnection = getInessDb();
    const User = UserModel(dbConnection);

    const updatedUserResponse = await User.findOneAndUpdate(
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
    const dbConnection = getInessDb();
    const User = UserModel(dbConnection);

    const user = await User.findById(userId);

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
    const dbConnection = getInessDb();
    const User = UserModel(dbConnection);

    const userResponse = await User.findOne({ phoneNumber: phoneNumber });

    if (userResponse) {
      if (userResponse.otp === collectedOtp && userResponse.role == "admin") {
        /// Once otp has been matched we will make the otp in user table as null-/
        let response = await User.findOneAndUpdate(
          { phoneNumber: phoneNumber },
          { $set: { otp: null } }
        );
        if (response) {
          return {
            message: "Login successfull",
            success: true,
            data: userResponse,
          };
        } else {
          return {
            message: "Unable to login",
            success: false,
            data: null,
          };
        }
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
    const dbConnection = getInessDb();
    const User = UserModel(dbConnection);

    //// First finding the user who is making this call------/
    const originalUserWhoIsMakingTheCallData = await User.findById({
      userId,
    }).select("role");

    if (originalUserWhoIsMakingTheCallData.role === "admin") {
      const userResponse = await User.find();
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
