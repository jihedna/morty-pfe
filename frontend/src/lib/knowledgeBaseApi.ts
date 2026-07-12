import { apiClient } from './apiClient'

export interface KnowledgeBaseArticle {
  id: string
  title: string
  category: string
  content: string
  source: string | null
  language: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KnowledgeBaseArticleCreate {
  title: string
  category: string
  content: string
  source?: string | null
  language?: string
  is_active?: boolean
}

export interface KnowledgeBaseArticleUpdate {
  title?: string
  category?: string
  content?: string
  source?: string | null
  language?: string
  is_active?: boolean
}

export const knowledgeBaseApi = {
  listArticles: async (params?: { category?: string; language?: string }): Promise<KnowledgeBaseArticle[]> => {
    const response = await apiClient.get<KnowledgeBaseArticle[]>('/knowledge-base', params)
    return response
  },

  getArticle: async (articleId: string): Promise<KnowledgeBaseArticle> => {
    const response = await apiClient.get<KnowledgeBaseArticle>(`/knowledge-base/${articleId}`)
    return response
  },

  createArticle: async (data: KnowledgeBaseArticleCreate): Promise<KnowledgeBaseArticle> => {
    const response = await apiClient.post<KnowledgeBaseArticle>('/knowledge-base', data)
    return response
  },

  updateArticle: async (articleId: string, data: KnowledgeBaseArticleUpdate): Promise<KnowledgeBaseArticle> => {
    const response = await apiClient.patch<KnowledgeBaseArticle>(`/knowledge-base/${articleId}`, data)
    return response
  },

  publishArticle: async (articleId: string): Promise<KnowledgeBaseArticle> => {
    return knowledgeBaseApi.updateArticle(articleId, { is_active: true })
  },

  unpublishArticle: async (articleId: string): Promise<KnowledgeBaseArticle> => {
    return knowledgeBaseApi.updateArticle(articleId, { is_active: false })
  },
}
