'use client'

import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, Users, Award, Clock } from 'lucide-react'
import type { RestaurantTheme } from '@/lib/get-restaurant-context'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface AnalysisDashboardProps {
  theme: RestaurantTheme
  currentMonth: string
  metrics: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
  }
  peakHoursData: Array<{ time: string; orders: number }>
  topItemsData: Array<{ name: string; quantity: number; revenue: number }>
  bestDriversData: Array<{ name: string; deliveries: number }>
}

function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export default function AnalysisDashboard({
  theme,
  currentMonth,
  metrics,
  peakHoursData,
  topItemsData,
  bestDriversData,
}: AnalysisDashboardProps) {
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (val === 'all') {
      params.delete('month')
    } else {
      params.set('month', val)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Generate last 6 months for the dropdown
  const monthOptions = useMemo(() => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    return options
  }, [])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl rounded-xl p-3 text-sm">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          <p className="text-gray-600 font-medium" style={{ color: theme.primaryColor }}>
            Orders: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full font-brand animate-fade-in-up">
      {/* Header with Filter */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Premium Analytics</h1>
          <p className="text-gray-500 mt-2 font-medium">Deep insights into your restaurant's performance</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="month-filter" className="text-sm font-semibold text-gray-600">
            Period:
          </label>
          <select
            id="month-filter"
            value={currentMonth}
            onChange={handleMonthChange}
            className="block w-48 pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white font-medium shadow-sm"
          >
            <option value="all">All Time</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Premium Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <MetricCard 
          title="Total Revenue" 
          value={formatPrice(metrics.totalRevenue)} 
          icon={<DollarSign className="h-6 w-6" />}
          primaryColor={theme.primaryColor}
        />
        <MetricCard 
          title="Total Orders" 
          value={metrics.totalOrders.toString()} 
          icon={<ShoppingBag className="h-6 w-6" />}
          primaryColor={theme.primaryColor}
        />
        <MetricCard 
          title="Average Order Value" 
          value={formatPrice(metrics.averageOrderValue)} 
          icon={<TrendingUp className="h-6 w-6" />}
          primaryColor={theme.primaryColor}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area - Peak Hours */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
              <Clock className="w-32 h-32" style={{ color: theme.primaryColor }} />
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              Peak Ordering Times
            </h2>
            
            <div className="h-80 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<CustomTooltip />} />
                  <Bar 
                    dataKey="orders" 
                    fill={theme.primaryColor} 
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              Top Selling Items
            </h2>
            
            {topItemsData.length > 0 ? (
              <div className="space-y-4">
                {topItemsData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                        style={{ backgroundColor: index < 3 ? theme.primaryColor : '#cbd5e1' }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-sm font-medium text-gray-500">{item.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(item.revenue)}</p>
                      <p className="text-xs font-semibold text-emerald-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 font-medium">Not enough data yet.</div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
          {/* Best Drivers */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
             {/* Decorative Background */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-400" />
                Top Delivery Riders
              </h2>
              
              {bestDriversData.length > 0 ? (
                <div className="space-y-5">
                  {bestDriversData.slice(0, 5).map((driver, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-yellow-400">
                          {index + 1}
                        </div>
                        <p className="font-semibold">{driver.name}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-lg">{driver.deliveries}</span>
                        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Deliveries</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-white/50 font-medium text-sm">No driver data available yet.</div>
              )}
            </div>
          </div>
          
          {/* Pro Tips / Insights */}
          <div className="bg-emerald-50 p-6 rounded-3xl shadow-sm border border-emerald-100">
            <h3 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Smart Insights
            </h3>
            <ul className="space-y-3 text-sm text-emerald-900 font-medium">
              <li className="flex gap-2 items-start">
                <span className="mt-1">💡</span>
                <span>Focus your marketing efforts leading up to your peak hours to maximize conversion.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="mt-1">🚀</span>
                <span>Your top selling items are prime candidates for special combo offers.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="mt-1">⭐</span>
                <span>Reward your top delivery riders to maintain excellent customer service.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, primaryColor }: { title: string, value: string, icon: React.ReactNode, primaryColor: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group transition-all hover:shadow-md hover:-translate-y-1 duration-300">
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
        style={{ backgroundColor: primaryColor }}
      />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-gray-500 font-semibold text-sm mb-1">{title}</p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
        </div>
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm transform transition-transform group-hover:scale-110 duration-300"
          style={{ backgroundColor: primaryColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
