from flask import Blueprint, request, jsonify
from core.database import db, SETTINGS_FILE

settings_api = Blueprint('settings_api', __name__)

@settings_api.route('/api/settings', methods=['GET', 'POST'])
def manage_settings():
    settings = db.load(SETTINGS_FILE)
    
    if request.method == 'GET':
        return jsonify(settings)

    if request.method == 'POST':
        data = request.json
        updatable_fields = ['bot_token', 'admin_chat_id', 'require_approval', 'notifications_enabled', 'help_text', 'help_button_text']
        for field in updatable_fields:
            if field in data:
                settings[field] = data[field]
        
        db.save(SETTINGS_FILE, settings)
        return jsonify({'success': True, 'settings': settings})
