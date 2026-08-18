# PRJ01: Testing Report & Execution Log

| Field | Details |
| :--- | :--- |
| **Document Code** | `PRJ01_TestingReport_v1.0_2026-08-13` |
| **Test Framework** | Pytest 8.2.2 |
| **Python Version** | Python 3.11.9 |
| **Total Automated Tests** | 86 |
| **Pass Rate** | 100% (86 Passed, 0 Failed) |

---

## 1. Test Suite Summary

```
tests/test_api.py .................................── [ 35 Passed ]
tests/test_auth.py ........                          ── [  8 Passed ]
tests/test_llm_reasoning.py ............             ── [ 12 Passed ]
tests/test_lrs.py ......                             ── [  6 Passed ]
tests/test_rate_limit.py .........                   ── [  9 Passed ]
tests/test_recommender.py ..........                 ── [ 10 Passed ]
tests/test_resources.py ......                       ── [  6 Passed ]

============================== 86 passed in 4.12s ==============================
```

## 2. Key Test Cases

| Test ID | Test Target | Input / Scenario | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | `test_extract_skills_valid_resume` | Free-text resume string | Extracted skill list with confidence scores | **PASS** |
| **TC-02** | `test_gap_analysis_exact_match` | Identical user & target skills | Readiness score = 100% | **PASS** |
| **TC-03** | `test_auth_missing_header` | Request without Authorization header | HTTP 401 Unauthorized | **PASS** |
| **TC-04** | `test_auth_expired_jwt` | Request with expired JWT token | HTTP 401 Token Expired | **PASS** |
| **TC-05** | `test_admin_route_non_admin` | Request to `/admin/users` as `job_seeker` | HTTP 403 Forbidden | **PASS** |
| **TC-06** | `test_gemini_streaming_fallback` | Guidance stream request without API key | Graceful error string chunk in stream | **PASS** |
| **TC-07** | `test_lrs_statement_format` | `log_resume_upload_event()` call | Valid xAPI JSONL schema entry | **PASS** |
| **TC-08** | `test_rate_limit_exceeded` | Burst requests exceeding threshold | HTTP 429 Too Many Requests | **PASS** |
