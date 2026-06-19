# Agent Matching Algorithm Design

## Overview

The agent matching algorithm uses a weighted rule-based recommendation system to calculate compatibility scores between clients and agents. The system evaluates multiple factors including location expertise, property type specialization, budget experience, availability, and performance metrics to recommend the most suitable agents for each client's requirements.

## Algorithm Architecture

### High-Level Flow

```
Client Requirements → Factor Calculation → Weight Application → Score Aggregation → Ranking → Recommendation
```

### Components

1. **Input Processing**: Parse and validate client requirements
2. **Factor Calculation**: Calculate individual factor scores
3. **Weight Application**: Apply weights to factor scores
4. **Score Aggregation**: Combine weighted scores into final compatibility score
5. **Ranking**: Sort agents by compatibility score
6. **Recommendation**: Generate top N recommendations with explanations

## Compatibility Factors

### 1. Location Match (Weight: 30%)

Measures how well the agent's service regions match the client's preferred locations.

**Calculation:**
```python
def calculate_location_match(client_locations: list[str], agent_regions: list[str]) -> float:
    """
    Calculate location match score (0-100).
    
    Args:
        client_locations: List of client's preferred locations
        agent_regions: List of agent's service regions
    
    Returns:
        Location match score (0-100)
    """
    if not client_locations or not agent_regions:
        return 0.0
    
    # Count matching locations
    matches = len(set(client_locations) & set(agent_regions))
    
    # Calculate score based on percentage of client locations covered
    score = (matches / len(client_locations)) * 100
    
    return min(score, 100.0)
```

**Example:**
- Client locations: ["Tunis", "La Marsa", "Carthage"]
- Agent regions: ["Tunis", "La Marsa", "Ariana"]
- Matches: 2 out of 3
- Score: (2/3) * 100 = 66.67

---

### 2. Property Type Match (Weight: 25%)

Measures how well the agent's expertise matches the client's preferred property type.

**Calculation:**
```python
def calculate_property_type_match(client_property_type: str, agent_expertise: list[str]) -> float:
    """
    Calculate property type match score (0-100).
    
    Args:
        client_property_type: Client's preferred property type
        agent_expertise: List of agent's expertise areas
    
    Returns:
        Property type match score (0-100)
    """
    if not client_property_type or not agent_expertise:
        return 0.0
    
    # Check if property type is in expertise
    if client_property_type.lower() in [exp.lower() for exp in agent_expertise]:
        return 100.0
    
    # Check for related expertise (partial match)
    property_type_mapping = {
        'apartment': ['apartments', 'residential', 'housing'],
        'villa': ['villas', 'luxury', 'residential'],
        'land': ['land', 'plots', 'development'],
        'commercial': ['commercial', 'office', 'retail']
    }
    
    related_terms = property_type_mapping.get(client_property_type.lower(), [])
    for term in related_terms:
        if term in [exp.lower() for exp in agent_expertise]:
            return 50.0  # Partial match
    
    return 0.0  # No match
```

**Example:**
- Client property type: "apartment"
- Agent expertise: ["apartments", "luxury", "commercial"]
- Score: 100.0 (exact match)

---

### 3. Budget Experience Match (Weight: 20%)

Measures how well the agent's experience aligns with the client's budget range.

**Calculation:**
```python
def calculate_budget_match(client_min_budget: float, client_max_budget: float, 
                          agent_performance: dict) -> float:
    """
    Calculate budget experience match score (0-100).
    
    Args:
        client_min_budget: Client's minimum budget
        client_max_budget: Client's maximum budget
        agent_performance: Agent's performance metrics including budget history
    
    Returns:
        Budget match score (0-100)
    """
    if not agent_performance or 'avg_deal_value' not in agent_performance:
        return 50.0  # Neutral score if no data
    
    agent_avg_deal = agent_performance['avg_deal_value']
    client_budget_midpoint = (client_min_budget + client_max_budget) / 2
    
    # Calculate percentage difference
    if client_budget_midpoint == 0:
        return 50.0
    
    difference = abs(agent_avg_deal - client_budget_midpoint) / client_budget_midpoint
    
    # Convert difference to score (closer = higher score)
    if difference <= 0.2:  # Within 20%
        return 100.0
    elif difference <= 0.4:  # Within 40%
        return 75.0
    elif difference <= 0.6:  # Within 60%
        return 50.0
    elif difference <= 0.8:  # Within 80%
        return 25.0
    else:
        return 0.0
```

**Example:**
- Client budget: 150,000 - 300,000 (midpoint: 225,000)
- Agent average deal: 200,000
- Difference: |200,000 - 225,000| / 225,000 = 0.111 (11.1%)
- Score: 100.0 (within 20%)

---

### 4. Availability Score (Weight: 15%)

Measures the agent's current availability status.

**Calculation:**
```python
def calculate_availability_score(agent_availability: str, agent_workload: dict) -> float:
    """
    Calculate availability score (0-100).
    
    Args:
        agent_availability: Agent's availability status
        agent_workload: Agent's current workload metrics
    
    Returns:
        Availability score (0-100)
    """
    # Base score from availability status
    availability_scores = {
        'available': 100.0,
        'busy': 50.0,
        'unavailable': 0.0
    }
    
    base_score = availability_scores.get(agent_availability, 50.0)
    
    # Adjust based on workload
    if agent_workload and 'active_leads' in agent_workload:
        active_leads = agent_workload['active_leads']
        
        # Reduce score if too many active leads
        if active_leads > 20:
            base_score *= 0.5
        elif active_leads > 15:
            base_score *= 0.7
        elif active_leads > 10:
            base_score *= 0.9
    
    return base_score
```

**Example:**
- Agent availability: "available"
- Active leads: 8
- Score: 100.0 * 0.9 = 90.0

---

### 5. Performance Score (Weight: 10%)

Measures the agent's overall performance metrics.

**Calculation:**
```python
def calculate_performance_score(agent_performance: dict) -> float:
    """
    Calculate performance score (0-100).
    
    Args:
        agent_performance: Agent's performance metrics
    
    Returns:
        Performance score (0-100)
    """
    if not agent_performance:
        return 50.0  # Neutral score
    
    scores = []
    
    # Conversion rate (weight: 40%)
    if 'conversion_rate' in agent_performance:
        conversion_rate = agent_performance['conversion_rate']
        conversion_score = min(conversion_rate * 100, 100.0)
        scores.append(conversion_score * 0.4)
    
    # Response time (weight: 30%)
    if 'avg_response_time_hours' in agent_performance:
        response_time = agent_performance['avg_response_time_hours']
        # Faster response = higher score
        if response_time <= 2:
            response_score = 100.0
        elif response_time <= 4:
            response_score = 75.0
        elif response_time <= 8:
            response_score = 50.0
        elif response_time <= 24:
            response_score = 25.0
        else:
            response_score = 0.0
        scores.append(response_score * 0.3)
    
    # Client rating (weight: 30%)
    if 'rating_avg' in agent_performance:
        rating = agent_performance['rating_avg']
        rating_score = (rating / 5.0) * 100
        scores.append(rating_score * 0.3)
    
    # If no metrics available, return neutral score
    if not scores:
        return 50.0
    
    return sum(scores)
```

**Example:**
- Conversion rate: 0.75 (75%)
- Response time: 2.5 hours
- Rating: 4.5/5.0
- Scores: (75 * 0.4) + (75 * 0.3) + (90 * 0.3) = 30 + 22.5 + 27 = 79.5

---

## Compatibility Score Calculation

### Weighted Score Aggregation

```python
def calculate_compatibility_score(client_requirements: dict, agent_profile: dict) -> dict:
    """
    Calculate overall compatibility score between client and agent.
    
    Args:
        client_requirements: Client's property requirements
        agent_profile: Agent's profile and performance data
    
    Returns:
        Dictionary with compatibility score and factor breakdown
    """
    # Calculate individual factor scores
    location_score = calculate_location_match(
        client_requirements.get('locations', []),
        agent_profile.get('service_regions', [])
    )
    
    property_type_score = calculate_property_type_match(
        client_requirements.get('property_type', ''),
        agent_profile.get('expertise_areas', [])
    )
    
    budget_score = calculate_budget_match(
        client_requirements.get('min_budget', 0),
        client_requirements.get('max_budget', 0),
        agent_profile.get('performance_metrics', {})
    )
    
    availability_score = calculate_availability_score(
        agent_profile.get('availability', 'available'),
        agent_profile.get('workload', {})
    )
    
    performance_score = calculate_performance_score(
        agent_profile.get('performance_metrics', {})
    )
    
    # Apply weights
    weights = {
        'location': 0.30,
        'property_type': 0.25,
        'budget': 0.20,
        'availability': 0.15,
        'performance': 0.10
    }
    
    weighted_score = (
        location_score * weights['location'] +
        property_type_score * weights['property_type'] +
        budget_score * weights['budget'] +
        availability_score * weights['availability'] +
        performance_score * weights['performance']
    )
    
    # Round to 2 decimal places
    final_score = round(weighted_score, 2)
    
    return {
        'compatibility_score': final_score,
        'factors': {
            'location_match': round(location_score, 2),
            'property_type_match': round(property_type_score, 2),
            'budget_match': round(budget_score, 2),
            'availability': round(availability_score, 2),
            'performance': round(performance_score, 2)
        },
        'weights': weights
    }
```

### Example Calculation

**Client Requirements:**
- Locations: ["Tunis", "La Marsa"]
- Property type: "apartment"
- Budget: 150,000 - 300,000

**Agent Profile:**
- Service regions: ["Tunis", "La Marsa", "Carthage"]
- Expertise areas: ["apartments", "luxury"]
- Availability: "available"
- Active leads: 5
- Performance metrics:
  - Conversion rate: 0.70
  - Average response time: 3 hours
  - Rating: 4.2/5.0
  - Average deal value: 200,000

**Factor Scores:**
- Location match: 100.0 (2/2 locations match)
- Property type match: 100.0 (exact match)
- Budget match: 100.0 (within 20% of client budget)
- Availability: 100.0 (available, low workload)
- Performance: 76.5 (calculated from metrics)

**Weighted Score:**
- Location: 100.0 * 0.30 = 30.0
- Property type: 100.0 * 0.25 = 25.0
- Budget: 100.0 * 0.20 = 20.0
- Availability: 100.0 * 0.15 = 15.0
- Performance: 76.5 * 0.10 = 7.65

**Final Score:** 30.0 + 25.0 + 20.0 + 15.0 + 7.65 = 97.65

---

## Recommendation Generation

### Ranking and Selection

```python
def generate_recommendations(client_requirements: dict, all_agents: list[dict], 
                           top_n: int = 3) -> list[dict]:
    """
    Generate top N agent recommendations for a client.
    
    Args:
        client_requirements: Client's property requirements
        all_agents: List of all available agents
        top_n: Number of top recommendations to return
    
    Returns:
        List of recommended agents with scores and explanations
    """
    # Filter available agents
    available_agents = [
        agent for agent in all_agents 
        if agent.get('availability') != 'unavailable'
    ]
    
    if not available_agents:
        return []
    
    # Calculate compatibility scores for all agents
    scored_agents = []
    for agent in available_agents:
        score_result = calculate_compatibility_score(client_requirements, agent)
        scored_agents.append({
            'agent_id': agent['id'],
            'agent_name': agent['full_name'],
            'agency_name': agent.get('agency_name', ''),
            'compatibility_score': score_result['compatibility_score'],
            'factors': score_result['factors'],
            'explanation': generate_explanation(score_result, client_requirements, agent)
        })
    
    # Sort by compatibility score (descending)
    scored_agents.sort(key=lambda x: x['compatibility_score'], reverse=True)
    
    # Return top N recommendations
    return scored_agents[:top_n]
```

### Explanation Generation

```python
def generate_explanation(score_result: dict, client_requirements: dict, 
                        agent_profile: dict) -> str:
    """
    Generate human-readable explanation for the recommendation.
    
    Args:
        score_result: Compatibility score result
        client_requirements: Client's requirements
        agent_profile: Agent's profile
    
    Returns:
        Explanation string
    """
    factors = score_result['factors']
    explanations = []
    
    # Location explanation
    if factors['location_match'] >= 80:
        explanations.append(
            f"Agent specializes in {', '.join(agent_profile.get('service_regions', [])[:3])}, "
            f"which matches your preferred locations ({', '.join(client_requirements.get('locations', [])[:2])})"
        )
    elif factors['location_match'] >= 50:
        explanations.append(
            f"Agent covers some of your preferred locations"
        )
    
    # Property type explanation
    if factors['property_type_match'] == 100:
        explanations.append(
            f"Agent has expertise in {client_requirements.get('property_type', '')} properties"
        )
    
    # Budget explanation
    if factors['budget_match'] >= 80:
        explanations.append(
            f"Agent has experience with properties in your budget range"
        )
    
    # Performance explanation
    if factors['performance'] >= 70:
        explanations.append(
            f"Agent has strong performance metrics with a "
            f"{agent_profile.get('performance_metrics', {}).get('conversion_rate', 0)*100:.0f}% conversion rate"
        )
    
    # Availability explanation
    if factors['availability'] == 100:
        explanations.append("Agent is currently available")
    
    # Combine explanations
    if explanations:
        return ". ".join(explanations) + "."
    else:
        return "Agent matches your requirements based on overall profile fit."
```

**Example Explanation:**
"Agent specializes in Tunis, La Marsa, which matches your preferred locations (Tunis, La Marsa). Agent has expertise in apartment properties. Agent has experience with properties in your budget range. Agent has strong performance metrics with a 70% conversion rate. Agent is currently available."

---

## Algorithm Configuration

### Weights Configuration

Weights can be adjusted based on business priorities:

```python
DEFAULT_WEIGHTS = {
    'location': 0.30,
    'property_type': 0.25,
    'budget': 0.20,
    'availability': 0.15,
    'performance': 0.10
}

# Alternative configurations
LOCATION_FOCUSED_WEIGHTS = {
    'location': 0.40,
    'property_type': 0.20,
    'budget': 0.15,
    'availability': 0.15,
    'performance': 0.10
}

PERFORMANCE_FOCUSED_WEIGHTS = {
    'location': 0.20,
    'property_type': 0.20,
    'budget': 0.15,
    'availability': 0.15,
    'performance': 0.30
}
```

### Thresholds

Minimum scores for recommendation:

```python
MINIMUM_COMPATIBILITY_SCORE = 50.0  # Agents below this score won't be recommended
MINIMUM_AGENT_COUNT = 3  # Minimum number of recommendations to return
```

---

## Algorithm Testing

### Unit Tests

```python
import pytest

def test_location_match():
    # Perfect match
    assert calculate_location_match(["Tunis", "La Marsa"], ["Tunis", "La Marsa", "Carthage"]) == 100.0
    
    # Partial match
    assert calculate_location_match(["Tunis", "La Marsa", "Carthage"], ["Tunis", "Ariana"]) == 33.33
    
    # No match
    assert calculate_location_match(["Tunis"], ["Ariana", "La Soukra"]) == 0.0

def test_property_type_match():
    # Exact match
    assert calculate_property_type_match("apartment", ["apartments", "luxury"]) == 100.0
    
    # Partial match
    assert calculate_property_type_match("apartment", ["residential", "commercial"]) == 50.0
    
    # No match
    assert calculate_property_type_match("apartment", ["commercial", "land"]) == 0.0

def test_budget_match():
    # Perfect match
    assert calculate_budget_match(150000, 300000, {'avg_deal_value': 225000}) == 100.0
    
    # Close match
    assert calculate_budget_match(150000, 300000, {'avg_deal_value': 200000}) == 100.0
    
    # No match
    assert calculate_budget_match(150000, 300000, {'avg_deal_value': 500000}) == 0.0

def test_compatibility_score():
    client_reqs = {
        'locations': ['Tunis', 'La Marsa'],
        'property_type': 'apartment',
        'min_budget': 150000,
        'max_budget': 300000
    }
    
    agent_profile = {
        'service_regions': ['Tunis', 'La Marsa'],
        'expertise_areas': ['apartments'],
        'availability': 'available',
        'workload': {'active_leads': 5},
        'performance_metrics': {
            'conversion_rate': 0.70,
            'avg_response_time_hours': 3,
            'rating_avg': 4.2,
            'avg_deal_value': 200000
        }
    }
    
    result = calculate_compatibility_score(client_reqs, agent_profile)
    assert result['compatibility_score'] >= 0
    assert result['compatibility_score'] <= 100
    assert 'factors' in result
    assert 'weights' in result
```

### Integration Tests

```python
def test_recommendation_generation():
    client_reqs = {
        'locations': ['Tunis', 'La Marsa'],
        'property_type': 'apartment',
        'min_budget': 150000,
        'max_budget': 300000
    }
    
    agents = [
        {
            'id': '1',
            'full_name': 'Agent One',
            'agency_name': 'RE/MAX Smile',
            'service_regions': ['Tunis', 'La Marsa'],
            'expertise_areas': ['apartments'],
            'availability': 'available',
            'workload': {'active_leads': 5},
            'performance_metrics': {
                'conversion_rate': 0.70,
                'avg_response_time_hours': 3,
                'rating_avg': 4.2,
                'avg_deal_value': 200000
            }
        },
        {
            'id': '2',
            'full_name': 'Agent Two',
            'agency_name': 'RE/MAX Smile',
            'service_regions': ['Ariana'],
            'expertise_areas': ['commercial'],
            'availability': 'available',
            'workload': {'active_leads': 10},
            'performance_metrics': {
                'conversion_rate': 0.60,
                'avg_response_time_hours': 5,
                'rating_avg': 4.0,
                'avg_deal_value': 300000
            }
        }
    ]
    
    recommendations = generate_recommendations(client_reqs, agents, top_n=2)
    
    assert len(recommendations) == 2
    assert recommendations[0]['compatibility_score'] >= recommendations[1]['compatibility_score']
    assert all('explanation' in rec for rec in recommendations)
```

---

## Performance Optimization

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_location_match(locations_tuple: tuple, regions_tuple: tuple) -> float:
    return calculate_location_match(list(locations_tuple), list(regions_tuple))
```

### Batch Processing

```python
def batch_calculate_scores(client_requirements: dict, agents: list[dict]) -> list[dict]:
    """Calculate scores for multiple agents efficiently."""
    return [calculate_compatibility_score(client_requirements, agent) for agent in agents]
```

### Database Optimization

```sql
-- Index for agent availability
CREATE INDEX idx_agent_profiles_availability ON agent_profiles(availability);

-- Index for service regions (JSONB)
CREATE INDEX idx_agent_profiles_regions ON agent_profiles USING GIN(service_regions);

-- Index for performance metrics
CREATE INDEX idx_agent_profiles_performance ON agent_profiles USING GIN(performance_metrics);
```

---

## Monitoring and Analytics

### Metrics to Track

- **Average compatibility score**: Track overall match quality
- **Factor score distribution**: Understand which factors contribute most
- **Recommendation acceptance rate**: Track how often clients accept recommendations
- **Lead conversion by score**: Correlation between compatibility score and conversion
- **Agent performance vs. score**: Validate algorithm effectiveness

### A/B Testing

Test different weight configurations:

```python
def ab_test_recommendations(client_requirements: dict, agents: list[dict]):
    """Test different weight configurations."""
    # Group A: Default weights
    recommendations_a = generate_recommendations(
        client_requirements, agents, weights=DEFAULT_WEIGHTS
    )
    
    # Group B: Performance-focused weights
    recommendations_b = generate_recommendations(
        client_requirements, agents, weights=PERFORMANCE_FOCUSED_WEIGHTS
    )
    
    return {
        'group_a': recommendations_a,
        'group_b': recommendations_b
    }
```

---

## Future Enhancements

### Machine Learning Integration

- **Learn from historical data**: Use successful client-agent pairs to refine weights
- **Personalization**: Adapt recommendations based on individual client preferences
- **Dynamic weights**: Adjust weights based on market conditions
- **Feature engineering**: Add new factors based on data analysis

### Advanced Features

- **Multi-objective optimization**: Balance multiple objectives (fairness, efficiency, satisfaction)
- **Temporal factors**: Consider time-of-day and seasonal patterns
- **Social proof**: Incorporate client reviews and testimonials
- **Collaborative filtering**: "Clients like you also worked with..."
- **Geographic clustering**: Group agents by geographic proximity

### Real-time Updates

- **Live availability**: Real-time availability tracking
- **Dynamic workload**: Adjust recommendations based on current workload
- **Market conditions**: Adapt to changing market conditions
