import mongoose from "mongoose";
import UserActivePlansModel from "../userActivePlans/activePlans.model";
import UserActiveServicesModel from "../userActivePlans/activeServices.model";
import SessionModel from "../sessions/sessions.model";
import CartModel from "../cart/cart.model";

/**
 * Interface for user filter parameters
 */
export interface UserFilterParams {
  gender?: string[];
  age?: number[];
  isCorporateUser?: boolean;
  search?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  hasPlansOrServices?: boolean;
  sessionWeekStart?: Date | null;
  sessionWeekEnd?: Date | null;
  hasCartItems?: boolean;
  hasMedicalConditions?: boolean;
  joinStartDate?: Date | null;
  joinEndDate?: Date | null;
}

/**
 * Interface for filter query object
 */
export interface UserFilterQuery {
  baseQuery: Record<string, any>;
  userIds?: mongoose.Types.ObjectId[];
  requiresEarlyReturn?: boolean;
}

/**
 * Parses query parameters into structured filter parameters
 */
export function parseUserFilterParams(query: Record<string, any>): UserFilterParams {
  // Normalize gender to lowercase for case-insensitive matching
  const genderArray = query.gender?.split(",") || [];
  const normalizedGender = genderArray.map((g: string) => g.toLowerCase().trim());
  
  return {
    gender: normalizedGender,
    age: query.age?.split(",").map(Number) || [],
    isCorporateUser: query.isCorporateUser === "true",
    search: query.search || "",
    startDate: query.startDate ? new Date(query.startDate) : null,
    endDate: query.endDate ? new Date(query.endDate) : null,
    hasPlansOrServices: query.hasPlansOrServices === "true",
    sessionWeekStart: query.sessionWeekStart ? new Date(query.sessionWeekStart) : null,
    sessionWeekEnd: query.sessionWeekEnd ? new Date(query.sessionWeekEnd) : null,
    hasCartItems: query.hasCartItems === "true",
    hasMedicalConditions: query.hasMedicalConditions === "true",
    joinStartDate: query.joinStartDate ? new Date(query.joinStartDate) : null,
    joinEndDate: query.joinEndDate ? new Date(query.joinEndDate) : null,
  };
}

/**
 * Gets user IDs that have sessions in the specified week
 */
async function getUserIdsFromSessions(
  weekStart: Date | null,
  weekEnd: Date | null
): Promise<mongoose.Types.ObjectId[]> {
  if (!weekStart || !weekEnd) {
    return [];
  }

  // Find sessions within the week range
  const sessionQuery: any = {
    isActive: true,
    sessionDate: {
      $gte: weekStart,
      $lte: weekEnd,
    },
  };

  const sessionUserIds = await SessionModel.find(sessionQuery).distinct("userId");
  return sessionUserIds.map((id: any) => new mongoose.Types.ObjectId(id));
}

/**
 * Gets user IDs that have cart items
 */
async function getUserIdsWithCartItems(): Promise<mongoose.Types.ObjectId[]> {
  const cartQuery: any = {
    isDeleted: false,
    isBought: false,
  };

  const cartUserIds = await CartModel.find(cartQuery).distinct("userId");
  return cartUserIds.map((id: any) => new mongoose.Types.ObjectId(id));
}

/**
 * Gets user IDs that match plans/services filters (date range and/or has plans/services)
 */
async function getUserIdsFromPlansAndServices(
  startDate: Date | null,
  endDate: Date | null,
  hasPlansOrServices: boolean
): Promise<mongoose.Types.ObjectId[]> {
  const hasDateFilter = startDate !== null && startDate !== undefined;
  const hasEndDateFilter = endDate !== null && endDate !== undefined;
  const shouldFilter = hasPlansOrServices === true || hasDateFilter || hasEndDateFilter;

  if (!shouldFilter) {
    return []; // Return empty array if no filter should be applied
  }

  const planQuery: any = { isActive: true };
  const serviceQuery: any = { isActive: true };

  // Add date range filter if provided
  if (hasDateFilter || hasEndDateFilter) {
    planQuery.createdAt = {};
    serviceQuery.createdAt = {};
    
    if (hasDateFilter && startDate) {
      planQuery.createdAt.$gte = startDate;
      serviceQuery.createdAt.$gte = startDate;
    }
    
    if (hasEndDateFilter && endDate) {
      // Set end date to end of day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      planQuery.createdAt.$lte = endOfDay;
      serviceQuery.createdAt.$lte = endOfDay;
    }
  }

  // Get user IDs from plans and services based on filters
  const [planUsers, serviceUsers] = await Promise.all([
    UserActivePlansModel.find(planQuery).distinct("userId"),
    UserActiveServicesModel.find(serviceQuery).distinct("userId"),
  ]);

  // Combine unique user IDs
  const allUserIds = Array.from(new Set([...planUsers, ...serviceUsers]));
  
  return allUserIds.map((id: any) => new mongoose.Types.ObjectId(id));
}

/**
 * Builds the base query object for filtering users
 */
export function buildBaseUserQuery(params: UserFilterParams): Record<string, any> {
  const queryObj: any = { role: "user" };

  // Gender filter - case insensitive using $or with regex
  if (params.gender && params.gender.length > 0) {
    // Create case-insensitive regex conditions for each gender value
    const genderConditions = params.gender.map((g: string) => ({
      sex: { $regex: new RegExp(`^${g.trim()}$`, "i") },
    }));
    queryObj["$or"] = genderConditions;
  }

  // Age filter (only apply if not default range)
  // Calculate actual age considering year, month, and day using proper date arithmetic
  if (
    params.age &&
    params.age.length > 0 &&
    !(params.age[0] === 0 && params.age[1] === 100)
  ) {
    const minAge = Math.min(...params.age);
    const maxAge = Math.max(...params.age);
    
    // Calculate date thresholds for age range
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // For minimum age: person must be at least minAge years old today
    // Someone who is exactly minAge today was born on or before (today - minAge years)
    // Example: If today is 2024-12-27 and minAge is 25, max DOB is 1999-12-27
    const maxBirthDate = new Date(today);
    maxBirthDate.setFullYear(today.getFullYear() - minAge);
    maxBirthDate.setHours(23, 59, 59, 999);
    
    // For maximum age: person must be at most maxAge years old today
    // Someone who is maxAge today was born on (today - maxAge years)
    // Someone who is maxAge+1 today was born before (today - maxAge years)
    // We want people who are maxAge or less
    // Example: If today is 2024-12-27 and maxAge is 30:
    //   - Born 1994-12-27 = exactly 30 today (INCLUDE)
    //   - Born 1994-12-28 = 29 today (INCLUDE)
    //   - Born 1993-12-27 = 31 today (EXCLUDE, already had 31st birthday)
    //   - Born 1993-12-28 = 30 today (INCLUDE, hasn't had 31st birthday yet)
    // So min DOB should be 1993-12-28 (one day after today - maxAge - 1 years)
    const minBirthDate = new Date(today);
    minBirthDate.setFullYear(today.getFullYear() - maxAge - 1);
    minBirthDate.setDate(minBirthDate.getDate() + 1); // Add one day to include people who haven't turned maxAge+1 yet
    minBirthDate.setHours(0, 0, 0, 0);
    
    // Age filter: dob should be between minBirthDate and maxBirthDate
    queryObj["dob"] = {
      $gte: minBirthDate,
      $lte: maxBirthDate,
      $exists: true,
      $ne: null,
    };
  }

  // Join date filter (createdAt)
  if (params.joinStartDate || params.joinEndDate) {
    const joinDateFilter: any = {};
    if (params.joinStartDate) {
      joinDateFilter.$gte = new Date(params.joinStartDate);
      joinDateFilter.$gte.setHours(0, 0, 0, 0);
    }
    if (params.joinEndDate) {
      const endOfDay = new Date(params.joinEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      joinDateFilter.$lte = endOfDay;
    }
    queryObj["createdAt"] = joinDateFilter;
  }

  // Search filter - combine with gender filter if both exist
  if (params.search) {
    const searchRegex = { $regex: params.search, $options: "i" };
    const searchConditions: any[] = [
      { name: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex },
    ];

    // Add ObjectId search if search string is a valid ObjectId
    if (params.search.match(/^[0-9a-fA-F]{24}$/)) {
      searchConditions.push({
        _id: new mongoose.Types.ObjectId(params.search),
      });
    }

    // If gender filter already set up $or, combine with search using $and
    if (queryObj["$or"] && params.gender && params.gender.length > 0) {
      // We need both gender AND search to match
      const genderOr = queryObj["$or"];
      delete queryObj["$or"];
      queryObj["$and"] = [
        { $or: genderOr },
        { $or: searchConditions },
      ];
    } else {
      queryObj["$or"] = searchConditions;
    }
  }

  return queryObj;
}

/**
 * Builds the MongoDB aggregation pipeline for fetching users
 */
export function buildUserAggregationPipeline(
  baseQuery: Record<string, any>,
  userIds?: mongoose.Types.ObjectId[],
  isCorporateUser?: boolean,
  hasMedicalConditions?: boolean
): any[] {
  const pipeline: any[] = [];

  // Add user ID filter if provided
  if (userIds && userIds.length > 0) {
    baseQuery["_id"] = { $in: userIds };
  }

  // Initial match stage
  pipeline.push({
    $match: baseQuery,
  });

  // Lookup user details
  pipeline.push({
    $lookup: {
      from: "userdetails",
      localField: "_id",
      foreignField: "userId",
      as: "userDetails",
    },
  });

  // Unwind user details (preserve users without details)
  pipeline.push({
    $unwind: {
      path: "$userDetails",
      preserveNullAndEmptyArrays: true,
    },
  });

  // Apply corporate user filter after lookup (since it's a nested field)
  if (isCorporateUser) {
    pipeline.push({
      $match: {
        "userDetails.companyId": { $exists: true, $ne: null },
      },
    });
  }

  // Apply medical condition filter after lookup (users with any medical conditions)
  if (hasMedicalConditions) {
    pipeline.push({
      $match: {
        $and: [
          { "userDetails.medicalConditions": { $exists: true } },
          { "userDetails.medicalConditions": { $ne: null } },
          { "userDetails.medicalConditions": { $not: { $size: 0 } } },
        ],
      },
    });
  }

  // Sort by creation date (newest first)
  pipeline.push({
    $sort: { createdAt: -1 },
  });

  return pipeline;
}

/**
 * Main function to build filter query for getAllUsers
 */
export async function buildUserFilterQuery(
  params: UserFilterParams
): Promise<UserFilterQuery> {
  // Collect all user IDs from different filters
  const allUserIds: mongoose.Types.ObjectId[] = [];
  
  // Get user IDs from plans/services filters
  const planServiceUserIds = await getUserIdsFromPlansAndServices(
    params.startDate,
    params.endDate,
    params.hasPlansOrServices || false
  );
  
  // Get user IDs from sessions week filter
  const sessionUserIds = await getUserIdsFromSessions(
    params.sessionWeekStart || null,
    params.sessionWeekEnd || null
  );
  
  // Get user IDs from cart items filter
  let cartUserIds: mongoose.Types.ObjectId[] = [];
  if (params.hasCartItems) {
    cartUserIds = await getUserIdsWithCartItems();
  }

  // Check if any filters require specific user IDs
  const hasDateFilter =
    params.startDate !== null && params.startDate !== undefined;
  const hasEndDateFilter = params.endDate !== null && params.endDate !== undefined;
  const shouldFilterByPlansServices =
    params.hasPlansOrServices === true || hasDateFilter || hasEndDateFilter;
  const hasSessionWeekFilter =
    params.sessionWeekStart !== null && params.sessionWeekEnd !== null;
  
  // Combine all user ID filters
  const filterConditions: mongoose.Types.ObjectId[][] = [];
  
  if (shouldFilterByPlansServices && planServiceUserIds.length > 0) {
    filterConditions.push(planServiceUserIds);
  } else if (shouldFilterByPlansServices && planServiceUserIds.length === 0) {
    // If filter requires plans/services but no users found, return early
    return {
      baseQuery: {},
      requiresEarlyReturn: true,
    };
  }
  
  if (hasSessionWeekFilter && sessionUserIds.length > 0) {
    filterConditions.push(sessionUserIds);
  } else if (hasSessionWeekFilter && sessionUserIds.length === 0) {
    // If filter requires sessions but no users found, return early
    return {
      baseQuery: {},
      requiresEarlyReturn: true,
    };
  }
  
  if (params.hasCartItems && cartUserIds.length > 0) {
    filterConditions.push(cartUserIds);
  } else if (params.hasCartItems && cartUserIds.length === 0) {
    // If filter requires cart items but no users found, return early
    return {
      baseQuery: {},
      requiresEarlyReturn: true,
    };
  }
  
  // Find intersection of all filter conditions (users must match ALL active filters)
  if (filterConditions.length > 0) {
    // Start with the first condition
    let intersection = new Set(filterConditions[0].map(id => id.toString()));
    
    // Find intersection with remaining conditions
    for (let i = 1; i < filterConditions.length; i++) {
      const currentSet = new Set(filterConditions[i].map(id => id.toString()));
      intersection = new Set([...intersection].filter(id => currentSet.has(id)));
    }
    
    allUserIds.push(...Array.from(intersection).map(id => new mongoose.Types.ObjectId(id)));
    
    // If intersection is empty, return early
    if (allUserIds.length === 0) {
      return {
        baseQuery: {},
        requiresEarlyReturn: true,
      };
    }
  }

  // Build base query
  const baseQuery = buildBaseUserQuery(params);

  return {
    baseQuery,
    userIds: allUserIds.length > 0 ? allUserIds : undefined,
    requiresEarlyReturn: false,
  };
}

/**
 * Builds aggregation pipeline for trainer assigned users
 * This is similar to buildUserAggregationPipeline but for trainer-specific use case
 */
export function buildTrainerUserAggregationPipeline(
  baseQuery: Record<string, any>,
  assignedUserIds: mongoose.Types.ObjectId[],
  isCorporateUser?: boolean
): any[] {
  const pipeline: any[] = [];

  // Add assigned user IDs filter
  baseQuery["_id"] = { $in: assignedUserIds };

  // Initial match stage
  pipeline.push({
    $match: baseQuery,
  });

  // Lookup user details
  pipeline.push({
    $lookup: {
      from: "userdetails",
      localField: "_id",
      foreignField: "userId",
      as: "userDetails",
    },
  });

  // Unwind user details (preserve users without details)
  pipeline.push({
    $unwind: {
      path: "$userDetails",
      preserveNullAndEmptyArrays: true,
    },
  });

  // Apply corporate user filter after lookup
  if (isCorporateUser) {
    pipeline.push({
      $match: {
        "userDetails.companyId": { $exists: true, $ne: null },
      },
    });
  }

  // Project to exclude phone number (trainer view doesn't need it)
  pipeline.push({
    $project: {
      phoneNumber: 0,
    },
  });

  return pipeline;
}

