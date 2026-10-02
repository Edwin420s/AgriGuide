import pytest

def evaluate_parametric_drought_trigger(daily_moisture_pct: list[float], threshold_pct: float = 16.0, trigger_consecutive_days: int = 5) -> dict:
    """Evaluates whether consecutive soil moisture deficit satisfies parametric drought index insurance payout."""
    max_consecutive = 0
    current_consecutive = 0
    for m in daily_moisture_pct:
        if m <= threshold_pct:
            current_consecutive += 1
            if current_consecutive > max_consecutive:
                max_consecutive = current_consecutive
        else:
            current_consecutive = 0
            
    is_triggered = max_consecutive >= trigger_consecutive_days
    return {
        "payout_triggered": is_triggered,
        "max_consecutive_deficit_days": max_consecutive,
        "trigger_threshold_days": trigger_consecutive_days,
        "payout_percentage": 100.0 if is_triggered else 0.0
    }

def test_parametric_insurance_payout_trigger():
    """Verify that 6 consecutive days under 16% soil moisture triggers drought payout."""
    moisture_history = [22.0, 20.0, 15.5, 14.8, 14.2, 13.9, 14.1, 15.0, 24.0]
    # Consecutive days <= 16%: [15.5, 14.8, 14.2, 13.9, 14.1, 15.0] = 6 days
    res = evaluate_parametric_drought_trigger(moisture_history, threshold_pct=16.0, trigger_consecutive_days=5)
    assert res["payout_triggered"] is True
    assert res["max_consecutive_deficit_days"] == 6
    assert res["payout_percentage"] == 100.0

def test_parametric_insurance_no_payout_if_rainfall_compensates():
    """Verify that intermittent rain prevents payout trigger when drought duration is broken."""
    moisture_history = [22.0, 15.0, 14.0, 21.0, 14.0, 15.0, 20.0]
    res = evaluate_parametric_drought_trigger(moisture_history, threshold_pct=16.0, trigger_consecutive_days=5)
    assert res["payout_triggered"] is False
    assert res["max_consecutive_deficit_days"] == 2
    assert res["payout_percentage"] == 0.0
