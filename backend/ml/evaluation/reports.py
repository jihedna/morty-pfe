"""Report generation: model cards, training reports, data-readiness reports."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from ml.config import METADATA_DIR


def generate_model_card(
    model_name: str,
    purpose: str,
    target: str,
    training_data: dict,
    evaluation_data: dict,
    metrics: dict,
    limitations: list[str],
    prohibited_uses: list[str],
    fallback: str,
    retraining_recommendation: str,
    model_version: str,
    status: str = "technical_demo",
) -> str:
    """Generate a model card in Markdown."""
    return f"""# Model Card: {model_name}

## Purpose
{purpose}

## Target
{target}

## Status
{status}

## Model Version
{model_version}

## Training Data
- Rows: {training_data.get('rows', 'N/A')}
- Date range: {training_data.get('date_range', 'N/A')}
- Source: {training_data.get('source', 'N/A')}

## Evaluation Data
- Rows: {evaluation_data.get('rows', 'N/A')}
- Split: {evaluation_data.get('split', 'N/A')}

## Metrics
```json
{json.dumps(metrics, indent=2, default=str)}
```

## Limitations
{chr(10).join(f'- {l}' for l in limitations)}

## Prohibited Uses
{chr(10).join(f'- {p}' for p in prohibited_uses)}

## Fallback
{fallback}

## Retraining Recommendation
{retraining_recommendation}

## Generated At
{datetime.now(timezone.utc).isoformat()}
"""


def generate_training_report(
    model_name: str,
    status: str,
    row_counts: dict,
    split_sizes: dict | None = None,
    class_distribution: dict | None = None,
    metrics: dict | None = None,
    artifact_paths: dict | None = None,
    failure_reason: str | None = None,
) -> str:
    """Generate a training report in Markdown."""
    lines = [f"# Training Report: {model_name}", ""]
    lines.append(f"**Status:** {status}")
    lines.append(f"**Timestamp:** {datetime.now(timezone.utc).isoformat()}")
    lines.append("")

    lines.append("## Row Counts")
    for k, v in row_counts.items():
        lines.append(f"- {k}: {v}")
    lines.append("")

    if split_sizes:
        lines.append("## Split Sizes")
        for k, v in split_sizes.items():
            lines.append(f"- {k}: {v}")
        lines.append("")

    if class_distribution:
        lines.append("## Class Distribution")
        for k, v in class_distribution.items():
            lines.append(f"- {k}: {v}")
        lines.append("")

    if metrics:
        lines.append("## Metrics")
        lines.append(f"```json\n{json.dumps(metrics, indent=2, default=str)}\n```")
        lines.append("")

    if artifact_paths:
        lines.append("## Artifact Paths")
        for k, v in artifact_paths.items():
            lines.append(f"- {k}: {v}")
        lines.append("")

    if failure_reason:
        lines.append(f"## Failure Reason\n{failure_reason}")
        lines.append("")

    return "\n".join(lines)


def save_report(content: str, filename: str) -> Path:
    """Save a report to the metadata directory."""
    path = METADATA_DIR / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path


def save_data_readiness(report: dict, filename: str = "data_readiness.json") -> Path:
    """Save data-readiness report as JSON."""
    path = METADATA_DIR / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)
    return path
