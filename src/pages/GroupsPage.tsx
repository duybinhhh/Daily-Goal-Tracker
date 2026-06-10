// src/pages/GroupsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { GroupCommentsSection } from "../components/groups/GroupCommentsSection";
import { GroupInvitePanel } from "../components/groups/GroupInvitePanel";
import { ShareModal } from "../components/ShareModal";
import { useAuthStore } from "../store/authStore";
import { GroupMemberProgress, HabitGroup, useGroupStore } from "../store/groupStore";
import { useGoalStore } from "../store/goalStore";
import { useTranslation } from "../i18n";

type GroupTab = "my-groups" | "discover";
type PendingAction = "create" | "join" | "leave" | "delete" | "remove" | "checkin" | null;

const CATEGORY_OPTIONS = ["Health", "Fitness", "Work", "Learning", "Routine", "Finance"];
const FREQUENCY_OPTIONS = ["daily", "weekly", "monthly"];

const getFrequencyLabel = (frequency: string) => {
  if (frequency === "weekly") return "hàng tuần";
  if (frequency === "monthly") return "hàng tháng";
  return "hàng ngày";
};

const getInitials = (name?: string) => {
  if (!name) return "DG";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DG";
};

const getCompletionRate = (current: number, target: number) => {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
};

const getGroupGoalLabel = (group: Pick<HabitGroup, "goal_title" | "goal_target_count" | "goal_frequency">) => {
  return `${group.goal_title} · ${group.goal_target_count} lần ${getFrequencyLabel(group.goal_frequency)}`;
};

export const GroupsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    groups,
    activeGroup,
    loading,
    error,
    fetchGroups,
    fetchGroupById,
    createGroup,
    joinGroup,
    leaveGroup,
    removeMember,
    deleteGroup,
    clearError,
  } = useGroupStore();
  const { completeGoalProgress, goals, fetchGoals } = useGoalStore();

  const [activeTab, setActiveTab] = useState<GroupTab>("my-groups");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCat, setGoalCat] = useState("Health");
  const [goalTarget, setGoalTarget] = useState(1);
  const [goalFreq, setGoalFreq] = useState("daily");

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{ title: string; description: string; streakCount?: number }>({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchGroups();
    fetchGoals();
  }, [fetchGroups, fetchGoals]);

  const myGroups = useMemo(() => groups.filter((group) => group.isJoined), [groups]);
  const discoverGroups = useMemo(() => groups.filter((group) => !group.isJoined), [groups]);
  const categories = useMemo(() => {
    const values = new Set(groups.map((group) => group.goal_category).filter(Boolean));
    return ["all", ...Array.from(values)];
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const source = activeTab === "my-groups" ? myGroups : discoverGroups;
    const query = searchQuery.trim().toLowerCase();

    return source.filter((group) => {
      const matchesSearch =
        !query ||
        group.name.toLowerCase().includes(query) ||
        group.goal_title.toLowerCase().includes(query) ||
        (group.description || "").toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "all" || group.goal_category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [activeTab, categoryFilter, discoverGroups, myGroups, searchQuery]);

  const rankedMembers = useMemo(() => {
    if (!activeGroup) return [];
    return [...activeGroup.members].sort((a, b) => {
      const rateDiff = getCompletionRate(b.current_count, b.target_count) - getCompletionRate(a.current_count, a.target_count);
      if (rateDiff !== 0) return rateDiff;
      return b.streak.current_streak - a.streak.current_streak;
    });
  }, [activeGroup]);

  const currentUserProgress = useMemo(() => {
    if (!activeGroup || !user) return null;
    return activeGroup.members.find((member) => member.user_id === user.id) || null;
  }, [activeGroup, user]);

  const activeGroupGoal = useMemo(() => {
    if (!activeGroup) return null;
    return goals.find((goal) => goal.group_id === activeGroup.id) || null;
  }, [activeGroup, goals]);

  const completedMemberCount = activeGroup?.members.filter((member) => member.status === "completed").length || 0;
  const averageProgress = activeGroup?.members.length
    ? Math.round(activeGroup.members.reduce((sum, member) => sum + getCompletionRate(member.current_count, member.target_count), 0) / activeGroup.members.length)
    : 0;

  const resetCreateForm = () => {
    setGroupName("");
    setGroupDesc("");
    setGoalTitle("");
    setGoalCat("Health");
    setGoalTarget(1);
    setGoalFreq("daily");
  };

  const handleSelectGroup = async (groupId: string) => {
    await fetchGroupById(groupId);
  };

  const handleCreateGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    setPendingAction("create");
    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDesc.trim(),
        goal_title: goalTitle.trim(),
        goal_category: goalCat,
        goal_target_count: goalTarget,
        goal_frequency: goalFreq,
      });
      setShowCreateModal(false);
      resetCreateForm();
      await fetchGoals();
      setActiveTab("my-groups");
    } finally {
      setPendingAction(null);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setPendingAction("join");
    try {
      await joinGroup(groupId);
      await fetchGoals();
    } finally {
      setPendingAction(null);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm("Bạn chắc chắn muốn rời nhóm này? Mục tiêu nhóm liên kết với tài khoản của bạn cũng sẽ được gỡ.")) return;
    setPendingAction("leave");
    try {
      await leaveGroup(groupId);
      await fetchGoals();
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Xóa nhóm này? Hành động này sẽ giải tán nhóm và không thể hoàn tác.")) return;
    setPendingAction("delete");
    try {
      await deleteGroup(groupId);
      await fetchGoals();
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string, memberName: string) => {
    if (!confirm(`Xóa ${memberName} khỏi nhóm này?`)) return;
    setPendingAction("remove");
    try {
      await removeMember(groupId, memberId);
      await fetchGoals();
    } finally {
      setPendingAction(null);
    }
  };

  const handleQuickCheckin = async () => {
    if (!activeGroup || !activeGroupGoal) return;
    setPendingAction("checkin");
    try {
      await completeGoalProgress(activeGroupGoal.id, "");
      await fetchGroupById(activeGroup.id);
      await fetchGoals();
    } finally {
      setPendingAction(null);
    }
  };

  const handleShareGroupProgress = () => {
    if (!activeGroup) return;
    const memberProgress = activeGroup.members.find((member) => member.user_id === user?.id);

    setShareData({
      title: `Tiến độ nhóm ${activeGroup.name}`,
      description: `${activeGroup.goal_title}: ${memberProgress?.current_count || 0}/${memberProgress?.target_count || 0} lần hoàn thành`,
      streakCount: memberProgress?.streak.current_streak || 0,
    });
    setShowShareModal(true);
  };

  const GroupCard = ({ group }: { group: HabitGroup }) => {
    const isActive = activeGroup?.id === group.id;
    return (
      <button
        type="button"
        onClick={() => handleSelectGroup(group.id)}
        className={`group w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 ${
          isActive ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/5" : "border-white/10 bg-surface-container-low hover:bg-surface-container"
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[18px]">groups</span>
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-extrabold text-on-surface">{group.name}</h3>
                <p className="truncate text-[10px] font-bold uppercase tracking-wider text-primary">{group.goal_category}</p>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-on-surface-variant">
              {group.description || "Chưa có mô tả nhóm."}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black text-on-surface-variant">
            {group.memberCount}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-2 text-[11px] text-on-surface">
            <span className="material-symbols-outlined text-[15px] text-secondary">track_changes</span>
            <span className="min-w-0 truncate font-bold">{getGroupGoalLabel(group)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${group.isJoined ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>
              {group.isJoined ? "Đã tham gia" : "Có thể tham gia"}
            </span>
            {!group.isJoined && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary transition-transform group-hover:translate-x-0.5">
                Tham gia
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const MemberRow = ({ member, rank }: { member: GroupMemberProgress; rank: number }) => {
    const isCurrentUser = member.user_id === user?.id;
    const completionRate = getCompletionRate(member.current_count, member.target_count);
    const isCompleted = member.status === "completed";

    return (
      <div className={`rounded-xl border p-3 transition-colors ${isCurrentUser ? "border-secondary/30 bg-secondary/10" : "border-white/10 bg-surface-container-low"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${rank === 1 ? "bg-primary text-on-primary" : "bg-white/5 text-on-surface-variant"}`}>
              #{rank}
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[13px] font-black text-on-surface">
              {getInitials(member.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-extrabold text-on-surface">{member.name}</p>
                {isCurrentUser && <span className="rounded-full bg-secondary/15 px-1.5 py-0.5 text-[9px] font-black text-secondary">Bạn</span>}
              </div>
              <p className="truncate text-[11px] text-on-surface-variant">{member.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:w-[280px]">
            <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Tiến độ</p>
              <p className="mt-0.5 text-[13px] font-black text-on-surface">{member.current_count}/{member.target_count}</p>
            </div>
            <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Chuỗi</p>
              <p className="mt-0.5 text-[13px] font-black text-on-surface">{member.streak.current_streak}đ</p>
            </div>
            <div className={`rounded-lg px-2.5 py-1.5 ${isCompleted ? "bg-secondary/10" : "bg-primary/10"}`}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Trạng thái</p>
              <p className={`mt-0.5 text-[13px] font-black ${isCompleted ? "text-secondary" : "text-primary"}`}>{isCompleted ? "Đạt" : "Đang"}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-secondary" : "bg-primary"}`} style={{ width: `${completionRate}%` }} />
          </div>
          <span className="w-8 text-right text-[11px] font-black text-on-surface">{completionRate}%</span>
          {activeGroup?.creator_id === user?.id && !isCurrentUser && (
            <button
              type="button"
              onClick={() => handleRemoveMember(activeGroup.id, member.user_id, member.name)}
              disabled={pendingAction === "remove"}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error transition-colors hover:bg-error/20 disabled:opacity-50"
              title="Xóa thành viên"
            >
              <span className="material-symbols-outlined text-[16px]">person_remove</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <header
        className="fixed left-0 right-0 top-0 z-50 border-b px-4 py-3 shadow-sm backdrop-blur-xl md:left-[220px] md:px-6"
        style={{ borderColor: "var(--border-subtle)", background: "var(--header-bg)" }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
              <span className="material-symbols-outlined text-[14px]">diversity_3</span>
              Habit Groups
            </div>
            <h1 className="text-xl font-black tracking-tight text-on-surface">Nhóm thói quen</h1>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-[260px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
              <input
                className="min-h-[40px] w-full rounded-xl border border-white/10 bg-surface-container-low py-1.5 pl-9 pr-4 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary/60"
                placeholder="Tìm nhóm hoặc mục tiêu..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                clearError();
                setShowCreateModal(true);
              }}
              className="btn-primary min-h-[40px] justify-center text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              Tạo nhóm
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-5 p-4 pt-[150px] sm:pt-[132px] md:p-5 md:pt-[132px] xl:grid-cols-[380px_minmax(0,1fr)] xl:pt-[112px]">
        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-[112px] xl:max-h-[calc(100vh-128px)] xl:self-start xl:overflow-hidden">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-surface-container-low p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Đã tham gia</p>
              <p className="mt-0.5 text-xl font-black text-on-surface">{myGroups.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-surface-container-low p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Khám phá</p>
              <p className="mt-0.5 text-xl font-black text-on-surface">{discoverGroups.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-surface-container-low p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tổng</p>
              <p className="mt-0.5 text-xl font-black text-on-surface">{groups.length}</p>
            </div>
          </div>

          {error && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
              <span>{error}</span>
              <button type="button" onClick={clearError} className="font-black">Đóng</button>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-surface-container-low p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("my-groups")}
                className={`rounded-xl px-3 py-2.5 text-sm font-black transition-all ${activeTab === "my-groups" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-white/5"}`}
              >
                Nhóm của tôi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
                className={`rounded-xl px-3 py-2.5 text-sm font-black transition-all ${activeTab === "discover" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-white/5"}`}
              >
                Khám phá
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  categoryFilter === category
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {category === "all" ? "Tất cả" : category}
              </button>
            ))}
          </div>

          <div className="flex min-h-[360px] flex-col gap-3 overflow-y-auto pr-1 xl:min-h-0 xl:flex-1">
            {loading && groups.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-surface-container-low">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-surface-container-low p-8 text-center">
                <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant">{activeTab === "my-groups" ? "group_off" : "travel_explore"}</span>
                <h3 className="text-base font-black text-on-surface">{activeTab === "my-groups" ? "Bạn chưa tham gia nhóm nào" : "Chưa có nhóm phù hợp"}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {activeTab === "my-groups" ? "Tạo nhóm mới hoặc chuyển sang Khám phá để tham gia nhóm đang mở." : "Thử đổi từ khóa tìm kiếm hoặc bỏ lọc danh mục."}
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {activeGroup ? (
            <div className="flex min-h-[620px] flex-col gap-4 rounded-2xl border border-white/10 bg-surface-container-low p-4 md:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary">{activeGroup.goal_category}</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                      Tạo bởi {activeGroup.creator_name}
                    </span>
                    {activeGroup.isJoined && <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-black text-secondary">Bạn đang tham gia</span>}
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-on-surface">{activeGroup.name}</h2>
                  <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-on-surface-variant">
                    {activeGroup.description || "Nhóm này chưa có mô tả. Bạn vẫn có thể theo dõi mục tiêu chung và tiến độ thành viên."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!activeGroup.isJoined && (
                    <button
                      type="button"
                      onClick={() => handleJoinGroup(activeGroup.id)}
                      disabled={pendingAction === "join"}
                      className="btn-primary h-[36px] text-[13px] disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      Tham gia
                    </button>
                  )}
                  {activeGroup.isJoined && (
                    <>
                      <button type="button" onClick={handleShareGroupProgress} className="btn-ghost h-[36px] text-[13px]">
                        <span className="material-symbols-outlined text-[16px]">share</span>
                        Chia sẻ
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickCheckin}
                        disabled={pendingAction === "checkin" || !activeGroupGoal || currentUserProgress?.status === "completed"}
                        className="btn-primary h-[36px] text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        {currentUserProgress?.status === "completed" ? "Đã đạt" : "Check-in"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Mục tiêu chung</p>
                  <p className="mt-1 text-base font-black text-on-surface">{activeGroup.goal_title}</p>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant">{activeGroup.goal_target_count} lần {getFrequencyLabel(activeGroup.goal_frequency)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Đã đạt</p>
                  <p className="mt-1 text-xl font-black text-secondary">{completedMemberCount}/{activeGroup.members.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tiến độ TB</p>
                  <p className="mt-1 text-xl font-black text-primary">{averageProgress}%</p>
                </div>
              </div>

              {currentUserProgress && (
                <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-3.5">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-secondary">Tiến độ của bạn</p>
                      <p className="mt-0.5 text-[13px] text-on-surface">
                        {currentUserProgress.current_count}/{currentUserProgress.target_count} lần · chuỗi {currentUserProgress.streak.current_streak} ngày
                      </p>
                    </div>
                    <span className="text-xl font-black text-secondary">
                      {getCompletionRate(currentUserProgress.current_count, currentUserProgress.target_count)}%
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${getCompletionRate(currentUserProgress.current_count, currentUserProgress.target_count)}%` }} />
                  </div>
                </div>
              )}

              {activeGroup.isJoined && (activeGroup.creator_id === user?.id || activeGroup.invite_code) && (
                <GroupInvitePanel group={activeGroup} canManageInvite={activeGroup.creator_id === user?.id} />
              )}

              <div className="flex-1">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-on-surface">Bảng xếp hạng thành viên</h3>
                  </div>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-on-surface-variant">{activeGroup.members.length} thành viên</span>
                </div>
                <div className="space-y-2.5">
                  {rankedMembers.map((member, index) => (
                    <MemberRow key={member.user_id} member={member} rank={index + 1} />
                  ))}
                </div>
              </div>

              {activeGroup.isJoined && (
                <div className="border-t border-white/10 pt-4">
                  <GroupCommentsSection groupId={activeGroup.id} />
                </div>
              )}

              <div className="sticky bottom-4 z-30 mt-auto flex flex-col-reverse gap-2 rounded-2xl border border-white/10 bg-surface-container-high/95 px-3 py-2 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => useGroupStore.setState({ activeGroup: null })}
                  className="btn-ghost min-h-[36px] justify-center px-3 py-1.5 text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Đóng
                </button>
                {activeGroup.creator_id === user?.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(activeGroup.id)}
                    disabled={pendingAction === "delete"}
                    className="btn-danger-ghost min-h-[36px] justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Xóa nhóm
                  </button>
                ) : activeGroup.isJoined ? (
                  <button
                    type="button"
                    onClick={() => handleLeaveGroup(activeGroup.id)}
                    disabled={pendingAction === "leave"}
                    className="btn-danger-ghost min-h-[36px] justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Rời nhóm
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[620px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-surface-container-low p-10 text-center">
              <span className="material-symbols-outlined mb-4 text-6xl text-on-surface-variant">groups</span>
              <h2 className="text-xl font-black text-on-surface">Chọn một nhóm để xem chi tiết</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
                Bạn có thể xem mục tiêu chung, tiến độ của từng thành viên, check-in nhanh và trò chuyện trong nhóm.
              </p>
              <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary mt-6 text-sm">
                <span className="material-symbols-outlined text-[18px]">group_add</span>
                Tạo nhóm đầu tiên
              </button>
            </div>
          )}
        </section>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container-high shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
              <div>
                <h3 className="text-lg font-black text-on-surface">Tạo nhóm thói quen</h3>
                <p className="mt-0.5 text-xs text-on-surface-variant">Đặt mục tiêu chung để mọi người cùng theo dõi và check-in.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  clearError();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-on-surface transition-colors hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tên nhóm</span>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-surface-container-low px-3.5 text-sm font-semibold text-on-surface outline-none focus:border-primary/60"
                    placeholder="Ví dụ: Chạy bộ buổi sáng"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Mục tiêu chung</span>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={(event) => setGoalTitle(event.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-surface-container-low px-3.5 text-sm font-semibold text-on-surface outline-none focus:border-primary/60"
                    placeholder="Ví dụ: Chạy 5km"
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Mô tả</span>
                  <textarea
                    rows={2}
                    value={groupDesc}
                    onChange={(event) => setGroupDesc(event.target.value)}
                    className="w-full resize-none rounded-xl border border-white/10 bg-surface-container-low px-3.5 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary/60"
                    placeholder="Mô tả ngắn về tinh thần hoặc luật chơi của nhóm..."
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Danh mục</span>
                  <select
                    value={goalCat}
                    onChange={(event) => setGoalCat(event.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-surface-container-low px-3.5 text-sm font-semibold text-on-surface outline-none focus:border-primary/60"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tần suất</span>
                  <select
                    value={goalFreq}
                    onChange={(event) => setGoalFreq(event.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-surface-container-low px-3.5 text-sm font-semibold text-on-surface outline-none focus:border-primary/60"
                  >
                    {FREQUENCY_OPTIONS.map((frequency) => (
                      <option key={frequency} value={frequency}>{getFrequencyLabel(frequency)}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Chỉ tiêu (số lần)</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={goalTarget}
                    onChange={(event) => setGoalTarget(parseInt(event.target.value, 10) || 1)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-surface-container-low px-3.5 text-sm font-semibold text-on-surface outline-none focus:border-primary/60"
                  />
                </label>

                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 sm:mt-auto">
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">Xem trước</p>
                  <p className="mt-1 text-sm font-black text-on-surface truncate">{groupName || "Tên nhóm"}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant truncate">
                    {(goalTitle || "Mục tiêu")} · {goalTarget} lần {getFrequencyLabel(goalFreq)}
                  </p>
                </div>
              </div>

              {error && <div className="mt-3 rounded-lg border border-error/20 bg-error/10 p-2.5 text-xs font-bold text-error">{error}</div>}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    clearError();
                  }}
                  className="btn-ghost h-[40px] px-5 justify-center text-sm"
                >
                  Hủy
                </button>
                <button type="submit" disabled={pendingAction === "create"} className="btn-primary h-[40px] px-6 justify-center text-sm disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  {pendingAction === "create" ? t("common.saving") : "Tạo nhóm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} type="badge" data={shareData} />
    </div>
  );
};

export default GroupsPage;
