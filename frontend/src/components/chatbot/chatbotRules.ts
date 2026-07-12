/**
 * Rule-based chatbot engine for RE/MAX Smile AI.
 * Future: replace processMessage() with a call to POST /api/v1/ai/chat
 */

export type UserRole = 'client' | 'agent' | 'manager' | null

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

interface Rule {
  patterns: RegExp[]
  response: (role: UserRole) => string
}

const rules: Rule[] = [
  {
    patterns: [/hello|hi|hey|bonjour|salam/i],
    response: (role) =>
      `Hello! I'm your RE/MAX Smile AI assistant. ${
        role === 'client'
          ? 'I can help you browse properties, manage favorites, contact agents, and schedule viewings.'
          : role === 'agent'
          ? 'I can help you manage your listings, appointments, and conversations.'
          : role === 'manager'
          ? 'I can help you navigate analytics, agents, properties, and appointments.'
          : 'How can I help you today?'
      }`,
  },
  {
    patterns: [/how.*(work|use|start|begin|navigate)/i, /what can you do/i, /help/i],
    response: (role) => {
      if (role === 'client')
        return `Here's what you can do as a client:\n• **Browse Properties** – go to /properties\n• **Favorite a property** – click the heart on any listing\n• **Create a search request** – go to Search Requests\n• **Contact an agent** – open a property and click "Contact Agent"\n• **Request a viewing** – open a property and click "Request Viewing"\n• **View your appointments** – go to Appointments\n• **Check messages** – go to Messages`
      if (role === 'agent')
        return `Here's what you can do as an agent:\n• **Add a property** – go to Properties → Add New\n• **Edit listings** – click any property in My Listings\n• **Manage appointments** – go to Appointments to confirm, reschedule or complete\n• **Reply to clients** – go to Messages\n• **Update your profile** – go to My Profile`
      if (role === 'manager')
        return `Here's what you can do as a manager:\n• **View analytics** – go to Analytics\n• **Manage agents** – go to Agents\n• **Manage users** – go to Users\n• **Review properties** – go to Properties\n• **Monitor appointments** – go to Appointments\n• **Review conversations** – go to Conversations`
      return 'Please log in to get personalised guidance.'
    },
  },
  {
    patterns: [/propert(y|ies)|listing|house|apartment|villa/i],
    response: (role) => {
      if (role === 'agent')
        return 'To manage your listings, go to **Properties** in the sidebar. You can add a new property, edit existing ones, update status (available → reserved → sold/rented), and manage images and features.'
      if (role === 'manager')
        return 'Go to **Properties** in the sidebar to view all listings, filter by status or agent, and take administrative actions.'
      return 'Browse available properties at **/properties**. You can filter by type, price, city, and more. Click a property to view full details, save it to favorites, contact the agent, or request a viewing.'
    },
  },
  {
    patterns: [/favorit|save.*property|bookmark/i],
    response: (role) => {
      if (role === 'client')
        return 'Click the **heart icon** on any property card or on the property detail page to save it to your favorites. View all your favorites under **Favorites** in the sidebar.'
      return 'Favorites are a client feature. Clients can save properties they like for easy access later.'
    },
  },
  {
    patterns: [/search request|find.*property|looking for/i],
    response: (role) => {
      if (role === 'client')
        return 'Go to **Search Requests** in the sidebar and click **New Request**. Describe what you\'re looking for (type, budget, location) and agents will be matched to your request. Check your matches under **Matches**.'
      if (role === 'agent')
        return 'Client search requests are visible in your **Dashboard** as potential leads. When a client request matches your profile, you may be shown as a match.'
      return 'Clients can create search requests to find properties matching their criteria.'
    },
  },
  {
    patterns: [/appointment|viewing|visit|schedule|book/i],
    response: (role) => {
      if (role === 'client')
        return 'Open a property detail page and click **"Request Viewing"**. Choose a date and time slot, add notes if needed, and submit. Track your appointments under **Appointments** in the sidebar.'
      if (role === 'agent')
        return 'Go to **Appointments** in the sidebar. You can:\n• **Confirm** a requested appointment\n• **Reschedule** it to a different time\n• **Complete** it after the visit\n• **Mark as no-show** if the client didn\'t attend\n• **Cancel** if needed'
      if (role === 'manager')
        return 'Go to **Appointments** to view all appointments across agents. You can filter by status and take administrative actions.'
      return 'Please log in to manage appointments.'
    },
  },
  {
    patterns: [/message|chat|conversation|contact.*agent|send/i],
    response: (role) => {
      if (role === 'client')
        return 'Go to a property detail page and click **"Contact Agent"** to start a conversation. You can also go to **Messages** in the sidebar to see all your conversations and send messages.'
      if (role === 'agent')
        return 'Go to **Messages** in the sidebar to view conversations with clients. Click any conversation to open the chat and reply.'
      if (role === 'manager')
        return 'Go to **Conversations** in the sidebar to monitor all conversations on the platform.'
      return 'Please log in to access messaging.'
    },
  },
  {
    patterns: [/notification|alert|unread/i],
    response: () =>
      'Go to **Notifications** in the sidebar to see all your alerts. You can mark individual notifications as read or mark all as read at once.',
  },
  {
    patterns: [/profile|account|settings|edit.*info/i],
    response: (role) => {
      if (role === 'agent')
        return 'Go to **My Profile** in the sidebar to update your bio, contact information, office details, years of experience, and languages.'
      return 'Your account details were set at registration. Contact your manager if you need to update your email or role.'
    },
  },
  {
    patterns: [/analytic|statistic|report|dashboard/i],
    response: (role) => {
      if (role === 'manager')
        return 'Go to **Analytics** in the sidebar. You can view:\n• **Properties** – by status, type, city, price\n• **Agents** – performance table\n• **Clients** – engagement metrics\n• **Appointments** – completion and cancellation rates\n• **Engagement** – messages, favorites, saved searches\n• **Time Series** – trends over a date range'
      if (role === 'agent')
        return 'Your **Dashboard** shows key metrics: total listings, available/reserved/sold, pending appointments, active chats, and unread notifications.'
      if (role === 'client')
        return 'Your **Dashboard** shows your favorites count, active search requests, upcoming appointments, active conversations, and unread notifications.'
      return 'Please log in to view analytics.'
    },
  },
  {
    patterns: [/saved search|alert.*propert|notify.*new/i],
    response: (role) => {
      if (role === 'client')
        return 'Go to **Saved Searches** in the sidebar to save your current search filters. You can enable notifications to be alerted when new properties match your criteria.'
      return 'Saved searches are a client feature for tracking property criteria.'
    },
  },
  {
    patterns: [/agent|realtor|broker/i],
    response: (role) => {
      if (role === 'manager')
        return 'Go to **Agents** in the sidebar to view all agents, their profiles, and performance metrics.'
      if (role === 'client')
        return 'Open a property detail page and click **"Contact Agent"** to reach the listing agent. You can also view the agent\'s profile information on the property page.'
      return 'Each property listing is managed by a licensed RE/MAX agent.'
    },
  },
  {
    patterns: [/user.*manag|manage.*user|deactivat|activat.*user/i],
    response: (role) => {
      if (role === 'manager')
        return 'Go to **Users** in the sidebar to view all registered users. You can filter by role and activate or deactivate accounts.'
      return 'User management is only available to managers.'
    },
  },
  {
    patterns: [/login|sign.?in|password|forgot/i],
    response: () =>
      'To log in, go to **/login** and enter your email and password. If you forgot your password, contact your manager. New users can register at **/register**.',
  },
  {
    patterns: [/logout|sign.?out/i],
    response: () =>
      'Click the **"Sign Out"** button at the bottom of the sidebar to log out securely.',
  },
  {
    patterns: [/price|cost|how much|budget|TND|afford/i],
    response: () =>
      'Property prices vary by type, location, and size. Browse **/properties** and use the **price filter** to set your budget range. Prices are shown in Tunisian Dinar (TND).',
  },
  {
    patterns: [/location|city|governorat|district|where/i],
    response: () =>
      'You can filter properties by city, governorate, and district on the **/properties** page. Use the filter panel on the left to narrow results by location.',
  },
  {
    patterns: [/thank|thanks|merci|shukran/i],
    response: () =>
      "You're welcome! Feel free to ask if you need anything else. 😊",
  },
  {
    patterns: [/bye|goodbye|see you|au revoir/i],
    response: () =>
      'Goodbye! Good luck with your property search. Feel free to come back anytime! 👋',
  },
]

const FALLBACK = (role: UserRole): string => {
  const suggestions =
    role === 'client'
      ? 'properties, favorites, search requests, appointments, messages'
      : role === 'agent'
      ? 'listings, appointments, messages, profile'
      : role === 'manager'
      ? 'analytics, users, agents, properties, appointments'
      : 'properties, login, registration'

  return `I'm not sure I understood that. I can help you with: **${suggestions}**. Try rephrasing your question, or ask "help" for a full overview.`
}

let _msgCounter = 0
function newId() {
  return `msg-${Date.now()}-${++_msgCounter}`
}

export function createWelcomeMessage(role: UserRole): ChatMessage {
  const greeting =
    role === 'client'
      ? "Hi! I'm your RE/MAX assistant. I can help you browse properties, contact agents, schedule viewings, and more. Ask me anything!"
      : role === 'agent'
      ? "Hi! I'm your RE/MAX assistant. I can guide you through managing listings, appointments, and client conversations. How can I help?"
      : role === 'manager'
      ? "Hi! I'm your RE/MAX assistant. I can help you navigate analytics, manage users, agents, and oversee the platform. What do you need?"
      : "Hi! I'm the RE/MAX Smile AI assistant. How can I help you today?"
  return { id: newId(), role: 'assistant', text: greeting, timestamp: new Date() }
}

export function processMessage(text: string, role: UserRole): ChatMessage {
  const trimmed = text.trim()
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(trimmed))) {
      return { id: newId(), role: 'assistant', text: rule.response(role), timestamp: new Date() }
    }
  }
  return { id: newId(), role: 'assistant', text: FALLBACK(role), timestamp: new Date() }
}

export function userMessage(text: string): ChatMessage {
  return { id: newId(), role: 'user', text, timestamp: new Date() }
}
