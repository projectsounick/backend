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
      isDefault: true,
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

export async function createCorporateCommunity(
  name: string,
  companyId: string
) {
  try {
    const existing = await CommunityModel.findOne({
      company: new mongoose.Types.ObjectId(companyId),
    });
    if (existing) {
      return {
        message: "Corporate community already exists",
        success: false,
      };
    }

    const community = await CommunityModel.create({
      name: name,
      isCorporate: true,
      company: new mongoose.Types.ObjectId(companyId),
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
export async function getUserCommunityId(userId: string) {
  try {
    const community = await CommunityModel.findOne({
      members: new mongoose.Types.ObjectId(userId),
    });

    if (!community) {
      return {
        success: false,
        communityId: null,
        message: "No community found for this user.",
      };
    }

    return {
      success: true,
      communityId: community._id,
      message: "Community found successfully.",
    };
  } catch (error) {
    console.error("Error fetching user community:", error);
    return {
      success: false,
      communityId: null,
      message: "An error occurred while fetching the community.",
    };
  }
}
export async function getAllCommunities(
  status: any,
  page: string,
  limit: string
) {
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
          as: "posts",
        },
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
          postCount: { $size: "$posts" },
        },
      },
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

export async function getUserCommunities(
  userId: string,
  status: any,
  page: string,
  limit: string
) {
  try {
    const queryObj: any = {
      members: new mongoose.Types.ObjectId(userId),
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
          as: "posts",
        },
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
          postCount: { $size: "$posts" },
        },
      },
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
      },
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

export async function getCommunityPosts(
  communityId: string,
  userId: string,
  page: string,
  limit: string
) {
  try {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;

    const pageNumber = parsedPage > 0 ? parsedPage : 1;
    const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
    const skip = (pageNumber - 1) * itemsPerPage;

    const posts = await PostModel.aggregate([
      {
        $match: {
          community: new mongoose.Types.ObjectId(communityId),
          isActive: true,
        },
      },
      { $sort: { createdAt: -1, isActive: -1 } },
      { $skip: skip },
      { $limit: itemsPerPage },

      // Populate likes
      {
        $lookup: {
          from: "likes",
          let: { postId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$post", "$$postId"] } } }],
          as: "likes",
        },
      },

      // Populate comments
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$post", "$$postId"] } } }],
          as: "comments",
        },
      },

      // Populate createdBy with user info
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser",
        },
      },
      { $unwind: "$createdByUser" },

      // Add like/comment counts and if user liked
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          commentCount: { $size: "$comments" },
          likedByUser: {
            $in: [new mongoose.Types.ObjectId(userId), "$likes.user"],
          },
        },
      },

      // Project required fields
      {
        $project: {
          text: 1,
          media: 1,
          type: 1,
          createdAt: 1,
          likeCount: 1,
          commentCount: 1,
          likedByUser: 1,
          "createdBy._id": "$createdByUser._id",
          "createdBy.name": "$createdByUser.name",
          "createdBy.profilePic": "$createdByUser.profilePic",
        },
      },
    ]);

    const totalItems = await PostModel.countDocuments({
      community: new mongoose.Types.ObjectId(communityId),
      isActive: true,
    });

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      message: "Posts fetched successfully",
      success: true,
      data: posts,
      pagination: {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      },
    };
  } catch (error: any) {
    console.log(error.message);
    throw new Error(error.message);
  }
}

export async function getCommentsForPost(
  postId: string,
  page?: string,
  limit?: string
) {
  try {
    const hasPagination = page && limit;
    let comments;

    if (hasPagination) {
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);

      const pageNumber = parsedPage > 0 ? parsedPage : 1;
      const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
      const skip = (pageNumber - 1) * itemsPerPage;

      comments = await CommentModel.find({ post: postId })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage);

      const totalItems = await CommentModel.countDocuments({ post: postId });
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      return {
        message: "Comments fetched with pagination",
        success: true,
        data: comments,
        pagination: {
          currentPage: pageNumber,
          totalItems,
          totalPages,
        },
      };
    } else {
      // No pagination — fetch all comments
      comments = await CommentModel.find({ post: postId })
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      return {
        message: "All comments fetched successfully",
        success: true,
        data: comments,
        pagination: null,
      };
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(error.message || "Error fetching comments");
  }
}
