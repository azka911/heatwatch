import { render, screen, fireEvent } from '@testing-library/react'
import FilterPanel from '../dashboard/FilterPanel'

const mockSetMode = jest.fn()

jest.mock('@/context/DashboardContext', () => ({
  useDashboard: () => ({
    city: 'Greater Kuala Lumpur',
    mode: 'observed',
    setMode: mockSetMode,
  }),
}))

describe('FilterPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the study area correctly', () => {
    render(<FilterPanel />)
    expect(screen.getByText('Greater Kuala Lumpur')).toBeInTheDocument()
  })

  it('renders the Locked label', () => {
    render(<FilterPanel />)
    expect(screen.getByText('(Locked)')).toBeInTheDocument()
  })

  it('renders both Observed and Predicted buttons', () => {
    render(<FilterPanel />)
    expect(screen.getByText('Observed')).toBeInTheDocument()
    expect(screen.getByText('Predicted')).toBeInTheDocument()
  })

  it('shows observed mode description when mode is observed', () => {
    render(<FilterPanel />)
    expect(screen.getByText('Observed mode')).toBeInTheDocument()
  })

  it('calls setMode with predicted when Predicted button is clicked', () => {
    render(<FilterPanel />)
    fireEvent.click(screen.getByText('Predicted'))
    expect(mockSetMode).toHaveBeenCalledWith('predicted')
  })

  it('calls setMode with observed when Observed button is clicked', () => {
    render(<FilterPanel />)
    fireEvent.click(screen.getByText('Observed'))
    expect(mockSetMode).toHaveBeenCalledWith('observed')
  })
})