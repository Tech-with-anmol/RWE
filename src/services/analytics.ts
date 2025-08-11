import { invoke } from "@tauri-apps/api/core";

export interface AnalyticsData {
  date: string;
  count: number;
}

export async function getConversationAnalytics(period: 'day' | 'week' | 'month'): Promise<AnalyticsData[]> {
  try {
    const data = await invoke<AnalyticsData[]>('get_conversation_analytics', { period });
    return data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return [];
  }
}
