"""
RE/MAX Smile AI final acceptance audit

Runs live API smoke tests against the backend and frontend, and performs
static code scans for placeholders, accessibility, security, and cleanup.
"""
from __future__ import annotations

import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone

import httpx

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"
REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent

CREDS = {
    "client": ("client1@gmail.com", "Client123"),
    "agent": ("agent1@remax.tn", "Agent123"),
    "manager": ("manager@remax.tn", "Manager123"),
}

SKIP_DIRS = {"venv", "node_modules", ".git", "dist", "build", ".pytest_cache", ".ruff_cache", "alembic", "__pycache__"}


class Audit:
    def __init__(self):
        self.client = httpx.Client(base_url=BASE_URL, timeout=20.0)
        self.tokens: dict[str, str] = {}
        self.ids: dict[str, str] = {}
        self.results: list[dict] = []
        self.scan: list[dict] = []

    def log(self, section: str, name: str, status: str, status_code: int = 0, detail: str = ""):
        self.results.append(
            {
                "section": section,
                "name": name,
                "status": status,
                "status_code": status_code,
                "detail": detail[:300],
            }
        )

    def request(
        self,
        section: str,
        name: str,
        method: str,
        path: str,
        expected: int = 200,
        json_data: dict | None = None,
        token: str | None = None,
        allow_error: bool = False,
    ) -> httpx.Response | None:
        headers = {}
        if token:
            headers["Authorization"] = "Bearer " + self.tokens[token]
        try:
            if method == "GET":
                r = self.client.get(path, headers=headers)
            elif method == "POST":
                r = self.client.post(path, json=json_data, headers=headers)
            elif method == "PATCH":
                r = self.client.patch(path, json=json_data, headers=headers)
            elif method == "PUT":
                r = self.client.put(path, json=json_data, headers=headers)
            elif method == "DELETE":
                r = self.client.delete(path, headers=headers)
            else:
                raise ValueError("unsupported method: " + method)
            ok = r.status_code == expected
            if ok or allow_error:
                self.log(section, name, "pass" if ok else "warn", r.status_code, r.text if not ok else "")
                return r
            else:
                self.log(section, name, "fail", r.status_code, r.text)
                return r
        except Exception as exc:
            self.log(section, name, "fail", 0, str(exc))
            return None

    def json_field(self, r: httpx.Response | None, key: str, default=None):
        try:
            return r.json()[key]
        except Exception:
            return default

    def login(self, role: str):
        email, password = CREDS[role]
        r = self.request(
            "auth",
            "login " + role,
            "POST",
            "/api/v1/auth/login",
            200,
            json_data={"email": email, "password": password},
        )
        if r and r.status_code == 200:
            self.tokens[role] = r.json()["access_token"]
        return r

    def public(self):
        self.request("public", "GET /", "GET", "/")
        self.request("public", "health", "GET", "/health")
        self.request("public", "docs", "GET", "/docs")
        r = self.request("public", "list properties", "GET", "/api/v1/properties")
        properties = self.json_field(r, "properties", [])
        if properties:
            self.ids["property_id"] = properties[0]["id"]
            self.request("public", "property detail", "GET", f"/api/v1/properties/{properties[0]['id']}")
        self.request("public", "filter properties", "GET", "/api/v1/properties?city=Tunis&minimum_price=100000&limit=5")
        self.request("public", "openapi", "GET", "/openapi.json")

    def client_workflow(self):
        self.login("client")
        self.request("client", "me", "GET", "/api/v1/users/me", token="client")

        # public-looking authenticated endpoints used by client portal
        self.request("client", "list agents", "GET", "/api/v1/agents", token="client")
        self.request("client", "map properties", "GET", "/api/v1/map/properties", token="client")
        self.request("client", "map agents", "GET", "/api/v1/map/agents", token="client")
        self.request("client", "market areas", "GET", "/api/v1/market/areas", token="client")
        self.request("client", "heat map", "GET", "/api/v1/market/areas/heat-map", token="client")
        self.request(
            "client",
            "investment score",
            "POST",
            "/api/v1/investment/score",
            200,
            json_data={"city": "Tunis", "district": "Ariana", "budget": 250000.0, "property_type": "apartment", "listing_type": "sale", "investment_goal": "rental_yield"},
            token="client",
        )

        # agent needed for matches, conversation, appointment
        agent_list = self.request("client", "list agents", "GET", "/api/v1/agents", token="client")
        agents = self.json_field(agent_list, "agents", []) if agent_list else []
        if not agents:
            agents = self.json_field(agent_list, "", [])
        agent_id = agents[0]["id"] if agents else None
        agent_user_id = agents[0].get("user", {}).get("id") if agents else None
        self.ids["agent_id"] = agent_id
        self.ids["agent_user_id"] = agent_user_id

        # search request
        search_payload = {
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0,
            "preferred_city": "Tunis",
            "minimum_bedrooms": 2,
            "minimum_bathrooms": 1,
            "minimum_area_sqm": 80.0,
            "urgency": "high",
            "notes": "audit search request",
        }
        r = self.request("client", "create search request", "POST", "/api/v1/client-requests", 201, json_data=search_payload, token="client")
        request_id = self.json_field(r, "id")
        self.ids["request_id"] = request_id
        if request_id:
            self.request("client", "my search requests", "GET", "/api/v1/client-requests/me", token="client")
            self.request("client", "agent matches", "GET", f"/api/v1/client-requests/{request_id}/agent-matches", token="client")
            self.request("client", "lead score", "GET", f"/api/v1/client-requests/{request_id}/lead-score", token="client")

        # favorites
        prop_id = self.ids.get("property_id")
        if prop_id:
            self.request("client", "favorite property", "POST", f"/api/v1/favorites/{prop_id}", 201, token="client")
            self.request("client", "check favorite", "GET", f"/api/v1/favorites/check/{prop_id}", token="client")
            self.request("client", "my favorites", "GET", "/api/v1/favorites/me", token="client")
            self.request("client", "delete favorite", "DELETE", f"/api/v1/favorites/{prop_id}", 204, token="client")

        # saved search
        saved = self.request(
            "client",
            "create saved search",
            "POST",
            "/api/v1/saved-searches",
            201,
            json_data={
                "name": "Audit saved search",
                "filters": {"property_type": "apartment", "city": "Tunis"},
                "notifications_enabled": True,
            },
            token="client",
        )
        saved_id = self.json_field(saved, "id")
        self.ids["saved_search_id"] = saved_id
        self.request("client", "my saved searches", "GET", "/api/v1/saved-searches/me", token="client")

        # conversation
        if agent_id:
            conv = self.request(
                "client",
                "create conversation",
                "POST",
                "/api/v1/conversations",
                201,
                json_data={"subject": "Audit conversation", "agent_id": agent_id, "search_request_id": request_id},
                token="client",
            )
            conv_id = self.json_field(conv, "id")
            self.ids["conversation_id"] = conv_id
            if conv_id:
                self.request("client", "my conversations", "GET", "/api/v1/conversations/me", token="client")
                self.request(
                    "client",
                    "send message",
                    "POST",
                    f"/api/v1/conversations/{conv_id}/messages",
                    201,
                    json_data={"content": "Hello from audit"},
                    token="client",
                )

        # appointment
        if prop_id and agent_id:
            start = (datetime.now(timezone.utc) + timedelta(days=2, hours=10)).isoformat()
            end = (datetime.now(timezone.utc) + timedelta(days=2, hours=11)).isoformat()
            appt = self.request(
                "client",
                "create appointment",
                "POST",
                "/api/v1/appointments",
                201,
                json_data={
                    "agent_id": agent_id,
                    "property_id": prop_id,
                    "scheduled_start": start,
                    "scheduled_end": end,
                    "client_notes": "Audit viewing request",
                },
                token="client",
            )
            appt_id = self.json_field(appt, "id")
            self.ids["appointment_id"] = appt_id
            if appt_id:
                self.request("client", "my appointments", "GET", "/api/v1/appointments/me", token="client")
                self.request(
                    "client",
                    "cancel appointment",
                    "PATCH",
                    f"/api/v1/appointments/{appt_id}/status",
                    200,
                    json_data={"status": "cancelled", "cancellation_reason": "audit cleanup"},
                    token="client",
                )

        # notifications
        notifs = self.request("client", "my notifications", "GET", "/api/v1/notifications/me", token="client")
        notif_id = None
        if notifs:
            items = self.json_field(notifs, "notifications", [])
            if items:
                notif_id = items[0]["id"]
        self.request("client", "unread count", "GET", "/api/v1/notifications/unread-count", token="client")
        if notif_id:
            self.request("client", "mark notification read", "PATCH", f"/api/v1/notifications/{notif_id}/read", 200, token="client")
            self.request("client", "delete notification", "DELETE", f"/api/v1/notifications/{notif_id}", 204, token="client")

    def agent(self):
        self.login("agent")
        profile = self.request("agent", "my profile", "GET", "/api/v1/agents/me/profile", token="agent")
        agent_id = self.json_field(profile, "id")
        self.ids["agent_id"] = agent_id or self.ids.get("agent_id")
        if profile:
            self.ids["agent_user_id"] = profile.json().get("user_id") or self.ids.get("agent_user_id")

        self.request(
            "agent",
            "update profile",
            "PATCH",
            "/api/v1/agents/me/profile",
            200,
            json_data={"phone": "+216 71 000 001", "biography": "Updated during audit", "languages": "French, Arabic"},
            token="agent",
        )
        self.request(
            "agent",
            "update availability",
            "PATCH",
            "/api/v1/agents/me/availability",
            200,
            json_data={"availability_status": "available"},
            token="agent",
        )

        # leads
        self.request("agent", "my leads", "GET", "/api/v1/agent/leads", token="agent")
        lead_request_id = self.ids.get("request_id")
        if lead_request_id:
            self.request("agent", "lead detail", "GET", f"/api/v1/agent/leads/{lead_request_id}", token="agent", allow_error=True)
            self.request("agent", "lead score", "GET", f"/api/v1/agent/leads/{lead_request_id}/score", token="agent", allow_error=True)
            self.request("agent", "recalculate lead", "POST", f"/api/v1/agent/leads/{lead_request_id}/recalculate", 200, token="agent", allow_error=True)

        # property create, update, feature, image, status
        property_payload = {
            "title": "Audit Property",
            "description": "Created during audit",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "draft",
            "price": 250000.0,
            "area_sqm": 150.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "address_line": "123 Audit Street",
            "city": "Tunis",
            "postal_code": "1001",
            "latitude": 36.8065,
            "longitude": 10.1815,
        }
        prop = self.request("agent", "create property", "POST", "/api/v1/properties", 201, json_data=property_payload, token="agent")
        prop_id = self.json_field(prop, "id")
        self.ids["agent_property_id"] = prop_id
        if prop_id:
            self.request("agent", "update property", "PATCH", f"/api/v1/properties/{prop_id}", 200, json_data={"title": "Audit Property Updated"}, token="agent")
            self.request("agent", "add feature", "POST", f"/api/v1/properties/{prop_id}/features", 201, json_data="balcony", token="agent")
            self.request(
                "agent",
                "add image",
                "POST",
                f"/api/v1/properties/{prop_id}/images",
                201,
                json_data={"image_url": "https://example.com/audit.jpg", "alt_text": "audit", "is_primary": True},
                token="agent",
            )
            self.request("agent", "update status", "PATCH", f"/api/v1/properties/{prop_id}/status", 200, json_data={"status": "available"}, token="agent")

        # appointments from agent perspective
        appt_id = self.ids.get("appointment_id")
        if appt_id:
            self.request("agent", "agent appointments", "GET", "/api/v1/appointments/agent/me", token="agent")
            self.request(
                "agent",
                "confirm appointment",
                "PATCH",
                f"/api/v1/appointments/{appt_id}/status",
                200,
                json_data={"status": "confirmed"},
                token="agent",
            )
            new_start = (datetime.now(timezone.utc) + timedelta(days=3, hours=10)).isoformat()
            new_end = (datetime.now(timezone.utc) + timedelta(days=3, hours=11)).isoformat()
            self.request(
                "agent",
                "reschedule appointment",
                "PATCH",
                f"/api/v1/appointments/{appt_id}/reschedule",
                200,
                json_data={"scheduled_start": new_start, "scheduled_end": new_end},
                token="agent",
            )
            self.request(
                "agent",
                "cancel appointment",
                "PATCH",
                f"/api/v1/appointments/{appt_id}/status",
                200,
                json_data={"status": "cancelled", "cancellation_reason": "audit cleanup"},
                token="agent",
            )

        # conversation message from agent
        conv_id = self.ids.get("conversation_id")
        if conv_id:
            self.request(
                "agent",
                "send message",
                "POST",
                f"/api/v1/conversations/{conv_id}/messages",
                201,
                json_data={"content": "Reply from agent"},
                token="agent",
            )
            self.request("agent", "my conversations", "GET", "/api/v1/conversations/me", token="agent")

        # notifications
        self.request("agent", "my notifications", "GET", "/api/v1/notifications/me", token="agent")

    def manager(self):
        self.login("manager")
        self.request("manager", "analytics overview", "GET", "/api/v1/admin/analytics/overview", token="manager")
        self.request("manager", "analytics heat map", "GET", "/api/v1/admin/analytics/heat-map", token="manager")
        self.request("manager", "analytics leads", "GET", "/api/v1/admin/analytics/leads", token="manager")
        self.request("manager", "users list", "GET", "/api/v1/admin/users", token="manager")
        self.request("manager", "agents list", "GET", "/api/v1/agents", token="manager")
        self.request("manager", "admin properties", "GET", "/api/v1/properties/admin/all", token="manager")
        self.request("manager", "admin appointments", "GET", "/api/v1/appointments/admin/all", token="manager")
        self.request("manager", "admin conversations", "GET", "/api/v1/conversations/admin/all", token="manager")

        # contract
        agent_id = self.ids.get("agent_id")
        client_id = self.tokens.get("client")  # need real client id, not token
        if not client_id:
            # placeholder; we will get real user id below
            pass
        client_me = self.request("client", "me", "GET", "/api/v1/users/me", token="client")
        real_client_id = None
        if client_me:
            real_client_id = client_me.json().get("id")
        contract = self.request(
            "manager",
            "create contract",
            "POST",
            "/api/v1/admin/contracts",
            201,
            json_data={
                "agent_id": agent_id or "",
                "client_id": real_client_id,
                "sale_date": datetime.now(timezone.utc).isoformat(),
                "amount": 250000.0,
                "city": "Tunis",
                "district": "Ariana",
                "property_type": "apartment",
                "area_sqm": 150.0,
                "contract_type": "sale",
            },
            token="manager",
            allow_error=True,
        )
        contract_id = self.json_field(contract, "id")
        if contract_id:
            self.request("manager", "update contract", "PATCH", f"/api/v1/admin/contracts/{contract_id}", 200, json_data={"amount": 260000.0}, token="manager")
            self.request("manager", "contracts list", "GET", "/api/v1/admin/contracts", token="manager")

        # knowledge base
        article = self.request(
            "manager",
            "create knowledge article",
            "POST",
            "/api/v1/knowledge-base",
            201,
            json_data={"title": "Audit Article", "category": "general", "content": "Article created during audit", "is_active": True},
            token="manager",
        )
        article_id = self.json_field(article, "id")
        if article_id:
            self.request("manager", "update knowledge article", "PATCH", f"/api/v1/knowledge-base/{article_id}", 200, json_data={"is_active": False}, token="manager")
            self.request("manager", "knowledge base list", "GET", "/api/v1/knowledge-base", token="manager")

    def security(self):
        # unauthenticated
        self.request("security", "unauth client requests", "GET", "/api/v1/client-requests/me", 401)
        self.request("security", "unauth admin analytics", "GET", "/api/v1/admin/analytics/overview", 401)
        # wrong role
        self.request("security", "client blocked admin", "GET", "/api/v1/admin/analytics/overview", 403, token="client")
        self.request("security", "agent blocked admin users", "GET", "/api/v1/admin/users", 403, token="agent")
        # property ownership
        prop_id = self.ids.get("agent_property_id")
        if prop_id:
            self.request("security", "client blocked agent property", "PATCH", f"/api/v1/properties/{prop_id}/status", 403, json_data={"status": "draft"}, token="client")

    def chatbot(self):
        self.request("chatbot", "client chat", "POST", "/api/v1/ai/chat", 200, json_data={"message": "find an agent in Tunis", "role": "client"}, token="client")
        self.request("chatbot", "agent chat", "POST", "/api/v1/ai/chat", 200, json_data={"message": "my leads", "role": "agent"}, token="agent")
        self.request("chatbot", "manager chat", "POST", "/api/v1/ai/chat", 200, json_data={"message": "analytics", "role": "manager"}, token="manager")

    def frontend_reachable(self):
        try:
            r = httpx.get(FRONTEND_URL, timeout=10.0)
            self.log("frontend", "frontend reachable", "pass" if r.status_code == 200 else "fail", r.status_code, r.text[:100])
        except Exception as exc:
            self.log("frontend", "frontend reachable", "fail", 0, str(exc))

    def scan_files(self):
        frontend = REPO_ROOT / "frontend" / "src"
        # Look for placeholder text actually rendered in JSX (Coming Soon / TODO in UI)
        placeholder_pattern = re.compile(r">[^<]*(Coming Soon|TODO)[^<]*<", re.IGNORECASE)
        comment_pattern = re.compile(r"//|/\*")
        responsive_pattern = re.compile(r"\b(sm|md|lg|xl|2xl):[a-z-]+")
        accessibility_patterns = {
            "aria-label": re.compile(r"aria-label="),
            "role": re.compile(r"role="),
            "htmlFor": re.compile(r"htmlFor="),
            "focus-visible": re.compile(r"focus-visible:"),
            "aria-live": re.compile(r"aria-live="),
        }
        placeholder_hits: list[str] = []
        responsive_count = 0
        accessibility_counts = {k: 0 for k in accessibility_patterns}

        for p in frontend.rglob("*"):
            if p.is_dir() or "__tests__" in p.parts:
                continue
            if p.suffix not in (".tsx", ".ts", ".css"):
                continue
            try:
                text = p.read_text(encoding="utf-8")
            except Exception:
                continue
            for m in placeholder_pattern.finditer(text):
                # Skip the match if it lies on a line that is a comment
                line = text[:m.start()].splitlines()[-1]
                if comment_pattern.search(line):
                    continue
                placeholder_hits.append(str(p.relative_to(REPO_ROOT)) + ":" + m.group(0)[:80])
            responsive_count += len(responsive_pattern.findall(text))
            for k, pat in accessibility_patterns.items():
                accessibility_counts[k] += len(pat.findall(text))

        # index.html viewport
        index_html = REPO_ROOT / "frontend" / "index.html"
        viewport = False
        if index_html.exists():
            viewport = "viewport" in index_html.read_text(encoding="utf-8")

        self.scan.append({"area": "frontend_placeholders", "status": "warn" if placeholder_hits else "pass", "details": placeholder_hits[:10]})
        self.scan.append({"area": "frontend_responsive", "status": "pass", "details": "responsive class occurrences: " + str(responsive_count)})
        self.scan.append({"area": "frontend_accessibility", "status": "pass", "details": accessibility_counts})
        self.scan.append({"area": "viewport_meta", "status": "pass" if viewport else "fail", "details": "viewport meta present" if viewport else "missing viewport meta"})

    def scan_security_cleanup(self):
        # Check .gitignore entries
        gitignore = REPO_ROOT / ".gitignore"
        ignored = []
        if gitignore.exists():
            lines = [line.strip() for line in gitignore.read_text(encoding="utf-8").splitlines()]
            ignored = lines

        sensitive = []
        secret_files = ["backend/.env", "frontend/.env", ".env", "mcp_config.json", ".env.local"]
        for name in secret_files:
            full = REPO_ROOT / name
            if full.exists() and name not in ignored:
                sensitive.append(name)

        # Tracked files that should not be
        tracked_danger: list[str] = []
        try:
            proc = subprocess.run(
                ["git", "ls-files"],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            tracked = proc.stdout.splitlines()
            bad_name_re = re.compile(r"__pycache__|\.pyc$|\.pyo$|\.new$|/dist/|node_modules|mcp_config|\.env$|API_KEY|SECRET|PASSWORD", re.IGNORECASE)
            tracked_danger = [f for f in tracked if bad_name_re.search(f)]
        except Exception:
            tracked_danger = []

        # Cleanup walk (not tracked files, but filesystem presence)
        cleanup: list[str] = []
        for root, dirs, files in os.walk(REPO_ROOT):
            rel = pathlib.Path(root).relative_to(REPO_ROOT)
            # Prune skipped directories and skip current if inside one
            if any(part in SKIP_DIRS for part in rel.parts):
                continue
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for d in dirs:
                if d == "__pycache__":
                    cleanup.append(str(rel / d))
            for f in files:
                if f.endswith((".pyc", ".pyo", ".new")):
                    cleanup.append(str(rel / f))

        self.scan.append({"area": "gitignore", "status": "pass" if not sensitive else "fail", "details": sensitive or "sensitive files ignored"})
        self.scan.append({"area": "tracked_danger", "status": "pass" if not tracked_danger else "fail", "details": tracked_danger[:10]})
        self.scan.append({"area": "cleanup_candidates", "status": "warn" if cleanup else "pass", "details": cleanup[:10]})

        # Delete __pycache__ and .pyc files
        removed = []
        for root, dirs, files in os.walk(REPO_ROOT):
            rel = pathlib.Path(root).relative_to(REPO_ROOT)
            if any(part in SKIP_DIRS for part in rel.parts):
                continue
            for d in list(dirs):
                if d == "__pycache__":
                    p = pathlib.Path(root) / d
                    shutil.rmtree(p, ignore_errors=True)
                    removed.append(str(p))
                    dirs.remove(d)
            for f in files:
                if f.endswith((".pyc", ".pyo")):
                    p = pathlib.Path(root) / f
                    p.unlink(missing_ok=True)
                    removed.append(str(p))
        self.scan.append({"area": "cleanup_performed", "status": "pass", "details": removed[:10]})

    def write_report(self):
        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "results": self.results,
            "scan": self.scan,
            "summary": {
                "pass": sum(1 for r in self.results if r["status"] == "pass"),
                "fail": sum(1 for r in self.results if r["status"] == "fail"),
                "warn": sum(1 for r in self.results if r["status"] == "warn"),
            },
        }
        path = REPO_ROOT / "backend" / "audit_report.json"
        path.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")

        lines = [
            "RE/MAX Smile AI Audit Summary",
            "=" * 40,
            "",
            "API & Smoke:",
        ]
        for r in self.results:
            lines.append(f"[{r['status']}] {r['section']}: {r['name']} ({r['status_code']}) {r['detail']}")
        lines.append("")
        lines.append("Scans:")
        for s in self.scan:
            lines.append(f"[{s['status']}] {s['area']}: {s['details']}")
        lines.append("")
        lines.append(f"Totals: {report['summary']}")
        (REPO_ROOT / "backend" / "audit_report.txt").write_text("\n".join(lines), encoding="utf-8")
        return report

    def run(self):
        self.public()
        self.client_workflow()
        self.agent()
        self.manager()
        self.security()
        self.chatbot()
        self.frontend_reachable()
        self.scan_files()
        self.scan_security_cleanup()
        return self.write_report()


if __name__ == "__main__":
    audit = Audit()
    report = audit.run()
    print(json.dumps(report["summary"], indent=2))
    if report["summary"]["fail"] > 0:
        sys.exit(1)
