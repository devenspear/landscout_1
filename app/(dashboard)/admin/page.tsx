import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

async function getSystemHealth() {
  const scanRuns = await prisma.scanRun.count()
  const parcels = await prisma.parcel.count()
  const deals = await prisma.deal.count()
  const recentScans = await prisma.scanRun.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })

  return {
    scanRuns,
    parcels,
    deals,
    recentScans
  }
}

export default async function AdminPage() {
  const health = await getSystemHealth()

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
            <p className="text-gray-600">Configure system settings and monitor health</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* System Health Dashboard */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{health.scanRuns}</div>
                <div className="text-sm text-gray-600">Total Scans</div>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{health.parcels}</div>
                <div className="text-sm text-gray-600">Properties</div>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{health.deals}</div>
                <div className="text-sm text-gray-600">Active Deals</div>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {health.recentScans.filter(s => s.status === 'running').length}
                </div>
                <div className="text-sm text-gray-600">Running</div>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Tabs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Geography Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="w-5 h-5" />
              <span>Geography</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Target States</label>
              <div className="grid grid-cols-2 gap-2">
                {['VA', 'NC', 'SC', 'GA', 'FL', 'AL'].map(state => (
                  <div key={state} className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">{state}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Acreage Range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Min</label>
                  <input type="number" defaultValue="100" className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max</label>
                  <input type="number" defaultValue="1000" className="w-full p-2 border rounded text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Metro Proximity</label>
              <select className="w-full p-2 border rounded text-sm">
                <option>Within 60 miles</option>
                <option>Within 45 miles</option>
                <option>Within 30 miles</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Data Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { name: 'LandWatch', status: 'active', count: 1200 },
                { name: 'Hall & Hall', status: 'active', count: 800 },
                { name: 'Lands of America', status: 'inactive', count: 0 },
                { name: 'Land.com', status: 'inactive', count: 0 },
                { name: 'LandFlip', status: 'inactive', count: 0 }
              ].map(source => (
                <div key={source.name} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked={source.status === 'active'} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">{source.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={source.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {source.count} listings
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Test All Sources
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fit Scoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Fit Scoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { factor: 'Acreage Match', weight: 25, enabled: true },
              { factor: 'Land Cover', weight: 20, enabled: true },
              { factor: 'Water Features', weight: 15, enabled: true },
              { factor: 'Metro Proximity', weight: 15, enabled: true },
              { factor: 'Price/Acre', weight: 10, enabled: true },
              { factor: 'Topography', weight: 10, enabled: false },
              { factor: 'Zoning', weight: 5, enabled: false }
            ].map(factor => (
              <div key={factor.factor} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked={factor.enabled} 
                      className="rounded" 
                    />
                    <span className="text-sm">{factor.factor}</span>
                  </div>
                  <span className="text-xs text-gray-500">{factor.weight}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  defaultValue={factor.weight} 
                  className="w-full h-2 bg-gray-200 rounded-lg slider"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Scheduling</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Scan Frequency</label>
              <select className="w-full p-2 border rounded text-sm">
                <option>Weekly</option>
                <option>Daily</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Scan Time</label>
              <input type="time" defaultValue="02:00" className="w-full p-2 border rounded text-sm" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Timeout (minutes)</label>
              <input type="number" defaultValue="30" className="w-full p-2 border rounded text-sm" />
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Auto-retry failed scans</span>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Email notifications</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rate Limiting</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Requests/min</label>
                  <input type="number" defaultValue="10" className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Delay (ms)</label>
                  <input type="number" defaultValue="2000" className="w-full p-2 border rounded text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">User Agent</label>
              <input 
                type="text" 
                defaultValue="LandScout/1.0" 
                className="w-full p-2 border rounded text-sm" 
              />
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Respect robots.txt</span>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Enable caching</span>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
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
                <div key={service.service} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    {service.status === 'healthy' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">{service.service}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{service.uptime}</div>
                    <div className="text-xs text-gray-500">uptime</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full mb-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Health Check
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                View Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      <Card className="mt-6">
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
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-sm">{activity.action}</div>
                    <div className="text-xs text-gray-500">{activity.details}</div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}