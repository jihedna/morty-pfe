import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import {
  adminContractsApi,
  ContractResponse,
  ContractCreate,
  ContractUpdate,
  ContractAnalytics,
  ContractType,
} from '../../lib/adminContractsApi'
import { extractApiError } from '../../utils/format'
import { PageHeader } from '../../components/ui/shared'
import Button from '../../components/ui/Button'

const PROPERTY_TYPES = ['apartment', 'villa', 'land', 'commercial', 'office']
const PAGE_SIZE = 20

function fmtAmount(n: number) {
  return n.toLocaleString('fr-TN', { maximumFractionDigits: 0 }) + ' TND'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-TN')
}

const BLANK: ContractCreate = {
  agent_id: '',
  sale_date: new Date().toISOString().slice(0, 10),
  amount: 0,
  city: '',
  district: '',
  property_type: 'apartment',
  contract_type: 'sale',
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

function SimpleBar({ rows, color, cap }: { rows: { label: string; count: number }[]; color: string; cap?: boolean }) {
  const max = Math.max(...rows.map(r => r.count), 1)
  if (rows.length === 0) return <p className="text-gray-400 text-sm">No data yet</p>
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.label}>
          <div className="flex justify-between text-sm mb-0.5">
            <span className={`text-gray-700 ${cap ? 'capitalize' : ''}`}>{r.label}</span>
            <span className="text-gray-500 font-medium">{r.count}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`${color} h-2 rounded-full`} style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminContracts() {
  const [contracts, setContracts] = useState<ContractResponse[]>([])
  const [total, setTotal] = useState(0)
  const [analytics, setAnalytics] = useState<ContractAnalytics | null>(null)
  const [skip, setSkip] = useState(0)
  const [filterCity, setFilterCity] = useState('')
  const [filterType, setFilterType] = useState<ContractType | ''>('')
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [tab, setTab] = useState<'list' | 'analytics'>('list')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ContractResponse | null>(null)
  const [form, setForm] = useState<ContractCreate>(BLANK)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ContractResponse | null>(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    setPageError(null)
    try {
      const r = await adminContractsApi.list({
        city: filterCity || undefined,
        contract_type: filterType || undefined,
        skip,
        limit: PAGE_SIZE,
      })
      setContracts(r.contracts)
      setTotal(r.total)
    } catch (e) {
      setPageError(extractApiError(e))
    } finally {
      setLoading(false)
    }
  }, [filterCity, filterType, skip])

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalytics(await adminContractsApi.getAnalytics())
    } catch { /* analytics failure is non-critical */ }
  }, [])

  useEffect(() => { loadList() }, [loadList])
  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const openCreate = () => {
    setEditTarget(null)
    setForm(BLANK)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (c: ContractResponse) => {
    setEditTarget(c)
    setForm({
      agent_id: c.agent_id,
      sale_date: c.sale_date.slice(0, 10),
      amount: c.amount,
      city: c.city,
      district: c.district ?? '',
      property_type: c.property_type,
      contract_type: c.contract_type,
    })
    setFormError(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.agent_id.trim()) { setFormError('Agent ID is required'); return }
    if (!form.city.trim()) { setFormError('City is required'); return }
    if (form.amount <= 0) { setFormError('Amount must be greater than 0'); return }
    setSaving(true)
    setFormError(null)
    try {
      if (editTarget) {
        const u: ContractUpdate = {
          sale_date: new Date(form.sale_date).toISOString(),
          amount: form.amount,
          city: form.city,
          district: form.district || undefined,
          property_type: form.property_type,
          contract_type: form.contract_type,
        }
        await adminContractsApi.update(editTarget.id, u)
      } else {
        await adminContractsApi.create({
          ...form,
          sale_date: new Date(form.sale_date).toISOString(),
          district: form.district || undefined,
        })
      }
      setShowForm(false)
      await loadList()
      await loadAnalytics()
    } catch (e) {
      setFormError(extractApiError(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminContractsApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      await loadList()
      await loadAnalytics()
    } catch (e) {
      setPageError(extractApiError(e))
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title='Contract Management'
          subtitle={`${total} contract${total !== 1 ? 's' : ''}`}
          action={
            <Button type='button' size='sm' onClick={openCreate}>
              New Contract
            </Button>
          }
        />
        <TabBar tab={tab} onChange={setTab} />

        {pageError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {pageError}
          </div>
        )}

        {tab === 'list' && (
          <ListSection
            contracts={contracts}
            total={total}
            skip={skip}
            loading={loading}
            filterCity={filterCity}
            filterType={filterType}
            onFilterCity={v => { setFilterCity(v); setSkip(0) }}
            onFilterType={v => { setFilterType(v); setSkip(0) }}
            onPrev={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
            onNext={() => setSkip(skip + PAGE_SIZE)}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            fmtAmount={fmtAmount}
            fmtDate={fmtDate}
          />
        )}

        {tab === 'analytics' && (
          <AnalyticsSection analytics={analytics} fmtAmount={fmtAmount} />
        )}
      </div>

      {showForm && (
        <FormModal
          form={form}
          editTarget={editTarget}
          formError={formError}
          saving={saving}
          onChange={setForm}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          fmtAmount={fmtAmount}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </AppLayout>
  )
}

function TabBar({ tab, onChange }: { tab: string; onChange: (t: 'list' | 'analytics') => void }) {
  return (
    <div className="flex gap-2">
      {(['list', 'analytics'] as const).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
            tab === t
              ? 'bg-[#003DA5] text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

interface ListProps {
  contracts: ContractResponse[]
  total: number
  skip: number
  loading: boolean
  filterCity: string
  filterType: string
  onFilterCity: (v: string) => void
  onFilterType: (v: ContractType | '') => void
  onPrev: () => void
  onNext: () => void
  onEdit: (c: ContractResponse) => void
  onDelete: (c: ContractResponse) => void
  fmtAmount: (n: number) => string
  fmtDate: (s: string) => string
}

function ListSection({ contracts, total, skip, loading, filterCity, filterType,
  onFilterCity, onFilterType, onPrev, onNext, onEdit, onDelete, fmtAmount, fmtDate }: ListProps) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <input
          placeholder="Filter by city…"
          value={filterCity}
          onChange={e => onFilterCity(e.target.value)}
          className={inp}
        />
        <select
          value={filterType}
          onChange={e => onFilterType(e.target.value as ContractType | '')}
          className={inp + ' w-auto'}
        >
          <option value="">All types</option>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#003DA5]" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No contracts found</p>
          <p className="text-gray-400 text-sm mt-1">Add a contract or adjust the filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Type', 'City', 'District', 'Property', 'Amount', 'Agent', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contracts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{fmtDate(c.sale_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      c.contract_type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {c.contract_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.city}</td>
                  <td className="px-4 py-3 text-gray-500">{c.district || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{c.property_type}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmtAmount(c.amount)}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.agent_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(c)}
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onPrev}
          disabled={skip === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <span className="text-xs text-gray-400">
          {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
        </span>
        <button
          onClick={onNext}
          disabled={contracts.length < PAGE_SIZE}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </>
  )
}

function AnalyticsSection({ analytics, fmtAmount }: { analytics: ContractAnalytics | null; fmtAmount: (n: number) => string }) {
  if (!analytics) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400 text-sm">
        Loading analytics…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contracts', value: analytics.total_contracts },
          { label: 'Sales', value: analytics.total_sales },
          { label: 'Rents', value: analytics.total_rents },
          { label: 'Avg Sale', value: fmtAmount(analytics.average_sale_amount) },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Contracts by City</h3>
          <SimpleBar rows={analytics.by_city.map(r => ({ label: r.city, count: r.count }))} color="bg-[#003DA5]" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">By Property Type</h3>
          <SimpleBar rows={analytics.by_property_type.map(r => ({ label: r.property_type, count: r.count }))} color="bg-blue-400" cap />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Trend</h3>
        {analytics.monthly_trend.length === 0 ? (
          <p className="text-gray-400 text-sm">No monthly data yet. Add contracts to see trends.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2 pr-6">Month</th>
                  <th className="pb-2 pr-6">Contracts</th>
                  <th className="pb-2">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.monthly_trend.map(r => (
                  <tr key={r.month} className="text-gray-700">
                    <td className="py-2 pr-6">{r.month}</td>
                    <td className="py-2 pr-6 font-medium">{r.count}</td>
                    <td className="py-2 font-semibold">{fmtAmount(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

interface FormProps {
  form: ContractCreate
  editTarget: ContractResponse | null
  formError: string | null
  saving: boolean
  onChange: React.Dispatch<React.SetStateAction<ContractCreate>>
  onClose: () => void
  onSave: () => void
}

function FormModal({ form, editTarget, formError, saving, onChange, onClose, onSave }: FormProps) {
  const set = (k: keyof ContractCreate, v: string | number | undefined) =>
    onChange(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          {editTarget ? 'Edit Contract' : 'New Contract'}
        </h2>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InputField label="Agent ID *">
            <input value={form.agent_id} placeholder="Agent UUID"
              onChange={e => set('agent_id', e.target.value)} className={inp} />
          </InputField>
          <InputField label="Date *">
            <input type="date" value={form.sale_date}
              onChange={e => set('sale_date', e.target.value)} className={inp} />
          </InputField>
          <InputField label="Amount (TND) *">
            <input type="number" value={form.amount} min={0}
              onChange={e => set('amount', Number(e.target.value))} className={inp} />
          </InputField>
          <InputField label="Contract Type">
            <select value={form.contract_type}
              onChange={e => set('contract_type', e.target.value as ContractType)} className={inp}>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </InputField>
          <InputField label="City *">
            <input value={form.city} placeholder="e.g. Tunis"
              onChange={e => set('city', e.target.value)} className={inp} />
          </InputField>
          <InputField label="District">
            <input value={form.district ?? ''} placeholder="e.g. Lac 1"
              onChange={e => set('district', e.target.value)} className={inp} />
          </InputField>
          <InputField label="Property Type">
            <select value={form.property_type}
              onChange={e => set('property_type', e.target.value)} className={inp}>
              {PROPERTY_TYPES.map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </InputField>
          <InputField label="Area (m²)">
            <input type="number" value={form.area_sqm ?? ''} min={0} placeholder="optional"
              onChange={e => set('area_sqm', e.target.value ? Number(e.target.value) : undefined)} className={inp} />
          </InputField>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 px-4 py-2 bg-[#003DA5] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : editTarget ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ target, fmtAmount, onCancel, onConfirm }: {
  target: ContractResponse
  fmtAmount: (n: number) => string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Delete Contract?</h2>
        <p className="text-sm text-gray-600">
          Permanently delete the <strong>{target.contract_type}</strong> contract
          for <strong>{fmtAmount(target.amount)}</strong> in <strong>{target.city}</strong>.
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
