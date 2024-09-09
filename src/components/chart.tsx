"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart} from "recharts"
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig: ChartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Esigns",
    color: "#0f766e",
  },
  mobile: {
    label: "Partial",
    color: "#0891b2",
  },
  delivery: {
    label: "Delivered",
    color: "#99f6e4",
  },
  duplicate: {
    label: "Duplicate",
    color: "#ef4444",
  },
  accepted: {
    label: "Accepted",
    color: "#22c55e", // You can choose a different color
  },
};

function ChartSkeleton() {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="flex">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-6 w-[80px]" />
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}

export function Chart({
  chartData,
  total,
  isLoading = false,
}: {
  chartData: any;
  total: {
    desktop: number;
    mobile: number;
    delivery: number;
    duplicate: number;
    accepted: number;
  };
  isLoading?: boolean;
}) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop");

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Overview</CardTitle>
        </div>
        <div className="flex">
          {["mobile", "desktop", "delivery", "duplicate", "accepted"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <div
                key={chart}                
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"                
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>              
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDelivery" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-delivery)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-delivery)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDuplicate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-duplicate)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-duplicate)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAccepted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-accepted)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-accepted)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 7)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => value.slice(0, 7)}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="duplicate"
              type="natural"
              fill="url(#fillDuplicate)"
              stroke="var(--color-duplicate)"
              stackId="a"
            />
            <Area
              dataKey="accepted"
              type="natural"
              fill="url(#fillAccepted)"
              stroke="var(--color-accepted)"
              stackId="a"
            />
            <Area
              dataKey="delivery"
              type="natural"
              fill="url(#fillDelivery)"
              stroke="var(--color-delivery)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            {/* <ChartLegend content={<ChartLegendContent />} /> */}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
