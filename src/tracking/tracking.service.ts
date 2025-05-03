import { WalkTracking } from "./walkTracking.model";
import { SleepTracking } from "./sleepTracking.model";
import { WaterTrackingModel } from "./waterTracking.model";

export async function AddOrUpdateTracking(number: string) {
    try {
        const trackingType = req.params.trackingType;
        
        // Get database connection

        // Check if the user already exists
        let user = await UserModel.findOne({ phoneNumber: number });

        // Generate a random OTP
        const otp = userUtils.generateOtp(); // e.g., function that returns a 6-digit random number
        if (!user) {
            return { success: false, message: "User doen't found" };
        }
        return { success: true, message: "OTP sent successfully" };
    } catch (error) {
        return { success: false, message: "User doen't found" };
    }
}

export async function getTracking(number: string) {
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

