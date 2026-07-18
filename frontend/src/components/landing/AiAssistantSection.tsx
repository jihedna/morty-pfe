import { useAuth } from '../../contexts/AuthContext'

export default function AiAssistantSection() {
  const { isAuthenticated } = useAuth()

  const handleOpenChatbot = () => {
    window.dispatchEvent(new CustomEvent('open-chatbot'))
  }

  return (
    <section className="py-16 md:py-24 bg-navy-900" aria-label="AI assistant">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 block">AI Powered</span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Your AI Real Estate Assistant
            </h2>
            <p className="text-base text-white/70 mb-8 leading-relaxed">
              Get instant answers about properties, neighborhoods, and market trends. Our AI assistant helps you make informed decisions.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                'Ask about property details and availability',
                'Get market insights for Tunisian cities',
                'Receive personalized property suggestions',
              ].map(feature => (
                <li key={feature} className="flex items-start gap-3 text-white/80 text-sm">
                  <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleOpenChatbot}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-primary-600 transition-all active:scale-95"
              >
                Open AI Assistant
              </button>
            ) : (
              <a
                href="/login"
                className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-primary-600 transition-all active:scale-95"
              >
                Sign In to Chat with AI
              </a>
            )}
          </div>

          <div className="relative">
            <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700 shadow-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-navy-700">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">AI Assistant</p>
                  <p className="text-white/50 text-xs">Online</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-navy-700 rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]">
                  <p className="text-white/90 text-sm">Hi! I can help you find properties in Tunisia. What are you looking for?</p>
                </div>
                <div className="bg-primary-500 rounded-lg rounded-tr-none px-4 py-3 max-w-[80%] ml-auto">
                  <p className="text-white text-sm">I'm looking for a 3-bedroom apartment in Tunis under 500,000 TND.</p>
                </div>
                <div className="bg-navy-700 rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]">
                  <p className="text-white/90 text-sm">I found several options matching your criteria. Would you like to see featured listings?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
