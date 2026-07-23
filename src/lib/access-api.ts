import { z } from "zod";

const loginIdSchema = z.string().trim().min(4, "로그인 아이디는 4자 이상 입력해 주세요.").max(20)
  .regex(/^[A-Za-z0-9._-]+$/, "로그인 아이디는 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다.");
const passwordSchema = z.string().min(8, "비밀번호는 8자 이상 입력해 주세요.").max(64)
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "비밀번호에는 영문과 숫자를 모두 포함해 주세요.");

export function normalizeLoginId(loginId: string) {
  return loginId.trim().toLowerCase();
}

export const accountCredentialsInputSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
});

export const accessLoginInputSchema = accountCredentialsInputSchema;

export const accessRequestInputSchema = accountCredentialsInputSchema.extend({
  nickname: z.string().trim().min(2, "닉네임은 두 글자 이상 입력해 주세요.").max(20),
  message: z.string().trim().max(120).default(""),
});

export const accessReviewInputSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const memberRoleInputSchema = z.object({
  role: z.enum(["OFFICER", "MEMBER"]),
});

export const adminSessionInputSchema = z.object({
  key: z.string().min(1),
});

export const changeRequestStatusInputSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
});

export type AccessSessionResponse = {
  status: "none" | "pending" | "approved" | "rejected";
  request?: {
    id: string;
    nickname: string;
    requestedAt: string;
  };
  member?: {
    nickname: string;
    role: "OWNER" | "OFFICER" | "MEMBER";
    credentialsReady: boolean;
  };
};

export type AdminAccessRequest = {
  id: string;
  nickname: string;
  loginId?: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
};

export type AdminGuildMember = {
  id: string;
  nickname: string;
  loginId?: string;
  role: "OWNER" | "OFFICER" | "MEMBER";
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
};
