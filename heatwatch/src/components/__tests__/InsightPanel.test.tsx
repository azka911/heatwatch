import { render, screen, waitFor } from '@testing-library/react'
import InsightPanel from '../dashboard/InsightPanel'

const mockSummary = {
  avg_lst: 33.4,
  avg_ndvi: 0.52,
  hotspot_count: 1189,
  high_risk_count: 554,
}

const mockSuhi = {
  suhi: 5.18,
  urban_lst: 36.36,
  rural_lst: 31.18,
}

const mockInterventions = {
  hotspots: [
    { intervention_type: 'Tree Planting' },
    { intervention_type: 'Tree Planting' },
    { intervention_type: 'Cool Roof' },
    { intervention_type: 'Shaded Walkways' },
  ],
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockInterventions,
  }) as jest.Mock
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('InsightPanel', () => {
  it('renders Analytical Insights header in observed mode', () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('Analytical Insights')).toBeInTheDocument()
  })

  it('renders Model Insights header in predicted mode', () => {
    render(
      <InsightPanel mode="predicted" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('Model Insights')).toBeInTheDocument()
  })

  it('renders the Observed badge in observed mode', () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('Observed')).toBeInTheDocument()
  })

  it('renders the Predicted badge in predicted mode', () => {
    render(
      <InsightPanel mode="predicted" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('Predicted')).toBeInTheDocument()
  })

  it('renders avg LST from summary props', () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('33.4°C')).toBeInTheDocument()
  })

  it('renders avg NDVI from summary props', () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('0.52')).toBeInTheDocument()
  })

  it('renders high risk zone count', () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('554 zones')).toBeInTheDocument()
  })

  it('renders urban and rural LST values', () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('36.36°C')).toBeInTheDocument()
    expect(screen.getByText('31.18°C')).toBeInTheDocument()
  })

  it('renders interventions after fetch completes', async () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    await waitFor(() => {
      expect(screen.getByText('Tree Planting')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(
      <InsightPanel mode="observed" summary={mockSummary} suhi={mockSuhi} />
    )
    expect(screen.getByText('Loading interventions...')).toBeInTheDocument()
  })
})