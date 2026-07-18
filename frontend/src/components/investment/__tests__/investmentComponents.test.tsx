import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InvestmentScoreGauge } from '../InvestmentScoreGauge'
import { InvestmentGradeBadge } from '../InvestmentGradeBadge'
import { InvestmentMetricCard } from '../InvestmentMetricCard'
import { ScoreBreakdown } from '../ScoreBreakdown'
import { RiskList } from '../RiskList'
import { InvestmentMethodologyNotice } from '../InvestmentMethodologyNotice'
import { EquityProjectionChart } from '../EquityProjectionChart'
import { ExpenseBreakdownChart } from '../ExpenseBreakdownChart'
import { FinancialProjectionTable } from '../FinancialProjectionTable'

describe('InvestmentScoreGauge', () => {
  it('renders the score and accessible meter', () => {
    render(<InvestmentScoreGauge score={72} />)
    expect(screen.getByText('72')).toBeInTheDocument()
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '72')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps score to 0-100', () => {
    render(<InvestmentScoreGauge score={150} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    render(<InvestmentScoreGauge score={-10} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

describe('InvestmentGradeBadge', () => {
  it('renders strong opportunity for high score', () => {
    render(<InvestmentGradeBadge score={75} />)
    expect(screen.getByText('FORTE OPPORTUNITÉ')).toBeInTheDocument()
  })

  it('renders moderate opportunity for mid score', () => {
    render(<InvestmentGradeBadge score={55} />)
    expect(screen.getByText('OPPORTUNITÉ MODÉRÉE')).toBeInTheDocument()
  })

  it('renders high risk for low score', () => {
    render(<InvestmentGradeBadge score={30} />)
    expect(screen.getByText('RISQUE ÉLEVÉ')).toBeInTheDocument()
  })
})

describe('InvestmentMetricCard', () => {
  it('renders title, value, and supporting text', () => {
    render(<InvestmentMetricCard title="Test" value="42" supportingText="Strong" icon={<span>icon</span>} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })
})

describe('ScoreBreakdown', () => {
  it('renders all score bars', () => {
    render(<ScoreBreakdown scores={{ demand_score: 80, affordability_score: 70, rental_yield_score: 60, growth_score: 50, liquidity_score: 40 }} />)
    expect(screen.getByText('Demande')).toBeInTheDocument()
    expect(screen.getByText('Accessibilité budget')).toBeInTheDocument()
    expect(screen.getByText('Rendement locatif')).toBeInTheDocument()
    expect(screen.getByText('Croissance des prix')).toBeInTheDocument()
    expect(screen.getByText('Liquidité')).toBeInTheDocument()
  })
})

describe('RiskList', () => {
  it('renders risks', () => {
    render(<RiskList risks={['Risk one', 'Risk two']} />)
    expect(screen.getByText('Risques identifiés')).toBeInTheDocument()
    expect(screen.getByText('Risk one')).toBeInTheDocument()
    expect(screen.getByText('Risk two')).toBeInTheDocument()
  })

  it('renders nothing when risks are empty', () => {
    const { container } = render(<RiskList risks={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('InvestmentMethodologyNotice', () => {
  it('renders note and disclaimer', () => {
    render(<InvestmentMethodologyNotice note="Note text" />)
    expect(screen.getByText('Note text')).toBeInTheDocument()
    expect(screen.getByText(/Cette estimation est fournie à titre informatif/i)).toBeInTheDocument()
  })
})

describe('EquityProjectionChart', () => {
  it('shows empty state when no data is provided', () => {
    render(<EquityProjectionChart />)
    expect(screen.getByText('10-Year Equity Growth')).toBeInTheDocument()
    expect(screen.getByText('No projection data available.')).toBeInTheDocument()
  })
})

describe('ExpenseBreakdownChart', () => {
  it('shows empty state when no categories are provided', () => {
    render(<ExpenseBreakdownChart />)
    expect(screen.getByText('Monthly Expense Breakdown')).toBeInTheDocument()
    expect(screen.getByText('No expense data available.')).toBeInTheDocument()
  })

  it('renders categories when provided', () => {
    render(<ExpenseBreakdownChart categories={[{ label: 'Mortgage', value: 1000 }, { label: 'Taxes', value: 200 }]} total={1200} />)
    expect(screen.getByText('Mortgage')).toBeInTheDocument()
    expect(screen.getByText('Taxes')).toBeInTheDocument()
    expect(screen.getByText(/Total: 1200/)).toBeInTheDocument()
  })
})

describe('FinancialProjectionTable', () => {
  it('shows empty state when no rows are provided', () => {
    render(<FinancialProjectionTable />)
    expect(screen.getByText('Year-by-Year Financial Projection')).toBeInTheDocument()
    expect(screen.getByText('No projection data available.')).toBeInTheDocument()
  })

  it('renders rows when provided', () => {
    render(<FinancialProjectionTable rows={[{ year: 1, propertyValue: 100000, loanBalance: 80000, equity: 20000, rentalIncome: 12000, operatingExpenses: 4000, netCashFlow: 8000 }]} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('20000')).toBeInTheDocument()
  })
})
