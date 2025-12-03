import { Request } from "express";

export interface TokenPayload {
	id: number;
	email: string;
	name: string;
}

export interface AuthenticatedRequest extends Request {
	user?: TokenPayload;
}
