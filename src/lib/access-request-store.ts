"use client";

import { useSyncExternalStore } from "react";
import { parseAccessRequests, type AccessRequest } from "@/lib/access-request";

const REQUESTS_KEY = "guild-archive-access-requests-v1";
const SESSION_KEY = "guild-archive-access-session-v1";
const CHANGE_EVENT = "guild-archive-access-change";
const EMPTY_REQUESTS = "[]";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getRequestsSnapshot() {
  return window.localStorage.getItem(REQUESTS_KEY) ?? EMPTY_REQUESTS;
}

function getSessionSnapshot() {
  return window.localStorage.getItem(SESSION_KEY) ?? "";
}

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAccessRequests() {
  const serialized = useSyncExternalStore(subscribe, getRequestsSnapshot, () => EMPTY_REQUESTS);
  return parseAccessRequests(serialized);
}

export function useAccessSessionId() {
  return useSyncExternalStore(subscribe, getSessionSnapshot, () => "");
}

export function saveAccessRequests(requests: readonly AccessRequest[]) {
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  emitChange();
}

export function setAccessSession(requestId: string) {
  window.localStorage.setItem(SESSION_KEY, requestId);
  emitChange();
}

export function clearAccessSession() {
  window.localStorage.removeItem(SESSION_KEY);
  emitChange();
}

export function clearAccessDemo() {
  window.localStorage.removeItem(REQUESTS_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  emitChange();
}
