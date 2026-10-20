import time
from typing import Dict, List, Optional, Any
from app.schemas import MemoryEntry, MemoryState

class MemoryService:
    def __init__(self):
        # In-memory storage for runtime (can be backed by SQLite/file if needed)
        self.visitor_preferences: Dict[str, Any] = {
            "preferred_depth": "concise",
            "voice_output_enabled": True,
            "speaking_speed": 1.0,
            "frequently_explored": []
        }
        self.owner_preferences: Dict[str, Any] = {
            "mode": "executive",
            "voice_output_enabled": True,
            "briefing_frequency": "on_start"
        }
        self.session_conversations: Dict[str, List[Dict[str, str]]] = {}
        self.enabled = True
        self.last_updated = time.time()

    def get_state(self, scope: str = "visitor") -> MemoryState:
        prefs = self.owner_preferences if scope == "owner" else self.visitor_preferences
        entries = [
            MemoryEntry(
                id=f"{scope}_{k}",
                key=k,
                value=v,
                updated_at=time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self.last_updated)),
                scope=scope
            )
            for k, v in prefs.items()
        ]
        return MemoryState(
            enabled=self.enabled,
            storage_type="client_local_and_backend",
            entries=entries
        )

    def set_preference(self, key: str, value: Any, scope: str = "visitor") -> bool:
        if not self.enabled:
            return False
        target = self.owner_preferences if scope == "owner" else self.visitor_preferences
        target[key] = value
        self.last_updated = time.time()
        return True

    def delete_entry(self, key: str, scope: str = "visitor") -> bool:
        target = self.owner_preferences if scope == "owner" else self.visitor_preferences
        if key in target:
            del target[key]
            self.last_updated = time.time()
            return True
        return False

    def clear_all(self, scope: str = "visitor") -> bool:
        if scope == "owner":
            self.owner_preferences.clear()
        else:
            self.visitor_preferences.clear()
        self.last_updated = time.time()
        return True

    def set_enabled(self, enabled: bool) -> bool:
        self.enabled = enabled
        return self.enabled

memory_service = MemoryService()
