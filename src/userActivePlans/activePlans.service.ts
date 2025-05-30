import mongoose from "mongoose";
import UserActivePlansModel from "./activePlans.model";
import dayjs from "dayjs";
export async function activePlanForUser(userId: string, plans: Array<any>) {
    try {
        const useractiveplansObj = plans.map((item) => {
            const respObj = {
                userId: new mongoose.Types.ObjectId(userId)
            }
            if (item.dietPlanDetails) {
                respObj['dietPlanId'] = new mongoose.Types.ObjectId(item.dietPlanDetails._id);
                respObj['planStartDate'] = new Date();
                respObj['planEndDate'] = getEndDate(item.dietPlanDetails.duration, item.dietPlanDetails.durationType);

            }
            if (item.plan) {
                respObj['plan'] = { planId: new mongoose.Types.ObjectId(item.plan._id), planItemId: item.plan.planItem._id };
                respObj['planStartDate'] = new Date();
                respObj['planEndDate'] = getEndDate(item.plan.planItem.duration, item.plan.planItem.durationType);
                respObj['totalSessions'] = item.plan.planItem.sessionCount;
                respObj['remainingSessions'] = item.plan.planItem.sessionCount;

            }

            return respObj;
        })
        const userActivePlans = await UserActivePlansModel.insertMany(useractiveplansObj);
        return {
            message: "Plans activated successfully",
            success: true,
            data: userActivePlans,
        };
    } catch (error) {
        throw new Error(error);
    }
}

export async function getUserPlanHostory(userId: string, status: boolean | null) {
    try {
        const queryObj: any = { userId: new mongoose.Types.ObjectId(userId) };

        if (status !== null) {
            queryObj["isActive"] = status;
        }
        const activePlans = await UserActivePlansModel.aggregate([
            { $match: queryObj },
            { $sort: { createdAt: -1 } },

            // Lookup diet plan details (if applicable)
            {
                $lookup: {
                    from: "dietplans",
                    localField: "dietPlanId",
                    foreignField: "_id",
                    as: "dietPlanDetails",
                },
            },
            //Lookup plan details using the nested `plan.planId`
            {
                $lookup: {
                    from: "plans",
                    let: { planId: "$plan.planId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$planId"] } } }
                    ],
                    as: "planDetails",
                },
            },
            //Lookup plan item details using the nested `plan.planItemId`
            {
                $lookup: {
                    from: "planitems",
                    let: { planItemId: "$plan.planItemId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } }
                    ],
                    as: "planItemDetails",
                },
            },
            // Lookup diet plan details from `planDetails.dietPlanId`
            {
                $lookup: {
                    from: "dietplans",
                    let: { dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } }
                    ],
                    as: "planDietPlanDetails",
                },
            },
            // Convert `planDetails`, `planItemDetails`, and `planDietPlanDetails` into a structured plan object
            {
                $addFields: {
                    plan: {
                        $cond: {
                            if: { $gt: [{ $size: "$planDetails" }, 0] }, // Only add if plan exists
                            then: {
                                $mergeObjects: [
                                    { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                                    {
                                        planItem: { $arrayElemAt: ["$planItemDetails", 0] }, //  Nest planItem inside plan
                                        dietPlanDetails: { $arrayElemAt: ["$planDietPlanDetails", 0] } //  Nest dietPlanDetails inside plan
                                    }
                                ]
                            },
                            else: "$$REMOVE" //  Completely remove plan if no data exists
                        }
                    }
                }
            },
            //Ensure final structure
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] },
                    plan: 1, //Plan object will appear only if data exists
                    planStartDate: 1,
                    planEndDate: 1,
                    totalSessions: 1,
                    remainingSessions: 1,
                    trainerId: 1,
                    preferredAddress: 1,
                    preferredDays: 1,
                    preferredTime: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1,

                },
            },
        ]);
        return {
            message: "Current active Plans fetched successfully",
            success: true,
            data: activePlans,
        };
    } catch (error) {
        throw new Error(error);
    }
}
const getEndDate = (duration: number, durationType: 'day' | 'week' | 'month' | 'year') => {
    let endDate;

    switch (durationType) {
        case "day":
            endDate = dayjs().add(duration, "day");
            break;
        case "week":
            endDate = dayjs().add(duration, "week");
            break;
        case "month":
            endDate = dayjs().add(duration, "month");
            break;
        case "year":
            endDate = dayjs().add(duration, "year");
            break;
        default:
            throw new Error("Invalid duration type");
    }

    return endDate.format("YYYY-MM-DD"); // ✅ Returns formatted end date
};