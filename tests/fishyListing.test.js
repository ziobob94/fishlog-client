import { describe, it, expect } from 'vitest'
import { pendingListingDraft, draftToPayload, listingParts } from '../src/utils/fishyListing.js'

describe('annunci proposti da Fishy', () => {
  it('rimanda la bozza parziale solo se manca qualcosa', () => {
    const d = { title: 'Canna da surf' }
    expect(pendingListingDraft([{ action: 'catch', reason: 'species_unknown' }, { action: 'create_listing', reason: 'listing_incomplete', draft: d }])).toBe(d)
    expect(pendingListingDraft([{ action: 'catch', reason: 'species_unknown' }])).toBe(null)
    expect(pendingListingDraft([])).toBe(null)
  })
  it('payload per POST /listings: solo campi noti, località solo se detta', () => {
    expect(draftToPayload({ title: 'Canna', condition: 'usato', price: 80, category: 'canne', evil: 1 }))
      .toEqual({ title: 'Canna', category: 'canne', condition: 'usato', price: 80, currency: 'EUR', visibility: 'all' })
    expect(draftToPayload({ title: 'C', condition: 'nuovo', price: 5, location: { name: 'Roma' }, description: 'ok' }).location).toEqual({ name: 'Roma' })
  })
  it('riepilogo: prezzo con virgola ed euro', () => {
    expect(listingParts({ title: 'Canna', price: 80.5 }, { category: 'Canne', condition: 'Usato' })).toEqual(['Canna', 'Canne', 'Usato', '80,5 €'])
  })
})
