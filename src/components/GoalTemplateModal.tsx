import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import {
  GoalTemplate,
  GoalCategory,
  GOAL_TEMPLATES,
  searchTemplates,
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS
} from '../data/goalTemplates';

interface GoalTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: GoalTemplate) => void;
}

export const GoalTemplateModal: React.FC<GoalTemplateModalProps> = ({ isOpen, onClose, onApply }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | "All">("All");
  const [previewTemplate, setPreviewTemplate] = useState<GoalTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    let results = searchQuery ? searchTemplates(searchQuery) : GOAL_TEMPLATES;
    if (selectedCategory !== "All") {
      results = results.filter(t => t.category === selectedCategory);
    }
    return results;
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "85vh", borderRadius: "16px" }}
        onClick={e => e.stopPropagation()} // ngăn click bên trong đóng modal
      >
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--color-on-surface)" }}>
              <span className="text-2xl">✨</span> Chọn mẫu mục tiêu
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Tìm kiếm mẫu mục tiêu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-variant/50 border border-outline-variant/20 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
              style={{ color: "var(--color-on-surface)" }}
            />
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="px-4 py-3 border-b border-outline-variant/20 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(["All", ...ALL_CATEGORIES] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-on-primary"
                    : "bg-surface-variant text-on-surface-variant hover:bg-primary/10"
                }`}
              >
                {cat === "All" ? "🗂 Tất cả" : `${CATEGORY_ICONS[cat as GoalCategory]} ${CATEGORY_LABELS[cat as GoalCategory]}`}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--color-on-surface-variant)" }}>
              <span style={{ fontSize: "32px" }}>🔍</span>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>
                Không tìm thấy template nào cho "<strong>{searchQuery}</strong>"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`glass-card p-4 cursor-pointer transition-all hover:scale-[1.02] border ${
                    previewTemplate?.id === template.id
                      ? "border-primary/60 bg-primary/5"
                      : "border-outline-variant/20 hover:border-primary/30"
                  }`}
                  onClick={() => setPreviewTemplate(template)}
                  style={{ borderRadius: "12px" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none">{template.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-on-surface)" }}>
                          {template.title}
                        </h3>
                        <span style={{
                          fontSize: "10px", fontWeight: 600,
                          padding: "2px 8px", borderRadius: "999px",
                          background: "var(--color-primary-container)",
                          color: "var(--color-on-primary-container)",
                        }}>
                          {CATEGORY_LABELS[template.category]}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--color-on-surface-variant)", marginTop: "4px" }}>
                        {template.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2" style={{ fontSize: "11px", color: "var(--color-on-surface-variant)" }}>
                        <span>🔁 {template.frequency === "daily" ? "Hàng ngày" : template.frequency === "weekly" ? "Hàng tuần" : "Hàng tháng"}</span>
                        <span>🎯 Mục tiêu: {template.target_count}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Panel preview và nút apply – chỉ hiện khi card đang được chọn */}
                  {previewTemplate?.id === template.id && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-outline-variant)" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // tránh re-trigger card click
                          onApply(template);
                        }}
                        className="w-full btn-primary text-sm py-2"
                        style={{ borderRadius: "8px" }}
                      >
                        ✨ Dùng template này
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
