import { useEffect, useState } from "react";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";
import { syncOfflineData } from "../services/syncManager";

export const useGoals = (filterCategory: string = "All") => {
  const { isAuthenticated } = useAuthStore();
  const {
    goals,
    loading,
    error,
    fetchGoals,
    fetchStats,
    fetchHistory,
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    restoreGoal,
    bulkArchiveGoals,
    bulkPauseGoals,
    bulkDeleteGoals,
    completeGoalProgress,
    deleteLogProgress,
  } = useGoalStore();

  const [activeCategory, setActiveCategory] = useState<string>(filterCategory);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
      fetchStats();
      fetchHistory();
    }
  }, [isAuthenticated, fetchGoals, fetchStats, fetchHistory]);

  const activeGoalsList = goals.filter((g) => !g.is_archived);
  const archivedGoalsList = goals.filter((g) => g.is_archived);

  const filteredGoals = activeGoalsList.filter((goal) => {
    if (activeCategory === "All") return true;
    return goal.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const categories = ["All", ...Array.from(new Set(activeGoalsList.map((g) => g.category)))];

  const todayPendingGoals = activeGoalsList.filter((g) => g.status === "active" && g.current_count < g.target_count);
  const todayCompletedGoals = activeGoalsList.filter((g) => g.current_count >= g.target_count);

  return {
    goals: activeGoalsList, // Backwards compatibility for components not aware of archived list yet
    activeGoalsList,
    archivedGoalsList,
    filteredGoals,
    categories,
    activeCategory,
    setActiveCategory,
    todayPendingGoals,
    todayCompletedGoals,
    loading,
    error,
    refreshAll: async () => {
      await syncOfflineData();
      await Promise.all([fetchGoals(), fetchStats(), fetchHistory()]);
    },
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    restoreGoal,
    bulkArchiveGoals,
    bulkPauseGoals,
    bulkDeleteGoals,
    completeGoalProgress,
    deleteLogProgress,
  };
};
export default useGoals;
