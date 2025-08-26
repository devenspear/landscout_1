import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, MapPin, Star, TrendingUp } from 'lucide-react'

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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your land discovery pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parcels</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParcels}</div>
            <p className="text-xs text-muted-foreground">
              Properties discovered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              From all sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Fit Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highFitCount}</div>
            <p className="text-xs text-muted-foreground">
              80+ fit score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Scan Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{scan.runType} Scan</p>
                    <p className="text-sm text-gray-500">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      scan.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : scan.status === 'running'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {scan.status}
                    </div>
                    {scan.processedCount > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {scan.processedCount} processed, {scan.newCount} new
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Run On-Demand Scan
              </button>
              <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                View High Fit Properties
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Export Results
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}