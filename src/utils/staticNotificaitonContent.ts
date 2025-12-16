export const notificationContentForNewMessage = {
  title: "New Support Message",
  body: "You’ve received a new message from our support team.",
};
export const notificationContentForNewVideo = {
  title: "New Video Uploaded",
  body: "A new video is now available for you to watch.",
};
export const notificationContentForImageProgress = {
  title: "Snap Your Progress 📸",
  body: "Show how far you’ve come! Upload today’s progress picture.",
};

export const notificationContentForWaterLog = {
  title: "Hydration Check 💧",
  body: "Stay refreshed! Log your water intake now.",
};

export const notificationContentForSteps = {
  title: "Step Up Your Game 👟",
  body: "Track your steps and keep moving towards your goal!",
};

export const notificationContentForSessionCreated = {
  title: "New Session Scheduled 📅",
  body: "You have a new session scheduled. Check your calender for details.",
};

export const notificationContentForSessionCanceled = {
  title: "Session Canceled ❌",
  body: "Your upcoming session has been canceled. Please reschedule at your convenience.",
};

export const notificationContentForSessionCompleted = {
  title: "Session Completed ✅",
  body: "Great job on completing your session! Keep up the good work.",
};

export const notificationContentForSessionEdited = {
  title: "Session Updated 📝",
  body: "Your session details have been updated. Check your calendar for the latest information.",
};

export const notificationContentForPlanAssign = {
  title: "New Plan Assigned 📋",
  body: "A new plan has been assigned to you. Start your journey today!",
};

export const notificationContentForPlanExpire = {
  title: "Plan Expiring Soon ⏳",
  body: "Your current plan is expiring soon. Renew now to continue your progress!",
};
export const notificationContentForPlanEnd = {
  title: "Plan Expired ❌",
  body: "Your current plan has expired. Renew now to continue your progress!",
};

/// Function to get version update notification content -----------------------------/
export const getVersionUpdateNotificationContent = (platform: string, version: string) => {
  return {
    title: `New ${platform} Version Available! 🎉`,
    body: `A new version (${version}) of the ${platform} app is now available. Update now to enjoy the latest features and improvements!`,
  };
};
