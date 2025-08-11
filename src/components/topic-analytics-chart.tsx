"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getConversationAnalytics, type AnalyticsData } from "@/services/analytics"

const chartConfig = {
  count: {
    label: "Topics",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface TopicAnalyticsChartProps {
  period?: 'day' | 'week' | 'month'
}

export function TopicAnalyticsChart({ period: initialPeriod = 'day' }: TopicAnalyticsChartProps) {
  const [chartData, setChartData] = React.useState<AnalyticsData[]>([])
  const [period, setPeriod] = React.useState<'day' | 'week' | 'month'>(initialPeriod)
  const [loading, setLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getConversationAnalytics(period)
      setChartData(data.reverse())
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const totalTopics = chartData.reduce((sum, item) => sum + item.count, 0)
  const avgPerPeriod = chartData.length > 0 ? Math.round(totalTopics / chartData.length * 10) / 10 : 0

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    switch (period) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      default:
        return dateStr
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Topic Creation Analytics</CardTitle>
            <CardDescription>
              Total topics created over time
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(value: 'day' | 'week' | 'month') => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData.map(item => ({
                ...item,
                formattedDate: formatDate(item.date)
              }))}
              margin={{
                top: 20,
              }}
            >
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={8} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {totalTopics} topics created in total <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Average of {avgPerPeriod} topics per {period}
        </div>
      </CardFooter>
    </Card>
  )
}
