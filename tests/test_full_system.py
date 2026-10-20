import urllib.request
import json
import sys

def test_system():
    print("=== RUNNING V.E.R.A. FULL SYSTEM ACCEPTANCE TEST ===")
    
    # 1. Test Frontend HTML
    try:
        with urllib.request.urlopen("http://127.0.0.1:5500/index.html") as resp:
            assert resp.status == 200
            html = resp.read().decode('utf-8')
            required_elements = [
                'id="welcomeOverlay"',
                'id="beginVoiceBtn"',
                'id="authVoiceOrb"',
                'id="holoStage"',
                'id="conversationFeed"',
                'id="missionGrid"',
                'id="archGraphStage"',
                'id="matrixGrid"',
                'id="memoryEntriesList"',
                'id="diagSpeechRec"'
            ]
            for elem in required_elements:
                assert elem in html, f"Missing element {elem} in HTML"
            print("[PASS] Frontend index.html loaded and verified all 10 core system elements.")
    except Exception as e:
        print(f"[FAIL] Frontend HTML test failed: {e}")
        return False

    # 2. Test CSS
    try:
        with urllib.request.urlopen("http://127.0.0.1:5500/style.css") as resp:
            assert resp.status == 200
            css = resp.read().decode('utf-8')
            assert "--gold-primary" in css
            assert "--cyan-telemetry" in css
            assert "welcome-overlay" in css
            print("[PASS] Frontend style.css loaded and verified color tokens and HUD styling.")
    except Exception as e:
        print(f"[FAIL] Frontend CSS test failed: {e}")
        return False

    # 3. Test JS
    try:
        with urllib.request.urlopen("http://127.0.0.1:5500/script.js") as resp:
            assert resp.status == 200
            js = resp.read().decode('utf-8')
            assert "normalizePassphrase" in js
            assert "verifyPassphrase" in js
            assert "speechEngine" in js
            assert "conductProjectBriefing" in js
            print("[PASS] Frontend script.js loaded and verified passphrase and voice state machine.")
    except Exception as e:
        print(f"[FAIL] Frontend JS test failed: {e}")
        return False

    # 4. Test Hologram Asset
    try:
        with urllib.request.urlopen("http://127.0.0.1:5500/assets/vera_core.jpg") as resp:
            assert resp.status == 200
            data = resp.read()
            assert len(data) > 10000, "Asset data too small"
            print(f"[PASS] Hologram core asset verified: {len(data)} bytes.")
    except Exception as e:
        print(f"[FAIL] Hologram asset test failed: {e}")
        return False

    # 5. Test Backend Health
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/health") as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode('utf-8'))
            assert data["status"] == "healthy"
            print("[PASS] Backend /health verified.")
    except Exception as e:
        print(f"[FAIL] Backend /health failed: {e}")
        return False

    # 6. Test Backend Diagnostics
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/api/system/diagnostics") as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode('utf-8'))
            assert data["operator"] == "Prathmesh Mante"
            assert data["github_user"] == "prathmeshmante-glitch"
            print(f"[PASS] Backend /api/system/diagnostics verified (Repos indexed: {data['total_public_repos']}).")
    except Exception as e:
        print(f"[FAIL] Backend /api/system/diagnostics failed: {e}")
        return False

    # 7. Test Backend Chat / AI
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/assistant/chat",
            data=json.dumps({"message": "Explain BrandForge and its architecture", "current_repo": "brandforge"}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode('utf-8'))
            assert "brandforge" in data["spoken_reply"].lower() or "brandforge" in data["display_reply"].lower()
            print("[PASS] Backend /api/assistant/chat verified (Grounded repo inquiry).")
    except Exception as e:
        print(f"[FAIL] Backend /api/assistant/chat failed: {e}")
        return False

    print("=== ALL SYSTEM ACCEPTANCE TESTS PASSED SUCCESSFULLY ===")
    return True

if __name__ == "__main__":
    success = test_system()
    sys.exit(0 if success else 1)
