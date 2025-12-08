// src/components/charts/MiniStatsChart.jsx
import React from "react";
import Chart from "react-apexcharts";

const MiniStatsChart = ({ data = [], color = "#7c3aed", height = 50 }) => {
  // Simple sparkline style
  const options = {
    chart: {
      type: "area",
      sparkline: { enabled: true },
      animations: { enabled: true },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: { opacity: 0.15 },
    colors: [color],
    tooltip: { enabled: false },
  };

  const series = [{ name: "s", data: data.length ? data : [0, 1, 0, 2, 1] }];

  return <Chart options={options} series={series} type="area" height={height} />;
};

export { MiniStatsChart };
export default MiniStatsChart;
