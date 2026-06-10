import React, { useState } from "react";
import Button from "../ui/Button";
import { followFriend, unfollowFriend } from "../../services/friends";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onToggle?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({ userId, initialIsFollowing, onToggle }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const previousState = isFollowing;
    const nextState = !previousState;

    setIsFollowing(nextState);
    setIsLoading(true);

    try {
      if (previousState) {
        await unfollowFriend(userId);
      } else {
        await followFriend(userId);
      }
      onToggle?.(nextState);
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      setIsFollowing(previousState);
      alert("Chưa cập nhật được trạng thái theo dõi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      size="sm"
      onClick={handleToggleFollow}
      isLoading={isLoading}
      className="w-full justify-center sm:w-auto"
      style={{ minWidth: "116px" }}
    >
      {isFollowing ? "Đang theo dõi" : "Theo dõi"}
    </Button>
  );
};

export default FollowButton;
