"use client";

import { useEffect, useRef } from "react";

import type { EChartsOption } from "echarts";

export default function ClinicalChart({
  option,
  height = 320,
}: {
  option: EChartsOption;
  height?: number;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let chart: { dispose: () => void; resize: () => void; setOption: (option: EChartsOption) => void } | null = null;
    let resizeObserver: ResizeObserver | null = null;

    void import("echarts").then((echarts) => {
      if (!chartRef.current || disposed) {
        return;
      }

      chart = echarts.init(chartRef.current, undefined, {
        renderer: "svg",
      });
      chart.setOption(option);

      resizeObserver = new ResizeObserver(() => {
        chart?.resize();
      });

      resizeObserver.observe(chartRef.current);
    });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chart?.dispose();
    };
  }, [option]);

  return <div ref={chartRef} style={{ height }} className="w-full" />;
}
