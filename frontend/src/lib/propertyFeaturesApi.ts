import { apiClient } from './apiClient'

export const propertyFeaturesApi = {
  addFeature: async (propertyId: string, feature: string): Promise<void> => {
    await apiClient.post(`/properties/${propertyId}/features`, feature)
  },

  deleteFeature: async (propertyId: string, featureId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/features/${featureId}`)
  },
}
