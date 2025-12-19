from flask import Blueprint, jsonify
import psutil
import os
from bot.bot_core import get_bot

health_api = Blueprint('health_api', __name__)

@health_api.route('/api/health')
def get_health():
    try:
        process = psutil.Process(os.getpid())
        memory_mb = process.memory_info().rss / (1024 * 1024)
        
        # Real Storage Info
        disk = psutil.disk_usage('/')
        storage_percent = disk.percent
        storage_status = "Safe" if storage_percent < 90 else "Warning"
        
        # Bot status
        bot = get_bot()
        bot_status = "Active" if bot else "Offline"
        
        # Database check
        data_files = ['consoles.json', 'users.json', 'rentals.json', 'rental_requests.json', 'admin_settings.json']
        data_path = os.path.join(os.path.dirname(__file__), '..', 'data')
        missing_files = []
        for f in data_files:
            if not os.path.exists(os.path.join(data_path, f)):
                missing_files.append(f)
        
        db_status = "Healthy" if not missing_files else f"Error: {len(missing_files)} missing"
        
        return jsonify({
            'bot_status': bot_status,
            'storage_status': storage_status,
            'storage_percent': storage_percent,
            'memory_usage': f"{int(memory_mb)}MB",
            'db_status': db_status,
            'uptime': "Online" # Simple indicator
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
