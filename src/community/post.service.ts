import { sendingNotificationByTakingTwoUserId } from "../Notification/notification.service";
import CommunityModel, {
  PostModel,
  CommentModel,
  LikeModel,
} from "./community.model";
import mongoose from "mongoose";

export async function createPost(data: Record<string, any>, createdBy: string) {
  try {
    const { communityId, text, media, type } = data;

    const community = await CommunityModel.findById(communityId);
    if (!community) {
      return {
        message: "Community doesn't exist",
        success: false,
      };
    }

    // Create the post
    const post = await PostModel.create({
      community: communityId,
      createdBy,
      text,
      media,
      type,
    });

    // Populate createdBy field with name and profilePic
    const populatedPost = await PostModel.findById(post._id).populate({
      path: "createdBy",
      select: "name profilePic", // Include only name and profilePic
    });

    return {
      message: "Post added successfully",
      success: true,
      data: populatedPost,
    };
  } catch (error: any) {
    console.log(error.message);
    throw new Error(error);
  }
}

export async function disapprovePost(postId: string) {
  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return {
        message: "post doesn't exists",
        success: false,
      };
    }

    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      { isApproved: post.isApproved ? false : true },
      { new: true }
    );

    return {
      message: "Post status change successfully",
      success: true,
      data: updatedPost,
    };
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
}

export async function LikeUnlikePost(
  postId: string,
  userId: string,
  notificationData: any
) {
  try {
    console.log(postId);
    console.log(userId);

    const post = await LikeModel.findOne({
      post: new mongoose.Types.ObjectId(postId),
      user: new mongoose.Types.ObjectId(userId),
    });
    console.log(post);

    if (post) {
      // then user already liked the post, so we will remove the like
      await LikeModel.deleteOne({ post: postId, user: userId });
      return {
        message: "Post unliked successfully",
        success: true,
      };
    } else {
      // else we will add the like
      let response = await LikeModel.create({ post: postId, user: userId });
      //// Code for like notificaiton ---------------------------/

      try {
        if (notificationData) {
          const { reciverId, senderId } = notificationData;
          sendingNotificationByTakingTwoUserId(senderId, reciverId, "like");
        }
      } catch (error) {}

      return {
        message: "Post liked successfully",
        success: true,
      };
    }
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
}

export async function commentOnPost(
  postId: string,
  userId: string,
  comment: string
) {
  try {
    const savedComment = await CommentModel.create({
      post: new mongoose.Types.ObjectId(postId),
      user: new mongoose.Types.ObjectId(userId),
      text: comment,
    });

    return {
      message: "comment posted successfully",
      success: true,
    };
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
}

export async function deletePostById(postId: string, userId: string) {
  try {
    const post = await PostModel.findById(postId);

    if (!post) {
      return {
        message: "Post not found",
        success: false,
      };
    }

    // Get the community to check if user is admin
    const communityId = post.community.toString ? post.community.toString() : post.community;
    const community = await CommunityModel.findById(communityId);
    
    if (!community) {
      return {
        message: "Community not found",
        success: false,
      };
    }

    // Check if user is the creator or an admin of the community
    const isCreator = post.createdBy.toString() === userId;
    const isAdmin = community.admins && community.admins.some(
      (adminId: any) => adminId.toString() === userId
    );

    if (!isCreator && !isAdmin) {
      return {
        message: "You are not authorized to delete this post",
        success: false,
      };
    }

    await PostModel.findByIdAndDelete(postId);

    return {
      message: "Post deleted successfully",
      success: true,
    };
  } catch (error: any) {
    console.log(error.message);
    throw new Error(error);
  }
}
