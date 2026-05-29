import { render, screen } from '@testing-library/react'
import KpiCard from '../dashboard/KpiCard'

describe('KpiCard', () => {
  it('renders the label correctly', () => {
    render(<KpiCard label="Average LST" value="33.4" />)
    expect(screen.getByText('Average LST')).toBeInTheDocument()
  })

  it('renders the value correctly', () => {
    render(<KpiCard label="Average LST" value="33.4" />)
    expect(screen.getByText('33.4')).toBeInTheDocument()
  })

  it('renders the unit when provided', () => {
    render(<KpiCard label="Average LST" value="33.4" unit="°C" />)
    expect(screen.getByText('°C')).toBeInTheDocument()
  })

  it('renders the sub text when provided', () => {
    render(<KpiCard label="Average LST" value="33.4" sub="MODIS observed" />)
    expect(screen.getByText('MODIS observed')).toBeInTheDocument()
  })

  it('does not render sub text when not provided', () => {
    render(<KpiCard label="Average LST" value="33.4" />)
    expect(screen.queryByText('MODIS observed')).not.toBeInTheDocument()
  })

  it('renders the icon when provided', () => {
    render(
      <KpiCard
        label="Average LST"
        value="33.4"
        icon={<span data-testid="test-icon">🌡️</span>}
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders without crashing when only required props are given', () => {
    render(<KpiCard label="High Risk Zones" value="554" />)
    expect(screen.getByText('High Risk Zones')).toBeInTheDocument()
    expect(screen.getByText('554')).toBeInTheDocument()
  })
})