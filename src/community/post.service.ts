import CommunityModel, { PostModel, CommentModel, LikeModel } from "./community.model";
import mongoose from "mongoose";



export async function createPost(data: Record<string, any>, createdBy: string) {
    try {
        const { communityId, text, media, type } = data;

        const community = await CommunityModel.findById(communityId);
        if (!community) {
            return {
                message: "community doesn't exists",
                success: false,
            };
        }

        const post = await PostModel.create({
            community: communityId,
            createdBy,
            text,
            media,
            type
        });

        return {
            message: "Post added successfully",
            success: true,
            data: post,
        };
    } catch (error) {
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

export async function LikeUnlikePost(postId: string, userId: string) {
    try {
        const post = await LikeModel.find({ _id: new mongoose.Types.ObjectId(postId), user: new mongoose.Types.ObjectId(userId) });
        if (post) {
            // then user already liked the post, so we will remove the like
            await LikeModel.deleteOne({ post: postId, user: userId });
            return {
                message: "Post unliked successfully",
                success: true,
            };
        }
        // else we will add the like
        await LikeModel.create({ post: postId, user: userId });
        return {
            message: "Post liked successfully",
            success: true,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function commentOnPost(postId: string, userId: string, comment: string){
    try {


        const savedComment = await CommentModel.create({
            post: new mongoose.Types.ObjectId(postId),
            user: new mongoose.Types.ObjectId(userId),
            text: comment
        });

        return {
            message: "comment posted successfully",
            success: true,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
};
