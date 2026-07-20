import { z } from "zod";

export const accessRequestInputSchema = z.object({
  nickname: z.string().trim().min(2, "닉네임은 두 글자 이상 입력해 주세요.").max(20),
  guildCode: z.string().trim().min(4, "길드 코드를 확인해 주세요.").max(20),
  message: z.string().trim().max(120).default(""),
});

export const accessReviewInputSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const adminSessionInputSchema = z.object({
  key: z.string().min(1),
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
  };
};

export type AdminAccessRequest = {
  id: string;
  nickname: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
};
