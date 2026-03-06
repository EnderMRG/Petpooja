import { useState } from 'react'
import MenuFilters from '../components/MenuFilters'
import MenuTable from '../components/MenuTable'

export default function MenuIntelligence() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      <MenuFilters 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <MenuTable filter={activeFilter} searchTerm={searchTerm} />
    </div>
  )
}
