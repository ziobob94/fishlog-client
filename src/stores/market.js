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

  const external           = ref([])
  const externalConfigured = ref(true)
  const externalLoading    = ref(false)
  const externalError      = ref('')
  const externalPagination = ref({ page: 1, limit: 12, total: 0, pages: 0 })

  const shops           = ref([])
  const shopsLoading     = ref(false)
  const shopsPagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

  async function fetchListings(params = {}, { append = false } = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/listings', { params })
      listings.value = append ? [...listings.value, ...data.data] : data.data
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

  async function fetchShops(params = {}, { append = false } = {}) {
    shopsLoading.value = true
    try {
      const { data } = await api.get('/listings/shops', { params })
      shops.value = append ? [...shops.value, ...data.data] : data.data
      shopsPagination.value = data.pagination
      return shopsPagination.value.pages
    } finally {
      shopsLoading.value = false
    }
  }

  async function fetchExternal(params = {}, { append = false } = {}) {
    externalLoading.value = true
    externalError.value = ''
    try {
      const { data } = await api.get('/listings/external', { params })
      external.value = append ? [...external.value, ...data.data] : data.data
      externalConfigured.value = data.configured
      externalError.value = data.error || ''

      const limit = Number(params.limit) || 12
      const total = data.total ?? external.value.length
      externalPagination.value = { page: Number(params.page) || 1, limit, total, pages: Math.ceil(total / limit) }
      return externalPagination.value.pages
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
    // Niente Content-Type esplicito: senza il boundary generato dal browser
    // per il FormData, il multipart non è più parsabile lato server.
    const { data } = await api.post(`/media/upload/listing/${id}`, form)
    return data.uploaded
  }

  async function deleteMedia(listingId, mediaId) {
    await api.delete(`/media/listing/${listingId}/${mediaId}`)
  }

  return {
    listings, mine, current, categories, loading, pagination,
    external, externalConfigured, externalLoading, externalError, externalPagination,
    shops, shopsLoading, shopsPagination,
    fetchListings, fetchMine, fetchListing, fetchShop, fetchShops, fetchCategories, fetchExternal,
    createListing, updateListing, deleteListing, uploadMedia, deleteMedia
  }
})
