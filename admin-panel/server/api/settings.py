from flask import Blueprint, request, jsonify
from core.database import db, SETTINGS_FILE

settings_api = Blueprint('settings_api', __name__)

@settings_api.route('/api/settings', methods=['GET', 'POST'])
def manage_settings():
    settings = db.load(SETTINGS_FILE)
    
    if request.method == 'GET':
        # Don't return the full token for security, maybe mask it or just return existence
        # But for an admin panel, we might need to see it or at least part of it
        return jsonify(settings)

    if request.method == 'POST':
        data = request.json
        # Only update valid fields
        updatable_fields = ['bot_token', 'admin_chat_id', 'require_approval', 'notifications_enabled']
        for field in updatable_fields:
            if field in data:
                settings[field] = data[field]
        
        db.save(SETTINGS_FILE, settings)
        return jsonify({'success': True, 'settings': settings})
