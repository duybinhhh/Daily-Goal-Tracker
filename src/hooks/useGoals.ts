// src/hooks/useGoals.ts
import { useEffect, useState } from "react";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";

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
    completeGoalProgress,
  } = useGoalStore();

  const [activeCategory, setActiveCategory] = useState<string>(filterCategory);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
      fetchStats();
      fetchHistory();
    }
  }, [isAuthenticated, fetchGoals, fetchStats, fetchHistory]);

  const filteredGoals = goals.filter((goal) => {
    if (activeCategory === "All") return true;
    return goal.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const categories = ["All", ...Array.from(new Set(goals.map((g) => g.category)))];

  const todayPendingGoals = goals.filter((g) => g.status === "active" && g.current_count < g.target_count);
  const todayCompletedGoals = goals.filter((g) => g.current_count >= g.target_count);

  return {
    goals,
    filteredGoals,
    categories,
    activeCategory,
    setActiveCategory,
    todayPendingGoals,
    todayCompletedGoals,
    loading,
    error,
    refreshAll: async () => {
      await Promise.all([fetchGoals(), fetchStats(), fetchHistory()]);
    },
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoalProgress,
  };
};
export default useGoals;
