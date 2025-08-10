import SessionModel from "../sessions/sessions.model";
import UserModel from "../users/user.model";

//// Function for returning the users who has upcoming session within one hour -------------------/
export async function getUpcomingUsersWhoHasSession(
  now: any,
  nextHour: any,
  todayStart: any,
  todayEnd: any
) {
  try {
    const sessions = await SessionModel.find({
      sessionDate: { $gte: todayStart, $lte: todayEnd },
      isActive: true,
      sessionStatus: "scheduled",
      // Match time range
      $expr: {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: {
                    $concat: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$sessionDate",
                        },
                      },
                      "T",
                      "$sessionTime",
                      ":00Z",
                    ],
                  },
                },
              },
              now.toDate(),
            ],
          },
          {
            $lt: [
              {
                $dateFromString: {
                  dateString: {
                    $concat: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$sessionDate",
                        },
                      },
                      "T",
                      "$sessionTime",
                      ":00Z",
                    ],
                  },
                },
              },
              nextHour.toDate(),
            ],
          },
        ],
      },
    }).select("userId sessionTime sessionDate");
    const userIds = [...new Set(sessions.map((s) => s.userId.toString()))];
    return userIds;
  } catch (error) {
    console.log(error);
    return [];
  }
}

///// Function for ggetting user fcm tokens with their id's---------------------------/
export async function getFcmTokens(userIds: any) {
  try {
    const userDetails = await UserModel.find({
      _id: { $in: userIds },
    }).select("expoPushToken");

    const tokens = userDetails
      .map((user) => user.expoPushToken)
      .filter((token): token is string => Boolean(token)); // removes null/undefined

    return tokens;
  } catch (error) {
    console.error("Error fetching FCM tokens:", error);
    return [];
  }
}
