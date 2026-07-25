# AI Assistant Design

The implemented assistant is a deterministic, knowledge-base-backed service. It does not currently depend on an external generative-model API.

## Request flow

1. `POST /api/v1/ai/chat` validates the authenticated request.
2. The service classifies the message into a supported intent: market information, property search, agent finder, appointment, investment advice, add property, property status, or general FAQ.
3. It searches active `knowledge_base_articles` for relevant content.
4. It composes a response with source references when articles match.
5. It returns suggested UI actions and uses a controlled fallback when evidence is insufficient.

## Knowledge management

Managers use `/admin/knowledge-base` and the `/api/v1/knowledge-base` endpoints to list, create, and update articles. Article titles/categories/content form the assistant's approved source set. Content must be reviewed and refreshed when market, tax, or legal guidance changes.

## Safety and limitations

- Answers are informational and must not be presented as legal, tax, or investment guarantees.
- A missing citation means the knowledge base did not supply supporting content.
- Intent classification and retrieval are lexical/rule-based, so paraphrases and ambiguous questions may fall back.
- Conversation history is carried in the request schema where supported; the assistant does not persist a separate chatbot conversation model.

Future integration with an LLM or embeddings would require explicit configuration, evaluation, cost controls, prompt-injection defenses, and retention/privacy decisions; those integrations are not part of the current code.
