'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  X,
  RefreshCw,
  AlertCircle,
  Loader2,
  PackageCheck,
  Building2
} from 'lucide-react'

interface TrackingEvent {
  date: string
  time: string
  place: string
  status: string
}

interface TrackingResult {
  success: boolean
  trackingNumber: string
  courier: string
  courierName: string
  courierColor: string
  status: string
  statusCategory: 'delivered' | 'in_transit' | 'created' | 'unknown' | 'error'
  events: TrackingEvent[]
  latestEvent?: TrackingEvent
  errorMessage?: string
}

// Courier information
const COURIER_INFO: Record<string, { name: string; website: string; color: string }> = {
  elta: { name: 'ELTA Courier', website: 'https://www.elta-courier.gr', color: '#1e40af' },
  acs: { name: 'ACS Courier', website: 'https://www.acscourier.net', color: '#dc2626' },
  speedex: { name: 'SpeedEx', website: 'https://www.speedex.gr', color: '#f59e0b' },
  box_now: { name: 'Box Now', website: 'https://boxnow.gr', color: '#10b981' },
  courier_center: { name: 'Courier Center', website: 'https://courier.gr', color: '#8b5cf6' },
  geniki: { name: 'Geniki Taxydromiki', website: 'https://www.taxydromiki.com', color: '#ec4899' },
}

export default function Home() {
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState<TrackingResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTrackingNumber = useCallback(() => {
    const numbers = inputValue
      .split(/[,\n]/)
      .map(n => n.trim().toUpperCase())
      .filter(n => n.length >= 8 && !trackingNumbers.includes(n))

    if (numbers.length > 0) {
      setTrackingNumbers(prev => [...prev, ...numbers])
      setInputValue('')
    }
  }, [inputValue, trackingNumbers])

  const removeTrackingNumber = useCallback((number: string) => {
    setTrackingNumbers(prev => prev.filter(n => n !== number))
    setResults(prev => prev.filter(r => r.trackingNumber !== number))
  }, [])

  const fetchTrackingData = useCallback(async () => {
    if (trackingNumbers.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackingNumbers }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tracking data')
      }

      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [trackingNumbers])

  const getStatusIcon = (category?: string) => {
    switch (category) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'in_transit':
        return <Truck className="h-4 w-4" />
      case 'created':
        return <Package className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (category?: string) => {
    switch (category) {
      case 'delivered':
        return 'bg-green-500 hover:bg-green-600'
      case 'in_transit':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'created':
        return 'bg-blue-500 hover:bg-blue-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getBorderColor = (category?: string, courierColor?: string) => {
    if (courierColor) return `border-l-[${courierColor}]`
    switch (category) {
      case 'delivered':
        return 'border-l-green-500'
      case 'in_transit':
        return 'border-l-amber-500'
      case 'created':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Greek Courier Tracker
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Track shipments from ELTA, ACS, SpeedEx, Box Now, Courier Center & Geniki
          </p>
          
          {/* Supported Couriers */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {Object.entries(COURIER_INFO).map(([code, info]) => (
              <Badge 
                key={code} 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: info.color, color: info.color }}
              >
                {info.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Input Card */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Tracking Numbers
            </CardTitle>
            <CardDescription>
              Auto-detect courier from tracking number format (e.g., SE...GR for ELTA, BN... for Box Now)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., BN12345678, SP12345678"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTrackingNumber()}
                className="flex-1 h-12 text-lg"
              />
              <Button onClick={addTrackingNumber} size="lg" className="h-12 px-6">
                <Plus className="h-5 w-5 mr-2" />
                Add
              </Button>
            </div>

            {/* Tracking Number Tags */}
            {trackingNumbers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {trackingNumbers.map((number) => (
                  <Badge
                    key={number}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm font-mono"
                  >
                    {number}
                    <button
                      onClick={() => removeTrackingNumber(number)}
                      className="ml-2 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Track Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={fetchTrackingData}
            disabled={loading || trackingNumbers.length === 0}
            size="lg"
            className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Track All Shipments
              </>
            )}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        <div className="space-y-4">
          {results.map((result) => (
            <Card
              key={result.trackingNumber}
              className={`shadow-md border-0 border-l-4 overflow-hidden`}
              style={{ borderLeftColor: result.courierColor || '#6b7280' }}
            >
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                      style={{ color: result.courierColor }}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="font-mono text-lg">
                        {result.trackingNumber}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span 
                          className="font-medium"
                          style={{ color: result.courierColor }}
                        >
                          {result.courierName}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${getStatusColor(result.statusCategory)} text-white flex items-center gap-1.5 px-3 py-1`}
                    >
                      {getStatusIcon(result.statusCategory)}
                      {result.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {result.success && result.latestEvent && (
                <CardContent className="pt-4">
                  {/* Latest Event */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {result.status}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.latestEvent.date} at {result.latestEvent.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {result.latestEvent.place}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* All Events */}
                  {result.events && result.events.length > 1 && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Tracking History ({result.events.length} events)
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {result.events.map((event, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                          >
                            <div className="text-center min-w-[60px]">
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {event.date}
                              </div>
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {event.time}
                              </div>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  {event.place}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                {event.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              )}

              {!result.success && (
                <CardContent className="pt-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{result.errorMessage}</AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {trackingNumbers.length === 0 && (
          <Card className="shadow-md border-0">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                No tracking numbers
              </h3>
              <p className="text-slate-500 dark:text-slate-500">
                Add a tracking number above to get started
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Supports: ELTA, ACS, SpeedEx, Box Now, Courier Center, Geniki Taxydromiki</p>
          <p className="mt-1">Demo for Home Assistant custom integration</p>
        </div>
      </div>
    </div>
  )
}
