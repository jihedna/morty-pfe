import PublicLayout from '../components/layout/PublicLayout'
import LandingHero from '../components/landing/LandingHero'
import RoleActionSection from '../components/landing/RoleActionSection'
import FeaturedPropertiesSection from '../components/landing/FeaturedPropertiesSection'
import AiAssistantSection from '../components/landing/AiAssistantSection'
import AgentFinderSection from '../components/landing/AgentFinderSection'
import PublicFooter from '../components/landing/PublicFooter'

export default function LandingPage() {
  return (
    <PublicLayout>
      <LandingHero />
      <RoleActionSection />
      <FeaturedPropertiesSection />
      <AiAssistantSection />
      <AgentFinderSection />
      <PublicFooter />
    </PublicLayout>
  )
}
