import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { knowledgeBaseApi, KnowledgeBaseArticle, KnowledgeBaseArticleCreate } from '../../lib/knowledgeBaseApi'
import { extractApiError } from '../../utils/format'
import { PageHeader, DataTable, Card, FilterPanel } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'

const categoryOptions = [
  { value: '', label: 'All categories' },
  { value: 'legal', label: 'Legal' },
  { value: 'procedures', label: 'Procedures' },
  { value: 'market', label: 'Market' },
  { value: 'general', label: 'General' },
  { value: 'faq', label: 'FAQ' },
]

const languageOptions = [
  { value: '', label: 'All languages' },
  { value: 'fr', label: 'French' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
]

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Published' },
  { value: 'inactive', label: 'Unpublished' },
]

export default function AdminKnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null)

  const loadArticles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: { category?: string; language?: string } = {}
      if (category) params.category = category
      if (language) params.language = language
      const data = await knowledgeBaseApi.listArticles(Object.keys(params).length > 0 ? params : undefined)
      let filtered = data
      if (status === 'active') filtered = data.filter((a) => a.is_active)
      if (status === 'inactive') filtered = data.filter((a) => !a.is_active)
      setArticles(filtered)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load knowledge base articles')
    } finally {
      setIsLoading(false)
    }
  }, [category, language, status])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const handlePublishToggle = async (article: KnowledgeBaseArticle) => {
    try {
      await knowledgeBaseApi.updateArticle(article.id, { is_active: !article.is_active })
      loadArticles()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to update article status')
    }
  }

  const handleDelete = async (article: KnowledgeBaseArticle) => {
    if (!confirm(`Delete article "${article.title}"?`)) return
    try {
      await knowledgeBaseApi.updateArticle(article.id, { is_active: false })
      loadArticles()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to archive article')
    }
  }

  const handleSave = async (data: KnowledgeBaseArticleCreate) => {
    try {
      if (editingArticle) {
        await knowledgeBaseApi.updateArticle(editingArticle.id, data)
      } else {
        await knowledgeBaseApi.createArticle(data)
      }
      setShowForm(false)
      setEditingArticle(null)
      loadArticles()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to save article')
    }
  }

  const tableColumns = [
    { key: 'title', header: 'Title', render: (a: KnowledgeBaseArticle) => <span className="font-medium">{a.title}</span> },
    { key: 'category', header: 'Category', render: (a: KnowledgeBaseArticle) => a.category },
    { key: 'language', header: 'Language', render: (a: KnowledgeBaseArticle) => a.language.toUpperCase() },
    {
      key: 'status',
      header: 'Status',
      render: (a: KnowledgeBaseArticle) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            a.is_active ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {a.is_active ? 'Published' : 'Unpublished'}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (a: KnowledgeBaseArticle) => new Date(a.updated_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a: KnowledgeBaseArticle) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingArticle(a)
              setShowForm(true)
            }}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handlePublishToggle(a)}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            {a.is_active ? 'Unpublish' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(a)}
            className="text-sm text-accent-600 hover:text-accent-800 font-medium"
          >
            Archive
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Knowledge Base"
          subtitle="Manage chatbot knowledge base articles"
          action={
            <Button type="button" onClick={() => {
              setEditingArticle(null)
              setShowForm(true)
            }}>
              New Article
            </Button>
          }
        />

        {error && (
          <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        <FilterPanel
          title="Filters"
          onClear={() => {
            setCategory('')
            setLanguage('')
            setStatus('')
          }}
          hasFilters={!!category || !!language || !!status}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Category" value={category} onChange={setCategory} options={categoryOptions} />
            <Select label="Language" value={language} onChange={setLanguage} options={languageOptions} />
            <Select label="Status" value={status} onChange={setStatus} options={statusOptions} />
          </div>
        </FilterPanel>

        {showForm && (
          <ArticleForm
            article={editingArticle}
            onCancel={() => {
              setShowForm(false)
              setEditingArticle(null)
            }}
            onSave={handleSave}
          />
        )}

        <DataTable
          columns={tableColumns}
          rows={articles}
          keyExtractor={(a) => a.id}
          isLoading={isLoading}
          emptyTitle="No knowledge base articles"
          emptyDescription="Create an article to get started."
        />
      </div>
    </AppLayout>
  )
}

function ArticleForm({
  article,
  onCancel,
  onSave,
}: {
  article: KnowledgeBaseArticle | null
  onCancel: () => void
  onSave: (data: KnowledgeBaseArticleCreate) => void
}) {
  const [title, setTitle] = useState(article?.title || '')
  const [category, setCategory] = useState(article?.category || '')
  const [language, setLanguage] = useState(article?.language || 'fr')
  const [content, setContent] = useState(article?.content || '')
  const [source, setSource] = useState(article?.source || '')
  const [isActive, setIsActive] = useState(article?.is_active ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    onSave({
      title,
      category,
      content,
      source: source || null,
      language,
      is_active: isActive,
    })
    setIsSubmitting(false)
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {article ? 'Edit Article' : 'New Article'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={title} onChange={setTitle} required />
          <Input label="Category" value={category} onChange={setCategory} required />
          <Select
            label="Language"
            value={language}
            onChange={setLanguage}
            options={languageOptions.filter((o) => o.value !== '')}
          />
          <Input label="Source" value={source} onChange={setSource} />
        </div>
        <div>
          <label htmlFor="article-content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="article-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Published</span>
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : article ? 'Update Article' : 'Create Article'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
