import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, Star, DollarSign } from 'lucide-react'

const stages = [
  { id: 'New', name: 'New', color: 'bg-gray-100', count: 0 },
  { id: 'Qualified', name: 'Qualified', color: 'bg-blue-100', count: 0 },
  { id: 'Triage', name: 'Triage', color: 'bg-yellow-100', count: 0 },
  { id: 'Pursuit', name: 'Pursuit', color: 'bg-orange-100', count: 0 },
  { id: 'LOI', name: 'LOI', color: 'bg-purple-100', count: 0 },
  { id: 'UC', name: 'Under Contract', color: 'bg-green-100', count: 0 },
  { id: 'Closed', name: 'Closed', color: 'bg-green-200', count: 0 },
  { id: 'Lost', name: 'Lost', color: 'bg-red-100', count: 0 }
]

async function getDealsWithParcels() {
  const deals = await prisma.deal.findMany({
    include: {
      parcel: {
        include: {
          fitScore: true,
          listings: {
            include: {
              source: true
            },
            orderBy: { lastSeenAt: 'desc' },
            take: 1
          }
        }
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return deals
}

// Create sample deals if none exist
async function ensureSampleDeals() {
  const existingDeals = await prisma.deal.count()
  
  if (existingDeals === 0) {
    // Get some parcels to create deals for
    const parcels = await prisma.parcel.findMany({ take: 5 })
    
    const sampleDeals = [
      { parcelId: parcels[0]?.id, stage: 'New', priority: 'P2', notes: 'Initial contact attempt made' },
      { parcelId: parcels[1]?.id, stage: 'Qualified', priority: 'P1', notes: 'Owner expressed interest' },
      { parcelId: parcels[2]?.id, stage: 'Triage', priority: 'P1', notes: 'Due diligence in progress' }
    ]

    for (const deal of sampleDeals) {
      if (deal.parcelId) {
        await prisma.deal.create({
          data: deal
        })
      }
    }
  }
}

export default async function PipelinePage() {
  await ensureSampleDeals()
  const deals = await getDealsWithParcels()
  
  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id)
    return acc
  }, {} as Record<string, typeof deals>)

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>
            <p className="text-gray-600">Kanban board for managing land acquisition deals</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{deals.length}</div>
            <div className="text-sm text-gray-600">Total Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {dealsByStage.Qualified?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Qualified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {dealsByStage.UC?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Under Contract</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              ${((dealsByStage.Closed?.reduce((sum, deal) => {
                return sum + (deal.parcel.listings[0]?.price || 0)
              }, 0) || 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-600">Closed Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {stages.map((stage) => {
          const stageDeals = dealsByStage[stage.id] || []
          
          return (
            <div key={stage.id} className="min-h-[600px]">
              <Card className={`${stage.color} border-t-4`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <span>{stage.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stageDeals.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        {/* Priority Badge */}
                        {deal.priority && (
                          <div className="mb-2">
                            <Badge 
                              variant={deal.priority === 'P0' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {deal.priority}
                            </Badge>
                          </div>
                        )}

                        {/* Property Info */}
                        <div className="mb-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <div className="text-sm font-medium">
                              {deal.parcel.acreage} acres
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {deal.parcel.county}, {deal.parcel.state}
                          </div>
                        </div>

                        {/* Fit Score */}
                        {deal.parcel.fitScore && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="w-3 h-3 text-gray-400" />
                            <div className={`text-sm font-medium ${
                              deal.parcel.fitScore.overallScore >= 80 ? 'text-green-600' : 
                              deal.parcel.fitScore.overallScore >= 60 ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {deal.parcel.fitScore.overallScore} fit
                            </div>
                          </div>
                        )}

                        {/* Price */}
                        {deal.parcel.listings[0]?.price && (
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <div className="text-sm">
                              ${(deal.parcel.listings[0].price / 1000).toFixed(0)}k
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {deal.notes && (
                          <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {deal.notes}
                          </div>
                        )}

                        {/* Last Activity */}
                        {deal.activities.length > 0 && (
                          <div className="text-xs text-gray-500 border-t pt-2">
                            Last: {deal.activities[0].type}
                          </div>
                        )}

                        {/* Updated Date */}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(deal.updatedAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Add Deal Button */}
                  <Button 
                    variant="ghost" 
                    className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-gray-400"
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

      {/* Empty State */}
      {deals.length === 0 && (
        <Card className="mt-8">
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium mb-2">No deals in pipeline</h3>
              <p className="mb-4">Start by adding high-fit properties from your results table.</p>
              <Button>
                Add First Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}