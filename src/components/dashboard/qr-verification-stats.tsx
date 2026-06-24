"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { QRCodeVerificationStatsDto } from "@/lib/types";
import type { ChartConfig } from "@/components/ui/chart";
import { getCategoryLabel } from "@/lib/consts";

interface QRVerificationStatsProps {
  stats: QRCodeVerificationStatsDto;
}

// 커스텀 X축 Tick 컴포넌트 (화면 너비 기반 줄바꿈)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomXAxisTick = ({ x, y, payload }: any) => {
  const text = payload.value.toString();
  const lineHeight = 14;
  const fontSize = 12;

  // 화면 너비에 따른 동적 글자 수 계산
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
  let maxCharsPerLine = 8; // 기본값

  if (screenWidth < 480) {
    maxCharsPerLine = 4; // 매우 좁은 화면
  } else if (screenWidth < 768) {
    maxCharsPerLine = 6; // 좁은 화면
  } else if (screenWidth < 1024) {
    maxCharsPerLine = 8; // 중간 화면
  } else {
    maxCharsPerLine = 10; // 넓은 화면
  }

  const renderMultiLineText = (fullText: string) => {
    const words = fullText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // 단어가 너무 길면 강제로 자르기
          if (word.length > maxCharsPerLine) {
            let remainingWord = word;
            while (remainingWord.length > maxCharsPerLine) {
              lines.push(remainingWord.slice(0, maxCharsPerLine));
              remainingWord = remainingWord.slice(maxCharsPerLine);
            }
            currentLine = remainingWord;
          } else {
            currentLine = word;
          }
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const lines = renderMultiLineText(text);

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line: string, index: number) => (
        <text
          key={index}
          x={0}
          y={index * lineHeight + 5}
          textAnchor="middle"
          fontSize={fontSize}
          className="fill-current"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// 카테고리별 고정 색상
const CATEGORY_COLORS: Record<string, string> = {
  PLATFORM_ALBUM: "#6366f1", // 인디고
  CONTENTS_ALBUM: "#06b6d4", // 사이안
  CONTENTS_GOODS: "#f97316", // 진한 주황
  ALBUM: "#3b82f6", // 파랑
  CONCERT: "#8b5cf6", // 보라
  BROADCAST: "#ec4899", // 핑크
  GOODS: "#f59e0b", // 주황
  OFFLINE_SPOT: "#10b981", // 초록
};

export function QRVerificationStats({ stats }: QRVerificationStatsProps) {
  // 막대 그래프용 데이터
  const barChartData = useMemo(() => {
    return stats.categoryStats.map((stat) => ({
      category: getCategoryLabel(stat.category),
      count: stat.count,
      fill: CATEGORY_COLORS[stat.category] || "#6b7280",
    }));
  }, [stats.categoryStats]);

  // 파이 그래프용 데이터
  const pieChartData = useMemo(() => {
    return stats.categoryStats.map((stat) => ({
      category: stat.category,
      label: getCategoryLabel(stat.category),
      count: stat.count,
      percentage: stat.percentage,
      fill: CATEGORY_COLORS[stat.category] || "#6b7280",
    }));
  }, [stats.categoryStats]);

  // 막대 그래프 설정
  const barChartConfig = useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: "인증 횟수",
        color: "hsl(var(--chart-1))",
      },
    };
    return config;
  }, []);

  // 파이 그래프 설정
  const pieChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    stats.categoryStats.forEach((stat, index) => {
      config[stat.category] = {
        label: getCategoryLabel(stat.category),
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [stats.categoryStats]);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* 막대 그래프 - 카테고리별 인증 횟수 */}
      <Card className="flex flex-1">
        <CardHeader>
          <CardTitle className="text-base">카테고리별 인증 횟수</CardTitle>
          <CardDescription>
            총 {stats.totalVerifications.toLocaleString()}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={barChartConfig}
            className="min-h-[200px] lg:min-h-auto max-h-[300px] w-full"
          >
            <BarChart
              data={barChartData}
              margin={{
                top: 30,
                // right: 30,
                // left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={<CustomXAxisTick />}
                interval={0}
                // height={50}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: data.fill }}
                          />
                          <span className="font-medium">{data.category}</span>
                          <span className="font-mono">
                            {data.count.toLocaleString()}건
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 파이 그래프 - 카테고리별 비율 */}
      <Card className="flex flex-1">
        <CardHeader>
          <CardTitle className="text-base">카테고리별 비율</CardTitle>
          <CardDescription>전체 인증 대비 비율</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={pieChartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: item.payload.fill }}
                        />
                        <span className="font-medium">
                          {pieChartConfig[name]?.label || name}
                        </span>
                        <span className="font-mono">
                          {Number(value).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={pieChartData}
                dataKey="percentage"
                nameKey="category"
                // innerRadius={60}
                strokeWidth={2}
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="category" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
