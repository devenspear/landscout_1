'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play, 
  RefreshCw,
  Globe,
  Database,
  Clock,
  Code,
  FileText
} from 'lucide-react'

interface AdapterInfo {
  id: string
  name: string
  status: 'partial' | 'stub' | 'working' | 'broken'
}

interface TestResult {
  adapter: any
  testParams: any
  results: {
    success: boolean
    count: number
    data: any[]
    error?: any
  }
  logs: any
  recommendations: string[]
}

export default function ScraperDebugPage() {
  const [adapters, setAdapters] = useState<AdapterInfo[]>([])
  const [selectedAdapter, setSelectedAdapter] = useState<string>('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  
  // Load available adapters
  useEffect(() => {
    fetch('/api/admin/test-adapter')
      .then(res => res.json())
      .then(data => {
        setAdapters(data.adapters)
        if (data.adapters.length > 0) {
          setSelectedAdapter(data.adapters[0].id)
        }
      })
  }, [])
  
  const runTest = async (testMode: 'basic' | 'detailed' = 'basic') => {
    if (!selectedAdapter) return
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/admin/test-adapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adapterId: selectedAdapter,
          testMode
        })
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setTesting(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'working': return 'bg-green-500'
      case 'partial': return 'bg-yellow-500'
      case 'stub': return 'bg-gray-500'
      case 'broken': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'working': return <CheckCircle className="w-4 h-4" />
      case 'partial': return <AlertTriangle className="w-4 h-4" />
      case 'broken': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen-ios pb-safe bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Scraper Debug Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Test and monitor website scraping adapters
        </p>
      </div>
      
      {/* Adapter Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Select Adapter to Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {adapters.map(adapter => (
              <button
                key={adapter.id}
                onClick={() => setSelectedAdapter(adapter.id)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedAdapter === adapter.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{adapter.name}</span>
                  <Badge className={`${getStatusColor(adapter.status)} text-white`}>
                    {adapter.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => runTest('basic')}
              disabled={testing || !selectedAdapter}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Play className="w-4 h-4 mr-2" />
              {testing ? 'Testing...' : 'Run Basic Test'}
            </Button>
            
            <Button
              onClick={() => runTest('detailed')}
              disabled={testing || !selectedAdapter}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Run Detailed Test
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Test Results */}
      {testResult && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Test Results
                </span>
                <Badge variant={testResult.results.success ? "default" : "destructive"}>
                  {testResult.results.success ? 'Success' : 'Failed'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold">{testResult.results.count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Properties Found
                  </div>
                </div>
                
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold">
                    {testResult.logs.totalDuration}ms
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Duration
                  </div>
                </div>
                
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">
                    {testResult.logs.logCounts.error}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Errors
                  </div>
                </div>
                
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-500">
                    {testResult.logs.logCounts.warn}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Warnings
                  </div>
                </div>
              </div>
              
              {/* Recommendations */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {testResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Sample Results */}
              {testResult.results.data.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Sample Properties</h3>
                  <div className="space-y-3">
                    {testResult.results.data.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="p-4 border rounded-lg dark:border-gray-700">
                        <div className="font-medium">{item.title || 'No title'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.acreage} acres • {item.county}, {item.state}
                        </div>
                        {item.price && (
                          <div className="text-sm font-semibold mt-1">
                            ${item.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Debug Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Debug Logs
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  {showLogs ? 'Hide' : 'Show'} Logs
                </Button>
              </CardTitle>
            </CardHeader>
            {showLogs && (
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
                  {testResult.logs.logs.map((log: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2 rounded ${
                        log.level === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                        log.level === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                        log.level === 'info' ? 'bg-blue-50 dark:bg-blue-900/20' :
                        'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <span className="font-semibold">
                        [{log.elapsed}ms] [{log.level.toUpperCase()}]
                      </span>
                      {' '}
                      {log.message}
                      {log.data && (
                        <pre className="mt-1 text-xs opacity-75">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  )
}