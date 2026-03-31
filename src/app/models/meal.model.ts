export interface MealEntry {
  id: string;
  userId: string;
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
