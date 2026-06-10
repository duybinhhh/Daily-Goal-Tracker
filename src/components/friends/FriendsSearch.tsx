import React, { useCallback, useEffect, useState } from "react";
import Input from "../ui/Input";
import UserSearchResultCard from "./UserSearchResultCard";
import { searchFriends } from "../../services/friends";
import { FriendUser } from "../../types";

const FriendsSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const users = await searchFriends(trimmedQuery);
      setResults(users);
    } catch (err) {
      console.error("Search friends failed:", err);
      setError("Không thể tìm kiếm bạn bè. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      performSearch(query);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <div className="w-full">
      <Input
        label="Tìm bạn bè"
        placeholder="Nhập tên hoặc email..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="space-y-3">
        {isLoading && (
          <div className="flex justify-center rounded-xl border border-white/10 bg-white/[0.03] py-8">
            <div className="spinner h-8 w-8" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-center text-sm font-semibold text-error">
            {error}
          </div>
        )}

        {!isLoading && !error && query.trim() !== "" && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-on-surface-variant">
            Không tìm thấy người dùng phù hợp.
          </div>
        )}

        {!isLoading &&
          !error &&
          results.map((user) => (
            <UserSearchResultCard
              key={user.id}
              user={user}
              onFollowToggle={(userId, isFollowing) => {
                setResults((prev) => prev.map((item) => (item.id === userId ? { ...item, isFollowing } : item)));
              }}
            />
          ))}

        {!isLoading && !error && query.trim() === "" && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">person_search</span>
            <p className="mt-2 text-sm font-bold text-on-surface">Bắt đầu tìm kiếm</p>
            <p className="mt-1 text-xs text-on-surface-variant">Nhập tên hoặc email để tìm bạn bè.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsSearch;
