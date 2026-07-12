import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PublicLayout from '../components/layout/PublicLayout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'AI Agent Matching',
    desc: 'Data-driven scoring connects you with agents who specialise in your budget, location, and property type.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Smart Property Search',
    desc: 'Semantic search, advanced filters, and live listings to find the right home or investment faster.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Market Insights',
    desc: 'Heat maps, price-per-m² trends, and demand analytics across Tunisian cities and districts.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Investment Score',
    desc: 'Evaluate listings and neighbourhoods with clear investment metrics and rental-yield estimates.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Appointments',
    desc: 'Request viewings, schedule visits, and manage your calendar with agents in one place.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Secure Messaging',
    desc: 'Chat with matched agents, share documents, and keep every conversation organised and secure.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search',
    desc: 'Browse listings or describe what you need to our AI assistant.',
  },
  {
    step: '02',
    title: 'Match',
    desc: 'Get AI-curated property matches and agent recommendations.',
  },
  {
    step: '03',
    title: 'Visit',
    desc: 'Schedule viewings and explore properties with expert agents.',
  },
  {
    step: '04',
    title: 'Close',
    desc: 'Negotiate, sign, and complete your deal with full support.',
  },
]

const ROLE_CARDS = [
  {
    id: 'client' as const,
    role: 'I am a Client',
    desc: 'Find the perfect home, match with top-tier agents, and schedule visits — all in one place.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'agent' as const,
    role: 'I am an Agent',
    desc: 'Manage your listings, receive qualified leads with scores, and grow your portfolio.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'manager' as const,
    role: 'I am a Manager',
    desc: 'Oversee the full platform — analytics, contracts, users, and performance metrics.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

const DEMO_CHAT = [
  { from: 'user', text: 'What is the average price per m² in Tunis Lac district?' },
  { from: 'bot', text: "Based on our market data, the Lac district in Tunis currently shows an average price around 3 200–4 500 TND/m² for apartments. Demand level is high with an upward price trend. Would you like me to find an agent specialised in that area?" },
  { from: 'user', text: 'Yes please, my budget is 400 000 TND' },
  { from: 'bot', text: "Great! I can match you with agents who work in Tunis Lac with budgets in your range. Create a search request and our algorithm will rank the best matches for you instantly." },
]

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [agentCity, setAgentCity] = useState('')
  const [agentType, setAgentType] = useState('')
  const [chatVisible, setChatVisible] = useState(false)

  const role = user?.role ?? null

  const dashboardLink = () => {
    if (!isAuthenticated) return '/login'
    if (role === 'agent') return '/agent/dashboard'
    if (role === 'manager') return '/admin/dashboard'
    return '/client/dashboard'
  }

  // Where "Find an Agent" / "Search Agents" should go
  const findAgentLink = () => {
    if (!isAuthenticated) return '/register'
    if (role === 'client') return '/client/search-requests/new'
    return dashboardLink()
  }

  // Where the real chatbot lives after login
  const chatLink = () => {
    if (!isAuthenticated) return '/register'
    return dashboardLink() // chatbot floats inside the portal
  }

  const handleAgentSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(findAgentLink())
  }

  return (
    <PublicLayout>
      <div className="bg-white font-sans">

      {/* HERO */}
      <section className="relative px-4 sm:px-6 py-20 md:py-28 bg-gradient-to-b from-primary-50/80 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-primary-100 shadow-sm rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600">AI-Powered Real Estate Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            The Future of Real Estate is <span className="text-primary-600">Driven by AI</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Search smart listings, get instant answers from our AI assistant, and get matched with the right
            RE/MAX agent to close your next property faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                if (isAuthenticated) {
                  window.dispatchEvent(new Event('open-chatbot'))
                } else {
                  setChatVisible(v => !v)
                }
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Ask AI Assistant
            </Button>
            <Button as="Link" to={findAgentLink()} variant="outline" size="lg" className="w-full sm:w-auto">
              Find an Agent
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Button as="Link" to="/properties" variant="ghost" size="lg" className="w-full sm:w-auto">
              Browse Properties
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </Button>
          </div>

        </div>

        {/* Chat preview — toggled by "Ask AI Assistant" for guests */}
        <div className={`relative z-10 max-w-sm mx-auto mt-10 transition-all duration-300 ${chatVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none h-0 overflow-hidden'}`}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-primary-500 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Smile AI Assistant</p>
                <p className="text-primary-200 text-xs">Always online</p>
              </div>
            </div>
            <div className="p-4 space-y-3 bg-gray-50">
              {DEMO_CHAT.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.from === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <Link to={chatLink()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
                {isAuthenticated ? 'Open Chatbot' : 'Register to Chat'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AGENT SEARCH */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Find an Agent</h2>
          <p className="text-gray-500 mb-6">Tell us what you are looking for and we will match you with the best available agent.</p>
          <form onSubmit={handleAgentSearch} className="flex flex-wrap gap-3 justify-center items-end">
            <Input
              id="agent-city"
              label="City"
              value={agentCity}
              onChange={setAgentCity}
              placeholder="e.g. Tunis, Sfax"
              className="w-52"
            />
            <Select
              id="agent-type"
              label="Property type"
              value={agentType}
              onChange={setAgentType}
              options={[
                { value: '', label: 'Any property type' },
                { value: 'apartment', label: 'Apartment' },
                { value: 'villa', label: 'Villa' },
                { value: 'land', label: 'Land' },
                { value: 'commercial', label: 'Commercial' },
              ]}
              className="w-52"
            />
            <Button type="submit" size="lg">Search Agents</Button>
          </form>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Intelligent Tools for Modern Real Estate</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Everything you need to search, compare, and close your next property with confidence.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <Card key={f.title} padding="lg" className="group hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
              <div className="w-14 h-14 bg-primary-50 group-hover:bg-primary-500 rounded-xl flex items-center justify-center text-primary-500 group-hover:text-white transition-colors mb-6">
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-page border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A simple, AI-guided journey from search to closing.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <Card key={item.step} padding="lg" className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROLE CARDS */}
      <section id="roles" className="bg-page border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Tailored for Every Role</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Whether you are buying, selling, or managing the business, Smile AI has you covered.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {ROLE_CARDS.map(c => {
              const isMyRole = isAuthenticated && role === c.id
              const isOtherRole = isAuthenticated && role !== c.id
              return (
                <Card
                  key={c.id}
                  padding="lg"
                  className={`flex flex-col items-center text-center ${isOtherRole ? 'opacity-50' : ''}`}
                >
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 mb-5">
                    {c.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{c.role}</h3>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-1">{c.desc}</p>
                  {isOtherRole ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl cursor-not-allowed select-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Requires {c.role.replace('I am ', '')} account
                    </span>
                  ) : (
                    <Button as="Link" to={isMyRole ? dashboardLink() : '/login'}>
                      {isMyRole ? 'Go to My Dashboard' : 'Sign In'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto bg-primary-500 rounded-[2rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">Ready to find your Smile?</h2>
            <p className="text-primary-100 text-lg max-w-xl mx-auto mb-10">Join the RE/MAX Smile AI ecosystem and transform your real estate experience.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button as="Link" to={dashboardLink()} variant="secondary" size="lg">
                  Go to My Dashboard
                </Button>
              ) : (
                <>
                  <Button as="Link" to="/register" variant="secondary" size="lg">
                    Get Started Free
                  </Button>
                  <Button as="Link" to="/properties" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                    Browse Properties
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <span className="font-bold text-gray-100">RE/MAX Smile AI</span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm">AI-powered real estate platform built for the RE/MAX network.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-200 mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/properties" className="hover:text-white transition-colors">Property Search</Link></li>
              <li><Link to="/map" className="hover:text-white transition-colors">Map</Link></li>
              <li><Link to="/market-map" className="hover:text-white transition-colors">Market Insights</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-200 mb-4">Account</h4>
            <ul className="space-y-3 text-sm">
              {isAuthenticated ? (
                <li>
                  <button type="button" onClick={() => logout()} className="hover:text-white transition-colors">
                    Sign Out
                  </button>
                </li>
              ) : (
                <>
                  <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                  <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6 border-t border-gray-800 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} RE/MAX Smile AI. All rights reserved.
        </div>
      </footer>
      </div>
    </PublicLayout>
  )
}
