export type AccessRequestStatus = "pending" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  nickname: string;
  guildCode: string;
  message: string;
  status: AccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
};

export type AccessRequestInput = Pick<AccessRequest, "nickname" | "guildCode" | "message">;

export function createAccessRequest(
  input: AccessRequestInput,
  options: { id: string; now: string },
): AccessRequest {
  return {
    id: options.id,
    nickname: input.nickname.trim(),
    guildCode: input.guildCode.trim().toUpperCase(),
    message: input.message.trim(),
    status: "pending",
    requestedAt: options.now,
  };
}

export function reviewAccessRequest(
  requests: readonly AccessRequest[],
  id: string,
  status: Exclude<AccessRequestStatus, "pending">,
  reviewedAt: string,
) {
  return requests.map((request) => (
    request.id === id ? { ...request, status, reviewedAt } : request
  ));
}

export function parseAccessRequests(value: string | null): AccessRequest[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAccessRequest);
  } catch {
    return [];
  }
}

function isAccessRequest(value: unknown): value is AccessRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<AccessRequest>;
  return (
    typeof request.id === "string"
    && typeof request.nickname === "string"
    && typeof request.guildCode === "string"
    && typeof request.message === "string"
    && typeof request.requestedAt === "string"
    && ["pending", "approved", "rejected"].includes(request.status ?? "")
  );
}
