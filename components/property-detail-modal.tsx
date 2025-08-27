'use client'

import { X, MapPin, Star, DollarSign, Ruler, Eye, Calendar, Users, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PropertyDetailModalProps {
  property: {
    id: string
    apn: string
    acreage: number
    county: string
    state: string
    centroidLat: number | null
    centroidLon: number | null
    fitScore: number
    topReasons: string[]
    price?: number
    pricePerAcre?: number
    listingUrl?: string
    sourceName?: string
    dealStage: string
    waterPresence: boolean
    waterFeatures: string[]
    metroDistance?: number
    nearestMetro?: string
  }
  isOpen: boolean
  onClose: () => void
}

export function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Property Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {property.acreage} acres • {property.county}, {property.state}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-5rem)]">
          {/* Left Panel - Details */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {/* Fit Score */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <div className={`text-4xl font-bold ${
                  property.fitScore >= 80 ? 'text-green-600' : 
                  property.fitScore >= 60 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {property.fitScore}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Fit Score</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">AI Assessment</div>
                </div>
              </div>
              {property.topReasons.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Top Reasons</h4>
                  <ul className="space-y-2">
                    {property.topReasons.slice(0, 3).map((reason, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                        <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">APN</div>
                  <div className="font-medium text-gray-900 dark:text-white">{property.apn}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Acreage</div>
                  <div className="font-medium text-gray-900 dark:text-white">{property.acreage} acres</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                  <div className="font-medium text-gray-900 dark:text-white">{property.county}, {property.state}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Deal Stage</div>
                  <Badge variant={property.dealStage === 'New' ? 'secondary' : 'default'}>
                    {property.dealStage}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Pricing */}
            {property.price && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${property.price.toLocaleString()}
                      </div>
                      {property.pricePerAcre && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ${Math.round(property.pricePerAcre).toLocaleString()} per acre
                        </div>
                      )}
                    </div>
                    <DollarSign className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
              <div className="space-y-3">
                {property.waterPresence && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400">💧</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Water Features</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {property.waterFeatures.length > 0 ? property.waterFeatures.join(', ') : 'Water present'}
                      </div>
                    </div>
                  </div>
                )}
                {property.nearestMetro && property.metroDistance && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Metro Access</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(property.metroDistance)} miles to {property.nearestMetro}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Source */}
            {property.sourceName && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Listing Source</h3>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{property.sourceName}</Badge>
                  {property.listingUrl && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(property.listingUrl, '_blank')}
                      className="hover:scale-105 transition-transform duration-200"
                    >
                      View Original
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Map/Photos Placeholder */}
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Map & Photos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                  Interactive map and property photos will be displayed here
                </p>
                {property.centroidLat && property.centroidLon && (
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Coordinates: {property.centroidLat.toFixed(6)}, {property.centroidLon.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Add to Pipeline
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Contact Owner
              </Button>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button className="hover:scale-105 transition-transform duration-200">
                <Eye className="w-4 h-4 mr-2" />
                View Full Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}