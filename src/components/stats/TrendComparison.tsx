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
import { useTranslation } from "../../i18n";
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

interface TrendResponse {
  success?: boolean;
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
  goalBreakdown?: Array<{
    goalId: string;
    title: string;
    category: string;
    status: string;
    current: number;
    previous: number;
    changePercent: number;
    todayCheckedIn: boolean;
    yesterdayCheckedIn: boolean;
  }>;
  dailySummary?: {
    today: DailySummaryBlock;
    yesterday: DailySummaryBlock;
  };
}

const PERIODS: Array<{ value: TrendPeriod; label: string; icon: string }> = [
  { value: "day", label: "Ngay", icon: "today" },
  { value: "week", label: "Tuan", icon: "calendar_view_week" },
  { value: "month", label: "Thang", icon: "calendar_month" },
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
  if (items.length === 0) return "Khong co";
  return items.slice(0, 2).join(", ") + (items.length > 2 ? ` +${items.length - 2}` : "");
}

export const TrendComparison: React.FC = () => {
  const { goals } = useGoalStore();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TrendPeriod>("week");
  const [goalId, setGoalId] = useState("");
  const [allGoalsMode, setAllGoalsMode] = useState<"overview" | "detail">("overview");
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === goalId), [goals, goalId]);
  const showAllGoalModes = !goalId;
  const isPositive = (trend?.changePercent ?? 0) >= 0;
  const hasData = Boolean(trend?.data?.some((point) => point.current > 0 || point.previous > 0));

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
          setError(err.response?.data?.message || "Khong tai duoc du lieu xu huong.");
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
    if (!summary) return "Hay check-in them de he thong co du lieu goi y chinh xac hon.";

    if (summary.yesterday.notCheckedInCount > 0) {
      return `Hom qua ban chua check-in ${summary.yesterday.notCheckedInCount} muc tieu (${listPreview(summary.yesterday.notCheckedInGoals)}). Goi y: dua cac muc nay len dau ngay hoac dat reminder som hon.`;
    }

    if (summary.today.notCheckedInCount > 0) {
      return `Hom nay ban con ${summary.today.notCheckedInCount} muc tieu chua check-in (${listPreview(summary.today.notCheckedInGoals)}). Nen hoan thanh muc de nhat truoc de giu nhip.`;
    }

    if (summary.today.checkedInCount > 0) {
      return "Hom nay ban dang giu nhip tot. Hay tiep tuc duy tri va tranh them qua nhieu muc tieu moi trong cung mot ngay.";
    }

    return "Chua co check-in trong hom nay. Hay bat dau voi mot muc tieu nho de tao da.";
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
          {point.previousPeriodLabel && <p>Ky truoc: {compactDate(point.previousPeriodLabel)}</p>}
          {point.currentPeriodLabel && <p>Hien tai: {compactDate(point.currentPeriodLabel)}</p>}
          {selectedGoal && <p>Muc tieu: {selectedGoal.title}</p>}
        </div>
        <div className="space-y-1.5 border-t border-white/10 pt-2">
          <div className="flex min-w-[180px] items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-outline/50" />
              Ky truoc
            </span>
            <strong>{previousPayload?.value ?? 0} check-in</strong>
          </div>
          <div className="flex min-w-[180px] items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
              Hien tai
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
            <p className="text-[11px] font-bold text-on-surface-variant">Da check-in</p>
            <p className="mt-1 text-2xl font-black text-secondary">{block?.checkedInCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-error/10 p-3">
            <p className="text-[11px] font-bold text-on-surface-variant">Chua check-in</p>
            <p className="mt-1 text-2xl font-black text-error">{block?.notCheckedInCount ?? 0}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  const GoalBreakdownStrip = () => {
    const items = trend?.goalBreakdown || [];
    if (!showAllGoalModes || allGoalsMode !== "detail") return null;

    if (items.length === 0) {
      return (
        <div className="mt-4 rounded-2xl border border-white/10 bg-surface-container-low p-4 text-sm text-on-surface-variant">
          Chua co muc tieu active de hien thi chi tiet.
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-surface-container-low p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-on-surface">Chi tiet tung muc tieu</p>
            <p className="text-xs text-on-surface-variant">Du lieu lay truc tiep tu log check-in hien tai cua tung muc tieu.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{items.length} muc tieu</span>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {items.map((item) => {
            const up = item.changePercent >= 0;
            return (
              <div
                key={item.goalId}
                className="min-w-[260px] rounded-2xl border border-white/10 bg-surface-container-high p-4"
              >
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
                    <p className="text-[11px] text-on-surface-variant">Ky truoc</p>
                    <p className="mt-1 text-xl font-black text-on-surface">{item.previous}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/10 p-3">
                    <p className="text-[11px] text-on-surface-variant">Hien tai</p>
                    <p className="mt-1 text-xl font-black text-secondary">{item.current}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`rounded-lg px-2 py-1.5 font-bold ${item.yesterdayCheckedIn ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                    Hom qua: {item.yesterdayCheckedIn ? "Da check-in" : "Chua"}
                  </div>
                  <div className={`rounded-lg px-2 py-1.5 font-bold ${item.todayCheckedIn ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                    Hom nay: {item.todayCheckedIn ? "Da check-in" : "Chua"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Trend Comparison</h2>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            So sanh hieu suat theo ngay, tuan lich va thang bang du lieu check-in realtime tu API.
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
            onChange={(event) => setGoalId(event.target.value)}
            className="min-h-[42px] rounded-xl border border-white/10 bg-surface-container-low px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary/60 sm:min-w-[240px]"
          >
            <option value="">{t("stats.allGoals")}</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-surface-container-low p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Tong ky truoc</p>
          <p className="mt-1 text-3xl font-black text-on-surface">{trend?.previousTotal ?? 0}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{compactDate(trend?.previousRangeLabel)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-container-low p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Tong ky hien tai</p>
          <p className="mt-1 text-3xl font-black text-on-surface">{trend?.currentTotal ?? 0}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{compactDate(trend?.currentRangeLabel)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-container-low p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Thay doi</p>
          <div className={`mt-1 inline-flex items-center gap-2 text-2xl font-black ${isPositive ? "text-secondary" : "text-error"}`}>
            <span className="material-symbols-outlined">{isPositive ? "trending_up" : "trending_down"}</span>
            <span>
              {formatPercent(trend?.changePercent ?? 0)}
              {period === "month" && <span className="ml-1 text-sm font-bold">so voi thang truoc</span>}
            </span>
          </div>
        </div>
      </div>

      {showAllGoalModes && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Che do hien thi khi xem tat ca muc tieu
          </p>
          <div className="inline-grid grid-cols-2 rounded-xl border border-white/10 bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setAllGoalsMode("overview")}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${allGoalsMode === "overview" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-white/5"}`}
            >
              Tong the
            </button>
            <button
              type="button"
              onClick={() => setAllGoalsMode("detail")}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${allGoalsMode === "detail" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-white/5"}`}
            >
              Chi tiet
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
        ) : !trend || !hasData ? (
          <div className="flex h-[320px] flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant">bar_chart_off</span>
            <p className="font-bold text-on-surface">Chua co du lieu so sanh</p>
            <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
              Hay check-in them muc tieu trong ky hien tai hoac ky truoc de bieu do co du lieu.
            </p>
          </div>
        ) : (
          <div className="h-[330px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend.data} margin={{ top: 12, right: 12, bottom: 8, left: -18 }} barGap={6}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingBottom: 12 }} />
                <Bar dataKey="previous" name="Ky truoc" fill="rgba(148, 163, 184, 0.55)" radius={[6, 6, 0, 0]} maxBarSize={34} animationDuration={450} />
                <Bar dataKey="current" name="Ky hien tai" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} maxBarSize={34} animationDuration={450} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bo loc hien tai</p>
        <p className="mt-1 text-sm font-bold text-on-surface">
          {selectedGoal ? `Muc tieu cu the: ${selectedGoal.title}` : "Tat ca muc tieu"}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Week mode dung tuan lich Monday-Sunday va so sanh voi tuan lich lien truoc, khong dung cach lay hom nay tru 7 ngay.
        </p>
      </div>

      <GoalBreakdownStrip />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCard title="Hom qua" block={trend?.dailySummary?.yesterday} />
        <SummaryCard title="Hom nay" block={trend?.dailySummary?.today} />
      </div>

      <div className="mt-4 rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-secondary/15 p-2 text-secondary">
            <span className="material-symbols-outlined text-[20px]">tips_and_updates</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-on-surface">Goi y can cai thien theo ngay</p>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{advice}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
