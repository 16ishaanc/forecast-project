import { useState, useEffect } from 'react'
import axios from 'axios'
import AwardsTab from './components/AwardsTab'
import MasterDataTab from './components/MasterDataTab'

const tabs = [
  { id: 'awards', label: 'Awards Entry' },
  { id: 'master', label: 'Master Data' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('awards')
  const [ndcMaster, setNdcMaster] = useState([])
  const [customerMaster, setCustomerMaster] = useState([])

  const refreshMaster = async () => {
    const [ndcRes, custRes] = await Promise.all([
      axios.get('/api/ndc-master'),
      axios.get('/api/customer-master'),
    ])
    setNdcMaster(ndcRes.data)
    setCustomerMaster(custRes.data)
  }

  useEffect(() => { refreshMaster() }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-blue-700 text-white px-6 py-4 shadow-md">
        <h1 className="text-xl font-bold tracking-wide">Forecast Dashboard</h1>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-gray-200 pt-6 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'awards' && (
            <AwardsTab ndcMaster={ndcMaster} customerMaster={customerMaster} />
          )}
          {activeTab === 'master' && (
            <MasterDataTab
              ndcMaster={ndcMaster}
              customerMaster={customerMaster}
              onRefresh={refreshMaster}
            />
          )}
        </main>
      </div>
    </div>
  )
}
