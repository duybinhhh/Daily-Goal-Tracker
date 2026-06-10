import React, { useState } from "react";
import { useGroupStore, HabitGroupDetail } from "../../store/groupStore";
import { Button } from "../ui/Button";

interface GroupInvitePanelProps {
  group: HabitGroupDetail;
  canManageInvite?: boolean;
}

export const GroupInvitePanel: React.FC<GroupInvitePanelProps> = ({ group, canManageInvite = false }) => {
  const { createInviteCode, loading } = useGroupStore();
  const [isCreating, setIsCreating] = useState(false);

  const inviteLink = group.invite_code ? `${window.location.origin}/#/join/${group.invite_code}` : "";
  const isExpired = Boolean(group.invite_expires_at && new Date(group.invite_expires_at) < new Date());
  const isFull = group.members.length >= (group.max_members || 20);
  const canUseInvite = Boolean(inviteLink && !isExpired && !isFull);

  const handleCreateInvite = async () => {
    if (!canManageInvite) return;

    if (isFull) {
      alert(`Nhóm đã đủ ${group.max_members || 20} thành viên, không thể tạo link mời.`);
      return;
    }

    try {
      setIsCreating(true);
      await createInviteCode(group.id);
      alert("Đã tạo link mời mới!");
    } catch (err: any) {
      alert(err.message || "Không thể tạo link mời.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => alert("Đã sao chép link mời!"))
      .catch(() => alert("Không thể sao chép link."));
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tham gia nhóm thói quen",
          text: `Tham gia nhóm thói quen "${group.name}" trên Daily Goal Tracker`,
          url: inviteLink,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const helperText = (() => {
    if (isFull) return `Nhóm đã đủ ${group.max_members || 20} thành viên, không thể mời thêm.`;
    if (canUseInvite) return "Link mời do admin tạo. Mọi thành viên trong nhóm đều có thể xem, sao chép và chia sẻ link này.";
    if (canManageInvite) return "Tạo link mời để các thành viên trong nhóm có thể chia sẻ cho bạn bè tham gia.";
    if (isExpired) return "Link mời đã hết hạn. Vui lòng nhờ admin tạo lại link.";
    return "Admin chưa tạo link mời cho nhóm này.";
  })();

  return (
    <div className="mt-4 animate-fade-in rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary">person_add</span>
        <h3 className="text-sm font-black text-on-surface">Mời thành viên</h3>
      </div>

      <p className="mb-4 text-[12px] text-on-surface-variant">{helperText}</p>

      {canUseInvite ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Link mời</span>
            <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-surface-container-low p-2">
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-on-surface">{inviteLink}</span>
            </div>
            {group.invite_expires_at && (
              <span className="text-[10px] italic text-on-surface-variant">
                Hết hạn: {new Date(group.invite_expires_at).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" size="sm" onClick={handleCopy} className="h-9 flex-1 text-[12px]">
              <span className="material-symbols-outlined mr-1 text-[16px]">content_copy</span>
              Sao chép
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare} className="h-9 flex-1 text-[12px]">
              <span className="material-symbols-outlined mr-1 text-[16px]">share</span>
              Chia sẻ
            </Button>
            {canManageInvite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateInvite}
                isLoading={isCreating || loading}
                className="h-9 text-[11px]"
                title="Tạo link mới"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </Button>
            )}
          </div>
        </div>
      ) : canManageInvite ? (
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreateInvite}
          isLoading={isCreating || loading}
          disabled={isFull}
          className="h-10 w-full text-[13px]"
        >
          <span className="material-symbols-outlined mr-2 text-[18px]">link</span>
          Tạo link mời
        </Button>
      ) : (
        <div className="rounded-lg border border-white/10 bg-surface-container-low p-3 text-[12px] font-semibold text-on-surface-variant">
          Chưa có link mời khả dụng.
        </div>
      )}
    </div>
  );
};
