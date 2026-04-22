import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Fuse from 'fuse.js'

const STATUSES = ['Active', 'Pending', 'Lost', 'Expired']

const emptyForm = () => ({
  ndc: '',
  ndc_description: '',
  customer_name: '',
  customer_hierarchy: '',
  monthly_quantity: '',
  valid_from: '',
  valid_to: '',
  award_status: 'Active',
  is_primary_award: false,
  date_entered: new Date().toISOString().split('T')[0],
})

export default function AwardsTab({ ndcMaster, customerMaster }) {
  const [form, setForm] = useState(emptyForm())
  const [ndcError, setNdcError] = useState(null)
  const [custQuery, setCustQuery] = useState('')
  const [custResults, setCustResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [awards, setAwards] = useState([])
  const [uploadMsg, setUploadMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const dropdownRef = useRef(null)

  const fuse = new Fuse(customerMaster, {
    keys: ['customer_name', 'customer_hierarchy'],
    threshold: 0.4,
  })

  useEffect(() => { loadAwards() }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadAwards = async () => {
    const res = await axios.get('/api/awards')
    setAwards(res.data)
  }

  const lookupNDC = async () => {
    if (!form.ndc.trim()) return
    try {
      const res = await axios.get(`/api/ndc/${form.ndc.trim()}`)
      setForm(f => ({ ...f, ndc_description: res.data.description }))
      setNdcError(null)
    } catch {
      setNdcError('NDC not found in master — you can still enter manually')
      setForm(f => ({ ...f, ndc_description: '' }))
    }
  }

  const handleCustInput = (val) => {
    setCustQuery(val)
    setForm(f => ({ ...f, customer_name: val, customer_hierarchy: '' }))
    if (val.length > 0) {
      const results = fuse.search(val).slice(0, 8).map(r => r.item)
      setCustResults(results)
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const selectCustomer = (c) => {
    setForm(f => ({ ...f, customer_name: c.customer_name, customer_hierarchy: c.customer_hierarchy }))
    setCustQuery(c.customer_name)
    setShowDropdown(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.ndc.trim()) return
    setSubmitting(true)
    try {
      await axios.post('/api/awards', {
        ...form,
        monthly_quantity: form.monthly_quantity ? parseFloat(form.monthly_quantity) : null,
        is_primary_award: form.is_primary_award,
      })
      setForm(emptyForm())
      setCustQuery('')
      setNdcError(null)
      await loadAwards()
    } catch (err) {
      alert('Error saving award: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this award?')) return
    await axios.delete(`/api/awards/${id}`)
    await loadAwards()
  }

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post('/api/awards/upload', fd)
      setUploadMsg(`✓ ${res.data.inserted} records imported`)
      await loadAwards()
    } catch (err) {
      setUploadMsg('✗ Upload failed: ' + (err.response?.data?.detail || err.message))
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-lg font-semibold text-gray-800">Awards Entry</h2>

      {/* Entry Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">New Award</h3>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* NDC + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NDC <span className="text-red-500">*</span></label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NDC then press Enter"
                value={form.ndc}
                onChange={e => setForm(f => ({ ...f, ndc: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupNDC() } }}
                onBlur={lookupNDC}
                required
              />
              {ndcError && <p className="text-xs text-amber-600 mt-1">{ndcError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NDC Description</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
                placeholder="Auto-populated from NDC master"
                value={form.ndc_description}
                onChange={e => setForm(f => ({ ...f, ndc_description: e.target.value }))}
              />
            </div>
          </div>

          {/* Customer + Hierarchy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type to search customers..."
                value={custQuery}
                onChange={e => handleCustInput(e.target.value)}
                onFocus={() => custQuery && setShowDropdown(true)}
                autoComplete="off"
              />
              {showDropdown && custResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-auto">
                  {custResults.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                      onMouseDown={() => selectCustomer(c)}
                    >
                      <span className="font-medium">{c.customer_name}</span>
                      {c.customer_hierarchy && (
                        <span className="text-gray-400 ml-2 text-xs">{c.customer_hierarchy}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Hierarchy</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
                placeholder="Auto-populated from customer selection"
                value={form.customer_hierarchy}
                onChange={e => setForm(f => ({ ...f, customer_hierarchy: e.target.value }))}
              />
            </div>
          </div>

          {/* Quantity + Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Quantity</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={form.monthly_quantity}
                onChange={e => setForm(f => ({ ...f, monthly_quantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.valid_from}
                onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.valid_to}
                onChange={e => setForm(f => ({ ...f, valid_to: e.target.value }))}
              />
            </div>
          </div>

          {/* Status + Primary + Date Entered */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Award Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.award_status}
                onChange={e => setForm(f => ({ ...f, award_status: e.target.value }))}
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Entered</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
                value={form.date_entered}
                onChange={e => setForm(f => ({ ...f, date_entered: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.is_primary_award}
                  onChange={e => setForm(f => ({ ...f, is_primary_award: e.target.checked }))}
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow" />
              </label>
              <span className="text-sm font-medium text-gray-700">Primary Award</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Award'}
            </button>
            <button
              type="button"
              onClick={() => { setForm(emptyForm()); setCustQuery(''); setNdcError(null) }}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bulk Excel Import</h3>
        <p className="text-xs text-gray-500 mb-3">
          Upload an Excel file with columns: NDC, NDC Description, Customer Name, Customer Hierarchy, Monthly Quantity, Valid From, Valid To, Award Status, Primary Award, Date Entered
        </p>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-blue-50 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            Choose Excel File
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleBulkUpload} />
          </label>
          {uploadMsg && (
            <span className={`text-sm font-medium ${uploadMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
              {uploadMsg}
            </span>
          )}
        </div>
      </div>

      {/* Awards Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Awards History ({awards.length} records)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                {['NDC','Description','Customer','Hierarchy','Qty','Valid From','Valid To','Status','Primary','Date Entered',''].map(h => (
                  <th key={h} className="pb-2 pr-4 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {awards.length === 0 && (
                <tr><td colSpan={11} className="py-8 text-center text-gray-400">No awards yet</td></tr>
              )}
              {awards.map(a => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4 font-mono">{a.ndc}</td>
                  <td className="py-2 pr-4 max-w-[150px] truncate">{a.ndc_description}</td>
                  <td className="py-2 pr-4 max-w-[140px] truncate">{a.customer_name}</td>
                  <td className="py-2 pr-4 max-w-[120px] truncate text-gray-500">{a.customer_hierarchy}</td>
                  <td className="py-2 pr-4">{a.monthly_quantity?.toLocaleString()}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{a.valid_from}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{a.valid_to}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.award_status === 'Active' ? 'bg-green-100 text-green-700' :
                      a.award_status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      a.award_status === 'Lost' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{a.award_status}</span>
                  </td>
                  <td className="py-2 pr-4 text-center">{a.is_primary_award ? '✓' : ''}</td>
                  <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{a.date_entered}</td>
                  <td className="py-2">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-red-400 hover:text-red-600 text-xs px-1"
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
