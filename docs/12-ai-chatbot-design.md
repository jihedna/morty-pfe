# AI Chatbot Design

## Overview

The RE/MAX Smile AI chatbot uses Retrieval-Augmented Generation (RAG) to provide accurate, context-aware answers to real estate questions. The system combines a large language model (LLM) with a knowledge base of approved documents to ensure responses are based on reliable, up-to-date information with proper source citations.

## Architecture

### System Components

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│  LLM Service    │
│   (React)       │     │   (FastAPI)     │     │  (OpenAI API)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Vector Store   │
                       │  (PostgreSQL + │
                       │   pgvector)     │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Knowledge Base │
                       │  (Documents)    │
                       └─────────────────┘
```

### Data Flow

1. **User Query**: Client submits question through frontend
2. **Query Processing**: Backend processes and analyzes the query
3. **Document Retrieval**: System searches knowledge base for relevant documents
4. **Context Assembly**: Retrieved documents are assembled into context
5. **LLM Generation**: LLM generates response using retrieved context
6. **Response Formatting**: Response is formatted with source citations
7. **Delivery**: Formatted response is sent to frontend
8. **Logging**: Interaction is logged for analytics and improvement

## Technology Stack

### Core Technologies

- **LLM Provider**: OpenAI API (GPT-4 or GPT-3.5-turbo)
- **Vector Database**: PostgreSQL with pgvector extension
- **Embedding Model**: OpenAI text-embedding-3-small or text-embedding-3-large
- **Backend Framework**: FastAPI (Python)
- **Document Processing**: LangChain for RAG pipeline
- **Text Processing**: spaCy for text preprocessing
- **PDF Processing**: PyPDF2 or pdfplumber for document extraction

### Alternative LLM Providers

If OpenAI is not available or cost-prohibitive:
- **Anthropic Claude**: Claude 3 Haiku/Sonnet/Opus
- **Google Gemini**: Gemini Pro
- **Local Models**: Llama 2, Mistral (with appropriate hosting)
- **Azure OpenAI**: Azure-hosted OpenAI models

## Knowledge Base Management

### Document Types

The knowledge base supports various document types:

- **Legal Documents**: Property laws, regulations, procedures
- **Market Reports**: Real estate market trends, price analyses
- **Tax Information**: Registration fees, taxes, government fees
- **Agency Guidelines**: RE/MAX Smile policies and procedures
- **Neighborhood Guides**: Information about Grand Tunis areas
- **Investment Guides**: Real estate investment advice
- **FAQ Documents**: Common questions and answers

### Document Processing Pipeline

```
Raw Document → Text Extraction → Text Cleaning → Chunking → Embedding → Vector Storage
```

#### 1. Text Extraction

- **PDF**: Extract text using PyPDF2 or pdfplumber
- **DOCX**: Extract text using python-docx
- **TXT**: Direct text reading
- **HTML**: Extract text using BeautifulSoup

#### 2. Text Cleaning

- Remove special characters and formatting
- Normalize whitespace
- Remove page numbers and headers
- Preserve section structure
- Handle tables and lists

#### 3. Text Chunking

Chunk documents into smaller segments for effective retrieval:

```python
chunk_size = 500  # characters
chunk_overlap = 50  # characters
```

**Chunking Strategies**:
- **Fixed-size chunks**: Simple but may break semantic boundaries
- **Semantic chunks**: Split by paragraphs or sections
- **Hybrid approach**: Fixed size with semantic boundaries

#### 4. Embedding Generation

Convert text chunks to vector embeddings:

```python
from openai import OpenAI

client = OpenAI()

def generate_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
```

#### 5. Vector Storage

Store embeddings in PostgreSQL with pgvector:

```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES kb_documents(id),
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

## Retrieval-Augmented Generation (RAG)

### Retrieval Process

#### 1. Query Embedding

Convert user query to embedding:

```python
def embed_query(query: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    return response.data[0].embedding
```

#### 2. Similarity Search

Find most relevant document chunks:

```sql
SELECT 
    dc.id,
    dc.document_id,
    dc.content,
    dc.embedding <=> :query_embedding AS distance,
    kd.title,
    kd.category
FROM document_chunks dc
JOIN kb_documents kd ON dc.document_id = kd.id
WHERE kd.status = 'active'
ORDER BY dc.embedding <=> :query_embedding
LIMIT 5;
```

#### 3. Context Assembly

Assemble retrieved chunks into context:

```python
def assemble_context(chunks: list) -> str:
    context_parts = []
    for chunk in chunks:
        context_parts.append(f"Source: {chunk['title']}\n{chunk['content']}")
    return "\n\n---\n\n".join(context_parts)
```

### Generation Process

#### 1. Prompt Engineering

Construct prompt with retrieved context:

```python
def construct_prompt(query: str, context: str) -> str:
    prompt = f"""
You are a helpful real estate assistant for RE/MAX Smile in Tunisia. 
Answer the user's question using ONLY the provided context from approved documents.
If the answer is not in the context, state that you don't have that information.
Always cite your sources.

Context:
{context}

Question: {query}

Answer:"""
    return prompt
```

#### 2. LLM Generation

Generate response using LLM:

```python
def generate_response(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful real estate assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=500
    )
    return response.choices[0].message.content
```

#### 3. Source Citation

Extract and format source citations:

```python
def extract_sources(response: str, chunks: list) -> list[dict]:
    sources = []
    for chunk in chunks:
        if chunk['title'] in response:
            sources.append({
                'document_id': chunk['document_id'],
                'title': chunk['title'],
                'category': chunk['category'],
                'relevance': calculate_relevance(response, chunk['content'])
            })
    return sources
```

## Conversation Management

### Session Management

```python
class ChatSession:
    def __init__(self, user_id: str):
        self.session_id = str(uuid.uuid4())
        self.user_id = user_id
        self.messages = []
        self.context_window = []
        self.created_at = datetime.now()
    
    def add_message(self, role: str, content: str, sources: list = None):
        self.messages.append({
            'id': str(uuid.uuid4()),
            'role': role,
            'content': content,
            'sources': sources,
            'created_at': datetime.now()
        })
    
    def get_context_window(self, max_messages: int = 5) -> list:
        return self.messages[-max_messages:]
```

### Context Window Management

Maintain conversation context for follow-up questions:

```python
def update_context_window(session: ChatSession, new_query: str, new_response: str):
    session.context_window.append({
        'query': new_query,
        'response': new_response
    })
    
    # Keep only last 5 exchanges
    if len(session.context_window) > 5:
        session.context_window = session.context_window[-5:]
```

### Follow-up Question Handling

Enhance queries with conversation context:

```python
def enhance_query(current_query: str, context_window: list) -> str:
    if not context_window:
        return current_query
    
    context_summary = "\n".join([
        f"Previous Q: {exchange['query']}\nPrevious A: {exchange['response']}"
        for exchange in context_window[-3:]
    ])
    
    enhanced_query = f"""
Previous conversation:
{context_summary}

Current question: {current_query}

Please answer the current question considering the conversation context."""
    
    return enhanced_query
```

## Prompt Engineering

### System Prompt

```python
SYSTEM_PROMPT = """
You are a professional real estate assistant for RE/MAX Smile in Tunisia. 
Your role is to help clients with real estate questions using ONLY the provided knowledge base documents.

Guidelines:
1. Answer questions accurately based on the provided context
2. If information is not available in the context, clearly state that
3. Always cite the source documents for your answers
4. Be professional, helpful, and concise
5. Focus on the Grand Tunis region (Tunis, La Marsa, Carthage, etc.)
6. Provide practical, actionable advice when possible
7. If you're uncertain, acknowledge the limitation
8. Do not make up information or hallucinate facts
9. Use clear, simple language appropriate for all users
10. If the question is ambiguous, ask for clarification

Topics you can help with:
- Property prices and market trends
- Legal procedures for buying/selling property
- Taxes and registration fees
- Neighborhood information
- Investment advice
- Agency services
- General real estate questions

Topics you cannot help with:
- Specific property recommendations (refer to property search)
- Agent availability (refer to agent profiles)
- Personal financial advice
- Legal representation (refer to legal professionals)
"""
```

### Few-Shot Examples

Include examples in the prompt for better performance:

```python
FEW_SHOT_EXAMPLES = """
Example 1:
Q: What are the registration fees for buying property in Tunisia?
A: According to the Tunisian Property Tax Guide, registration fees are approximately 3% of the property value. This fee is paid to the land registry office during the property transfer process.
Source: Tunisian Property Tax Guide

Example 2:
Q: Which area in Grand Tunis has the highest property prices?
A: Based on the Q4 2023 Market Report, La Marsa and Carthage typically have the highest property prices in the Grand Tunis region due to their coastal location and amenities.
Source: Q4 2023 Market Report
"""
```

## Quality Assurance

### Response Validation

```python
def validate_response(response: str, query: str, context: str) -> dict:
    validation = {
        'is_relevant': check_relevance(response, query),
        'has_sources': check_sources(response),
        'is_in_context': check_context_alignment(response, context),
        'is_helpful': check_helpfulness(response, query),
        'is_safe': check_safety(response)
    }
    return validation
```

### Fallback Mechanisms

```python
def generate_fallback_response(query: str) -> str:
    fallback_responses = [
        "I don't have specific information about that in my knowledge base. Would you like me to help you with something else?",
        "That's a great question, but I don't have the current information to provide an accurate answer. I recommend contacting a RE/MAX Smile agent for assistance.",
        "I'm not able to answer that question based on my available documents. Let me help you find an agent who can assist you."
    ]
    return random.choice(fallback_responses)
```

### Confidence Scoring

```python
def calculate_confidence(response: str, sources: list, context_relevance: float) -> float:
    factors = {
        'source_quality': len(sources) * 0.3,
        'context_relevance': context_relevance * 0.4,
        'response_length': min(len(response) / 200, 1) * 0.1,
        'citation_clarity': check_citation_clarity(response) * 0.2
    }
    confidence = sum(factors.values())
    return min(confidence, 1.0)
```

## Performance Optimization

### Caching Strategy

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_embedding(text: str) -> list[float]:
    return generate_embedding(text)
```

### Batch Processing

```python
def batch_generate_embeddings(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [item.embedding for item in response.data]
```

### Async Processing

```python
import asyncio

async def async_generate_response(prompt: str) -> str:
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, generate_response, prompt)
    return response
```

## Analytics and Monitoring

### Usage Metrics

Track the following metrics:
- Number of chat sessions per day
- Average messages per session
- Response time (p50, p95, p99)
- Document usage frequency
- Query categories
- User satisfaction ratings
- Fallback rate

### Quality Metrics

Track the following quality metrics:
- Response relevance scores
- Source citation accuracy
- Context alignment scores
- User feedback (thumbs up/down)
- Follow-up question rate

### Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_chat_interaction(session_id: str, query: str, response: str, sources: list, metrics: dict):
    logger.info({
        'session_id': session_id,
        'query': query,
        'response': response,
        'sources': sources,
        'response_time': metrics['response_time'],
        'confidence': metrics['confidence'],
        'timestamp': datetime.now().isoformat()
    })
```

## Security Considerations

### Input Validation

```python
def validate_query(query: str) -> bool:
    # Check for malicious patterns
    malicious_patterns = ['<script>', 'javascript:', 'eval(']
    for pattern in malicious_patterns:
        if pattern.lower() in query.lower():
            return False
    
    # Check length
    if len(query) > 1000:
        return False
    
    return True
```

### Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/chat/sessions/{session_id}/messages")
@limiter.limit("20/minute")
async def send_message(request: Request, session_id: str, message: ChatMessage):
    # Process message
    pass
```

### Content Filtering

```python
def filter_content(text: str) -> str:
    # Remove or flag inappropriate content
    # Implement content moderation
    return text
```

## Cost Management

### Token Usage Estimation

```python
def estimate_tokens(text: str) -> int:
    # Rough estimation: 1 token ≈ 4 characters
    return len(text) // 4

def calculate_cost(input_tokens: int, output_tokens: int) -> float:
    # OpenAI GPT-4 pricing (example)
    input_cost = (input_tokens / 1000) * 0.03
    output_cost = (output_tokens / 1000) * 0.06
    return input_cost + output_cost
```

### Cost Optimization Strategies

- Use smaller models (GPT-3.5-turbo) for simple queries
- Implement caching for common questions
- Limit context window size
- Use streaming responses for better UX
- Monitor and alert on unusual cost patterns

## Testing Strategy

### Unit Tests

```python
def test_query_embedding():
    query = "What are property taxes?"
    embedding = embed_query(query)
    assert len(embedding) == 1536
    assert all(isinstance(x, float) for x in embedding)

def test_context_assembly():
    chunks = [
        {'title': 'Doc1', 'content': 'Content 1'},
        {'title': 'Doc2', 'content': 'Content 2'}
    ]
    context = assemble_context(chunks)
    assert 'Doc1' in context
    assert 'Doc2' in context
```

### Integration Tests

```python
def test_end_to_end_chat():
    session = create_chat_session(user_id="test_user")
    response = send_message(session_id=session.session_id, content="Test question")
    assert response['role'] == 'assistant'
    assert len(response['sources']) > 0
```

### Evaluation Tests

```python
def test_response_quality():
    test_cases = [
        {
            'query': 'What are registration fees?',
            'expected_keywords': ['3%', 'registration', 'fee']
        }
    ]
    
    for case in test_cases:
        response = generate_response(case['query'])
        for keyword in case['expected_keywords']:
            assert keyword.lower() in response.lower()
```

## Deployment Considerations

### Environment Configuration

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-3-small
MAX_CONTEXT_LENGTH=4000
MAX_RESPONSE_LENGTH=500
TEMPERATURE=0.3
TOP_P=1.0
FREQUENCY_PENALTY=0.0
PRESENCE_PENALTY=0.0
```

### Scaling Considerations

- **Horizontal Scaling**: Deploy multiple API instances behind a load balancer
- **Connection Pooling**: Use connection pooling for database and API calls
- **Queue System**: Implement message queue for heavy processing tasks
- **CDN**: Use CDN for static knowledge base documents

### Monitoring

- **Application Monitoring**: Use Prometheus and Grafana
- **Log Aggregation**: Use ELK stack or CloudWatch
- **Error Tracking**: Use Sentry or similar
- **Performance Monitoring**: Use APM tools like New Relic or Datadog

## Future Enhancements

### Planned Features

- **Multi-language Support**: Support Arabic and French in addition to English
- **Voice Input/Output**: Integrate speech-to-text and text-to-speech
- **Image Analysis**: Analyze property images for Q&A
- **Personalization**: Learn from user preferences and history
- **Proactive Suggestions**: Suggest relevant information based on context
- **Integration with Property Data**: Answer questions about specific properties
- **Agent Handoff**: Seamless transfer to human agents when needed
- **Sentiment Analysis**: Detect user frustration and escalate appropriately

### Advanced RAG Techniques

- **Hybrid Search**: Combine semantic search with keyword search
- **Re-ranking**: Use cross-encoder for better relevance
- **Query Expansion**: Expand queries with synonyms and related terms
- **Multi-hop Reasoning**: Answer complex questions requiring multiple document lookups
- **Citations with Page Numbers**: Provide specific page references
