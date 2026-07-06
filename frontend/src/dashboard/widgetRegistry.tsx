import type { ComponentType } from 'react'
import type { DashboardSummary, WidgetKey } from '../api'
import { ActivityHeatmapWidget } from './widgets/ActivityHeatmapWidget'
import { EddingtonWidget } from './widgets/EddingtonWidget'
import { GearTotalsWidget } from './widgets/GearTotalsWidget'
import { MonthlyStatsWidget } from './widgets/MonthlyStatsWidget'
import { StreaksWidget } from './widgets/StreaksWidget'
import { TrainingLoadWidget } from './widgets/TrainingLoadWidget'
import { WeeklyStatsWidget } from './widgets/WeeklyStatsWidget'
import { YearlyStatsWidget } from './widgets/YearlyStatsWidget'

export interface WidgetProps {
  summary: DashboardSummary
}

export const WIDGET_REGISTRY: Record<WidgetKey, { label: string; component: ComponentType<WidgetProps> }> = {
  eddington_number: { label: 'Eddington Number', component: EddingtonWidget },
  streaks: { label: 'Streaks', component: StreaksWidget },
  weekly_stats: { label: 'Weekly Stats', component: WeeklyStatsWidget },
  monthly_stats: { label: 'Monthly Stats', component: MonthlyStatsWidget },
  yearly_stats: { label: 'Yearly Stats', component: YearlyStatsWidget },
  activity_heatmap: { label: 'Activity Heatmap', component: ActivityHeatmapWidget },
  training_load: { label: 'Training Load', component: TrainingLoadWidget },
  gear_totals: { label: 'Gear Totals', component: GearTotalsWidget },
}
