/**
 * Health Sync Service
 * Handles syncing health data from iOS (Apple Health) and Android (Google Fit)
 */

import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";
import WalkTrackingModel from "./walkTracking.model";
import SleepTrackingModel from "./sleepTracking.model";
import { UserDetailsModel } from "../users/user.model";

// Debug file path - put in backend root
const DEBUG_FILE_PATH = path.join(process.cwd(), "health-sync-debug.json");

// ============================================
// Types
// ============================================

interface HealthDataEntry {
  date: string;
  value: number;
  totalHealthKitValue?: number; // Optional: total HealthKit value for this date (for backend to store correctly)
}

interface SyncData {
  steps?: HealthDataEntry[];
  sleep?: HealthDataEntry[];
}

type Platform = "ios" | "android";

interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    stepsCount: number;
    sleepCount: number;
  };
  error?: string;
}

interface SyncStatus {
  stepSync: boolean;
  sleepSync: boolean;
  syncModalShown: boolean;
  lastSyncedStepsValue?: number | null;
  lastSyncedStepsDate?: Date | null; // Also serves as lastSyncIOS equivalent
  lastSyncedSleepValue?: number | null;
  lastSyncedSleepDate?: Date | null; // Also serves as lastSyncAndroid equivalent
}

// ============================================
// Constants
// ============================================

const LOG_PREFIX = "[HealthSync]";

// ============================================
// Main Sync Function
// ============================================

/**
 * Sync health data (steps and/or sleep) for a user
 * Merges with existing data - additive for same dates
 */
export async function syncHealthData(
  userId: string,
  data: SyncData,
  platform: Platform
): Promise<SyncResult> {
  try {
    console.log(`${LOG_PREFIX} Starting sync for user ${userId}, platform: ${platform}`);

    // Save debug data to file
    await saveDebugData(userId, data, platform);

    // Validate inputs
    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    if (!data.steps?.length && !data.sleep?.length) {
      return { success: false, message: "No data to sync" };
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    let stepsCount = 0;
    let sleepCount = 0;

    // Sync steps
    if (data.steps?.length) {
      stepsCount = await syncStepsData(userObjectId, data.steps);
    }

    // Sync sleep
    if (data.sleep?.length) {
      sleepCount = await syncSleepData(userObjectId, data.sleep);
    }

    // Update user sync status
    await updateUserSyncStatus(userId, data, platform);

    console.log(`${LOG_PREFIX} Sync complete: ${stepsCount} steps, ${sleepCount} sleep entries`);

    return {
      success: true,
      message: "Health data synced successfully",
      data: { stepsCount, sleepCount },
    };
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error:`, error);
    return {
      success: false,
      message: "Failed to sync health data",
      error: error.message,
    };
  }
}

// ============================================
// Steps Sync
// ============================================

async function syncStepsData(
  userId: mongoose.Types.ObjectId,
  steps: HealthDataEntry[]
): Promise<number> {
  console.log(`${LOG_PREFIX} Syncing ${steps.length} step entries`);

  const operations = steps.map(async (entry) => {
    const normalizedDate = normalizeDate(entry.date);
    const stepsValue = Math.max(0, Math.round(entry.value || 0));
    
    // If totalHealthKitValue is provided, use it for upsert (prevents duplicates on re-sync)
    const totalHealthKitValue = entry.totalHealthKitValue ? Math.round(entry.totalHealthKitValue) : null;

    if (stepsValue === 0 && !totalHealthKitValue) return null;

    try {
      const existing = await WalkTrackingModel.findOne({
        userId,
        date: normalizedDate,
      });

      if (existing) {
        // If totalHealthKitValue is provided, use max logic to prevent duplicates
        // This handles re-sync scenarios where same data might be sent again
        if (totalHealthKitValue !== null) {
          // Check if this is likely a duplicate sync by comparing values
          const existingValue = existing.steps || 0;
          const existingHealthKitValue = existing.healthKitValue || 0;
          
          if (totalHealthKitValue <= existingHealthKitValue) {
            // Already synced this or more data, skip to prevent duplicates
            console.log(
              `${LOG_PREFIX} Steps skipped for ${normalizedDate}: HealthKit ${totalHealthKitValue} <= existing HealthKit ${existingHealthKitValue}`
            );
            return existing;
          }
          
          // Calculate incremental difference
          const increment = totalHealthKitValue - existingHealthKitValue;
          existing.steps = existingValue + increment;
          existing.healthKitValue = totalHealthKitValue;
          await existing.save();
          
          console.log(
            `${LOG_PREFIX} Steps updated for ${normalizedDate}: ${existingValue} + ${increment} = ${existing.steps} (HealthKit: ${totalHealthKitValue})`
          );
          return existing;
        }
        
        // Legacy: simple additive merge (for incremental updates within same day)
        const previousValue = existing.steps || 0;
        existing.steps = previousValue + stepsValue;
        await existing.save();

        console.log(
          `${LOG_PREFIX} Steps merged for ${normalizedDate}: ${previousValue} + ${stepsValue} = ${existing.steps}`
        );
        return existing;
      } else {
        // Create new entry
        const newEntry = await WalkTrackingModel.create({
          userId,
          steps: totalHealthKitValue || stepsValue,
          healthKitValue: totalHealthKitValue || stepsValue,
          date: normalizedDate,
        });

        console.log(`${LOG_PREFIX} Steps created for ${normalizedDate}: ${newEntry.steps}`);
        return newEntry;
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error syncing steps for ${normalizedDate}:`, error);
      return null;
    }
  });

  const results = await Promise.all(operations);
  return results.filter(Boolean).length;
}

// ============================================
// Sleep Sync
// ============================================

async function syncSleepData(
  userId: mongoose.Types.ObjectId,
  sleep: HealthDataEntry[]
): Promise<number> {
  console.log(`${LOG_PREFIX} Syncing ${sleep.length} sleep entries`);

  const operations = sleep.map(async (entry) => {
    const sleepDate = new Date(entry.date);
    sleepDate.setHours(0, 0, 0, 0);
    const sleepValue = Math.max(0, Math.round(entry.value * 10) / 10); // Round to 1 decimal
    
    // If totalHealthKitValue is provided, use it for upsert (prevents duplicates on re-sync)
    const totalHealthKitValue = entry.totalHealthKitValue ? Math.round(entry.totalHealthKitValue * 10) / 10 : null;

    if (sleepValue === 0 && !totalHealthKitValue) return null;

    try {
      const existing = await SleepTrackingModel.findOne({
        userId,
        date: sleepDate,
      });

      if (existing) {
        // If totalHealthKitValue is provided, use max logic to prevent duplicates
        if (totalHealthKitValue !== null) {
          const existingValue = existing.sleepDuration || 0;
          const existingHealthKitValue = existing.healthKitValue || 0;
          
          if (totalHealthKitValue <= existingHealthKitValue) {
            // Already synced this or more data, skip to prevent duplicates
            console.log(
              `${LOG_PREFIX} Sleep skipped for ${sleepDate.toISOString()}: HealthKit ${totalHealthKitValue} <= existing HealthKit ${existingHealthKitValue}`
            );
            return existing;
          }
          
          // Calculate incremental difference
          const increment = totalHealthKitValue - existingHealthKitValue;
          existing.sleepDuration = existingValue + increment;
          existing.healthKitValue = totalHealthKitValue;
          await existing.save();
          
          console.log(
            `${LOG_PREFIX} Sleep updated for ${sleepDate.toISOString()}: ${existingValue} + ${increment} = ${existing.sleepDuration} (HealthKit: ${totalHealthKitValue})`
          );
          return existing;
        }
        
        // Legacy: simple additive merge
        const previousValue = existing.sleepDuration || 0;
        existing.sleepDuration = previousValue + sleepValue;
        await existing.save();

        console.log(
          `${LOG_PREFIX} Sleep merged for ${sleepDate.toISOString()}: ${previousValue} + ${sleepValue} = ${existing.sleepDuration}`
        );
        return existing;
      } else {
        // Create new entry
        const newEntry = await SleepTrackingModel.create({
          userId,
          sleepDuration: totalHealthKitValue || sleepValue,
          healthKitValue: totalHealthKitValue || sleepValue,
          date: sleepDate,
        });

        console.log(`${LOG_PREFIX} Sleep created for ${sleepDate.toISOString()}: ${newEntry.sleepDuration}`);
        return newEntry;
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error syncing sleep for ${sleepDate.toISOString()}:`, error);
      return null;
    }
  });

  const results = await Promise.all(operations);
  return results.filter(Boolean).length;
}

// ============================================
// User Sync Status
// ============================================

async function updateUserSyncStatus(
  userId: string,
  data: SyncData,
  platform: Platform
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Build update object
  const updateFields: Record<string, any> = {};

  if (data.steps?.length) {
    updateFields["healthSync.stepSync"] = true;
    updateFields["healthSync.syncModalShown"] = true; // Mark modal as shown when sync is enabled
    
    // Find today's steps entry and store the total HealthKit value
    const todaySteps = data.steps.find(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    if (todaySteps) {
      // Get today's entry (should be only one entry for today)
      const todayEntry = data.steps.find(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
      
      if (todayEntry) {
        // If frontend sent totalHealthKitValue, use it directly (most reliable)
        // Otherwise, calculate from incremental value + existing value
        let newTotal: number;
        
        if (todayEntry.totalHealthKitValue !== undefined && todayEntry.totalHealthKitValue !== null) {
          // Frontend sent the total HealthKit value - use it directly
          newTotal = todayEntry.totalHealthKitValue;
          console.log(`${LOG_PREFIX} Steps sync - Using totalHealthKitValue from frontend: ${newTotal}`);
        } else {
          // Fallback: calculate from incremental value
          const incrementalValue = todayEntry.value;
          const userDetails = await UserDetailsModel.findOne({ userId: userObjectId });
          const existingLastSyncedValue = userDetails?.healthSync?.lastSyncedStepsValue || 0;
          const existingLastSyncedDate = userDetails?.healthSync?.lastSyncedStepsDate 
            ? new Date(userDetails.healthSync.lastSyncedStepsDate) 
            : null;
          
          // Check if last sync was today (compare dates only, not times)
          let isLastSyncedToday = false;
          if (existingLastSyncedDate) {
            const existingDateOnly = new Date(existingLastSyncedDate);
            existingDateOnly.setHours(0, 0, 0, 0);
            isLastSyncedToday = existingDateOnly.getTime() === today.getTime();
          }
          
          newTotal = isLastSyncedToday
            ? existingLastSyncedValue + incrementalValue
            : incrementalValue; // First sync today - incremental is the total
          
          console.log(`${LOG_PREFIX} Steps sync - Incremental: ${incrementalValue}, Existing: ${existingLastSyncedValue}, New Total: ${newTotal}, Last synced today: ${isLastSyncedToday}`);
        }
        
        updateFields["healthSync.lastSyncedStepsValue"] = newTotal;
        updateFields["healthSync.lastSyncedStepsDate"] = now;
      }
    }
  }

  if (data.sleep?.length) {
    updateFields["healthSync.sleepSync"] = true;
    updateFields["healthSync.syncModalShown"] = true; // Mark modal as shown when sync is enabled
    
    // Find today's sleep entry and store the total HealthKit value
    const todaySleep = data.sleep.find(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    if (todaySleep) {
      // Get today's entry (should be only one entry for today)
      const todayEntry = data.sleep.find(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
      
      if (todayEntry) {
        // If frontend sent totalHealthKitValue, use it directly (most reliable)
        // Otherwise, calculate from incremental value + existing value
        let newTotal: number;
        
        if (todayEntry.totalHealthKitValue !== undefined && todayEntry.totalHealthKitValue !== null) {
          // Frontend sent the total HealthKit value - use it directly
          newTotal = todayEntry.totalHealthKitValue;
          console.log(`${LOG_PREFIX} Sleep sync - Using totalHealthKitValue from frontend: ${newTotal}`);
        } else {
          // Fallback: calculate from incremental value
          const incrementalValue = todayEntry.value;
          const userDetails = await UserDetailsModel.findOne({ userId: userObjectId });
          const existingLastSyncedValue = userDetails?.healthSync?.lastSyncedSleepValue || 0;
          const existingLastSyncedDate = userDetails?.healthSync?.lastSyncedSleepDate 
            ? new Date(userDetails.healthSync.lastSyncedSleepDate) 
            : null;
          
          // Check if last sync was today (compare dates only, not times)
          let isLastSyncedToday = false;
          if (existingLastSyncedDate) {
            const existingDateOnly = new Date(existingLastSyncedDate);
            existingDateOnly.setHours(0, 0, 0, 0);
            isLastSyncedToday = existingDateOnly.getTime() === today.getTime();
          }
          
          newTotal = isLastSyncedToday
            ? existingLastSyncedValue + incrementalValue
            : incrementalValue; // First sync today - incremental is the total
          
          console.log(`${LOG_PREFIX} Sleep sync - Incremental: ${incrementalValue}, Existing: ${existingLastSyncedValue}, New Total: ${newTotal}, Last synced today: ${isLastSyncedToday}`);
        }
        
        updateFields["healthSync.lastSyncedSleepValue"] = newTotal;
        updateFields["healthSync.lastSyncedSleepDate"] = now;
      }
    }
  }

  if (Object.keys(updateFields).length === 0) return;

  try {
    // Check if user details exist
    const existing = await UserDetailsModel.findOne({ userId: userObjectId });

    if (existing) {
      // Update existing
      await UserDetailsModel.findOneAndUpdate(
        { userId: userObjectId },
        { $set: updateFields },
        { new: true }
      );
    } else {
      // Create new with healthSync field
      const newHealthSync: any = {
        stepSync: !!data.steps?.length,
        sleepSync: !!data.sleep?.length,
        syncModalShown: true, // Mark modal as shown when sync is enabled
      };
      
      if (data.steps?.length) {
        const todaySteps = data.steps.find(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === today.getTime();
        });
        if (todaySteps) {
          const todayTotal = data.steps
            .filter(entry => {
              const entryDate = new Date(entry.date);
              entryDate.setHours(0, 0, 0, 0);
              return entryDate.getTime() === today.getTime();
            })
            .reduce((sum, entry) => sum + entry.value, 0);
          newHealthSync.lastSyncedStepsValue = todayTotal;
          newHealthSync.lastSyncedStepsDate = now;
        }
      }
      
      if (data.sleep?.length) {
        const todaySleep = data.sleep.find(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === today.getTime();
        });
        if (todaySleep) {
          const todayTotal = data.sleep
            .filter(entry => {
              const entryDate = new Date(entry.date);
              entryDate.setHours(0, 0, 0, 0);
              return entryDate.getTime() === today.getTime();
            })
            .reduce((sum, entry) => sum + entry.value, 0);
          newHealthSync.lastSyncedSleepValue = todayTotal;
          newHealthSync.lastSyncedSleepDate = now;
        }
      }
      
      await UserDetailsModel.create({
        userId: userObjectId,
        healthSync: newHealthSync,
      });
    }

    console.log(`${LOG_PREFIX} Updated sync status for user ${userId}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating sync status:`, error);
    // Don't throw - sync data is already saved
  }
}

// ============================================
// Get Sync Status
// ============================================

/**
 * Get user's health sync status
 */
export async function getHealthSyncStatus(userId: string): Promise<{
  success: boolean;
  data?: SyncStatus & {
    lastSyncedStepsValue?: number;
    lastSyncedStepsDate?: Date;
    lastSyncedSleepValue?: number;
    lastSyncedSleepDate?: Date;
  };
  message?: string;
  error?: string;
}> {
  try {
    const userDetails = await UserDetailsModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
console.log("it is userDetails sync", userDetails);
    // Default status for users without healthSync field
    const defaultStatus: SyncStatus = {
      syncModalShown: false,
      stepSync: false,
      sleepSync: false,
    };
console.log("it is defaultStatus sync", defaultStatus);
    const syncData = userDetails?.healthSync;
    console.log("it is syncData sync", syncData);
    if (!syncData) {
      return { success: true, data: defaultStatus };
    }

    const status: SyncStatus = {
      syncModalShown: syncData.syncModalShown ?? false,
      stepSync: syncData.stepSync ?? false,
      sleepSync: syncData.sleepSync ?? false,
      lastSyncedStepsValue: syncData.lastSyncedStepsValue ?? null,
      lastSyncedStepsDate: syncData.lastSyncedStepsDate ?? null,
      lastSyncedSleepValue: syncData.lastSyncedSleepValue ?? null,
      lastSyncedSleepDate: syncData.lastSyncedSleepDate ?? null,
    };

    return { success: true, data: status };
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error getting sync status:`, error);
    return {
      success: false,
      message: "Failed to get sync status",
      error: error.message,
    };
  }
}

/**
 * Disable health sync for a specific type
 */
export async function disableHealthSync(
  userId: string,
  type: "steps" | "sleep"
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`${LOG_PREFIX} Disabling ${type} sync for user ${userId}`);
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Update healthSync field to disable the specific type
    const updateField = type === "steps" ? "healthSync.stepSync" : "healthSync.sleepSync";
    
    await UserDetailsModel.updateOne(
      { userId: userObjectId },
      { 
        $set: { [updateField]: false },
        // Also update old field for backward compatibility
        [`appleHealth.${type === "steps" ? "stepSync" : "sleepSync"}`]: false,
      },
      { upsert: false }
    );

    console.log(`${LOG_PREFIX} ${type} sync disabled successfully`);
    return {
      success: true,
      message: `${type} sync disabled successfully`,
    };
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error disabling ${type} sync:`, error);
    return {
      success: false,
      message: `Failed to disable ${type} sync: ${error.message}`,
    };
  }
}

// ============================================
// Helpers
// ============================================

function normalizeDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
}

/**
 * Save incoming data to a debug file for inspection
 */
async function saveDebugData(
  userId: string,
  data: SyncData,
  platform: Platform
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    
    const debugEntry = {
      timestamp,
      userId,
      platform,
      stepsCount: data.steps?.length || 0,
      sleepCount: data.sleep?.length || 0,
      steps: data.steps?.map((entry, index) => ({
        index,
        date: entry.date,
        dateFormatted: new Date(entry.date).toLocaleDateString(),
        value: entry.value,
      })),
      sleep: data.sleep?.map((entry, index) => ({
        index,
        date: entry.date,
        dateFormatted: new Date(entry.date).toLocaleDateString(),
        value: entry.value,
      })),
      summary: {
        steps: data.steps ? {
          total: data.steps.reduce((sum, e) => sum + e.value, 0),
          average: data.steps.length > 0 ? Math.round(data.steps.reduce((sum, e) => sum + e.value, 0) / data.steps.length) : 0,
          min: data.steps.length > 0 ? Math.min(...data.steps.map(e => e.value)) : 0,
          max: data.steps.length > 0 ? Math.max(...data.steps.map(e => e.value)) : 0,
        } : null,
        sleep: data.sleep ? {
          total: data.sleep.reduce((sum, e) => sum + e.value, 0),
          average: data.sleep.length > 0 ? Math.round(data.sleep.reduce((sum, e) => sum + e.value, 0) / data.sleep.length * 10) / 10 : 0,
          min: data.sleep.length > 0 ? Math.min(...data.sleep.map(e => e.value)) : 0,
          max: data.sleep.length > 0 ? Math.max(...data.sleep.map(e => e.value)) : 0,
        } : null,
      },
    };

    // Read existing data or create new array
    let allEntries: any[] = [];
    if (fs.existsSync(DEBUG_FILE_PATH)) {
      try {
        const existingData = fs.readFileSync(DEBUG_FILE_PATH, "utf-8");
        allEntries = JSON.parse(existingData);
      } catch {
        allEntries = [];
      }
    }

    // Add new entry at the beginning
    allEntries.unshift(debugEntry);

    // Keep only last 50 entries to avoid huge files
    if (allEntries.length > 50) {
      allEntries = allEntries.slice(0, 50);
    }

    // Write back to file
    fs.writeFileSync(DEBUG_FILE_PATH, JSON.stringify(allEntries, null, 2));
    
    console.log(`${LOG_PREFIX} Debug data saved to: ${DEBUG_FILE_PATH}`);
    console.log(`${LOG_PREFIX} Summary: ${data.steps?.length || 0} steps, ${data.sleep?.length || 0} sleep entries`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error saving debug data:`, error);
    // Don't throw - this is just for debugging
  }
}
