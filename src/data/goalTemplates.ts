export type GoalCategory = "Health" | "Learning" | "Fitness" | "Work" | "Finance" | "Routine";

export interface GoalTemplate {
  id: string;           // unique slug, ví dụ "health-water-daily"
  title: string;        // tiếng Việt
  description: string;  // tiếng Việt, ngắn gọn 1 câu
  category: GoalCategory;
  target_count: number;
  frequency: "daily" | "weekly" | "monthly";
  emoji: string;        // 1 emoji đại diện, hiển thị trong modal
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // ── Health (Sức khoẻ) ──
  {
    id: "health-water",
    title: "Uống đủ 2 lít nước",
    description: "Duy trì thói quen uống đủ nước mỗi ngày để giữ cơ thể khoẻ mạnh.",
    category: "Health",
    target_count: 8,
    frequency: "daily",
    emoji: "💧",
  },
  {
    id: "health-sleep",
    title: "Ngủ trước 23h",
    description: "Đi ngủ đúng giờ để cải thiện chất lượng giấc ngủ và sức khoẻ tổng thể.",
    category: "Health",
    target_count: 1,
    frequency: "daily",
    emoji: "😴",
  },
  {
    id: "health-no-sugar",
    title: "Không ăn đồ ngọt",
    description: "Hạn chế đường để kiểm soát cân nặng và sức khoẻ tim mạch.",
    category: "Health",
    target_count: 1,
    frequency: "daily",
    emoji: "🚫🍬",
  },
  {
    id: "health-meditation",
    title: "Thiền định 10 phút",
    description: "Dành 10 phút mỗi ngày để thiền, giảm stress và tăng sự tập trung.",
    category: "Health",
    target_count: 1,
    frequency: "daily",
    emoji: "🧘",
  },

  // ── Learning (Học tập) ──
  {
    id: "learning-read",
    title: "Đọc sách 20 phút",
    description: "Đọc ít nhất 20 phút mỗi ngày để mở rộng kiến thức và tư duy.",
    category: "Learning",
    target_count: 1,
    frequency: "daily",
    emoji: "📚",
  },
  {
    id: "learning-english",
    title: "Luyện tiếng Anh",
    description: "Học từ vựng hoặc luyện nghe tiếng Anh 15 phút mỗi ngày.",
    category: "Learning",
    target_count: 1,
    frequency: "daily",
    emoji: "🗣️",
  },
  {
    id: "learning-online-course",
    title: "Học khoá online",
    description: "Hoàn thành ít nhất 1 bài học trong khoá học trực tuyến mỗi tuần.",
    category: "Learning",
    target_count: 1,
    frequency: "weekly",
    emoji: "💻",
  },
  {
    id: "learning-notes",
    title: "Ghi chú điều học được",
    description: "Tóm tắt và ghi lại những gì học được trong ngày để củng cố kiến thức.",
    category: "Learning",
    target_count: 1,
    frequency: "daily",
    emoji: "📝",
  },

  // ── Fitness (Thể lực) ──
  {
    id: "fitness-workout",
    title: "Tập thể dục 30 phút",
    description: "Duy trì 30 phút vận động mỗi ngày để cải thiện thể lực và tâm trạng.",
    category: "Fitness",
    target_count: 1,
    frequency: "daily",
    emoji: "🏋️",
  },
  {
    id: "fitness-steps",
    title: "Đi bộ 8.000 bước",
    description: "Đạt mục tiêu 8.000 bước mỗi ngày để giữ sức khoẻ và đốt calo.",
    category: "Fitness",
    target_count: 1,
    frequency: "daily",
    emoji: "🚶",
  },
  {
    id: "fitness-plank",
    title: "Plank 1 phút",
    description: "Tập plank mỗi ngày để tăng cường cơ lõi và sức mạnh cột sống.",
    category: "Fitness",
    target_count: 1,
    frequency: "daily",
    emoji: "💪",
  },
  {
    id: "fitness-run",
    title: "Chạy bộ 5km",
    description: "Chạy 5km mỗi tuần để cải thiện sức bền tim mạch.",
    category: "Fitness",
    target_count: 1,
    frequency: "weekly",
    emoji: "🏃",
  },

  // ── Work (Công việc) ──
  {
    id: "work-deep-work",
    title: "2 giờ Deep Work",
    description: "Dành 2 tiếng làm việc tập trung không bị gián đoạn mỗi ngày.",
    category: "Work",
    target_count: 1,
    frequency: "daily",
    emoji: "🎯",
  },
  {
    id: "work-review",
    title: "Review công việc cuối ngày",
    description: "Dành 10 phút mỗi tối để tổng kết và lên kế hoạch cho ngày hôm sau.",
    category: "Work",
    target_count: 1,
    frequency: "daily",
    emoji: "✅",
  },
  {
    id: "work-meeting",
    title: "Chuẩn bị trước cuộc họp",
    description: "Đọc agenda và chuẩn bị nội dung trước mỗi cuộc họp trong tuần.",
    category: "Work",
    target_count: 1,
    frequency: "weekly",
    emoji: "📋",
  },

  // ── Finance (Tài chính) ──
  {
    id: "finance-track",
    title: "Ghi chép chi tiêu",
    description: "Ghi lại toàn bộ chi tiêu trong ngày để kiểm soát tài chính cá nhân.",
    category: "Finance",
    target_count: 1,
    frequency: "daily",
    emoji: "💰",
  },
  {
    id: "finance-save",
    title: "Tiết kiệm hàng tháng",
    description: "Chuyển khoản tiết kiệm vào tài khoản riêng đầu mỗi tháng.",
    category: "Finance",
    target_count: 1,
    frequency: "monthly",
    emoji: "🏦",
  },
  {
    id: "finance-review",
    title: "Review ngân sách tuần",
    description: "Kiểm tra chi tiêu và điều chỉnh kế hoạch tài chính mỗi tuần.",
    category: "Finance",
    target_count: 1,
    frequency: "weekly",
    emoji: "📊",
  },

  // ── Routine (Thói quen) ──
  {
    id: "routine-journal",
    title: "Viết nhật ký buổi tối",
    description: "Ghi lại 3 điều biết ơn và 1 bài học mỗi tối trước khi đi ngủ.",
    category: "Routine",
    target_count: 1,
    frequency: "daily",
    emoji: "📓",
  },
  {
    id: "routine-morning",
    title: "Quy trình buổi sáng",
    description: "Hoàn thành quy trình buổi sáng: dậy đúng giờ, tập thể dục nhẹ, ăn sáng.",
    category: "Routine",
    target_count: 1,
    frequency: "daily",
    emoji: "🌅",
  },
  {
    id: "routine-no-phone",
    title: "Không dùng điện thoại 1 tiếng",
    description: "Tắt thông báo và không dùng điện thoại ít nhất 1 tiếng mỗi ngày.",
    category: "Routine",
    target_count: 1,
    frequency: "daily",
    emoji: "📵",
  },
];

// Helper: lấy templates theo category
export const getTemplatesByCategory = (category: GoalCategory): GoalTemplate[] =>
  GOAL_TEMPLATES.filter(t => t.category === category);

// Helper: tìm kiếm templates theo từ khoá (tên hoặc category)
export const searchTemplates = (query: string): GoalTemplate[] => {
  const q = query.toLowerCase().trim();
  if (!q) return GOAL_TEMPLATES;
  return GOAL_TEMPLATES.filter(
    t =>
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
  );
};

export const ALL_CATEGORIES: GoalCategory[] = ["Health", "Learning", "Fitness", "Work", "Finance", "Routine"];

// Map hiển thị tên Việt của category
export const CATEGORY_LABELS: Record<GoalCategory, string> = {
  Health: "Sức khoẻ",
  Learning: "Học tập",
  Fitness: "Thể lực",
  Work: "Công việc",
  Finance: "Tài chính",
  Routine: "Thói quen",
};

export const CATEGORY_ICONS: Record<GoalCategory, string> = {
  Health: "🩺",
  Learning: "📚",
  Fitness: "🏋️",
  Work: "💼",
  Finance: "💰",
  Routine: "⚡",
};
