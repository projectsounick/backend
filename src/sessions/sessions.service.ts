import mongoose from "mongoose";
import SessionModel from "./sessions.model";
import UserActivePlansModel from "../userActivePlans/activePlans.model";
import PaymentModel from "../payment/payment.model";
export async function createNewSession(data: any[],) {
    try {
        if(data.length > 0) {
            for (const sessionItem of data) {
                if (sessionItem.sessionAgainstPlan) {
                    const activePlan = await UserActivePlansModel.findById(sessionItem.activePlanId);
                    if (!activePlan) {
                        return {
                            message: "Active Plan with given id is not found",
                            success: false,
                        };
                    }

                    if(activePlan.remainingSessions <= 0) {
                        return {
                            message: "No remaining sessions in the active plan",
                            success: false,
                        };
                    }
                    if(activePlan.remainingSessions < data.length) {
                        return {
                            message: `remaining sessions in the active plan are ${activePlan.remainingSessions}, which is less than the number of sessions to be created`,
                            success: false,
                        };
                    }

                    // Decrement the remaining sessions in the active plan
                    activePlan.remainingSessions -= data.length;
                    await activePlan.save();
                }
                if(!sessionItem.sessionAgainstPlan){
                    // const paymentItem = await PaymentModel.findById(sessionItem.paymentItemId);
                    // if (!paymentItem) {
                    //     return {
                    //         message: "Payment item with given id is not found",
                    //         success: false,
                    //     };
                    // }
                    // if(paymentItem.status !== "success") {
                    //     return {
                    //         message: "Payment is not successful for the session",
                    //         success: false,
                    //     };
                    // }
                }
            }
        }

        const userSessions = await SessionModel.insertMany(data);

        
        return {
            message: "Sessions created successfully",
            success: true,
            data: userSessions,
        };
    } catch (error) {
        throw new Error(error);
    }
}