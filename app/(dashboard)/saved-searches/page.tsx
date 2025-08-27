import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Plus, MapPin, Calendar, Settings, Play, Trash2 } from 'lucide-react'

async function getSavedSearches() {
  const searches = await prisma.scanRun.findMany({
    include: {
      _count: {
        select: {
          parcels: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return searches
}

async function ensureSampleSearches() {
  const existingSearches = await prisma.scanRun.count()
  
  if (existingSearches === 0) {
    const sampleSearches = [
      {
        name: 'High-Value VA Properties',
        runType: 'on-demand',
        status: 'completed',
        resultCount: 23,
        config: JSON.stringify({
          states: ['VA'],
          minAcreage: 50,
          maxAcreage: 200,
          maxPricePerAcre: 15000
        })
      },
      {
        name: 'NC Waterfront Land',
        runType: 'on-demand',
        status: 'completed', 
        resultCount: 12,
        config: JSON.stringify({
          states: ['NC'],
          minAcreage: 20,
          maxAcreage: 100,
          waterRequired: true
        })
      },
      {
        name: 'Weekly GA Scan',
        runType: 'weekly',
        status: 'running',
        resultCount: 0,
        config: JSON.stringify({
          states: ['GA'],
          minAcreage: 100,
          maxAcreage: 500,
          schedule: 'weekly'
        })
      }
    ]

    for (const search of sampleSearches) {
      await prisma.scanRun.create({
        data: search
      })
    }
  }
}

export default async function SavedSearchesPage() {
  await ensureSampleSearches()
  const searches = await getSavedSearches()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
            <p className="text-gray-600">Manage and monitor your automated land searches</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Search
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{searches.length}</div>
            <div className="text-sm text-gray-600">Total Searches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {searches.filter(s => s.status === 'running').length}
            </div>
            <div className="text-sm text-gray-600">Running</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {searches.reduce((sum, s) => sum + (s.resultCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Results</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {searches.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Searches List */}
      <div className="space-y-4">
        {searches.map((search) => {
          const config = search.config ? JSON.parse(search.config) : {}
          
          return (
            <Card key={search.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Search className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-lg">{search.name}</h3>
                      <Badge className={`text-xs ${getStatusColor(search.status)}`}>
                        {search.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Search Criteria */}
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Search Criteria</div>
                        <div className="space-y-1">
                          {config.states && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{config.states.join(', ')}</span>
                            </div>
                          )}
                          {config.minAcreage && config.maxAcreage && (
                            <div className="text-sm text-gray-600">
                              {config.minAcreage}-{config.maxAcreage} acres
                            </div>
                          )}
                          {config.maxPricePerAcre && (
                            <div className="text-sm text-gray-600">
                              Max ${config.maxPricePerAcre.toLocaleString()}/acre
                            </div>
                          )}
                          {config.waterRequired && (
                            <Badge variant="secondary" className="text-xs">Water Required</Badge>
                          )}
                        </div>
                      </div>

                      {/* Results */}
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Results</div>
                        <div className="text-2xl font-bold text-green-600">
                          {search.resultCount || 0}
                        </div>
                        <div className="text-xs text-gray-500">properties found</div>
                      </div>

                      {/* Last Run */}
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Last Run</div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(search.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {config.schedule && (
                          <div className="text-xs text-gray-500 mt-1">
                            Scheduled: {config.schedule}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Running Searches */}
                    {search.status === 'running' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Scanning progress</span>
                          <span>65%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full w-2/3"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Run Now
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {searches.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No saved searches yet</h3>
                <p className="mb-4">Create your first automated search to discover land opportunities.</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Recent Search Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {searches.slice(0, 5).map((search) => (
              <div key={`activity-${search.id}`} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    search.status === 'completed' ? 'bg-green-500' : 
                    search.status === 'running' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="font-medium">{search.name}</span>
                  <span className="text-sm text-gray-600">
                    {search.status === 'completed' ? 'completed' : 
                     search.status === 'running' ? 'is running' : search.status}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(search.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}