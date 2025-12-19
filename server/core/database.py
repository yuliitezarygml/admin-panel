import os
import json
from datetime import datetime
import threading

class Database:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(Database, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized: return
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        self._initialized = True

    def _get_path(self, filename):
        return os.path.join(self.data_dir, filename)

    def load(self, filename):
        path = self._get_path(filename)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def save(self, filename, data):
        path = self._get_path(filename)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

db = Database()

# Constants for filenames
CONSOLES_FILE = 'consoles.json'
USERS_FILE = 'users.json'
RENTALS_FILE = 'rentals.json'
RENTAL_REQUESTS_FILE = 'rental_requests.json'
DISCOUNTS_FILE = 'discounts.json'
SETTINGS_FILE = 'admin_settings.json'
RATINGS_FILE = 'ratings.json'
ADMIN_USERS_FILE = 'admin_users.json'
