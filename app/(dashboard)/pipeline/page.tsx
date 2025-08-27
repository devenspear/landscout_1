'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, Star, DollarSign, Activity } from 'lucide-react'

const stages = [
  { id: 'New', name: 'New', color: 'bg-gray-50 dark:bg-gray-800', borderColor: 'border-t-gray-400', count: 0 },
  { id: 'Qualified', name: 'Qualified', color: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-t-blue-400', count: 0 },
  { id: 'Triage', name: 'Triage', color: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-t-yellow-400', count: 0 },
  { id: 'Pursuit', name: 'Pursuit', color: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-t-orange-400', count: 0 },
  { id: 'LOI', name: 'LOI', color: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-t-purple-400', count: 0 },
  { id: 'UC', name: 'Under Contract', color: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-t-green-400', count: 0 },
  { id: 'Closed', name: 'Closed', color: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-t-emerald-500', count: 0 },
  { id: 'Lost', name: 'Lost', color: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-t-red-400', count: 0 }
]

// Sample deals for demo
function getSampleDeals() {
  return [
    {
      id: '1',
      stage: 'New',
      priority: 'P2',
      notes: 'Initial contact attempt made',
      updatedAt: new Date().toISOString(),
      parcel: {
        acreage: 25.5,
        county: 'Riverside',
        state: 'CA',
        fitScore: { overallScore: 87 },
        listings: [{ price: 425000 }]
      },
      activities: [{ type: 'Email sent', createdAt: new Date().toISOString() }]
    },
    {
      id: '2',
      stage: 'Qualified',
      priority: 'P1',
      notes: 'Owner expressed interest in selling',
      updatedAt: new Date().toISOString(),
      parcel: {
        acreage: 12.3,
        county: 'Austin',
        state: 'TX',
        fitScore: { overallScore: 73 },
        listings: [{ price: 180000 }]
      },
      activities: [{ type: 'Phone call', createdAt: new Date().toISOString() }]
    },
    {
      id: '3',
      stage: 'Triage',
      priority: 'P1',
      notes: 'Due diligence in progress - environmental study ordered',
      updatedAt: new Date().toISOString(),
      parcel: {
        acreage: 40.8,
        county: 'Jefferson',
        state: 'CO',
        fitScore: { overallScore: 91 },
        listings: [{ price: 850000 }]
      },
      activities: [{ type: 'Site visit', createdAt: new Date().toISOString() }]
    },
    {
      id: '4',
      stage: 'Pursuit',
      priority: 'P0',
      notes: 'Preparing offer - market analysis complete',
      updatedAt: new Date().toISOString(),
      parcel: {
        acreage: 15.7,
        county: 'Maricopa',
        state: 'AZ',
        fitScore: { overallScore: 82 },
        listings: [{ price: 320000 }]
      },
      activities: [{ type: 'Market analysis', createdAt: new Date().toISOString() }]
    },
    {
      id: '5',
      stage: 'LOI',
      priority: 'P0',
      notes: 'LOI submitted - awaiting response from owner',
      updatedAt: new Date().toISOString(),
      parcel: {
        acreage: 8.2,
        county: 'Wake',
        state: 'NC',
        fitScore: { overallScore: 79 },
        listings: [{ price: 245000 }]
      },
      activities: [{ type: 'LOI submitted', createdAt: new Date().toISOString() }]
    }
  ]
}

export default function PipelinePage() {
  const deals = getSampleDeals()
  
  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id)
    return acc
  }, {} as Record<string, typeof deals>)

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deal Pipeline</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Kanban board for managing land acquisition deals</p>
          </div>
          <Button className="hover:scale-105 transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{deals.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Deals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dealsByStage.Qualified?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Qualified</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dealsByStage.UC?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Under Contract</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${((dealsByStage.Closed?.reduce((sum, deal) => {
                    return sum + (deal.parcel.listings[0]?.price || 0)
                  }, 0) || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Closed Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
          {stages.map((stage) => {
            const stageDeals = dealsByStage[stage.id] || []
            
            return (
              <div key={stage.id} className="flex-shrink-0 w-80 min-h-[600px]">
                <Card className={`${stage.color} ${stage.borderColor} border-t-4 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 shadow-lg`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex justify-between items-center text-gray-900 dark:text-white">
                      <span>{stage.name}</span>
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm"
                      >
                        {stageDeals.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4">
                    {stageDeals.map((deal) => (
                      <Card key={deal.id} className="bg-white dark:bg-gray-800 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-0 shadow-md">
                        <CardContent className="p-5">
                          {/* Priority Badge */}
                          {deal.priority && (
                            <div className="mb-3">
                              <Badge 
                                variant={deal.priority === 'P0' ? 'destructive' : 'secondary'}
                                className="text-xs font-medium"
                              >
                                {deal.priority === 'P0' ? '🔥 Critical' : deal.priority === 'P1' ? '⚡ High' : '📋 Normal'}
                              </Badge>
                            </div>
                          )}

                          {/* Property Info */}
                          <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="text-base font-semibold text-gray-900 dark:text-white">
                                {deal.parcel.acreage} acres
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                              {deal.parcel.county}, {deal.parcel.state}
                            </div>
                          </div>

                          {/* Fit Score */}
                          {deal.parcel.fitScore && (
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <div className={`text-sm font-medium ${
                                deal.parcel.fitScore.overallScore >= 80 ? 'text-green-600 dark:text-green-400' : 
                                deal.parcel.fitScore.overallScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {deal.parcel.fitScore.overallScore} fit score
                              </div>
                            </div>
                          )}

                          {/* Price */}
                          {deal.parcel.listings[0]?.price && (
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                ${(deal.parcel.listings[0].price / 1000).toFixed(0)}k
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {deal.notes && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              {deal.notes}
                            </div>
                          )}

                          {/* Last Activity */}
                          {deal.activities.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3 pb-1">
                              <div className="flex items-center space-x-1">
                                <Activity className="w-3 h-3" />
                                <span>Last: {deal.activities[0].type}</span>
                              </div>
                            </div>
                          )}

                          {/* Updated Date */}
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(deal.updatedAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add Deal Button */}
                    <Button 
                      variant="ghost" 
                      className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl hover:scale-105 transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {deals.length === 0 && (
        <Card className="mt-8 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Plus className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">No deals in pipeline</h3>
              <p className="mb-6 max-w-md mx-auto">Start by adding high-fit properties from your results table.</p>
              <Button className="hover:scale-105 transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                Add First Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}