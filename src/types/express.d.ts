import { User } from "../models/User.ts"; // Adjust the path to your User model/interface

declare global {
  namespace Express {
    interface Request {
      user?: User; // Use ? if user might not be authenticated in some routes
      // Or use non-optional if you always ensure user exists (e.g., via middleware)
      // user: User;
    }
  }
}

// This export is needed to make it a module (avoids "augmentation in global scope" issues)
export {};
