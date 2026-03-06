/* Mock Data for Petpooja Copilot Dashboard */

export const dashboardStats = [
  { id: 1, label: 'Hidden Stars Found', value: 8, icon: '⭐', color: '#FF6B35' },
  { id: 2, label: 'Risk Items', value: 5, icon: '⚠️', color: '#EF4444' },
  { id: 3, label: 'Avg Contribution Margin', value: 42, unit: '%', icon: '📈', color: '#10B981' },
  { id: 4, label: 'Orders Today', value: 127, icon: '📦', color: '#3B82F6' },
]

export const topItemsData = [
  { name: 'Paneer Butter Masala', margin: 68, category: 'Main Course' },
  { name: 'Chicken Biryani', margin: 65, category: 'Biryani' },
  { name: 'Dal Makhani', margin: 62, category: 'Main Course' },
  { name: 'Garlic Naan', margin: 58, category: 'Breads' },
  { name: 'Butter Chicken', margin: 55, category: 'Main Course' },
  { name: 'Veg Biryani', margin: 52, category: 'Biryani' },
  { name: 'Tandoori Chicken', margin: 50, category: 'Tandoori' },
  { name: 'Shahi Tukda', margin: 48, category: 'Desserts' },
  { name: 'Rasgulla', margin: 45, category: 'Desserts' },
  { name: 'Masala Dosa', margin: 42, category: 'South Indian' },
]

export const menuCategoryBreakdown = [
  { name: 'Stars', value: 24, color: '#FF6B35' },
  { name: 'Hidden Stars', value: 8, color: '#A78BFA' },
  { name: 'Plowhorses', value: 15, color: '#FB923C' },
  { name: 'Dogs', value: 12, color: '#64748B' },
]

export const todaysCombos = [
  {
    id: 1,
    items: ['Paneer Butter Masala', 'Garlic Naan', 'Lassi'],
    orderedTogether: 72,
    aovLift: 85,
    confidence: '72% ordered together'
  },
  {
    id: 2,
    items: ['Chicken Biryani', 'Raita', 'Gulab Jamun'],
    orderedTogether: 68,
    aovLift: 120,
    confidence: '68% ordered together'
  },
  {
    id: 3,
    items: ['Tandoori Chicken', 'Butter Naan', 'Mint Chutney'],
    orderedTogether: 65,
    aovLift: 95,
    confidence: '65% ordered together'
  },
]

export const menuItems = [
  { id: 1, name: 'Paneer Butter Masala', category: 'Main Course', price: 320, cost: 120, margin: 62.5, velocity: 'Fast', status: 'Star' },
  { id: 2, name: 'Chicken Biryani', category: 'Biryani', price: 380, cost: 140, margin: 63.2, velocity: 'Fast', status: 'Star' },
  { id: 3, name: 'Veg Biryani', category: 'Biryani', price: 280, cost: 120, margin: 57.1, velocity: 'Moderate', status: 'Hidden Star' },
  { id: 4, name: 'Dal Makhani', category: 'Main Course', price: 240, cost: 90, margin: 62.5, velocity: 'Fast', status: 'Star' },
  { id: 5, name: 'Butter Chicken', category: 'Main Course', price: 360, cost: 140, margin: 61.1, velocity: 'Fast', status: 'Star' },
  { id: 6, name: 'Tandoori Chicken', category: 'Tandoori', price: 420, cost: 180, margin: 57.1, velocity: 'Moderate', status: 'Plowhorse' },
  { id: 7, name: 'Garlic Naan', category: 'Breads', price: 80, cost: 30, margin: 62.5, velocity: 'Fast', status: 'Star' },
  { id: 8, name: 'Butter Naan', category: 'Breads', price: 70, cost: 28, margin: 60, velocity: 'Fast', status: 'Star' },
  { id: 9, name: 'Rasgulla', category: 'Desserts', price: 120, cost: 50, margin: 58.3, velocity: 'Slow', status: 'Dog' },
  { id: 10, name: 'Shahi Tukda', category: 'Desserts', price: 150, cost: 65, margin: 56.7, velocity: 'Slow', status: 'Dog' },
]

export const combos = [
  {
    id: 1,
    name: 'Bundle #1',
    items: ['Paneer Butter Masala', 'Garlic Naan', 'Lassi'],
    confidence: 72,
    aovLift: 85,
    marginScore: 4,
    ordersAnalyzed: 2400,
  },
  {
    id: 2,
    name: 'Bundle #2',
    items: ['Chicken Biryani', 'Raita', 'Gulab Jamun'],
    confidence: 68,
    aovLift: 120,
    marginScore: 5,
    ordersAnalyzed: 2400,
  },
  {
    id: 3,
    name: 'Bundle #3',
    items: ['Tandoori Chicken', 'Butter Naan', 'Mint Chutney'],
    confidence: 65,
    aovLift: 95,
    marginScore: 4,
    ordersAnalyzed: 2400,
  },
]

export const orders = [
  {
    id: 'ORD-2024-0001',
    time: '11:32 AM',
    items: ['Paneer Butter Masala', 'Garlic Naan', 'Lassi'],
    total: 420,
    language: 'Hindi',
    status: 'Completed'
  },
  {
    id: 'ORD-2024-0002',
    time: '11:45 AM',
    items: ['Chicken Biryani', 'Raita'],
    total: 380,
    language: 'English',
    status: 'Completed'
  },
  {
    id: 'ORD-2024-0003',
    time: '12:10 PM',
    items: ['Tandoori Chicken', 'Butter Naan', 'Mint Chutney'],
    total: 520,
    language: 'Hindi',
    status: 'Completed'
  },
  {
    id: 'ORD-2024-0004',
    time: '12:25 PM',
    items: ['Dal Makhani', 'Butter Naan', 'Rasgulla'],
    total: 330,
    language: 'English',
    status: 'Completed'
  },
]

export const getStatusColor = (status) => {
  const colors = {
    'Star': '#FF6B35',
    'Hidden Star': '#A78BFA',
    'Plowhorse': '#FB923C',
    'Dog': '#64748B'
  }
  return colors[status] || '#94A3B8'
}

export const getVelocityBadgeClass = (velocity) => {
  const classes = {
    'Fast': 'velocity-fast',
    'Moderate': 'velocity-moderate',
    'Slow': 'velocity-slow'
  }
  return classes[velocity] || 'velocity-moderate'
}
