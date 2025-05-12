interface UserInterface {
  toObject(): any;
  _id: string;
  name: string;
  phoneNumber: string;
  otp: number;
  onboarding: boolean;
  email: string;
  role: string;
  sex: string;
  timeCommitment: string;
  goal: string;
  preferredWorkoutTime: string;
  workoutPreferences: string[];
  activityLevel: string[];
  jwtToken: string;
}

export type { UserInterface };
