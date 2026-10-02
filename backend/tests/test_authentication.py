import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_registration_and_login_flow():
    # 1. Register a new farmer with unique email
    reg_email = f"testfarmer_{uuid.uuid4().hex[:8]}@agriguide.test"
    payload = {
        "name": "Sarah Nyambura",
        "email": reg_email,
        "password": "SecurePassword123!",
        "farm_name": "Nyambura Organic Shamba",
        "location_name": "Eldoret",
        "initial_crop": "maize"
    }
    r_reg = client.post("/api/auth/register", json=payload)
    assert r_reg.status_code == 200
    data_reg = r_reg.json()
    assert "access_token" in data_reg
    assert data_reg["user"]["name"] == "Sarah Nyambura"
    assert data_reg["user"]["email"] == reg_email
    assert data_reg["farm_id"] is not None
    assert data_reg["field_id"] is not None

    token = data_reg["access_token"]

    # 2. Duplicate registration should be rejected
    r_dup = client.post("/api/auth/register", json=payload)
    assert r_dup.status_code == 400

    # 3. Login with correct password
    r_login = client.post("/api/auth/login", json={
        "email": reg_email,
        "password": "SecurePassword123!"
    })
    assert r_login.status_code == 200
    data_login = r_login.json()
    assert "access_token" in data_login
    assert data_login["user"]["email"] == reg_email

    # 4. Login with wrong password should fail
    r_fail = client.post("/api/auth/login", json={
        "email": reg_email,
        "password": "WrongPassword999!"
    })
    assert r_fail.status_code == 401

    # 5. Access /auth/me with bearer token
    r_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    data_me = r_me.json()
    assert data_me["user"]["name"] == "Sarah Nyambura"

def test_demo_login_flow():
    r_demo = client.post("/api/auth/demo-login")
    assert r_demo.status_code == 200
    data = r_demo.json()
    assert "access_token" in data
    assert "user" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "demo.farmer@agriguide.io"
    assert data["user"]["role"] == "FARMER"
    assert "Demo Farmer" in data["user"]["name"]

def test_admin_farmer_profiles_directory():
    # Edwin Admin Login
    r_admin_login = client.post("/api/auth/admin-login")
    assert r_admin_login.status_code == 200
    admin_token = r_admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin accesses /api/admin/farmers
    r_admin = client.get("/api/admin/farmers", headers=admin_headers)
    assert r_admin.status_code == 200
    farmers_list = r_admin.json()
    assert isinstance(farmers_list, list)
    assert len(farmers_list) >= 1

    # Non-admin user registration
    farmer_email = f"regular_{uuid.uuid4().hex[:8]}@agriguide.test"
    r_reg = client.post("/api/auth/register", json={
        "name": "Regular User",
        "email": farmer_email,
        "password": "Password123!",
        "farm_name": "Family Farm",
        "location_name": "Murang'a",
        "initial_crop": "banana"
    })
    regular_token = r_reg.json()["access_token"]
    regular_headers = {"Authorization": f"Bearer {regular_token}"}
    regular_field_id = r_reg.json()["field_id"]

    # Regular user is forbidden from /api/admin/farmers
    r_forbidden = client.get("/api/admin/farmers", headers=regular_headers)
    assert r_forbidden.status_code == 403

    # Edwin Admin CAN view regular user's field profile
    r_admin_view_field = client.get(f"/api/fields/{regular_field_id}", headers=admin_headers)
    assert r_admin_view_field.status_code == 200


def test_authenticated_user_farms_and_fields():
    reg_email = f"farmer_{uuid.uuid4().hex[:8]}@agriguide.test"
    r_reg = client.post("/api/auth/register", json={
        "name": "David Kiprono",
        "email": reg_email,
        "password": "Password123!",
        "farm_name": "Kiprono Rift Farm",
        "location_name": "Nakuru",
        "initial_crop": "potato"
    })
    assert r_reg.status_code == 200
    token = r_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch user's farms
    r_farms = client.get("/api/farms", headers=headers)
    assert r_farms.status_code == 200
    farms = r_farms.json()
    assert len(farms) >= 1
    assert any(f["name"] == "Kiprono Rift Farm" for f in farms)

    # Fetch user's fields
    r_fields = client.get("/api/fields", headers=headers)
    assert r_fields.status_code == 200
    fields = r_fields.json()
    assert len(fields) >= 1
    assert any("potato" in f["crop"].lower() for f in fields)

def test_multi_tenant_isolation_and_privacy():
    # Setup User A
    email_a = f"alice_{uuid.uuid4().hex[:8]}@agriguide.test"
    r_a = client.post("/api/auth/register", json={
        "name": "Alice Wambui",
        "email": email_a,
        "password": "Password123!",
        "farm_name": "Alice Green Shamba",
        "location_name": "Nyeri",
        "initial_crop": "coffee"
    })
    assert r_a.status_code == 200
    token_a = r_a.json()["access_token"]
    farm_a_id = r_a.json()["farm_id"]
    field_a_id = r_a.json()["field_id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Setup User B
    email_b = f"bob_{uuid.uuid4().hex[:8]}@agriguide.test"
    r_b = client.post("/api/auth/register", json={
        "name": "Bob Otieno",
        "email": email_b,
        "password": "Password123!",
        "farm_name": "Bob Lake Shamba",
        "location_name": "Kisumu",
        "initial_crop": "sugarcane"
    })
    assert r_b.status_code == 200
    token_b = r_b.json()["access_token"]
    farm_b_id = r_b.json()["farm_id"]
    field_b_id = r_b.json()["field_id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Farm listing isolation
    farms_a = client.get("/api/farms", headers=headers_a).json()
    assert all(f["name"] != "Bob Lake Shamba" for f in farms_a)
    assert any(f["name"] == "Alice Green Shamba" for f in farms_a)

    farms_b = client.get("/api/farms", headers=headers_b).json()
    assert all(f["name"] != "Alice Green Shamba" for f in farms_b)
    assert any(f["name"] == "Bob Lake Shamba" for f in farms_b)

    # 2. Field listing isolation
    fields_a = client.get("/api/fields", headers=headers_a).json()
    assert all(f["id"] != field_b_id for f in fields_a)
    assert any(f["id"] == field_a_id for f in fields_a)

    fields_b = client.get("/api/fields", headers=headers_b).json()
    assert all(f["id"] != field_a_id for f in fields_b)
    assert any(f["id"] == field_b_id for f in fields_b)

    # 3. Direct field access prohibition across tenants (User A -> User B's field)
    r_forbidden_field = client.get(f"/api/fields/{field_b_id}", headers=headers_a)
    assert r_forbidden_field.status_code == 403

    r_forbidden_state = client.get(f"/api/fields/{field_b_id}/state", headers=headers_a)
    assert r_forbidden_state.status_code == 403

    r_forbidden_decide = client.post(f"/api/fields/{field_b_id}/decide", headers=headers_a)
    assert r_forbidden_decide.status_code == 403

    # 4. User A attempting to create a field under User B's farm
    r_tamper_farm = client.post("/api/fields", headers=headers_a, json={
        "farm_id": farm_b_id,
        "name": "Unauthorized Intruder Plot",
        "crop": "corn",
        "crop_stage": "vegetative",
        "soil_type": "loam",
        "size_acres": 1.0,
        "emitter_rate_lph": 2.0
    })
    assert r_tamper_farm.status_code == 403

    # 5. Decision & audit trail isolation
    # Run a decision for User B
    r_decide_b = client.post(f"/api/fields/{field_b_id}/decide", headers=headers_b)
    assert r_decide_b.status_code == 200
    decision_b_id = r_decide_b.json()["decision_id"]

    # User B can view their own decision audit
    r_audit_b = client.get(f"/api/decisions/{decision_b_id}/audit", headers=headers_b)
    assert r_audit_b.status_code == 200

    # User A CANNOT view User B's decision audit or diff
    r_audit_a = client.get(f"/api/decisions/{decision_b_id}/audit", headers=headers_a)
    assert r_audit_a.status_code == 403

    r_diff_a = client.get(f"/api/decisions/{decision_b_id}/diff", headers=headers_a)
    assert r_diff_a.status_code == 403

def test_user_profile_and_password_change_flow():
    # 1. Register a fresh user
    user_email = f"farmer_{uuid.uuid4().hex[:8]}@agriguide.test"
    initial_pass = "InitialPass123!"
    r_reg = client.post("/api/auth/register", json={
        "name": "Kipchoge Keino",
        "email": user_email,
        "password": initial_pass,
        "farm_name": "Highland Tea Shamba",
        "location_name": "Kericho",
        "initial_crop": "tea"
    })
    assert r_reg.status_code == 200
    token = r_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. View own profile via /user/profile
    r_prof = client.get("/api/user/profile", headers=headers)
    assert r_prof.status_code == 200
    pdata = r_prof.json()
    assert pdata["user"]["name"] == "Kipchoge Keino"
    assert pdata["user"]["email"] == user_email
    assert pdata["stats"]["total_farms"] >= 1

    # 3. Update profile details (name and language)
    r_upd = client.put("/api/user/profile", headers=headers, json={
        "name": "Kipchoge Keino (Master Farmer)",
        "language": "sw"
    })
    assert r_upd.status_code == 200
    assert r_upd.json()["user"]["name"] == "Kipchoge Keino (Master Farmer)"
    assert r_upd.json()["user"]["language"] == "sw"

    # 4. Attempt password change with wrong current password (should fail 400)
    r_fail_pw = client.post("/api/user/change-password", headers=headers, json={
        "current_password": "WrongPassword999!",
        "new_password": "UpdatedPassword456!"
    })
    assert r_fail_pw.status_code == 400

    # 5. Successfully change password
    r_change_pw = client.post("/api/user/change-password", headers=headers, json={
        "current_password": initial_pass,
        "new_password": "UpdatedPassword456!"
    })
    assert r_change_pw.status_code == 200
    assert r_change_pw.json()["status"] == "ok"

    # 6. Verify old password no longer works for login
    r_old_login = client.post("/api/auth/login", json={
        "email": user_email,
        "password": initial_pass
    })
    assert r_old_login.status_code == 401

    # 7. Verify new password works for login
    r_new_login = client.post("/api/auth/login", json={
        "email": user_email,
        "password": "UpdatedPassword456!"
    })
    assert r_new_login.status_code == 200
    assert "access_token" in r_new_login.json()

def test_strict_unique_email_case_insensitive():
    unique_suffix = uuid.uuid4().hex[:8]
    base_email = f"farmer_{unique_suffix}@agri.ke"
    payload = {
        "name": "Jane Wanjiku",
        "email": base_email,
        "password": "SafePassword123!",
        "farm_name": "Wanjiku Farm",
        "location_name": "Nyeri",
        "initial_crop": "coffee"
    }
    r1 = client.post("/api/auth/register", json=payload)
    assert r1.status_code == 200

    # Attempt to re-register with exact same email
    r_exact = client.post("/api/auth/register", json=payload)
    assert r_exact.status_code == 400
    assert "already exists" in r_exact.json()["detail"]

    # Attempt with uppercase and whitespace variation
    payload_upper = dict(payload)
    payload_upper["email"] = f"  {base_email.upper()}  "
    r_upper = client.post("/api/auth/register", json=payload_upper)
    assert r_upper.status_code == 400
    assert "already exists" in r_upper.json()["detail"]

def test_crop_catalog_auto_registration_and_persistence():
    # 1. Inspect existing crop catalog
    r_crops = client.get("/api/crops")
    assert r_crops.status_code == 200
    catalog = r_crops.json()
    assert isinstance(catalog, list)
    assert len(catalog) >= 10
    crop_names = [c["name"].lower() for c in catalog]
    assert "maize" in crop_names
    assert "french beans" in crop_names

    # 2. Register user with brand new unlisted crop (e.g. "Macadamia")
    novel_crop = f"macadamia_{uuid.uuid4().hex[:4]}"
    user_email = f"nut_grower_{uuid.uuid4().hex[:6]}@agri.ke"
    r_reg = client.post("/api/auth/register", json={
        "name": "David Mutua",
        "email": user_email,
        "password": "NutPassword123!",
        "farm_name": "Mutua Orchards",
        "location_name": "Embu",
        "initial_crop": novel_crop
    })
    assert r_reg.status_code == 200
    assert r_reg.json()["field_id"] is not None

    # 3. Verify novel crop is now in the global crop catalog
    r_crops_after = client.get("/api/crops")
    assert r_crops_after.status_code == 200
    after_names = [c["name"].lower() for c in r_crops_after.json()]
    assert novel_crop in after_names

    # 4. Explicitly add a missing crop via POST /api/crops
    another_crop = f"passionfruit_{uuid.uuid4().hex[:4]}"
    r_add = client.post("/api/crops", json={"name": another_crop})
    assert r_add.status_code == 200
    added_crop = r_add.json()
    assert added_crop["name"].lower() == another_crop
    assert "vegetative" in added_crop["common_stages"]

def test_strict_multi_tenant_isolation_no_data_leakage():
    # Create Farmer A
    email_a = f"farmer_a_{uuid.uuid4().hex[:6]}@agri.ke"
    r_a = client.post("/api/auth/register", json={
        "name": "Farmer Alice",
        "email": email_a,
        "password": "PasswordAlice123!",
        "farm_name": "Alice Private Ridge",
        "location_name": "Kitale",
        "initial_crop": "wheat"
    })
    assert r_a.status_code == 200
    token_a = r_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    field_a_id = r_a.json()["field_id"]
    farm_a_id = r_a.json()["farm_id"]

    # Create Farmer B
    email_b = f"farmer_b_{uuid.uuid4().hex[:6]}@agri.ke"
    r_b = client.post("/api/auth/register", json={
        "name": "Farmer Bob",
        "email": email_b,
        "password": "PasswordBob123!",
        "farm_name": "Bob Valley Shamba",
        "location_name": "Naivasha",
        "initial_crop": "spinach"
    })
    assert r_b.status_code == 200
    token_b = r_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    field_b_id = r_b.json()["field_id"]
    farm_b_id = r_b.json()["farm_id"]

    # Farmer B queries fields -> MUST ONLY see Farmer B's field(s)
    r_fields_b = client.get("/api/fields", headers=headers_b)
    assert r_fields_b.status_code == 200
    fields_b = r_fields_b.json()
    b_field_ids = [f["id"] for f in fields_b]
    assert field_b_id in b_field_ids
    assert field_a_id not in b_field_ids
    # Also verify Edwin's demo field (North Plot) is NOT visible to Farmer B
    for f in fields_b:
        assert f["farm"] != "Kilimo Bora Demonstration Farm"

    # Farmer B queries farms -> MUST ONLY see Farmer B's farm
    r_farms_b = client.get("/api/farms", headers=headers_b)
    assert r_farms_b.status_code == 200
    farms_b = r_farms_b.json()
    b_farm_ids = [f["id"] for f in farms_b]
    assert farm_b_id in b_farm_ids
    assert farm_a_id not in b_farm_ids
    for f in farms_b:
        assert f["name"] != "Kilimo Bora Demonstration Farm"

    # Farmer B attempts to inspect Farmer A's field directly -> MUST be 403 Forbidden
    r_leak_attempt = client.get(f"/api/fields/{field_a_id}", headers=headers_b)
    assert r_leak_attempt.status_code == 403

    # Farmer A attempts to inspect Farmer B's field directly -> MUST be 403 Forbidden
    r_leak_attempt_2 = client.get(f"/api/fields/{field_b_id}", headers=headers_a)
    assert r_leak_attempt_2.status_code == 403

def test_multilingual_crop_auto_detection_and_translation():
    # 1. Swahili detection for "mahindi"
    r_sw = client.get("/api/crops/detect?name=mahindi")
    assert r_sw.status_code == 200
    d_sw = r_sw.json()
    assert d_sw["matched"] is True
    assert d_sw["canonical_name"] == "maize"
    assert d_sw["detected_language"] == "sw"
    assert "Mahindi" in d_sw["name_sw"]
    assert "Maize" in d_sw["name_en"]
    assert "Maize" in d_sw["counterpart_name"]
    assert d_sw["category"] == "cereal"

    # 2. Swahili detection for "parachichi"
    r_para = client.get("/api/crops/detect?name=parachichi")
    assert r_para.status_code == 200
    d_para = r_para.json()
    assert d_para["matched"] is True
    assert d_para["canonical_name"] == "avocado"
    assert d_para["detected_language"] == "sw"
    assert "Avocado" in d_para["counterpart_name"]
    assert d_para["category"] == "fruit"

    # 3. English detection for "avocado"
    r_en = client.get("/api/crops/detect?name=avocado")
    assert r_en.status_code == 200
    d_en = r_en.json()
    assert d_en["matched"] is True
    assert d_en["canonical_name"] == "avocado"
    assert d_en["detected_language"] == "en"
    assert d_en["counterpart_name"] == "Parachichi"

    # 4. Swahili detection for "nyanya"
    r_nya = client.get("/api/crops/detect?name=nyanya")
    assert r_nya.status_code == 200
    d_nya = r_nya.json()
    assert d_nya["matched"] is True
    assert d_nya["canonical_name"] == "tomatoes"
    assert "Tomatoes" in d_nya["counterpart_name"]

    # 5. POST /api/crops with Swahili name auto-links and persists both languages
    r_add_sw = client.post("/api/crops", json={"name": "kahawa"})
    assert r_add_sw.status_code == 200
    d_add = r_add_sw.json()
    assert d_add["canonical_name"] if "canonical_name" in d_add else d_add["name"] == "coffee"
    assert "Kahawa" in d_add["name_sw"]
    assert "Coffee" in d_add["name_en"]

def test_multilingual_crop_agronomic_demand_calculation():
    from app.services.ml_analytics import AgriculturalMLService
    ml = AgriculturalMLService()

    # Calculate demand using Swahili crop name 'mahindi' in flowering stage
    demand_sw = ml.calculate_crop_water_demand("mahindi", "flowering", et0=4.0)
    assert demand_sw["crop_coefficient_kc"] == 1.20
    assert demand_sw["crop_demand_etc_mm_day"] == 4.80

    # Calculate demand using English crop name 'maize' in flowering stage
    demand_en = ml.calculate_crop_water_demand("maize", "flowering", et0=4.0)
    assert demand_en["crop_coefficient_kc"] == 1.20
    assert demand_en["crop_demand_etc_mm_day"] == 4.80

    # Calculate demand using Swahili crop name 'nyanya' in flowering stage
    demand_nyanya = ml.calculate_crop_water_demand("nyanya", "flowering", et0=4.0)
    assert demand_nyanya["crop_coefficient_kc"] == 1.15
    assert demand_nyanya["crop_demand_etc_mm_day"] == 4.60



