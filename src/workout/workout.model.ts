import mongoose, { Schema, Document } from "mongoose";

export interface Exercise extends Document {
    name: string;
    images: [string];
    videos: [string];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
const ExerciseSchema: Schema<Exercise> = new Schema<Exercise>({
    name: {
        type: String,
        required: false,
    },
    images: {
        type: [String],
        required: false,
    },
    videos: {
        type: [String],
        required: false,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    createdAt: {
        type: Date,
        default: () => {
            return Date.now();
        },
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: () => {
            return Date.now();
        },
    },
});
const ExerciseModel = mongoose.model<Exercise>("exercises", ExerciseSchema);

export interface EachexerciseItem extends Document {
    sets: Array<{repRange : number,timer:string  }>
    exercises:mongoose.Types.ObjectId
}

export interface WorkoutPlan extends Document {
    planName: string;
    sun: Array<EachexerciseItem>,
    mon: Array<EachexerciseItem>,
    tue: Array<EachexerciseItem>,
    wed: Array<EachexerciseItem>,
    thu: Array<EachexerciseItem>,
    fri: Array<EachexerciseItem>,
    sat: Array<EachexerciseItem>,
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
const WorkoutPlanSchema: Schema<WorkoutPlan> = new Schema<WorkoutPlan>({
    planName: {
        type: String,
        required: false,
    },
    sun: {
        sets: [
            {
                repRange: {
                    type: Number
                },
                timer: {
                    type: Number
                },
            }
        ],
        exercise: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Exercise",
            require: true
        }
    },
    mon: {
        sets: [
            {
                repRange: {
                    type: Number
                },
                timer: {
                    type: Number
                },
            }
        ],
        exercise: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Exercise",
            require: true
        }
    },
    tue: {
        sets: [
            {
                repRange: {
                    type: Number
                },
                timer: {
                    type: Number
                },
            }
        ],
        exercise: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Exercise",
            require: true
        }
    },
    wed: {
        sets: [
            {
                repRange: {
                    type: Number
                },
                timer: {
                    type: Number
                },
            }
        ],
        exercise: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Exercise",
            require: true
        }
    },
    thu: {
        sets: [
            {
                repRange: {
                    type: Number
                },
                timer: {
                    type: Number
                },
            }
        ],
        exercise: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Exercise",
            require: true
        }
    },
    fri: {
        sets: [
            {
                repRange: {
                    type: Number
                },
                timer: {
                    type: Number
                },
            }
        ],
        exercise: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Exercise",
            require: true
        }
    },
    sat: {
        sets: [
            {
                repRange: {
                    type: Number
                },
                timer: {
                    type: Number
                },
            }
        ],
        exercise: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Exercise",
            require: true
        }
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    createdAt: {
        type: Date,
        default: () => {
            return Date.now();
        },
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: () => {
            return Date.now();
        },
    },
});
const WorkoutPlanModel = mongoose.model<WorkoutPlan>("workoutplans", WorkoutPlanSchema);

export default ExerciseModel;
export { WorkoutPlanModel };

