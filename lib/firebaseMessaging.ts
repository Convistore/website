import { getMessaging } from "firebase/messaging";
import app  from "./firebase";

export const messaging =
  typeof window !== "undefined"
    ? getMessaging(app)
    : null;