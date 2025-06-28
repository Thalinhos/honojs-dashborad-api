import { ObjectId } from "mongodb";

 export function parseId(id: string) {
    try {
      return new ObjectId(id);
    } catch {
      return null;
    }
  }