"""
studyops Agent Tool & Orchestrator Test Suite
=============================================
Tests all 5 canonical student request scenarios through the real backend.
Usage: python test_agent.py
"""
import json
import sys
import requests
from datetime import datetime

BASE_URL = "http://localhost:8001/api"

OK = "[PASS]"
FAIL = "[FAIL]"
INFO = "  >>"

def separator(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def test_health():
    separator("HEALTH CHECK")
    r = requests.get(f"{BASE_URL}/health", timeout=5)
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    data = r.json()
    assert data.get("ok") or data.get("status"), f"Unexpected health response: {data}"
    print(f"{OK} Backend is healthy")
    return True

def test_seed():
    separator("SEED DATABASE")
    r = requests.post(f"{BASE_URL}/seed", timeout=15)
    assert r.status_code in (200, 201), f"Seed failed: {r.status_code} - {r.text}"
    print(f"{OK} Database seeded successfully")
    return True

def test_get_subjects():
    separator("SUBJECTS API")
    r = requests.get(f"{BASE_URL}/subjects", timeout=5)
    assert r.status_code == 200, f"Subjects failed: {r.status_code}"
    subjects = r.json()
    assert len(subjects) > 0, "No subjects found"
    print(f"{OK} Found {len(subjects)} subjects: {[s['code'] for s in subjects]}")
    return subjects

def test_get_tasks():
    separator("TASKS API")
    r = requests.get(f"{BASE_URL}/tasks", timeout=5)
    assert r.status_code == 200, f"Tasks failed: {r.status_code}"
    tasks = r.json()
    print(f"{OK} Found {len(tasks)} tasks")
    if tasks:
        t = tasks[0]
        print(f"  {INFO} Sample: [{t.get('course_code', '?')}] {t['title'][:50]} | Priority: {t['priority']} | Due: {t.get('deadline', '?')[:10]}")
    return tasks

def test_dashboard_stats():
    separator("DASHBOARD STATS API")
    r = requests.get(f"{BASE_URL}/dashboard/stats", timeout=5)
    assert r.status_code == 200, f"Stats failed: {r.status_code}"
    stats = r.json()
    print(f"{OK} Dashboard stats retrieved:")
    for k, v in stats.items():
        print(f"   {k}: {v}")
    return stats

def test_calendar_events():
    separator("CALENDAR EVENTS API")
    r = requests.get(f"{BASE_URL}/calendar/events", timeout=5)
    assert r.status_code == 200, f"Calendar failed: {r.status_code}"
    events = r.json()
    print(f"{OK} Found {len(events)} calendar events")
    return events

def test_tool_registry():
    separator("TOOL REGISTRY API")
    r = requests.get(f"{BASE_URL}/agent/tools", timeout=5)
    assert r.status_code == 200, f"Tools registry failed: {r.status_code}"
    data = r.json()
    tools = data.get("tools", [])
    print(f"{OK} Registered tools ({len(tools)}):")
    for t in tools:
        name = t.get("name", t) if isinstance(t, dict) else t
        print(f"   {INFO} {name}")
    return tools

def test_agent_run(prompt: str, expected_intent: str = None, expect_approval: bool = False):
    print(f"\n{INFO} Prompt: \"{prompt}\"")
    r = requests.post(
        f"{BASE_URL}/agent/run",
        json={"user_request": prompt},
        timeout=15
    )
    assert r.status_code == 200, f"Agent run failed: {r.status_code} - {r.text}"
    result = r.json()

    print(f"   Intent:  {result['intent']}")
    print(f"   Status:  {result['status']}")
    print(f"   Tools:   {', '.join(result.get('tools_used', []))}")
    print(f"   Actions: {len(result.get('observable_actions', []))} steps")
    print(f"   Response: {result['final_response'][:120]}...")
    print(f"   Duration: {result['duration_ms']}ms")

    assert result["final_response"], "Agent returned empty response"
    assert result["status"] in ("completed", "pending_approval", "failed")

    if expected_intent:
        assert result["intent"] == expected_intent, f"Expected intent '{expected_intent}', got '{result['intent']}'"

    if expect_approval:
        assert result["status"] == "pending_approval", f"Expected pending_approval status, got '{result['status']}'"
        assert result.get("approval_required") is not None, "Expected approval_required in response"
        print(f"   {OK} Human approval request created (ID: {result['approval_required'].get('approval_id')})")

    print(f"   {OK} Agent run completed successfully")
    return result

def test_agent_scenarios():
    separator("AI AGENT ORCHESTRATOR - 5 CORE SCENARIOS")
    scenarios = [
        {
            "prompt": "Add my DAA assignment due Friday. It will take 3 hours.",
            "intent": "create_assignment_and_schedule",
            "expect_approval": False,
        },
        {
            "prompt": "Find me two hours tomorrow to work on DAA.",
            "intent": "find_free_time",
            "expect_approval": False,
        },
        {
            "prompt": "Organize my week around my deadlines.",
            "intent": "organize_week",
            "expect_approval": False,
        },
        {
            "prompt": "I cannot finish my DBMS assignment today. Rearrange my schedule.",
            "intent": "rearrange_schedule",
            "expect_approval": True,
        },
        {
            "prompt": "What should I work on right now?",
            "intent": "get_priority_advice",
            "expect_approval": False,
        },
    ]
    
    results = []
    for s in scenarios:
        try:
            r = test_agent_run(
                s["prompt"],
                expected_intent=s["intent"],
                expect_approval=s["expect_approval"]
            )
            results.append(True)
        except AssertionError as e:
            print(f"   {FAIL} ASSERTION FAILED: {e}")
            results.append(False)
        except Exception as e:
            print(f"   {FAIL} ERROR: {e}")
            results.append(False)
    
    return results

def test_agent_activities():
    separator("AGENT ACTIVITY LOG API")
    r = requests.get(f"{BASE_URL}/agent/activity", timeout=5)
    assert r.status_code == 200, f"Agent activity failed: {r.status_code}"
    activities = r.json()
    print(f"{OK} Found {len(activities)} agent activity records")
    if activities:
        a = activities[0]
        print(f"  {INFO} Latest: [{a['run_id']}] {a['intent']} | {a['status']} | {a['duration_ms']}ms")
    return activities

def test_approvals():
    separator("HUMAN APPROVALS API")
    r = requests.get(f"{BASE_URL}/agent/approvals", timeout=5)
    assert r.status_code == 200, f"Approvals failed: {r.status_code}"
    approvals = r.json()
    pending = [a for a in approvals if a['status'] == 'pending']
    print(f"{OK} Found {len(approvals)} total approvals ({len(pending)} pending)")
    return approvals


if __name__ == "__main__":
    print("\n" + "="*60)
    print("  studyops — Agent & Tool Test Suite")
    print("  Running against:", BASE_URL)
    print("="*60)

    all_passed = []

    try:
        all_passed.append(test_health())
        all_passed.append(test_seed())
        test_get_subjects()
        test_get_tasks()
        test_dashboard_stats()
        test_calendar_events()
        test_tool_registry()
        
        scenario_results = test_agent_scenarios()
        all_passed.extend(scenario_results)
        
        test_agent_activities()
        test_approvals()

    except Exception as e:
        print(f"\n{FAIL} FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    separator("FINAL RESULTS")
    total = len(all_passed)
    passed = sum(1 for x in all_passed if x)
    failed = total - passed

    print(f"Tests Passed: {passed}/{total}")
    if failed:
        print(f"{FAIL} {failed} test(s) FAILED")
        sys.exit(1)
    else:
        print(f"{OK} ALL TESTS PASSED!")
        sys.exit(0)
