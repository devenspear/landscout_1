import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, DollarSign, Ruler, Eye } from 'lucide-react'

async function getParcelsWithData() {
  const parcels = await prisma.parcel.findMany({
    include: {
      fitScore: true,
      features: true,
      listings: {
        include: {
          source: true
        },
        orderBy: { lastSeenAt: 'desc' },
        take: 1
      },
      deals: {
        orderBy: { updatedAt: 'desc' },
        take: 1
      }
    },
    orderBy: {
      fitScore: {
        overallScore: 'desc'
      }
    }
  })

  return parcels.map(parcel => {
    const listing = parcel.listings[0]
    const deal = parcel.deals[0]
    const fitScore = parcel.fitScore
    const features = parcel.features

    return {
      id: parcel.id,
      apn: parcel.apn,
      acreage: parcel.acreage,
      county: parcel.county,
      state: parcel.state,
      centroidLat: parcel.centroidLat,
      centroidLon: parcel.centroidLon,
      fitScore: fitScore?.overallScore || 0,
      topReasons: fitScore?.topReasons ? JSON.parse(fitScore.topReasons) : [],
      price: listing?.price,
      pricePerAcre: listing?.pricePerAcre,
      listingUrl: listing?.url,
      sourceName: listing?.source?.name,
      dealStage: deal?.stage || 'New',
      waterPresence: features?.waterPresence || false,
      waterFeatures: features?.waterFeatures ? JSON.parse(features.waterFeatures) : [],
      metroDistance: features?.metroDistance,
      nearestMetro: features?.nearestMetro
    }
  })
}

export default async function ResultsPage() {
  const parcels = await getParcelsWithData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Results Table</h1>
            <p className="text-gray-600">Sortable land opportunities with fit scores</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button>
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6 flex space-x-4">
        <Button variant="outline" size="sm">All Properties</Button>
        <Button variant="outline" size="sm">High Fit (80+)</Button>
        <Button variant="outline" size="sm">Medium Fit (60+)</Button>
        <Button variant="outline" size="sm">With Water</Button>
        <Button variant="outline" size="sm">Under $10k/acre</Button>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        {parcels.map((parcel) => (
          <Card key={parcel.id} className={`hover:shadow-md transition-shadow ${
            parcel.fitScore >= 80 ? 'border-l-4 border-l-green-500' : ''
          }`}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Fit Score */}
                <div className="lg:col-span-1">
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold ${
                      parcel.fitScore >= 80 ? 'text-green-600' : 
                      parcel.fitScore >= 60 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {parcel.fitScore}
                    </div>
                    <Star className="w-4 h-4 ml-1 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-500">Fit Score</div>
                </div>

                {/* Property Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <div className="font-medium">{parcel.acreage} acres</div>
                      <div className="text-sm text-gray-600">
                        {parcel.county}, {parcel.state}
                      </div>
                      {parcel.apn && (
                        <div className="text-xs text-gray-500">APN: {parcel.apn}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="lg:col-span-3">
                  <div className="flex flex-wrap gap-1">
                    {parcel.waterPresence && (
                      <Badge variant="secondary" className="text-xs">
                        💧 Water
                      </Badge>
                    )}
                    {parcel.waterFeatures.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {parcel.waterFeatures.join(', ')}
                      </Badge>
                    )}
                    {parcel.nearestMetro && parcel.metroDistance && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(parcel.metroDistance)}mi to {parcel.nearestMetro}
                      </Badge>
                    )}
                  </div>
                  {parcel.topReasons.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {parcel.topReasons[0]}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="lg:col-span-2">
                  {parcel.price ? (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          ${parcel.price.toLocaleString()}
                        </div>
                        {parcel.pricePerAcre && (
                          <div className="text-sm text-gray-600">
                            ${Math.round(parcel.pricePerAcre).toLocaleString()}/acre
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">Price TBD</div>
                  )}
                </div>

                {/* Source & Stage */}
                <div className="lg:col-span-2">
                  <div className="space-y-1">
                    {parcel.sourceName && (
                      <Badge variant="outline" className="text-xs">
                        {parcel.sourceName}
                      </Badge>
                    )}
                    <div>
                      <Badge 
                        variant={parcel.dealStage === 'New' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {parcel.dealStage}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-1">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {parcels.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No properties found</h3>
                <p>Try adjusting your search criteria or run a new scan to discover properties.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {parcels.length > 0 && (
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {parcels.length} properties
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}