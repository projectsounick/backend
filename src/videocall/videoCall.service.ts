const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
import { v4 as uuidv4 } from "uuid";
import VideoCallModel from "./videoCall.model";
import { Types } from "mongoose";
const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;

export async function createVideoCallRoom(data: any, userId: string) {
  try {
    const { channelName, duration, participantIds } = data;


    if (!channelName) {
      throw new Error("Channel name is required");
    }
    if (!duration) {
      throw new Error("Duration is required");
    }
    if (!participantIds || participantIds.length === 0) {
      throw new Error("Participants are required");
    }

    const uuid = uuidv4();
    const role = RtcRole.PUBLISHER;
    const privilegeExpire = Math.floor(Date.now() / 1000) + duration;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uuid,
      role,
      privilegeExpire
    );

    const savedVideoCall = await VideoCallModel.create({
      creatorId: userId,
      participantIds: participantIds,
      channelName: channelName,
      duration: duration,
      callId: uuid,
      token: token
    })



    return {
      message: "Token generated successfully",
      success: true,
      data: {
        ...savedVideoCall.toObject(),
        appId: appId
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

export async function getVideoCallDetails(videoCallId: string, callingUserId: string) {
  try {
    const savedVideoCall = await VideoCallModel.findById(videoCallId);
    if (!savedVideoCall) {
      return {
        message: "video session with the given id is not present",
        success: false,
        data: null
      }
    }

    const callingUserObjectId = new Types.ObjectId(callingUserId);
    if (
      callingUserId != savedVideoCall.creatorId.toString() &&
      !savedVideoCall.participantIds.includes(callingUserObjectId)
    ) {
      return {
        message: "you are noy allowed to join this video session.",
        success: false,
        data: null
      }
    }
    return {
      message: "date fetched successfully",
      success: true,
      data: {
        ...savedVideoCall.toObject(),
        appId: appId
      },
    };
  } catch (error) {
    return {
      message: "Failed to fetch data",
      success: false,
      error: error.message,
    };
  }
}

export async function updateVideoCallDetails(videoCallId: string, callingUserId: string) {
  try {
    const savedVideoCall = await VideoCallModel.findById(videoCallId);
    if (!savedVideoCall) {
      return {
        message: "video session with the given id is not present",
        success: false,
        data: null
      }
    }

    if (callingUserId != savedVideoCall.creatorId.toString()) {
      return {
        message: "you are not allowed to update this video session.",
        success: false,
        data: null
      }
    }
    
    savedVideoCall.endedAt = new Date();
    savedVideoCall.save();

    return {
      message: "updated successfully",
      success: true,
      data: null
    };
  } catch (error) {
    return {
      message: "Failed to update data",
      success: false,
      error: error.message,
    };
  }
}