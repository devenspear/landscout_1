import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, MapPin, Star, TrendingUp, Play, Eye, Download, Search } from 'lucide-react'

async function getDashboardStats() {
  const [
    totalParcels,
    totalListings,
    totalDeals,
    highFitCount,
    recentScans
  ] = await Promise.all([
    prisma.parcel.count(),
    prisma.listing.count(),
    prisma.deal.count(),
    prisma.fitScore.count({ where: { overallScore: { gte: 80 } } }),
    prisma.scanRun.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        runType: true,
        status: true,
        createdAt: true,
        processedCount: true,
        newCount: true
      }
    })
  ])

  return {
    totalParcels,
    totalListings,
    totalDeals,
    highFitCount,
    recentScans
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your AI-powered land discovery pipeline</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParcels}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Properties discovered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalListings}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active listings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDeals}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pipeline deals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.highFitCount}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  High fit (80+)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Recent Scan Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium capitalize text-gray-900 dark:text-white">{scan.runType} Scan</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      scan.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : scan.status === 'running'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {scan.status}
                    </div>
                    {scan.processedCount > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {scan.processedCount} processed, {scan.newCount} new
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {stats.recentScans.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No recent scan activity</p>
                  <p className="text-sm">Run your first scan to discover properties</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
              <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:scale-105 transition-all duration-200">
                <Play className="w-4 h-4 mr-2" />
                Run On-Demand Scan
              </Button>
              <Button 
                variant="outline" 
                className="w-full hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View High Fit Properties
              </Button>
              <Button 
                variant="outline" 
                className="w-full hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Status Info */}
      <div className="mt-8">
        <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Status</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The Results and Pipeline pages currently display sample data for demonstration purposes. 
                  The dashboard shows real database statistics from your connected PostgreSQL database.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                    ✅ Real Database Connected
                  </div>
                  <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-medium">
                    📊 Sample Results Data
                  </div>
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm font-medium">
                    🔧 Admin Panel Functional
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}