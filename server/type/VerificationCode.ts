export interface VerificationCode {
    email: string;
    code: string;
    createdAt: Date;
    expiresAt: Date;
}
