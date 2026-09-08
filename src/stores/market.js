import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const useMarketStore = defineStore('market', () => {
  const listings   = ref([])
  const mine        = ref([])
  const current     = ref(null)
  const categories  = ref([])
  const loading     = ref(false)
  const pagination  = ref({ page: 1, limit: 20, total: 0, pages: 0 })

  const external          = ref([])
  const externalConfigured = ref(true)
  const externalLoading   = ref(false)

  async function fetchListings(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/listings', { params })
      listings.value = data.data
      pagination.value = data.pagination
      return pagination.value.pages
    } finally {
      loading.value = false
    }
  }

  async function fetchMine() {
    const { data } = await api.get('/listings/mine')
    mine.value = data.data
  }

  async function fetchListing(id) {
    const { data } = await api.get(`/listings/${id}`)
    current.value = data
    return data
  }

  async function fetchShop(userId) {
    const { data } = await api.get(`/listings/shop/${userId}`)
    return data
  }

  async function fetchExternal(params = {}) {
    externalLoading.value = true
    try {
      const { data } = await api.get('/listings/external', { params })
      external.value = data.data
      externalConfigured.value = data.configured
    } finally {
      externalLoading.value = false
    }
  }

  async function fetchCategories() {
    const { data } = await api.get('/listings/categories')
    categories.value = data.data
  }

  async function createListing(payload) {
    const { data } = await api.post('/listings', payload)
    return data
  }

  async function updateListing(id, payload) {
    const { data } = await api.patch(`/listings/${id}`, payload)
    if (current.value?._id === id) current.value = data
    return data
  }

  async function deleteListing(id) {
    await api.delete(`/listings/${id}`)
    mine.value = mine.value.filter(l => l._id !== id)
  }

  async function uploadMedia(id, files) {
    const form = new FormData()
    for (const f of files) form.append('file', f)
    const { data } = await api.post(`/media/upload/listing/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data.uploaded
  }

  async function deleteMedia(listingId, mediaId) {
    await api.delete(`/media/listing/${listingId}/${mediaId}`)
  }

  return {
    listings, mine, current, categories, loading, pagination,
    external, externalConfigured, externalLoading,
    fetchListings, fetchMine, fetchListing, fetchShop, fetchCategories, fetchExternal,
    createListing, updateListing, deleteListing, uploadMedia, deleteMedia
  }
})
