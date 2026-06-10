import React, { useEffect, useState } from "react";
import FriendsSearch from "../components/friends/FriendsSearch";
import { getFriendFeed, getFriendStats } from "../services/friends";
import { FriendActivity, FriendStats } from "../types";

const getRelativeTime = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
};

const FriendsPage: React.FC = () => {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [stats, setStats] = useState<FriendStats>({ followingCount: 0, followersCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFriendsData = async () => {
      setIsLoading(true);
      setError(null);

      const [feedResult, statsResult] = await Promise.allSettled([
        getFriendFeed(),
        getFriendStats(),
      ]);

      if (!isMounted) return;

      if (feedResult.status === "fulfilled") {
        setActivities(feedResult.value);
      } else {
        console.error("Failed to load friend feed:", feedResult.reason);
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      } else {
        console.error("Failed to load friend stats:", statsResult.reason);
      }

      if (feedResult.status === "rejected" && statsResult.status === "rejected") {
        setError("Chưa tải được dữ liệu bạn bè. Vui lòng thử lại sau.");
      }

      setIsLoading(false);
    };

    loadFriendsData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-5 p-4 md:p-6">
      <header className="rounded-2xl border border-white/10 bg-surface-container-low p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
              <span className="material-symbols-outlined text-[17px]">people</span>
              Friends Follow
            </div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Bạn bè</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
              Theo dõi bạn bè, xem hoạt động check-in mới nhất và cùng giữ nhịp xây dựng thói quen.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">Đang theo dõi</p>
              <p className="mt-2 text-3xl font-black text-on-surface">{stats.followingCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">Người theo dõi</p>
              <p className="mt-2 text-3xl font-black text-on-surface">{stats.followersCount}</p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-white/10 bg-surface-container-low p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-black text-on-surface">Tìm bạn bè</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Tìm theo tên hoặc email để theo dõi tiến độ của nhau.</p>
          </div>
          <FriendsSearch />
        </section>

        <aside className="rounded-2xl border border-white/10 bg-surface-container-low p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-on-surface">Feed hoạt động</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Check-in mới nhất từ người bạn đang theo dõi.</p>
            </div>
            {isLoading && <div className="spinner" />}
          </div>

          {!isLoading && activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">rss_feed</span>
              <p className="mt-2 text-sm font-bold text-on-surface">Chưa có hoạt động mới</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Hãy theo dõi một vài người bạn để feed bắt đầu có dữ liệu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">
                    {activity.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-on-surface">
                      <span className="font-black">{activity.userName}</span> vừa check-in{" "}
                      <span className="font-bold text-primary">"{activity.goalTitle}"</span>
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">{getRelativeTime(activity.createdAt)}</p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default FriendsPage;
