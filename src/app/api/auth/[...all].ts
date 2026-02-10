import { toNodeHandler } from "better-auth/node";
import { auth } from "@/server/services/auth/db.server";

export const config = { api: { bodyParser: false } };

export default toNodeHandler(auth.handler);
