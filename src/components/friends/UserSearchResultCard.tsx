import React from "react";
import FollowButton from "./FollowButton";
import { FriendUser } from "../../types";

interface UserSearchResultCardProps {
  user: FriendUser;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
}

const UserSearchResultCard: React.FC<UserSearchResultCardProps> = ({ user, onFollowToggle }) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-black text-primary">
          {user.avatarInitials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-on-surface">{user.name}</h3>
          <p className="mt-0.5 truncate text-xs text-on-surface-variant">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
              Lv.{user.level || 1}
            </span>
            <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-black uppercase text-secondary">
              {user.streak || 0} ngày chuỗi
            </span>
          </div>
        </div>
      </div>

      <FollowButton
        userId={user.id}
        initialIsFollowing={user.isFollowing}
        onToggle={(isFollowing) => onFollowToggle?.(user.id, isFollowing)}
      />
    </div>
  );
};

export default UserSearchResultCard;
