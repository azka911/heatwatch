import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Page from '@/app/(app)/hotspots/page'

// Generate mock hotspot rows
const generateRows = (count: number, risk: 'high' | 'medium' | 'low') =>
  Array.from({ length: count }, (_, i) => ({
    id: `${risk}-${i}`,
    name: `Zone ${risk} ${i + 1}`,
    risk,
    severity: Math.random(),
    lst_c: risk === 'high' ? 37.0 : risk === 'medium' ? 34.0 : 30.0,
    ndvi: 0.3,
    intervention_type: 'Tree Planting',
    intervention_rationale: 'Low NDVI area',
    lng: 101.6,
    lat: 3.1,
  }))

const mockHotspots = [
  ...generateRows(25, 'high'),
  ...generateRows(25, 'medium'),
  ...generateRows(25, 'low'),
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ hotspots: mockHotspots }),
  }) as jest.Mock
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('HotspotsPage', () => {
  it('renders the Hotspots heading', async () => {
    render(<Page />)
    expect(screen.getByText('Hotspots')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<Page />)
    expect(screen.getByText('Loading hotspot data...')).toBeInTheDocument()
  })

  it('renders all 4 tabs', async () => {
    render(<Page />)
    await waitFor(() => {
      expect(screen.getByText('All Zones')).toBeInTheDocument()
      expect(screen.getByText('High Risk')).toBeInTheDocument()
      expect(screen.getByText('Medium Risk')).toBeInTheDocument()
      expect(screen.getByText('Cooling Zones')).toBeInTheDocument()
    })
  })

  it('renders stats cards after loading', async () => {
  render(<Page />)
  await waitFor(() => {
    expect(screen.getByText('Total Zones')).toBeInTheDocument()
    expect(screen.getAllByText('75').length).toBeGreaterThan(0)
  })
})

  it('shows 20 rows per page by default', async () => {
    render(<Page />)
    await waitFor(() => {
      const rows = screen.getAllByText(/Zone high/i)
      expect(rows.length).toBe(20)
    })
  })

  it('resets to page 1 when tab changes', async () => {
    render(<Page />)
    await waitFor(() => screen.getByText('All Zones'))

    fireEvent.click(screen.getByText('All Zones'))
    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
    })
  })

  it('filters to high risk zones when High Risk tab clicked', async () => {
    render(<Page />)
    await waitFor(() => screen.getByText('High Risk'))

    fireEvent.click(screen.getByText('High Risk'))
    await waitFor(() => {
      expect(screen.getAllByText('HIGH').length).toBeGreaterThan(0)
    })
  })

  it('renders the model metrics footer', async () => {
    render(<Page />)
    await waitFor(() => {
      expect(screen.getByText(/R² = 0.652/)).toBeInTheDocument()
    })
  })

  it('shows pagination when more than 20 rows', async () => {
    render(<Page />)
    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
    })
  })

  it('navigates to next page when next button clicked', async () => {
    render(<Page />)
    await waitFor(() => screen.getByText('All Zones'))

    fireEvent.click(screen.getByText('All Zones'))
    await waitFor(() => screen.getByText(/Page 1 of/))

    fireEvent.click(screen.getByText('›'))
    await waitFor(() => {
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument()
    })
  })
})