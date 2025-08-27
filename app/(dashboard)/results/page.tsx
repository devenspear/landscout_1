'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, DollarSign, Ruler, Eye, Filter } from 'lucide-react'
import { PropertyDetailModal } from '@/components/property-detail-modal'

// Sample data for demo - replace with actual database query
function getSampleParcels() {
  return [
    {
      id: '1',
      apn: '123-456-789',
      acreage: 25.5,
      county: 'Riverside',
      state: 'CA',
      centroidLat: 33.7175,
      centroidLon: -116.2023,
      fitScore: 87,
      topReasons: ['Excellent water access', 'Near growing metro area', 'Zoning allows development'],
      price: 425000,
      pricePerAcre: 16667,
      listingUrl: 'https://example.com/listing/1',
      sourceName: 'LandWatch',
      dealStage: 'New',
      waterPresence: true,
      waterFeatures: ['Creek', 'Well'],
      metroDistance: 45,
      nearestMetro: 'Palm Springs'
    },
    {
      id: '2',
      apn: '987-654-321',
      acreage: 12.3,
      county: 'Austin',
      state: 'TX',
      centroidLat: 30.2672,
      centroidLon: -97.7431,
      fitScore: 73,
      topReasons: ['High growth area', 'Good road access', 'Agricultural zoning'],
      price: 180000,
      pricePerAcre: 14634,
      listingUrl: 'https://example.com/listing/2',
      sourceName: 'Land.com',
      dealStage: 'Contacted',
      waterPresence: false,
      waterFeatures: [],
      metroDistance: 12,
      nearestMetro: 'Austin'
    },
    {
      id: '3',
      apn: '456-789-123',
      acreage: 40.8,
      county: 'Jefferson',
      state: 'CO',
      centroidLat: 39.5501,
      centroidLon: -105.7821,
      fitScore: 91,
      topReasons: ['Mountain views', 'Privacy and seclusion', 'Recreational opportunities'],
      price: 850000,
      pricePerAcre: 20833,
      listingUrl: 'https://example.com/listing/3',
      sourceName: 'LandSearch',
      dealStage: 'In Pipeline',
      waterPresence: true,
      waterFeatures: ['Natural spring', 'Pond'],
      metroDistance: 25,
      nearestMetro: 'Denver'
    }
  ]
}

export default function ResultsPage() {
  const parcels = getSampleParcels()
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProperty(null)
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen-ios pb-safe transition-colors duration-200">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Results Table</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Sortable land opportunities with AI-powered fit scores</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button className="hover:scale-105 transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25">
              <Eye className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full hover:scale-105 transition-all duration-200 bg-white dark:bg-gray-800 backdrop-blur-sm"
        >
          All Properties
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full hover:scale-105 transition-all duration-200 bg-white dark:bg-gray-800 backdrop-blur-sm"
        >
          High Fit (80+)
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full hover:scale-105 transition-all duration-200 bg-white dark:bg-gray-800 backdrop-blur-sm"
        >
          Medium Fit (60+)
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full hover:scale-105 transition-all duration-200 bg-white dark:bg-gray-800 backdrop-blur-sm"
        >
          With Water 💧
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full hover:scale-105 transition-all duration-200 bg-white dark:bg-gray-800 backdrop-blur-sm"
        >
          Under $15k/acre
        </Button>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        {parcels.map((parcel) => (
          <Card key={parcel.id} className={`hover:shadow-xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg ${
            parcel.fitScore >= 80 ? 'ring-2 ring-green-500/20 border-l-4 border-l-green-500' : ''
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewProperty(parcel)}
                      className="hover:scale-105 transition-all duration-200 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {parcels.length === 0 && (
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <MapPin className="w-10 h-10 opacity-50" />
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">No properties found</h3>
                <p className="max-w-md mx-auto">Try adjusting your search criteria or run a new scan to discover properties.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {parcels.length > 0 && (
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {parcels.length} properties
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              disabled 
              className="rounded-full backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled 
              className="rounded-full backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  )
}