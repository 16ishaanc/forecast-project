import { useState } from 'react'
import axios from 'axios'

export default function MasterDataTab({ ndcMaster, customerMaster, onRefresh }) {
  const [ndcMsg, setNdcMsg] = useState(null)
  const [custMsg, setCustMsg] = useState(null)

  const handleNdcUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post('/api/ndc-master/upload', fd)
      setNdcMsg(`✓ ${res.data.upserted} NDC records loaded`)
      await onRefresh()
    } catch (err) {
      setNdcMsg('✗ ' + (err.response?.data?.detail || err.message))
    }
    e.target.value = ''
  }

  const handleCustUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post('/api/customer-master/upload', fd)
      setCustMsg(`✓ ${res.data.inserted} customer records loaded`)
      await onRefresh()
    } catch (err) {
      setCustMsg('✗ ' + (err.response?.data?.detail || err.message))
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-lg font-semibold text-gray-800">Master Data</h2>

      <div className="grid grid-cols-2 gap-6">

        {/* NDC Master */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">NDC Master</h3>
          <p className="text-xs text-gray-400 mb-4">
            Excel columns required: <span className="font-mono bg-gray-100 px-1 rounded">NDC</span>, <span className="font-mono bg-gray-100 px-1 rounded">Description</span>
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="cursor-pointer bg-blue-50 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              Upload Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleNdcUpload} />
            </label>
            <span className="text-xs text-gray-500">{ndcMaster.length} records loaded</span>
          </div>
          {ndcMsg && (
            <p className={`text-sm font-medium mb-3 ${ndcMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
              {ndcMsg}
            </p>
          )}
          {ndcMaster.length > 0 && (
            <div className="overflow-auto max-h-64 border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">NDC</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ndcMaster.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-mono">{row.ndc}</td>
                      <td className="px-3 py-1.5 text-gray-600">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {ndcMaster.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
              No NDC data loaded yet
            </div>
          )}
        </div>

        {/* Customer Master */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer Master</h3>
          <p className="text-xs text-gray-400 mb-4">
            Excel columns required: <span className="font-mono bg-gray-100 px-1 rounded">Customer Name</span>, <span className="font-mono bg-gray-100 px-1 rounded">Customer Hierarchy</span>
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="cursor-pointer bg-blue-50 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              Upload Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleCustUpload} />
            </label>
            <span className="text-xs text-gray-500">{customerMaster.length} records loaded</span>
          </div>
          {custMsg && (
            <p className={`text-sm font-medium mb-3 ${custMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
              {custMsg}
            </p>
          )}
          {customerMaster.length > 0 && (
            <div className="overflow-auto max-h-64 border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Customer Name</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Hierarchy</th>
                  </tr>
                </thead>
                <tbody>
                  {customerMaster.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5">{row.customer_name}</td>
                      <td className="px-3 py-1.5 text-gray-500">{row.customer_hierarchy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {customerMaster.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
              No customer data loaded yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
