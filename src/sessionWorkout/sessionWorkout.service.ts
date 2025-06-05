import mongoose from "mongoose";
import SessionWorkoutModel from "./sessionWorkout.model";
export async function assignWorkoutToSession(sessionId:string,data: Record<string, any>) {
    try {
        let savedWorkoutItems = [];
        for (const workoutItem of data.workoutItems) {
            const workoutItemObj = {
                sessionId: new mongoose.Types.ObjectId(sessionId),
                exercise: workoutItem.exercise,
                sets: workoutItem.sets,
                reps: workoutItem.reps,
                isComplete: false
            }
            if (workoutItem.timer) {
                workoutItemObj['timer'] = workoutItem.timer
            }
            const savedWorkout = await SessionWorkoutModel.create(workoutItemObj);

            savedWorkoutItems.push(savedWorkout);
        }
        
        return {
            message: "Workout assigned successfully",
            success: true,
            data: savedWorkoutItems,
        };
    } catch (error) {
        throw new Error(error);
    }
}


export async function deleteSessionWorkout(workoutId: string) {
    try {
        const deletedWorkout = await SessionWorkoutModel.findByIdAndDelete(workoutId);

        if (!deletedWorkout) {
            return {
                message: "Workout not found",
                success: false,
            };
        }

        return {
            message: "Workout deleted successfully",
            success: true,
            data: deletedWorkout,
        };
    } catch (error) {
        throw new Error(error);
    }
}