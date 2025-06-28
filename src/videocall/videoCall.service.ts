const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
import { v4 as uuidv4 } from "uuid";
import VideoCallModel from "./videoCall.model";
import { Types } from "mongoose";
const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;

interface CreateVideoCallInput {
  channelName: string;
  duration: number;
  participantIds: string[];
  type: "creator" | "audience";
  videoCallId?: string;
  active?: boolean;
  uid?: number; // Optional for audience
}

export async function createVideoCallRoom(
  data: CreateVideoCallInput,
  userId: string
) {
  try {
    console.log(data);
    const {
      channelName,
      duration,
      participantIds,
      type,
      uid,
      videoCallId,
      active,
    } = data;

    if (!channelName) throw new Error("Channel name is required");

    const callUid =
      type === "creator"
        ? Math.floor(Math.random() * 1000000)
        : Math.floor(Math.random() * 1000000);

    const role = RtcRole.PUBLISHER;
    const privilegeExpire = Math.floor(Date.now() / 1000) + duration;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      callUid,
      role,
      privilegeExpire
    );
    console.log("this is data");

    console.log(data);
    if (type === "creator") {
      // When creator initiates the call
      const participants = participantIds.map((pid) => ({
        userId: pid,
        uid: null,
        token: null,
      }));

      const savedCall = await VideoCallModel.create({
        creatorId: userId,
        participants,
        channelName,
        duration,
        callId: callUid,
        token,
        active,
      });

      return {
        message: "Call room created successfully",
        success: true,
        data: {
          ...savedCall.toObject(),
          appId,
        },
      };
    } else {
      // When audience joins, update their entry with UID and token
      const existingCall = await VideoCallModel.findOne({
        channelName,
        "participants.userId": userId,
        _id: videoCallId,
      });

      if (!existingCall) {
        throw new Error("Call or participant not found");
      }

      let updatedCall = await VideoCallModel.findOneAndUpdate(
        {
          _id: existingCall._id,
          "participants.userId": userId,
        },
        {
          $set: {
            "participants.$.uid": callUid,
            "participants.$.token": token,
          },
        },
        {
          new: true, // return the updated document
        }
      );

      return {
        message: "Audience joined and token assigned",
        success: true,
        data: {
          appId,

          ...updatedCall.toObject(),
        },
      };
    }
  } catch (error: any) {
    return {
      message: "Video call setup failed",
      success: false,
      error: error.message,
    };
  }
}
export async function getVideoCallDetails(userId: string) {
  try {
    const savedVideoCall = await VideoCallModel.findOne({
      active: true,
      "participants.userId": userId,
    });
    if (!savedVideoCall) {
      return {
        message: "video session with the given id is not present",
        success: false,
        data: null,
      };
    }

    return {
      message: "date fetched successfully",
      success: true,
      data: {
        ...savedVideoCall.toObject(),
        appId: appId,
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

export async function updateVideoCallDetails(
  videoCallId: string,
  callingUserId: string
) {
  try {
    const savedVideoCall = await VideoCallModel.findById(videoCallId);
    if (!savedVideoCall) {
      return {
        message: "video session with the given id is not present",
        success: false,
        data: null,
      };
    }

    if (callingUserId != savedVideoCall.creatorId.toString()) {
      return {
        message: "you are not allowed to update this video session.",
        success: false,
        data: null,
      };
    }

    savedVideoCall.endedAt = new Date();
    savedVideoCall.active = false;
    savedVideoCall.save();

    return {
      message: "updated successfully",
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      message: "Failed to update data",
      success: false,
      error: error.message,
    };
  }
}
