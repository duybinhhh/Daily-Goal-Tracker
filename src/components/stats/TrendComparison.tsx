import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";
import { useGoalStore } from "../../store/goalStore";

type TrendPeriod = "day" | "week" | "month";

interface TrendPoint {
  label: string;
  current: number;
  previous: number;
  currentPeriodLabel?: string;
  previousPeriodLabel?: string;
}

interface DailySummaryBlock {
  checkedInCount: number;
  notCheckedInCount: number;
  checkedInGoals: string[];
  notCheckedInGoals: string[];
  date: string;
}

interface GoalBreakdownItem {
  goalId: string;
  title: string;
  category: string;
  status: string;
  current: number;
  previous: number;
  changePercent: number;
  todayCheckedIn: boolean;
  yesterdayCheckedIn: boolean;
}

interface TrendResponse {
  period: TrendPeriod;
  goalId?: string;
  goalTitle?: string;
  generatedAt?: string;
  currentRangeLabel?: string;
  previousRangeLabel?: string;
  currentTotal: number;
  previousTotal: number;
  changePercent: number;
  data: TrendPoint[];
  goalBreakdown?: GoalBreakdownItem[];
  dailySummary?: {
    today: DailySummaryBlock;
    yesterday: DailySummaryBlock;
  };
}

const PERIODS: Array<{ value: TrendPeriod; label: string; icon: string }> = [
  { value: "day", label: "Ngày", icon: "today" },
  { value: "week", label: "Tuần", icon: "calendar_view_week" },
  { value: "month", label: "Tháng", icon: "calendar_month" },
];

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function compactDate(value?: string) {
  if (!value) return "";
  return value
    .split(" - ")
    .map((part) => {
      const pieces = part.split("-");
      return pieces.length === 3 ? `${pieces[2]}/${pieces[1]}` : part;
    })
    .join(" - ");
}

function getCompletionPercent(block?: DailySummaryBlock) {
  if (!block) return 0;
  const total = block.checkedInCount + block.notCheckedInCount;
  return total > 0 ? Math.round((block.checkedInCount / total) * 100) : 0;
}

function listPreview(items: string[]) {
  if (items.length === 0) return "Không có";
  return items.slice(0, 2).join(", ") + (items.length > 2 ? ` +${items.length - 2}` : "");
}

export const TrendComparison: React.FC = () => {
  const { goals } = useGoalStore();
  const [period, setPeriod] = useState<TrendPeriod>("week");
  const [goalId, setGoalId] = useState("");
  const [allGoalsMode, setAllGoalsMode] = useState<"overview" | "detail">("overview");
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === goalId), [goals, goalId]);
  const showAllGoalModes = !goalId;
  const isPositive = (trend?.changePercent ?? 0) >= 0;
  const hasChartData = Boolean(trend?.data?.some((point) => point.current > 0 || point.previous > 0));
  const detailItems = trend?.goalBreakdown || [];

  useEffect(() => {
    let cancelled = false;

    async function loadTrend() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ period });
        if (goalId) params.set("goalId", goalId);
        const response = await api.get<TrendResponse>(`/api/stats/trend?${params.toString()}`);
        if (!cancelled) setTrend(response.data);
      } catch (err: any) {
        if (!cancelled) {
          setTrend(null);
          setError(err.response?.data?.message || "Không tải được dữ liệu xu hướng.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrend();
    return () => {
      cancelled = true;
    };
  }, [period, goalId]);

  const advice = useMemo(() => {
    const summary = trend?.dailySummary;
    if (!summary) return "Hãy check-in thêm để hệ thống có dữ liệu gợi ý chính xác hơn.";

    if (summary.yesterday.notCheckedInCount > 0) {
      return `Hôm qua bạn chưa đạt ${summary.yesterday.notCheckedInCount} mục tiêu (${listPreview(summary.yesterday.notCheckedInGoals)}). Gợi ý: đưa các mục này lên đầu ngày hoặc đặt reminder sớm hơn.`;
    }

    if (summary.today.notCheckedInCount > 0) {
      return `Hôm nay bạn còn ${summary.today.notCheckedInCount} mục tiêu chưa đạt target (${listPreview(summary.today.notCheckedInGoals)}). Nên hoàn thành mục dễ nhất trước để giữ nhịp.`;
    }

    if (summary.today.checkedInCount > 0) {
      return "Hôm nay bạn đang giữ nhịp tốt. Hãy tiếp tục duy trì và tránh thêm quá nhiều mục tiêu mới trong cùng một ngày.";
    }

    return "Chưa có check-in trong hôm nay. Hãy bắt đầu với một mục tiêu nhỏ để tạo đà.";
  }, [trend]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const point: TrendPoint = payload[0].payload;
    const previousPayload = payload.find((item: any) => item.dataKey === "previous");
    const currentPayload = payload.find((item: any) => item.dataKey === "current");

    return (
      <div className="rounded-xl border border-white/10 bg-surface-container-high px-4 py-3 text-xs text-on-surface shadow-2xl">
        <p className="mb-2 font-extrabold">{label}</p>
        <div className="mb-2 space-y-1 text-[11px] text-on-surface-variant">
          {point.previousPeriodLabel && <p>Kỳ trước: {compactDate(point.previousPeriodLabel)}</p>}
          {point.currentPeriodLabel && <p>Hiện tại: {compactDate(point.currentPeriodLabel)}</p>}
          {selectedGoal && <p>Mục tiêu: {selectedGoal.title}</p>}
        </div>
        <div className="space-y-1.5 border-t border-white/10 pt-2">
          <div className="flex min-w-[180px] items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-outline/50" />
              Kỳ trước
            </span>
            <strong>{previousPayload?.value ?? 0} check-in</strong>
          </div>
          <div className="flex min-w-[180px] items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
              Hiện tại
            </span>
            <strong>{currentPayload?.value ?? 0} check-in</strong>
          </div>
        </div>
      </div>
    );
  };

  const SummaryCard = ({ title, block }: { title: string; block?: DailySummaryBlock }) => {
    const percent = getCompletionPercent(block);
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-container-low p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">{title}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{block?.date ? compactDate(block.date) : "--"}</p>
          </div>
          <div className="rounded-xl bg-primary/10 px-3 py-1 text-sm font-black text-primary">{percent}%</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary/10 p-3">
            <p className="text-[11px] font-bold text-on-surface-variant">Đã đạt</p>
            <p className="mt-1 text-2xl font-black text-secondary">{block?.checkedInCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-error/10 p-3">
            <p className="text-[11px] font-bold text-on-surface-variant">Chưa đạt</p>
            <p className="mt-1 text-2xl font-black text-error">{block?.notCheckedInCount ?? 0}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  const DetailView = () => {
    if (detailItems.length === 0) {
      return (
        <div className="flex h-[320px] flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant">view_list</span>
          <p className="font-bold text-on-surface">Chưa có mục tiêu active để hiển thị chi tiết</p>
        </div>
      );
    }

    return (
      <div className="h-[330px] overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {detailItems.map((item) => {
            const up = item.changePercent >= 0;
            return (
              <div key={item.goalId} className="w-[280px] rounded-2xl border border-white/10 bg-surface-container-high p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-extrabold text-on-surface" title={item.title}>{item.title}</h4>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{item.category}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${up ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                    {formatPercent(item.changePercent)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] text-on-surface-variant">Kỳ trước</p>
                    <p className="mt-1 text-xl font-black text-on-surface">{item.previous}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/10 p-3">
                    <p className="text-[11px] text-on-surface-variant">Hiện tại</p>
                    <p className="mt-1 text-xl font-black text-secondary">{item.current}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`rounded-lg px-2 py-1.5 font-bold ${item.yesterdayCheckedIn ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                    Hôm qua: {item.yesterdayCheckedIn ? "Đã đạt" : "Chưa đạt"}
                  </div>
                  <div className={`rounded-lg px-2 py-1.5 font-bold ${item.todayCheckedIn ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                    Hôm nay: {item.todayCheckedIn ? "Đã đạt" : "Chưa đạt"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const OverviewChart = () => {
    if (!trend || !hasChartData) {
      return (
        <div className="flex h-[320px] flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant">bar_chart_off</span>
          <p className="font-bold text-on-surface">Chưa có dữ liệu so sánh</p>
          <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
            Hãy check-in thêm mục tiêu trong kỳ hiện tại hoặc kỳ trước để biểu đồ có dữ liệu.
          </p>
        </div>
      );
    }

    return (
      <div className="h-[330px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend.data} margin={{ top: 12, right: 12, bottom: 8, left: -18 }} barGap={6}>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12, fontWeight: 700 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12, fontWeight: 700 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingBottom: 12 }} />
            <Bar dataKey="previous" name="Kỳ trước" fill="rgba(148, 163, 184, 0.55)" radius={[6, 6, 0, 0]} maxBarSize={34} animationDuration={450} />
            <Bar dataKey="current" name="Kỳ hiện tại" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} maxBarSize={34} animationDuration={450} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <section className="glass-card rounded-2xl p-5 md:p-7">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <span className="material-symbols-outlined text-[15px]">monitoring</span>
            US-22
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">So sánh xu hướng</h2>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            So sánh hiệu suất theo ngày, tuần lịch và tháng bằng dữ liệu check-in realtime từ API.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <div className="grid grid-cols-3 rounded-xl border border-white/10 bg-surface-container-low p-1">
            {PERIODS.map((item) => {
              const active = period === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriod(item.value)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    active ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <select
            value={goalId}
            onChange={(event) => {
              setGoalId(event.target.value);
              setAllGoalsMode("overview");
            }}
            className="min-h-[42px] rounded-xl border border-white/10 bg-surface-container-low px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary/60 sm:min-w-[240px]"
          >
            <option value="">Tất cả mục tiêu</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-surface-container-low p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Tổng kỳ trước</p>
          <p className="mt-1 text-3xl font-black text-on-surface">{trend?.previousTotal ?? 0}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{compactDate(trend?.previousRangeLabel)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-container-low p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Tổng kỳ hiện tại</p>
          <p className="mt-1 text-3xl font-black text-on-surface">{trend?.currentTotal ?? 0}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{compactDate(trend?.currentRangeLabel)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-container-low p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Thay đổi</p>
          <div className={`mt-1 inline-flex items-center gap-2 text-2xl font-black ${isPositive ? "text-secondary" : "text-error"}`}>
            <span className="material-symbols-outlined">{isPositive ? "trending_up" : "trending_down"}</span>
            <span>
              {formatPercent(trend?.changePercent ?? 0)}
              {period === "month" && <span className="ml-1 text-sm font-bold">so với tháng trước</span>}
            </span>
          </div>
        </div>
      </div>

      {showAllGoalModes && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Chế độ hiển thị khi xem tất cả mục tiêu
          </p>
          <div className="inline-grid grid-cols-2 rounded-xl border border-white/10 bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setAllGoalsMode("overview")}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${allGoalsMode === "overview" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-white/5"}`}
            >
              Tổng thể
            </button>
            <button
              type="button"
              onClick={() => setAllGoalsMode("detail")}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${allGoalsMode === "detail" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-white/5"}`}
            >
              Chi tiết
            </button>
          </div>
        </div>
      )}

      <div className="relative min-h-[340px] rounded-2xl border border-white/10 bg-surface-container-low/60 p-4">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/50 backdrop-blur-sm">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        )}

        {error ? (
          <div className="flex h-[320px] flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-2 text-3xl text-error">error</span>
            <p className="text-sm font-semibold text-error">{error}</p>
          </div>
        ) : showAllGoalModes && allGoalsMode === "detail" ? (
          <DetailView />
        ) : (
          <OverviewChart />
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bộ lọc hiện tại</p>
        <p className="mt-1 text-sm font-bold text-on-surface">
          {selectedGoal ? `Mục tiêu cụ thể: ${selectedGoal.title}` : allGoalsMode === "detail" ? "Tất cả mục tiêu - xem chi tiết từng mục tiêu" : "Tất cả mục tiêu - xem tổng thể"}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Chế độ tuần dùng tuần lịch Monday-Sunday và so sánh với tuần lịch liền trước, không dùng cách lấy hôm nay trừ 7 ngày.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCard title="Hôm qua" block={trend?.dailySummary?.yesterday} />
        <SummaryCard title="Hôm nay" block={trend?.dailySummary?.today} />
      </div>

      <div className="mt-4 rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-secondary/15 p-2 text-secondary">
            <span className="material-symbols-outlined text-[20px]">tips_and_updates</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-on-surface">Gợi ý cần cải thiện theo ngày</p>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{advice}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
