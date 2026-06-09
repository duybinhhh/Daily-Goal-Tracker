// src/pages/GroupsPage.tsx
import React, { useEffect, useState } from "react";
import { useGroupStore } from "../store/groupStore";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";
import { ShareModal } from "../components/ShareModal";
import { useTranslation } from "../i18n";

export const GroupsPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuthStore();
  const { groups, activeGroup, loading, error, fetchGroups, fetchGroupById, createGroup, joinGroup, leaveGroup, deleteGroup, clearError } = useGroupStore();
  const { completeGoalProgress, goals, fetchGoals } = useGoalStore();

  const [activeTab, setActiveTab] = useState<"my-groups" | "discover">("my-groups");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create group form state
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCat, setGoalCat] = useState("Health");
  const [goalTarget, setGoalTarget] = useState(1);
  const [goalFreq, setGoalFreq] = useState("daily");

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{ title: string; description: string; streakCount?: number }>({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchGroups();
    fetchGoals();
  }, [fetchGroups, fetchGoals]);

  const handleSelectGroup = (groupId: string) => {
    fetchGroupById(groupId);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup({
        name: groupName,
        description: groupDesc,
        goal_title: goalTitle,
        goal_category: goalCat,
        goal_target_count: goalTarget,
        goal_frequency: goalFreq,
      });
      setShowCreateModal(false);
      // Reset form fields
      setGroupName("");
      setGroupDesc("");
      setGoalTitle("");
      setGoalCat("Health");
      setGoalTarget(1);
      setGoalFreq("daily");
      fetchGoals(); // Refresh goals
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroup(groupId);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (confirm(t("groups.confirmLeave"))) {
      try {
        await leaveGroup(groupId);
        fetchGoals();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm(t("groups.confirmDelete"))) {
      try {
        await deleteGroup(groupId);
        fetchGoals();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Quick check-in for the active group's goal
  const handleQuickCheckin = async () => {
    if (!activeGroup) return;
    // Find the user's personal goal linked to this group
    const groupGoal = goals.find((g) => g.group_id === activeGroup.id);
    if (!groupGoal) return;

    try {
      const note = prompt(t("groups.checkinNotePrompt")) || "";
      await completeGoalProgress(groupGoal.id, note);
      // Refresh active group data to update leaderboard
      fetchGroupById(activeGroup.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Open share modal for group performance
  const handleShareGroupProgress = () => {
    if (!activeGroup) return;
    const memberProgress = activeGroup.members.find((m) => m.user_id === user?.id);
    const streak = memberProgress?.streak.current_streak || 0;
    
    setShareData({
      title: t("groups.teamProgress", { name: activeGroup.name }),
      description: t("groups.shareDesc", { title: activeGroup.goal_title, current: memberProgress?.current_count || 0, target: memberProgress?.target_count || 0 }),
      streakCount: streak,
    });
    setShowShareModal(true);
  };

  // Filter groups based on search & tab
  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.goal_title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "my-groups") {
      return g.isJoined && matchesSearch;
    } else {
      return !g.isJoined && matchesSearch;
    }
  });

  return (
    <div style={{ minHeight: "100vh" }} className="flex flex-col bg-background text-on-background antialiased font-sans">
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-4 md:px-6"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">{t("groups.title")}</h2>
          <div className="relative w-full sm:w-60">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: "18px" }}>
              search
            </span>
            <input
              className="bg-surface-container-high border-none rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none transition-all duration-300"
              style={{ border: "1px solid var(--border-subtle)" }}
              placeholder={t("common.search")}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-xs py-2 px-4 shrink-0"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>group_add</span>
          {t("groups.createGroup")}
        </button>
      </header>

      {/* Main layout grid */}
      <main className="p-4 md:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto w-full">
        {/* Left column: Groups list */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-w-0">
          {/* Tabs */}
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setActiveTab("my-groups"); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all ${
                activeTab === "my-groups"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t("groups.myGroups")} ({groups.filter(g => g.isJoined).length})
            </button>
            <button
              onClick={() => { setActiveTab("discover"); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all ${
                activeTab === "discover"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t("groups.discover")} ({groups.filter(g => !g.isJoined).length})
            </button>
          </div>

          {/* Group items wrapper */}
          <div className="flex flex-col gap-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {loading && groups.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-6 w-6 border-t-2 border-primary border-transparent rounded-full" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="glass-card p-8 text-center text-on-surface-variant text-sm rounded-2xl">
                {activeTab === "my-groups" 
                  ? t("groups.noJoinedGroups")
                  : t("groups.noDiscoverGroups")}
              </div>
            ) : (
              filteredGroups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => handleSelectGroup(g.id)}
                  className={`glass-card p-4 rounded-2xl border cursor-pointer hover:border-white/20 transition-all ${
                    activeGroup?.id === g.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-white/5"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-on-surface text-sm truncate">{g.name}</h4>
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-on-surface-variant font-semibold shrink-0">
                      👤 {t("groups.memberCount", { count: g.memberCount })}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
                    {g.description || t("groups.noDescription")}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                      🎯 {g.goal_title} ({g.goal_target_count}/{t("common." + g.goal_frequency)})
                    </span>
                    {!g.isJoined && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGroup(g.id);
                        }}
                        className="px-3 py-1 bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-wider rounded-md border-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      >
                        {t("groups.joinGroup")}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Group Details & Leaderboard */}
        <div className="lg:col-span-7">
          {activeGroup ? (
            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col gap-6 h-full min-h-[450px]">
              {/* Group top details */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-on-surface tracking-tight">{activeGroup.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {t("groups.createdBy", { name: activeGroup.creator_name })}
                  </p>
                  <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
                    {activeGroup.description || t("groups.noDescription")}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 shrink-0 sm:items-end">
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold">
                    {t("category." + activeGroup.goal_category.toLowerCase())}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">
                    {t("common." + activeGroup.goal_frequency)} target: {activeGroup.goal_target_count} logs
                  </span>
                </div>
              </div>

              {/* Members leaderboard title */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">👥 {t("groups.members")} & {t("groups.leaderboard")}</h4>
                  {activeGroup.isJoined && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleShareGroupProgress}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 text-xs font-semibold cursor-pointer"
                        style={{ display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>share</span>
                        {t("groups.shareTeam")}
                      </button>
                      <button
                        onClick={handleQuickCheckin}
                        className="px-3 py-1.5 bg-secondary text-on-secondary rounded-lg text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        style={{ display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check_circle</span>
                        {t("groups.checkinHabit")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Leaderboard list */}
                <div className="space-y-3">
                  {activeGroup.members.map((member) => {
                    const isCurrentUser = member.user_id === user?.id;
                    const completionRate = Math.min(100, Math.round((member.current_count / member.target_count) * 100));
                    
                    return (
                      <div
                        key={member.user_id}
                        className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
                          isCurrentUser
                            ? "bg-secondary/5 border-secondary/20"
                            : "bg-white/2 border-white/5"
                        }`}
                      >
                        {/* Member identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                            style={{
                              background: isCurrentUser 
                                ? "rgba(78, 222, 163, 0.12)" 
                                : "rgba(255, 255, 255, 0.05)",
                              color: isCurrentUser ? "var(--color-secondary)" : "var(--color-on-surface-variant)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-on-surface truncate">
                              {member.name} {isCurrentUser && <span className="text-[10px] text-secondary font-bold">{t("groups.youTag")}</span>}
                            </p>
                            <p className="text-[10px] text-on-surface-variant truncate">{member.email}</p>
                          </div>
                        </div>

                        {/* Progress and Streak */}
                        <div className="flex items-center gap-4 shrink-0">
                          {/* Progress bar */}
                          <div className="hidden sm:flex flex-col items-end w-24">
                            <span className="text-[10px] font-bold text-on-surface">
                              {member.current_count} / {member.target_count} logs
                            </span>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-1.5">
                              <div
                                className={`h-full ${member.status === "completed" ? "bg-secondary" : "bg-primary"}`}
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>

                          {/* Completion chip */}
                          <div>
                            {member.status === "completed" ? (
                              <span className="px-2.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/25 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                {t("common.done")}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-white/5 text-on-surface-variant border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                {t("common.active")}
                              </span>
                            )}
                          </div>

                          {/* Streak badge */}
                          {member.streak.current_streak > 0 && (
                            <div className="streak-badge shrink-0 py-0.5 px-2 text-[10px]">
                              <span className="material-symbols-outlined ms-filled" style={{ fontSize: "11px" }}>
                                local_fire_department
                              </span>
                              <span>{t("groups.streakBadgeValue", { days: member.streak.current_streak })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-auto border-t border-white/5 pt-4 flex justify-between items-center">
                {activeGroup.creator_id === user?.id ? (
                  <button
                    onClick={() => handleDeleteGroup(activeGroup.id)}
                    className="btn-danger-ghost py-2 px-3 text-xs"
                  >
                    {t("groups.deleteGroup")}
                  </button>
                ) : (
                  activeGroup.isJoined && (
                    <button
                      onClick={() => handleLeaveGroup(activeGroup.id)}
                      className="btn-danger-ghost py-2 px-3 text-xs"
                    >
                      {t("groups.leaveGroup")}
                    </button>
                  )
                )}

                <button
                  onClick={() => useGroupStore.setState({ activeGroup: null })}
                  className="btn-ghost py-2 px-3 text-xs"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center h-full min-h-[450px]">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4">group</span>
              <h3 className="text-lg font-bold text-on-surface">{t("groups.selectGroupHint")}</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mt-2 leading-relaxed">
                {t("groups.selectGroupDesc")}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-card relative w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl bg-slate-900/90 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-on-surface">{t("groups.createGroup")}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-on-surface border-none cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{t("groups.groupName")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("groups.groupNamePlaceholder")}
                  className="bg-surface-container-high border-none rounded-xl py-2.5 px-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none"
                  style={{ border: "1px solid var(--border-subtle)" }}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{t("groups.groupDesc")}</label>
                <textarea
                  rows={3}
                  placeholder={t("groups.groupDescPlaceholder")}
                  className="bg-surface-container-high border-none rounded-xl py-2.5 px-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none resize-none"
                  style={{ border: "1px solid var(--border-subtle)" }}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{t("goals.goalTitle")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("groups.habitGoalPlaceholder")}
                    className="bg-surface-container-high border-none rounded-xl py-2.5 px-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none"
                    style={{ border: "1px solid var(--border-subtle)" }}
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{t("goals.category")}</label>
                  <select
                    className="bg-surface-container-high border-none rounded-xl py-2.5 px-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none"
                    style={{ border: "1px solid var(--border-subtle)" }}
                    value={goalCat}
                    onChange={(e) => setGoalCat(e.target.value)}
                  >
                    <option value="Health">{t("category.health")}</option>
                    <option value="Fitness">{t("category.fitness")}</option>
                    <option value="Work">{t("category.work")}</option>
                    <option value="Learning">{t("category.learning")}</option>
                    <option value="Routine">{t("category.routine")}</option>
                    <option value="Finance">{t("category.finance")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{t("goals.targetCount")}</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="bg-surface-container-high border-none rounded-xl py-2.5 px-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none"
                    style={{ border: "1px solid var(--border-subtle)" }}
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(parseInt(e.target.value, 10) || 1)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{t("goals.frequency")}</label>
                  <select
                    className="bg-surface-container-high border-none rounded-xl py-2.5 px-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none"
                    style={{ border: "1px solid var(--border-subtle)" }}
                    value={goalFreq}
                    onChange={(e) => setGoalFreq(e.target.value)}
                  >
                    <option value="daily">{t("common.daily")}</option>
                    <option value="weekly">{t("common.weekly")}</option>
                    <option value="monthly">{t("common.monthly")}</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {loading ? t("common.saving") : t("groups.createGroup")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="badge"
        data={shareData}
      />
    </div>
  );
};
export default GroupsPage;
