import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import { fetchAdminOrders } from "../../Redux/Actions/orderActions";
import { formatPHP } from "../../utils/currency";
import { buildAnalyticsPdfHtml, exportPdfFromHtml } from "../../utils/pdfExport";

const monthLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-PH", { month: "short", year: "2-digit" });
};

const monthKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
};

const addressLabel = (order) => {
  const addressParts = [
    order?.shippingAddress1,
    order?.shippingAddress2,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  if (!addressParts.length) {
    return "Unknown Address";
  }
  return addressParts.join(", ");
};

const PIE_COLORS = ["#1f8a70", "#0077b6", "#ffb703", "#fb8500", "#8d99ae", "#b56576"];

const MostPurchasedPieChart = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const size = 170;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {!data.length ? <Text style={styles.emptyText}>No data yet.</Text> : null}

      {data.length ? (
        <View style={styles.pieWrap}>
          <Svg width={size} height={size}>
            {(() => {
              let offset = 0;
              return data.map((item, index) => {
                const value = Number(item.value || 0);
                const fraction = total > 0 ? value / total : 0;
                const dash = circumference * fraction;
                const color = PIE_COLORS[index % PIE_COLORS.length];

                const slice = (
                  <Circle
                    key={`${item.label}-${index}`}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${dash} ${Math.max(circumference - dash, 0)}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    rotation="-90"
                    originX={cx}
                    originY={cy}
                  />
                );

                offset += dash;
                return slice;
              });
            })()}
          </Svg>

          <View style={styles.legendWrap}>
            {data.map((item, index) => {
              const value = Number(item.value || 0);
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return (
                <View key={item.label} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: PIE_COLORS[index % PIE_COLORS.length] },
                    ]}
                  />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {item.label}: {value} ({percent}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const SixMonthLineChart = ({ title, data, insights }) => {
  const width = 320;
  const height = 180;
  const padX = 20;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 0);

  const points = data.map((item, index) => {
    const x = data.length <= 1 ? width / 2 : padX + (index / (data.length - 1)) * chartW;
    const normalized = max > 0 ? Number(item.value || 0) / max : 0;
    const y = padY + chartH - normalized * chartH;
    return { x, y, label: item.label, value: Number(item.value || 0) };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {!data.length ? <Text style={styles.emptyText}>No data yet.</Text> : null}

      {data.length ? (
        <View style={styles.sixMonthMetaWrap}>
          <Text style={styles.sixMonthMetaText}>Total: {formatPHP(insights?.totalSales || 0)}</Text>
          <Text style={styles.sixMonthMetaText}>Avg/Month: {formatPHP(insights?.averageSales || 0)}</Text>
          <Text style={styles.sixMonthMetaText}>Orders: {insights?.totalOrders || 0}</Text>
          <Text style={styles.sixMonthMetaText}>Best: {insights?.bestMonth?.label || "N/A"}</Text>
          <Text style={styles.sixMonthMetaText}>
            Growth: {typeof insights?.growthPercent === "number" ? `${insights.growthPercent.toFixed(1)}%` : "N/A"}
          </Text>
        </View>
      ) : null}

      {data.length ? (
        <View style={styles.lineWrap}>
          <Svg width={width} height={height}>
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke="#1f8a70"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((point) => (
              <Circle
                key={`${point.label}-${point.x}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#0077b6"
              />
            ))}
          </Svg>

          <View style={styles.lineLabelsRow}>
            {data.map((item) => (
              <Text key={item.label} style={styles.lineLabelText}>
                {item.label}
              </Text>
            ))}
          </View>

          <View style={styles.monthlyBreakdownWrap}>
            {data.map((item) => (
              <View key={`detail-${item.label}`} style={styles.monthlyBreakdownRow}>
                <Text style={styles.monthlyBreakdownMonth}>{item.label}</Text>
                <Text style={styles.monthlyBreakdownValue}>{formatPHP(item.value)}</Text>
                <Text style={styles.monthlyBreakdownOrders}>{item.orders} orders</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const AddressLollipopChart = ({ title, data }) => {
  const topValue = Math.max(...data.map((item) => Number(item.value || 0)), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {!data.length ? <Text style={styles.emptyText}>No data yet.</Text> : null}

      <View style={styles.lollipopWrap}>
        {data.map((item) => {
          const rawValue = Number(item.value || 0);
          const widthPercent = topValue > 0 ? Math.max((rawValue / topValue) * 100, 10) : 10;

          return (
            <View key={item.label} style={styles.lollipopItem}>
              <View style={styles.lollipopHeader}>
                <Text style={styles.lollipopLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.lollipopValue}>{rawValue} items</Text>
              </View>

              <View style={styles.lollipopTrack}>
                <View style={[styles.lollipopLine, { width: `${widthPercent}%` }]}>
                  <View style={styles.lollipopDot} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const Dashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { adminOrders: orders, loadingAdmin: loading, errorAdmin } = useSelector((state) => state.orders);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          await dispatch(fetchAdminOrders());
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Failed to load dashboard",
            text2: error?.response?.data?.message || "Please try again",
            topOffset: 60,
          });
        }
      };

      load();

      return undefined;
    }, [dispatch])
  );

  const summary = useMemo(() => {
    const orderList = orders || [];
    const totalSales = orderList.reduce((sum, order) => sum + Number(order?.totalPrice || 0), 0);

    const productPurchaseMap = {};
    const monthlySalesMap = {};
    const addressPurchaseMap = {};
    const userPurchaseMap = {};

    orderList.forEach((order) => {
      const orderDate = order?.dateOrdered || order?.createdAt;
      const key = monthKey(orderDate);
      if (key) {
        if (!monthlySalesMap[key]) {
          monthlySalesMap[key] = { label: monthLabel(orderDate), value: 0, orders: 0 };
        }
        monthlySalesMap[key].value += Number(order?.totalPrice || 0);
        monthlySalesMap[key].orders += 1;
      }

      const address = addressLabel(order);
      const userName = String(order?.user?.name || "Unknown User");

      (order?.orderItems || []).forEach((orderItem) => {
        const quantity = Number(orderItem?.quantity || 0);
        const productName = orderItem?.product?.name || "Unknown Item";

        productPurchaseMap[productName] = (productPurchaseMap[productName] || 0) + quantity;
        addressPurchaseMap[address] = (addressPurchaseMap[address] || 0) + quantity;
        userPurchaseMap[userName] = (userPurchaseMap[userName] || 0) + quantity;
      });
    });

    const mostPurchasedItems = Object.entries(productPurchaseMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const monthlySales = Object.entries(monthlySalesMap)
      .map(([key, metric]) => ({
        key,
        label: metric.label,
        value: metric.value,
        orders: metric.orders,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
      .map(({ label, value, orders }) => ({ label, value, orders }));

    const sixMonthTotalSales = monthlySales.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const sixMonthTotalOrders = monthlySales.reduce((sum, item) => sum + Number(item.orders || 0), 0);
    const sixMonthAverageSales = monthlySales.length ? sixMonthTotalSales / monthlySales.length : 0;
    const bestMonth = [...monthlySales].sort((a, b) => Number(b.value || 0) - Number(a.value || 0))[0] || null;

    const firstMonth = monthlySales[0] || null;
    const lastMonth = monthlySales[monthlySales.length - 1] || null;
    const growthPercent =
      firstMonth && Number(firstMonth.value) > 0 && lastMonth
        ? ((Number(lastMonth.value) - Number(firstMonth.value)) / Number(firstMonth.value)) * 100
        : null;

    const topAddresses = Object.entries(addressPurchaseMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topUsers = Object.entries(userPurchaseMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalSales,
      mostPurchasedItems,
      sixMonthSales: monthlySales,
      sixMonthInsights: {
        totalSales: sixMonthTotalSales,
        totalOrders: sixMonthTotalOrders,
        averageSales: sixMonthAverageSales,
        bestMonth,
        growthPercent,
      },
      topAddresses,
      topUsers,
      topItem: mostPurchasedItems[0] || null,
    };
  }, [orders]);

  const onRefresh = async () => {
    try {
      await dispatch(fetchAdminOrders());
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Refresh failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const exportPdfReport = async () => {
    try {
      const html = buildAnalyticsPdfHtml({
        title: "PageTurner Analytics Report",
        summaryLines: [
          { label: "Total Sales:", value: formatPHP(summary.totalSales) },
          { label: "Total Orders:", value: String(orders?.length || 0) },
          {
            label: "Top Item:",
            value: `${summary.topItem?.label || "N/A"} (${summary.topItem?.value || 0} items)`,
          },
          {
            label: "6-Month Total:",
            value: formatPHP(summary.sixMonthInsights?.totalSales || 0),
          },
          {
            label: "6-Month Average:",
            value: formatPHP(summary.sixMonthInsights?.averageSales || 0),
          },
          {
            label: "Growth:",
            value:
              typeof summary.sixMonthInsights?.growthPercent === "number"
                ? `${summary.sixMonthInsights.growthPercent.toFixed(1)}%`
                : "N/A",
          },
        ],
        sections: [
          {
            title: "Most Purchased Items",
            graphTitle: "Purchase Volume",
            graphData: summary.mostPurchasedItems.map((item) => ({
              label: item.label,
              value: Number(item.value || 0),
              displayValue: `${item.value} items`,
            })),
            headers: ["#", "Item", "Purchased Qty"],
            rows: summary.mostPurchasedItems.map((item, index) => [
              index + 1,
              item.label,
              item.value,
            ]),
          },
          {
            title: "6-Month Sales",
            graphTitle: "Sales Trend",
            graphData: summary.sixMonthSales.map((item) => ({
              label: item.label,
              value: Number(item.value || 0),
              displayValue: formatPHP(item.value || 0),
            })),
            headers: ["Month", "Sales", "Orders"],
            rows: summary.sixMonthSales.map((item) => [
              item.label,
              formatPHP(item.value || 0),
              item.orders,
            ]),
          },
          {
            title: "Top 5 Users by Purchased Items",
            graphTitle: "User Purchase Volume",
            graphData: summary.topUsers.map((item) => ({
              label: item.label,
              value: Number(item.value || 0),
              displayValue: `${item.value} items`,
            })),
            headers: ["#", "User", "Purchased Qty"],
            rows: summary.topUsers.map((item, index) => [index + 1, item.label, item.value]),
          },
          {
            title: "Top 5 Addresses by Purchased Items",
            graphTitle: "Address Purchase Volume",
            graphData: summary.topAddresses.map((item) => ({
              label: item.label,
              value: Number(item.value || 0),
              displayValue: `${item.value} items`,
            })),
            headers: ["#", "Address", "Purchased Qty"],
            rows: summary.topAddresses.map((item, index) => [index + 1, item.label, item.value]),
          },
        ],
      });

      const result = await exportPdfFromHtml(html, {
        fileName: "PageTurnerAnalyticsReport",
        dialogTitle: "Export analytics report",
      });

      Toast.show({
        type: "success",
        text1: "Report generated",
        text2: result.shared ? "PDF ready to share" : result.uri,
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "PDF export failed",
        text2: error?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={exportPdfReport}>
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.salesCard}>
        <Text style={styles.salesLabel}>Total Sales</Text>
        <Text style={styles.salesValue}>{formatPHP(summary.totalSales)}</Text>
        <Text style={styles.salesMeta}>Across {orders?.length || 0} orders</Text>
      </View>

      {summary.topItem ? (
        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>Top Item Purchased</Text>
          <Text style={styles.highlightAddress}>{summary.topItem.label}</Text>
          <Text style={styles.highlightMeta}>{summary.topItem.value} items purchased</Text>
        </View>
      ) : null}

      <MostPurchasedPieChart
        title="Most Purchased Items"
        data={summary.mostPurchasedItems}
      />

      <SixMonthLineChart
        title="6-Month Sales"
        data={summary.sixMonthSales}
        insights={summary.sixMonthInsights}
      />

      <AddressLollipopChart
        title="Top 5 Addresses by Purchases"
        data={summary.topAddresses}
      />

      <AddressLollipopChart
        title="Top 5 Users by Purchased Items"
        data={summary.topUsers}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#1f8a70" />
        </View>
      ) : null}

      {errorAdmin ? <Text style={styles.errorText}>{errorAdmin}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fbfd" },
  contentContainer: { padding: 12, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#0b3954" },
  exportBtn: {
    backgroundColor: "#0b3954",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exportBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  quickActionsCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8edf2",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  quickActionText: {
    color: "white",
    fontWeight: "700",
  },
  salesCard: {
    backgroundColor: "#0b3954",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  salesLabel: { color: "#cfe8f3", fontSize: 14, fontWeight: "600" },
  salesValue: { color: "white", fontSize: 30, fontWeight: "800", marginTop: 4 },
  salesMeta: { color: "#cfe8f3", marginTop: 4, fontWeight: "500" },
  highlightCard: {
    backgroundColor: "#fff6e6",
    borderWidth: 1,
    borderColor: "#ffd27d",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  highlightTitle: { fontSize: 13, color: "#7b4f00", fontWeight: "700" },
  highlightAddress: { marginTop: 2, fontSize: 17, fontWeight: "700", color: "#3d2a00" },
  highlightMeta: { marginTop: 2, color: "#7b4f00", fontWeight: "600" },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e8edf2",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#133c55" },
  emptyText: { color: "#6c757d" },
  pieWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  legendWrap: {
    flex: 1,
    minWidth: 180,
    paddingLeft: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: "#2f4858",
    fontWeight: "600",
  },
  lineWrap: {
    alignItems: "center",
  },
  sixMonthMetaWrap: {
    marginBottom: 8,
    backgroundColor: "#f4f8fb",
    borderRadius: 10,
    padding: 10,
  },
  sixMonthMetaText: {
    fontSize: 12,
    color: "#2f4858",
    fontWeight: "600",
    marginBottom: 3,
  },
  lineLabelsRow: {
    width: 320,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  lineLabelText: {
    fontSize: 10,
    color: "#415a77",
    fontWeight: "600",
  },
  monthlyBreakdownWrap: {
    width: 320,
    marginTop: 10,
  },
  monthlyBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5edf3",
    paddingVertical: 6,
  },
  monthlyBreakdownMonth: {
    width: 70,
    fontSize: 12,
    color: "#2f4858",
    fontWeight: "700",
  },
  monthlyBreakdownValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "#0b3954",
    fontWeight: "700",
    marginRight: 8,
  },
  monthlyBreakdownOrders: {
    width: 80,
    textAlign: "right",
    fontSize: 12,
    color: "#5c677d",
    fontWeight: "600",
  },
  lollipopWrap: {
    gap: 8,
  },
  lollipopItem: {
    marginBottom: 8,
  },
  lollipopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  lollipopLabel: {
    flex: 1,
    marginRight: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#2f4858",
  },
  lollipopValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2f4858",
  },
  lollipopTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#d8e8f2",
    justifyContent: "center",
    overflow: "hidden",
  },
  lollipopLine: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#57a1c7",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 2,
  },
  lollipopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0b3954",
  },
  loadingWrap: { paddingVertical: 8 },
  errorText: { color: "#c1121f", fontWeight: "600", marginTop: 8 },
});

export default Dashboard;
