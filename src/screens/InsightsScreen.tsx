import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Svg, { Rect, Text as SvgText, G, Path } from "react-native-svg";
import { useInsights, FocusCategory } from "../context/InsightsContext";
import { useSettings } from "../context/SettingsContext";
import { typography } from "../theme/typography";

const CATEGORY_LABELS: Record<FocusCategory, string> = {
  work: "Work",
  study: "Study",
  personal: "Personal",
  health: "Health",
  other: "Other",
};

// Helper function for pie chart arcs
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function InsightsScreen() {
  const { sessions, dailyStats, currentStreak, bestStreak, categoryStats, getHeatmapData } = useInsights();
  const { colors, isDark } = useSettings();

  const heatmapData = getHeatmapData(12);

  // Heatmap color intensity based on count (black/white theme)
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return colors.card;
    const opacity = Math.min(0.2 + count * 0.16, 1);
    return isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
  };

  const totalMinutes = Array.from(dailyStats.values()).reduce((sum, day) => sum + day.totalMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgPerDay = dailyStats.size > 0 ? Math.round((totalMinutes / dailyStats.size / 60) * 10) / 10 : 0;

  // Pie chart data
  const totalCategoryMinutes = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);
  const chartData = Object.entries(categoryStats)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      category: category as FocusCategory,
      value,
      percentage: Math.round((value / totalCategoryMinutes) * 100),
    }));

  // Render pie chart
  const renderPieChart = () => {
    if (totalCategoryMinutes === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Complete pomodoros to see your focus distribution</Text>
        </View>
      );
    }

    const size = 180;
    const radius = 70;
    const innerRadius = 45;
    const centerX = size / 2;
    const centerY = size / 2;

    let currentAngle = 0;
    const slices = chartData.map((item, index) => {
      const sliceAngle = (item.value / totalCategoryMinutes) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const outerStart = polarToCartesian(centerX, centerY, radius, endAngle);
      const outerEnd = polarToCartesian(centerX, centerY, radius, startAngle);
      const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
      const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const path = ["M", outerStart.x, outerStart.y, "A", radius, radius, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y, "L", innerEnd.x, innerEnd.y, "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y, "Z"].join(" ");

      // Alternate between text and muted for segments
      const segmentColor = index % 2 === 0 ? colors.text : colors.textSecondary;

      return { ...item, path, segmentColor };
    });

    return (
      <View style={styles.pieWrapper}>
        <Svg width={size} height={size}>
          <G>
            {slices.map((slice, index) => (
              <Path key={index} d={slice.path} fill={slice.segmentColor} />
            ))}
          </G>
        </Svg>
        <View style={styles.pieCenter}>
          <Text style={[styles.pieCenterValue, { color: colors.text }]}>{Math.round(totalCategoryMinutes / 60 * 10) / 10}</Text>
          <Text style={[styles.pieCenterLabel, { color: colors.textMuted }]}>hours</Text>
        </View>
      </View>
    );
  };

  // Heatmap rendering
  const cellSize = 12;
  const cellGap = 3;
  const weeksToShow = Math.ceil(heatmapData.length / 7);
  const heatmapWidth = weeksToShow * (cellSize + cellGap) + 40;
  const heatmapHeight = 7 * (cellSize + cellGap) + 30;

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const months: { label: string; x: number }[] = [];
  let currentMonth = "";
  heatmapData.forEach((item, index) => {
    const month = new Date(item.date).toLocaleString("default", { month: "short" });
    const week = Math.floor(index / 7);
    if (month !== currentMonth) {
      currentMonth = month;
      months.push({ label: month, x: week * (cellSize + cellGap) + 40 });
    }
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Insights</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Your focus journey</Text>
      </View>

      {/* Streak Cards */}
      <View style={styles.streakContainer}>
        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.streakValue, { color: colors.text }]}>{currentStreak}</Text>
          <Text style={[styles.streakTitle, { color: colors.textMuted }]}>Current Streak</Text>
        </View>
        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.streakValue, { color: colors.text }]}>{bestStreak}</Text>
          <Text style={[styles.streakTitle, { color: colors.textMuted }]}>Best Streak</Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{sessions.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pomodoros</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalHours}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Hours</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{avgPerDay}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg/Day</Text>
        </View>
      </View>

      {/* Calendar Heatmap */}
      <View style={[styles.heatmapContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus Activity</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={heatmapWidth} height={heatmapHeight}>
            {/* Day labels */}
            {[1, 3, 5].map((dayIndex) => (
              <SvgText key={dayIndex} x={15} y={dayIndex * (cellSize + cellGap) + cellSize + 20} fontSize={9} fill={colors.textMuted} textAnchor="middle">
                {days[dayIndex]}
              </SvgText>
            ))}

            {/* Month labels */}
            {months.map((month, i) => (
              <SvgText key={i} x={month.x} y={12} fontSize={9} fill={colors.textMuted}>
                {month.label}
              </SvgText>
            ))}

            {/* Heatmap cells with grid lines */}
            {heatmapData.map((item, index) => {
              const week = Math.floor(index / 7);
              const day = index % 7;
              const x = week * (cellSize + cellGap) + 40;
              const y = day * (cellSize + cellGap) + 20;
              return (
                <G key={item.date}>
                  {/* Cell background with border */}
                  <Rect
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    fill={getHeatmapColor(item.count)}
                    stroke={colors.border}
                    strokeWidth={0.5}
                  />
                </G>
              );
            })}
          </Svg>
        </ScrollView>

        {/* Legend */}
        <View style={styles.heatmapLegend}>
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <View key={level} style={[styles.legendCell, { backgroundColor: getHeatmapColor(level), borderColor: colors.border }]} />
          ))}
          <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
        </View>
      </View>

      {/* Category Pie Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus Distribution</Text>
        {renderPieChart()}

        {/* Category Legend */}
        {chartData.length > 0 && (
          <View style={styles.categoryLegend}>
            {chartData.map((item, index) => (
              <View key={item.category} style={[styles.categoryItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.categoryDot, { backgroundColor: index % 2 === 0 ? colors.text : colors.textSecondary }]} />
                <Text style={[styles.categoryLabel, { color: colors.text }]}>{CATEGORY_LABELS[item.category]}</Text>
                <Text style={[styles.categoryValue, { color: colors.textSecondary }]}>{Math.round((item.value / 60) * 10) / 10}h</Text>
                <Text style={[styles.categoryPercent, { color: colors.textMuted }]}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    ...typography.largeTitle,
  },
  headerSubtitle: {
    ...typography.subheadline,
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  streakValue: {
    ...typography.numeric,
  },
  streakTitle: {
    ...typography.label,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...typography.numericSmall,
    fontWeight: "600",
  },
  statLabel: {
    ...typography.label,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
  },
  heatmapContainer: {
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: 16,
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 4,
  },
  legendText: {
    ...typography.caption2,
    marginHorizontal: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  chartContainer: {
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  pieWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 180,
  },
  pieCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pieCenterValue: {
    ...typography.numericSmall,
    fontWeight: "200",
  },
  pieCenterLabel: {
    ...typography.label,
  },
  emptyChart: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.headline,
  },
  emptySubtext: {
    ...typography.footnote,
    marginTop: 8,
    textAlign: "center",
  },
  categoryLegend: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  categoryLabel: {
    ...typography.subheadline,
    flex: 1,
  },
  categoryValue: {
    ...typography.subheadline,
    fontWeight: "600",
    marginRight: 12,
  },
  categoryPercent: {
    ...typography.subheadline,
    width: 40,
    textAlign: "right",
  },
  bottomSpacing: {
    height: 100,
  },
});
