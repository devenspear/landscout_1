'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Eye, Download } from 'lucide-react'
import Link from 'next/link'

export function DashboardActions() {
  const [scanRunning, setScanRunning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)

  const runScan = async () => {
    setScanRunning(true)
    setScanResult(null)
    
    try {
      // First, ensure admin config is initialized
      const configResponse = await fetch('/api/admin/config/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!configResponse.ok) {
        throw new Error('Failed to initialize admin config')
      }
      
      // Now run the scan
      const response = await fetch('/api/admin/sources/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setScanResult({ success: true, message: result.message })
        // Optionally refresh the page after a delay to show updated stats
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setScanResult({ success: false, error: result.error })
      }
    } catch (error) {
      console.error('Scan failed:', error)
      setScanResult({ success: false, error: 'Failed to start scan: ' + error })
    } finally {
      setScanRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button 
        className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:scale-105 transition-all duration-200"
        onClick={runScan}
        disabled={scanRunning}
      >
        <Play className="w-4 h-4 mr-2" />
        {scanRunning ? 'Starting Scan...' : 'Run On-Demand Scan'}
      </Button>
      
      <Link href="/results">
        <Button 
          variant="outline" 
          className="w-full hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
        >
          <Eye className="w-4 h-4 mr-2" />
          View High Fit Properties
        </Button>
      </Link>
      
      <Button 
        variant="outline" 
        className="w-full hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
        onClick={() => {
          // For now, just show an alert. Later this can export actual data.
          alert('Export functionality will be implemented after scan data is available')
        }}
      >
        <Download className="w-4 h-4 mr-2" />
        Export Results
      </Button>
      
      {/* Show scan result */}
      {scanResult && (
        <div className={`mt-4 p-3 rounded-xl border ${
          scanResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-400'
        }`}>
          <div className="text-sm font-medium">
            {scanResult.success ? '✅ ' + scanResult.message : '❌ ' + scanResult.error}
          </div>
          {scanResult.success && (
            <div className="text-xs mt-1">
              Check back in a few minutes to see new properties discovered!
            </div>
          )}
        </div>
      )}
    </div>
  )
}