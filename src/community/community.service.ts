import CommunityModel, { CommentModel, PostModel } from "./community.model";
import mongoose from "mongoose";


export async function createDefaultCommunity(data: Record<string, any>) {
    try {
        const existing = await CommunityModel.findOne({ isDefault: true });
        if (existing) {
            return {
                message: "Default community already exists",
                success: false,
            };
        }

        const community = await CommunityModel.create({
            name: "Iness Fitness Hub",
            isDefault: true
        });

        return {
            message: "Default community added successfully",
            success: true,
            data: community,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function createCorporateCommunity(name: string, companyId: string) {
    try {
        const existing = await CommunityModel.findOne({ company: new mongoose.Types.ObjectId(companyId) });
        if (existing) {
            return {
                message: "Corporate community already exists",
                success: false,
            };
        }

        const community = await CommunityModel.create({
            name: name,
            isCorporate: true,
            company: new mongoose.Types.ObjectId(companyId)
        });

        return {
            message: "corporate community added successfully",
            success: true,
            data: community,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function assignMembers(communityId: string, memberIds: string[]) {
    try {
        const community = await CommunityModel.findById(communityId);
        if (!community) {
            return {
                message: "community doesn't exists",
                success: false,
            };
        }

        const updatedCommunity = await CommunityModel.findByIdAndUpdate(
            communityId,
            { $addToSet: { members: { $each: memberIds } } },
            { new: true }
        );

        return {
            message: "members added successfully",
            success: true,
            data: updatedCommunity,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function assignAdmins(communityId: string, adminIds: string[]) {
    try {
        const community = await CommunityModel.findById(communityId);
        if (!community) {
            return {
                message: "community doesn't exists",
                success: false,
            };
        }

        const updatedCommunity = await CommunityModel.findByIdAndUpdate(
            communityId,
            { $addToSet: { admins: { $each: adminIds } } },
            { new: true }
        );

        return {
            message: "admins added successfully",
            success: true,
            data: updatedCommunity,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function getAllCommunities(status: any, page: string, limit: string) {
    try {
        let savedCommunity;
        let paginationInfo = null;
        const queryObj: any = {};
        if (status !== null) {
            queryObj["isActive"] = status;
        }

        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 10;

        const pageNumber = parsedPage > 0 ? parsedPage : 1;
        const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
        const skip = (pageNumber - 1) * itemsPerPage;

        savedCommunity = await CommunityModel.aggregate([
            { $match: queryObj },
            { $sort: { createdAt: -1, isActive: -1 } },
            { $skip: skip },
            { $limit: itemsPerPage },
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "community",
                    as: "posts"
                }
            },
            {
                $project: {
                    name: 1,
                    bannerImage: 1,
                    isActive: 1,
                    isCorporate: 1,
                    isDefault: 1,
                    company: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    membersCount: { $size: "$members" },
                    postCount: { $size: "$posts" }
                }
            }
        ]);

        const totalItems = await CommunityModel.countDocuments(queryObj);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        paginationInfo = {
            currentPage: pageNumber,
            totalItems,
            totalPages,
        };


        return {
            message: "Communities fetched successfully",
            success: true,
            data: savedCommunity,
            pagination: paginationInfo,
        };
    } catch (error) {
        throw new Error(error);
    }
}


export async function getUserCommunities(userId: string, status: any, page: string, limit: string) {
    try {
        const queryObj: any = {
            members: new mongoose.Types.ObjectId(userId)
        };

        if (status !== null) {
            queryObj["isActive"] = status;
        }

        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 10;

        const pageNumber = parsedPage > 0 ? parsedPage : 1;
        const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
        const skip = (pageNumber - 1) * itemsPerPage;

        const userCommunities = await CommunityModel.aggregate([
            { $match: queryObj },
            { $sort: { createdAt: -1, isActive: -1 } },
            { $skip: skip },
            { $limit: itemsPerPage },
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "community",
                    as: "posts"
                }
            },
            {
                $project: {
                    name: 1,
                    bannerImage: 1,
                    isActive: 1,
                    isCorporate: 1,
                    isDefault: 1,
                    company: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    membersCount: { $size: "$members" },
                    postCount: { $size: "$posts" }
                }
            }
        ]);

        const totalItems = await CommunityModel.countDocuments(queryObj);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
            message: "User communities fetched successfully",
            success: true,
            data: userCommunities,
            pagination: {
                currentPage: pageNumber,
                totalItems,
                totalPages,
            }
        };
    } catch (error) {
        throw new Error(error);
    }
}


export async function getCommunityById(communityId: string) {
    try {
        const community = await CommunityModel.findById(communityId)
            .populate("company", "name")
            .populate("members", "name email")
            .populate("admins", "name email");

        return {
            message: "Community Details fetched successfully",
            success: true,
            data: community,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function getCommunityPosts(communityId: string, userId: string, page: string, limit: string) {
    try {
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 10;

        const pageNumber = parsedPage > 0 ? parsedPage : 1;
        const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
        const skip = (pageNumber - 1) * itemsPerPage;


        const posts = await PostModel.aggregate([
            { $match: { community: new mongoose.Types.ObjectId(communityId), isActive: true } },
            { $sort: { createdAt: -1, isActive: -1 } },
            { $skip: skip },
            { $limit: itemsPerPage },


            {
                $lookup: {
                    from: "likes",
                    let: { postId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$post", "$$postId"] } } }
                    ],
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "comments",
                    let: { postId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$post", "$$postId"] } } }
                    ],
                    as: "comments"
                }
            },
            {
                $addFields: {
                    likeCount: { $size: "$likes" },
                    commentCount: { $size: "$comments" },
                    likedByUser: {
                        $in: [new mongoose.Types.ObjectId(userId), "$likes.user"]
                    }
                }
            },
            {
                $project: {
                    text: 1,
                    media: 1,
                    type: 1,
                    createdBy: 1,
                    createdAt: 1,
                    likeCount: 1,
                    commentCount: 1,
                    likedByUser: 1
                }
            }
        ]);

        const totalItems = await PostModel.countDocuments({ $match: { community: new mongoose.Types.ObjectId(communityId), isActive: true } },);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const paginationInfo = {
            currentPage: pageNumber,
            totalItems,
            totalPages,
        };
        return {
            message: "Postes fetched successfully",
            success: true,
            data: posts,
            pagination: paginationInfo,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function getCommentsForPost(postId: string, page: string, limit: string) {
    try {
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 10;

        const pageNumber = parsedPage > 0 ? parsedPage : 1;
        const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
        const skip = (pageNumber - 1) * itemsPerPage;


        const comments = CommentModel.find({ post: postId })
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(itemsPerPage)


        const totalItems = await CommentModel.countDocuments({ $match: { post: postId } },);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const paginationInfo = {
            currentPage: pageNumber,
            totalItems,
            totalPages,
        };
        return {
            message: "Comments fetched successfully",
            success: true,
            data: comments,
            pagination: paginationInfo,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}