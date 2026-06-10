import api from "./api";
import { FriendUser, FriendActivity, FriendStats } from "../types";

export const searchFriends = async (query: string): Promise<FriendUser[]> => {
  const response = await api.get(`/api/friends/search?q=${encodeURIComponent(query)}`);
  return response.data.users;
};

export const followFriend = async (userId: string): Promise<void> => {
  await api.post("/api/friends/follow", { userId });
};

export const unfollowFriend = async (userId: string): Promise<void> => {
  await api.delete("/api/friends/follow", { data: { userId } });
};

export const getFriendFeed = async (): Promise<FriendActivity[]> => {
  const response = await api.get("/api/friends/feed");
  return response.data.activities;
};

export const getFriendStats = async (): Promise<FriendStats> => {
  const response = await api.get("/api/friends/stats");
  return response.data;
};

export const updatePrivacySettings = async (showActivityInFeed: boolean): Promise<void> => {
  await api.patch("/api/friends/privacy", { showActivityInFeed });
};
