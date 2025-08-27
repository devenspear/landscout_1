'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IOSSwitch } from '@/components/ui/ios-switch'
import { IOSSlider } from '@/components/ui/ios-slider'
import { IOSRadioGroup, IOSRadioItem } from '@/components/ui/ios-radio'
import { IOSSegmentedControl } from '@/components/ui/ios-segmented-control'
import { 
  Settings, 
  Map, 
  Database, 
  Star, 
  Clock, 
  Shield, 
  Activity,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  Target
} from 'lucide-react'

export default function AdminPage() {
  // State for all the controls
  const [states, setStates] = React.useState({
    VA: true, NC: true, SC: true, GA: true, FL: true, AL: true
  })
  const [acreageMin, setAcreageMin] = React.useState(100)
  const [acreageMax, setAcreageMax] = React.useState(1000)
  const [metroProximity, setMetroProximity] = React.useState('60')
  const [scanFrequency, setScanFrequency] = React.useState('weekly')
  const [sources, setSources] = React.useState({
    landwatch: true,
    hallhall: true,
    landsamerica: false,
    landcom: false,
    landflip: false
  })
  const [fitScoring, setFitScoring] = React.useState({
    acreage: { enabled: true, weight: 25 },
    landCover: { enabled: true, weight: 20 },
    water: { enabled: true, weight: 15 },
    metro: { enabled: true, weight: 15 },
    price: { enabled: true, weight: 10 },
    topography: { enabled: false, weight: 10 },
    zoning: { enabled: false, weight: 5 }
  })
  const [autoRetry, setAutoRetry] = React.useState(true)
  const [emailNotifications, setEmailNotifications] = React.useState(true)
  const [respectRobots, setRespectRobots] = React.useState(true)
  const [enableCaching, setEnableCaching] = React.useState(true)

  // Mock data for demonstration
  const health = {
    scanRuns: 42,
    parcels: 1234,
    deals: 18,
    recentScans: []
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              System Administration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Configure system settings and monitor health</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-transform duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 transition-all duration-200">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* System Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{health.scanRuns}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Scans</div>
              </div>
              <Activity className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">{health.parcels}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Properties</div>
              </div>
              <Database className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">{health.deals}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Deals</div>
              </div>
              <Target className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-600">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Running</div>
              </div>
              <Clock className="w-10 h-10 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Geography Configuration */}
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="w-5 h-5 text-blue-500" />
              <span>Geography</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Target States
              </label>
              <div className="space-y-2">
                {Object.entries(states).map(([state, enabled]) => (
                  <IOSSwitch
                    key={state}
                    checked={enabled}
                    onCheckedChange={(checked) => setStates({...states, [state]: checked})}
                    label={state}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Acreage Range
              </label>
              <IOSSlider
                value={acreageMin}
                onValueChange={setAcreageMin}
                min={50}
                max={500}
                step={50}
                label="Minimum"
              />
              <div className="mt-4">
                <IOSSlider
                  value={acreageMax}
                  onValueChange={setAcreageMax}
                  min={500}
                  max={2000}
                  step={100}
                  label="Maximum"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Metro Proximity
              </label>
              <IOSRadioGroup value={metroProximity} onValueChange={setMetroProximity}>
                <IOSRadioItem value="30">Within 30 miles</IOSRadioItem>
                <IOSRadioItem value="45">Within 45 miles</IOSRadioItem>
                <IOSRadioItem value="60">Within 60 miles</IOSRadioItem>
              </IOSRadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span>Data Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <IOSSwitch
                    checked={sources.landwatch}
                    onCheckedChange={(checked) => setSources({...sources, landwatch: checked})}
                    label="LandWatch"
                  />
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                    1,200 listings
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <IOSSwitch
                    checked={sources.hallhall}
                    onCheckedChange={(checked) => setSources({...sources, hallhall: checked})}
                    label="Hall & Hall"
                  />
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                    800 listings
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <IOSSwitch
                    checked={sources.landsamerica}
                    onCheckedChange={(checked) => setSources({...sources, landsamerica: checked})}
                    label="Lands of America"
                  />
                  <Badge variant="secondary">0 listings</Badge>
                </div>
              </div>

              <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <IOSSwitch
                    checked={sources.landcom}
                    onCheckedChange={(checked) => setSources({...sources, landcom: checked})}
                    label="Land.com"
                  />
                  <Badge variant="secondary">0 listings</Badge>
                </div>
              </div>

              <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <IOSSwitch
                    checked={sources.landflip}
                    onCheckedChange={(checked) => setSources({...sources, landflip: checked})}
                    label="LandFlip"
                  />
                  <Badge variant="secondary">0 listings</Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button 
                variant="outline" 
                className="w-full backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 hover:scale-105 transition-transform duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Test All Sources
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fit Scoring */}
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-blue-500" />
              <span>Fit Scoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(fitScoring).map(([key, config]) => (
              <div key={key} className="space-y-3">
                <IOSSwitch
                  checked={config.enabled}
                  onCheckedChange={(checked) => 
                    setFitScoring({
                      ...fitScoring, 
                      [key]: {...config, enabled: checked}
                    })
                  }
                  label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                />
                {config.enabled && (
                  <IOSSlider
                    value={config.weight}
                    onValueChange={(value) => 
                      setFitScoring({
                        ...fitScoring,
                        [key]: {...config, weight: value}
                      })
                    }
                    min={0}
                    max={50}
                    step={5}
                    showValue={true}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Scheduling</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Scan Frequency
              </label>
              <IOSSegmentedControl
                value={scanFrequency}
                onValueChange={setScanFrequency}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ]}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Scan Time
              </label>
              <input 
                type="time" 
                defaultValue="02:00" 
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Timeout (minutes)
              </label>
              <IOSSlider
                value={30}
                onValueChange={() => {}}
                min={10}
                max={60}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <IOSSwitch
                checked={autoRetry}
                onCheckedChange={setAutoRetry}
                label="Auto-retry failed scans"
              />
              <IOSSwitch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                label="Email notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Rate Limiting
              </label>
              <IOSSlider
                value={10}
                onValueChange={() => {}}
                min={1}
                max={30}
                label="Requests/min"
              />
              <div className="mt-4">
                <IOSSlider
                  value={2000}
                  onValueChange={() => {}}
                  min={500}
                  max={5000}
                  step={500}
                  label="Delay (ms)"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                User Agent
              </label>
              <input 
                type="text" 
                defaultValue="LandScout/1.0" 
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <IOSSwitch
                checked={respectRobots}
                onCheckedChange={setRespectRobots}
                label="Respect robots.txt"
              />
              <IOSSwitch
                checked={enableCaching}
                onCheckedChange={setEnableCaching}
                label="Enable caching"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { service: 'Database', status: 'healthy', uptime: '99.9%' },
                { service: 'Crawlers', status: 'healthy', uptime: '98.5%' },
                { service: 'Fit Scoring', status: 'healthy', uptime: '99.7%' },
                { service: 'Job Queue', status: 'warning', uptime: '95.2%' }
              ].map(service => (
                <div key={service.service} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    {service.status === 'healthy' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600 dark:text-blue-400">{service.uptime}</div>
                    <div className="text-xs text-gray-500">uptime</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
              <Button 
                variant="outline" 
                className="w-full backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 hover:scale-105 transition-transform duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Health Check
              </Button>
              <Button 
                variant="outline" 
                className="w-full backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 hover:scale-105 transition-transform duration-200"
              >
                View Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      <Card className="mt-6 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { timestamp: '2 min ago', action: 'Weekly scan completed', status: 'success', details: '23 new properties found' },
              { timestamp: '15 min ago', action: 'Fit scores recalculated', status: 'success', details: '1,247 properties updated' },
              { timestamp: '1 hour ago', action: 'LandWatch source health check', status: 'success', details: 'All endpoints responsive' },
              { timestamp: '2 hours ago', action: 'Configuration backup created', status: 'success', details: 'Auto-backup completed' },
              { timestamp: '4 hours ago', action: 'Failed scan retry', status: 'warning', details: 'Hall & Hall timeout, retrying...' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{activity.details}</div>
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}