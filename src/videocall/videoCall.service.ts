const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
export async function createVideoCallRoom(data, userId: string) {
  try {
    const { channelName, duration } = data;
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!channelName) {
      throw new Error("Channel name is required");
    }

    const uid = userId || Math.floor(Math.random() * 1000000);
    const role = RtcRole.PUBLISHER;
    const expireTimeSeconds = duration;
    console.log(expireTimeSeconds);

    const privilegeExpire = Math.floor(Date.now() / 1000) + expireTimeSeconds;
    console.log(privilegeExpire);

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpire
    );

    return {
      message: "Token generated successfully",
      success: true,
      data: {
        token,
        uid,
        channelName,
        appId,
      },
    };
  } catch (error) {
    return {
      message: "Failed to generate token",
      success: false,
      error: error.message,
    };
  }
}
