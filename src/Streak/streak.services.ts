import mongoose from "mongoose";
import StreakModel from "./streak.mode";

// ✅ Helper: Check if two dates are the same day (UTC)
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

// ✅ Helper: Check if a date is yesterday (UTC)
function isYesterday(date: Date): boolean {
  const today = new Date();
  const yesterdayUTC = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 1
    )
  );

  return (
    date.getUTCFullYear() === yesterdayUTC.getUTCFullYear() &&
    date.getUTCMonth() === yesterdayUTC.getUTCMonth() &&
    date.getUTCDate() === yesterdayUTC.getUTCDate()
  );
}

// --------------------------------------------------------

export const addStreakForUser = async (userId: string) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Normalize today's date to UTC midnight
    const now = new Date();
    const todayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    let streakDoc = await StreakModel.findOne({ userId: userObjectId });

    // ✅ If no streak exists, create new streak
    if (!streakDoc) {
      streakDoc = new StreakModel({
        userId: userObjectId,
        streaks: [todayUTC],
        totalStreak: 1,
      });
      await streakDoc.save();
      return {
        success: true,
        message: "New streak started successfully!",
        data: streakDoc,
      };
    }

    // Convert last streak entry to Date
    const lastDate = new Date(streakDoc.streaks[streakDoc.streaks.length - 1]);

    // ✅ Already recorded today
    if (isSameDay(lastDate, todayUTC)) {
      return {
        success: true,
        message: "Today's streak already recorded.",
        data: streakDoc,
      };
    }

    // ✅ If yesterday, increment streak; else reset
    if (isYesterday(lastDate)) {
      streakDoc.totalStreak += 1;
    } else {
      streakDoc.totalStreak = 1; // reset streak
    }

    streakDoc.streaks.push(todayUTC);
    streakDoc.updatedAt = new Date();
    await streakDoc.save();

    return {
      success: true,
      message: "Streak updated successfully!",
      data: streakDoc,
    };
  } catch (error: any) {
    console.error("Error adding streak:", error);
    return {
      success: false,
      message: "Failed to add streak",
      data: null,
    };
  }
};

export const getUserStreak = async (userId: string) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const streakDoc = await StreakModel.findOne({
      userId: userObjectId,
    }).lean();

    if (!streakDoc) {
      return {
        success: true,
        message: "No streak found for this user.",
        data: { totalStreak: 0, streaks: [], fetched: true },
      };
    }

    return {
      success: true,
      message: "User streak fetched successfully!",
      data: { ...streakDoc, fetched: true },
    };
  } catch (error: any) {
    console.error("Error fetching streak:", error);
    return {
      success: false,
      message: "Failed to fetch user streak",
      data: null,
    };
  }
};
