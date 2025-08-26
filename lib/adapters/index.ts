import { CrawlerAdapter } from './types'
import { LandWatchAdapter } from './landwatch'
import { HallAndHallAdapter } from './hallhall'

// Stub adapters - to be implemented
class StubAdapter implements CrawlerAdapter {
  constructor(public name: string, public sourceId: string) {}
  
  async search() {
    console.log(`TODO: Implement ${this.name} adapter`)
    return []
  }
  
  async getDetails(url: string) {
    console.log(`TODO: Implement ${this.name} details fetcher`)
    return {
      sourceId: this.sourceId,
      url,
      title: 'Stub Listing',
      acreage: 100,
      county: 'Unknown',
      state: 'Unknown',
      status: 'listed' as const
    }
  }
}

export const adapters: Record<string, CrawlerAdapter> = {
  landwatch: new LandWatchAdapter(),
  hallhall: new HallAndHallAdapter(),
  landandfarm: new StubAdapter('Land And Farm', 'landandfarm'),
  landsofamerica: new StubAdapter('Lands of America', 'landsofamerica'),
  whitetail: new StubAdapter('Whitetail Properties', 'whitetail'),
  unitedcountry: new StubAdapter('United Country', 'unitedcountry'),
  landleader: new StubAdapter('LandLeader', 'landleader'),
  masonmorse: new StubAdapter('Mason & Morse Ranch', 'masonmorse'),
  afm: new StubAdapter('AFM Real Estate', 'afm'),
  peoples: new StubAdapter('Peoples Company', 'peoples'),
  nai: new StubAdapter('NAI Land', 'nai'),
  crexi: new StubAdapter('Crexi', 'crexi'),
  loopnet: new StubAdapter('LoopNet', 'loopnet'),
}

export function getAdapter(adapterId: string): CrawlerAdapter | null {
  return adapters[adapterId] || null
}