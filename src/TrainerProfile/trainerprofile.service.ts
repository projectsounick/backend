import { TrainerProfileInterface } from "../interface/TrainerInterface";
import TrainerProfileModel from "./trainerprofile.model";
import UserModel from "../users/user.model";

///// Main function for the creating the new trainer ------------------------------/
export async function createTrainer(data: TrainerProfileInterface) {
  try {
    // Step 1: Check if a user with the same email or phone number exists
    let existingUser:any = await UserModel.findOne({
      $or: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
    });

    let userId: string;

    if (existingUser) {
      // If user exists, use their ID
      userId = existingUser._id;
    } else {
      // Create a new user if not found
      const newUser = new UserModel({
        email: data.email,
        password: data.password, // Hash this before saving!
        phoneNumber: data.phoneNumber,
        name: data.name,
        role: "trainer", // Assign the trainer role
      });

      const savedUser:any = await newUser.save();
      userId = savedUser._id;
    }

    // Step 2: Check if a trainer entry already exists for this userId
    const existingTrainer = await TrainerProfileModel.findOne({ _id: userId });

    if (existingTrainer) {
      return existingTrainer; // Trainer already exists, return it
    }

    // Step 3: Create a Trainer entry
    const newTrainer = new TrainerProfileModel({
      _id: userId, // Use the user ID
      trainerCertificates: data.trainerCertificates,
      trainerCode: data.trainerCode,
      trainerClients: data.trainerClients,
      trainerReviews: data.trainerReviews,
    });

    const savedTrainer = await newTrainer.save();
    return savedTrainer;
  } catch (error) {
    throw new Error(`Error creating trainer: ${error.message}`);
  }
}
