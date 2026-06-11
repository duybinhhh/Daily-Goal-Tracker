import React, { useState, useEffect } from "react";
import Card from "../ui/Card";
import { getFriendFeed } from "../../services/friends";
import { FriendActivity } from "../../types";

const FriendsTodayCard: React.FC = () => {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await getFriendFeed();
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch friend feed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--color-on-surface)" }}>
          <span>👥</span> Bạn bè hôm nay
        </h2>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="spinner w-6 h-6" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              Chưa có hoạt động mới từ bạn bè.
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 items-start p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {activity.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-tight" style={{ color: "var(--color-on-surface-variant)" }}>
                  <span className="font-semibold" style={{ color: "var(--color-on-surface)" }}>
                    {activity.userName}
                  </span>
                  {" vừa check-in "}
                  <span className="font-medium" style={{ color: "var(--color-primary)" }}>
                    "{activity.goalTitle}"
                  </span>
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-outline)" }}>
                  {getRelativeTime(activity.createdAt)}
                </p>
              </div>
              <div className="text-green-500">✅</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default FriendsTodayCard;
