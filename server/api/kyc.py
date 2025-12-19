from flask import Blueprint, jsonify, request
from core.database import db, KYC_REQUESTS_FILE, USERS_FILE, ADMIN_USERS_FILE
from datetime import datetime
import os
import uuid

kyc_api = Blueprint('kyc_api', __name__)

def get_kyc_requests():
    return db.load(KYC_REQUESTS_FILE)

def save_kyc_requests(requests):
    db.save(KYC_REQUESTS_FILE, requests)

@kyc_api.route('/api/kyc', methods=['GET'])
def get_all_kyc():
    requests = get_kyc_requests()
    users = db.load(USERS_FILE)
    
    # Enrich requests with user names
    enriched = []
    for req_id, req in requests.items():
        user = users.get(str(req.get('user_id')), {})
        req_copy = req.copy()
        req_copy['id'] = req_id
        req_copy['user_name'] = user.get('name', 'Unknown User')
        req_copy['username'] = user.get('username', 'N/A')
        enriched.append(req_copy)
        
    return jsonify(sorted(enriched, key=lambda x: x['timestamp'], reverse=True))

@kyc_api.route('/api/kyc/action', methods=['POST'])
def kyc_action():
    data = request.json
    req_id = data.get('request_id')
    action = data.get('action') # 'approve' or 'reject'
    admin_note = data.get('note', '')

    requests = get_kyc_requests()
    if req_id not in requests:
        return jsonify({'error': 'Request not found'}), 404

    req = requests[req_id]
    user_id = str(req['user_id'])
    
    users = db.load(USERS_FILE)
    if user_id not in users:
        return jsonify({'error': 'User not found'}), 404

    if action == 'approve':
        req['status'] = 'approved'
        users[user_id]['kyc_status'] = 'verified'
    elif action == 'reject':
        req['status'] = 'rejected'
        users[user_id]['kyc_status'] = 'rejected'
    
    req['admin_note'] = admin_note
    users[user_id]['kyc_note'] = admin_note
    req['processed_at'] = datetime.now().isoformat()
    
    # Track Admin Activity
    admin_id = data.get('admin_id')
    if admin_id:
        req['processed_by'] = admin_id
        admins = db.load(ADMIN_USERS_FILE)
        if admin_id in admins:
            stats = admins[admin_id].get('stats', {
                'total_processed_requests': 0,
                'total_processed_kyc': 0,
                'daily_actions': {}
            })
            stats['total_processed_kyc'] = stats.get('total_processed_kyc', 0) + 1
            
            today = datetime.now().strftime('%Y-%m-%d')
            daily = stats.get('daily_actions', {})
            daily[today] = daily.get(today, 0) + 1
            stats['daily_actions'] = daily
            
            admins[admin_id]['stats'] = stats
            db.save(ADMIN_USERS_FILE, admins)
    
    save_kyc_requests(requests)
    db.save(USERS_FILE, users)
    
    # Send Bot notification
    try:
        from bot.bot_core import get_bot
        from bot.keyboards import get_main_keyboard
        from core.database import SETTINGS_FILE
        
        bot = get_bot()
        settings = db.load(SETTINGS_FILE)
        help_btn_text = settings.get('help_button_text', 'ℹ️ Помощь')
        
        if action == 'approve':
            msg = "✅ *Поздравляем!*\n\nВаш профиль успешно верифицирован. Теперь вам доступны все функции аренды консолей."
            bot.send_message(user_id, msg, parse_mode='Markdown', 
                           reply_markup=get_main_keyboard(False, help_btn_text, 'verified'))
        elif action == 'reject':
            msg = f"❌ *Верификация отклонена*\n\nК сожалению, мы не смогли подтвердить ваш профиль."
            if admin_note:
                msg += f"\n\n💬 Причина: {admin_note}"
            msg += "\n\nВы можете попробовать отправить документы еще раз через меню «🛡️ Верификация»."
            bot.send_message(user_id, msg, parse_mode='Markdown',
                           reply_markup=get_main_keyboard(False, help_btn_text, 'rejected'))
    except Exception as e:
        print(f"Failed to send KYC notification: {e}")
        
    return jsonify({'success': True})

@kyc_api.route('/api/kyc/submit', methods=['POST'])
def submit_kyc():
    # This would be called by the bot handler
    data = request.json
    user_id = data.get('user_id')
    photo_url = data.get('photo_url')
    
    if not user_id or not photo_url:
        return jsonify({'error': 'Missing data'}), 400
        
    requests = get_kyc_requests()
    
    req_id = str(uuid.uuid4())
    requests[req_id] = {
        'user_id': user_id,
        'photo_url': photo_url,
        'status': 'pending',
        'timestamp': datetime.now().isoformat()
    }
    
    save_kyc_requests(requests)
    
    # Update user state
    users = db.load(USERS_FILE)
    if str(user_id) in users:
        users[str(user_id)]['kyc_status'] = 'pending'
        db.save(USERS_FILE, users)
        
    return jsonify({'success': True, 'request_id': req_id})
