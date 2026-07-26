'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface TrendData {
  period: string
  count: number
  sort_date: string
}

interface AnalyticsChartsProps {
  onboardingTrend: TrendData[]
  orderTrend: TrendData[]
}

export default function AnalyticsCharts({ onboardingTrend, orderTrend }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Onboarding Trend */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">New Restaurants Onboarded (6 Mo)</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={onboardingTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="count" name="New Tenants" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Volume Trend */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Platform Order Volume (8 Wk)</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={orderTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="count" name="Total Orders" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
