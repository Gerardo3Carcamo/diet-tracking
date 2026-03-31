export interface MealEntry {
  id: string;
  mainCourse: string;
  starter: string;
  drink: string;
  photoDataUrl: string;
  createdAt: string;
}

export interface NewMealPayload {
  mainCourse: string;
  starter: string;
  drink: string;
  photoDataUrl: string;
}

export interface ProfileSummary {
  userId: string;
  email: string;
  totalMeals: number;
  latestMeals: MealEntry[];
}
