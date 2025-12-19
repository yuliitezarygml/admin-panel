from flask import Blueprint, request, jsonify
from core.database import db, ADMIN_USERS_FILE
import uuid
import hashlib
from datetime import datetime

admins_api = Blueprint('admins_api', __name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def ensure_super_admin():
    admins = db.load(ADMIN_USERS_FILE)
    if not admins:
        admin_id = str(uuid.uuid4())
        admins[admin_id] = {
            "id": admin_id,
            "username": "admin",
            "password": hash_password("admin"),
            "full_name": "Администратор",
            "role": "owner",
            "avatar_url": None,
            "bio": "Главный администратор системы",
            "stats": {
                "total_processed_requests": 0,
                "total_processed_kyc": 0,
                "daily_actions": {} # Format: "YYYY-MM-DD": count
            },
            "permissions": ["all"],
            "created_at": datetime.now().isoformat()
        }
        db.save(ADMIN_USERS_FILE, admins)
    return admins

@admins_api.route('/api/admins', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_admins():
    admins = ensure_super_admin()
    
    if request.method == 'GET':
        res = []
        for x in admins.values():
            a = x.copy()
            if 'password' in a: del a['password']
            res.append(a)
        return jsonify(res)

    if request.method == 'POST':
        data = request.json
        # Check if username exists
        if any(a['username'] == data.get('username') for a in admins.values()):
            return jsonify({'error': 'Username already exists'}), 400
            
        admin_id = str(uuid.uuid4())
        new_admin = {
            'id': admin_id,
            'username': data.get('username'),
            'password': hash_password(data.get('password', '123456')),
            'full_name': data.get('full_name', 'Новый админ'),
            'role': data.get('role', 'staff'),
            'avatar_url': None,
            'bio': '',
            'stats': {
                'total_processed_requests': 0,
                'total_processed_kyc': 0,
                'daily_actions': {}
            },
            'permissions': data.get('permissions', []),
            'created_at': datetime.now().isoformat()
        }
        admins[admin_id] = new_admin
        db.save(ADMIN_USERS_FILE, admins)
        return jsonify({'success': True, 'id': admin_id})

    if request.method == 'PUT':
        data = request.json
        admin_id = data.get('id')
        if admin_id in admins:
            a = admins[admin_id]
            a['full_name'] = data.get('full_name', a['full_name'])
            a['role'] = data.get('role', a['role'])
            a['permissions'] = data.get('permissions', a['permissions'])
            if data.get('password'):
                a['password'] = hash_password(data.get('password'))
            db.save(ADMIN_USERS_FILE, admins)
            return jsonify({'success': True})
        return jsonify({'error': 'Admin not found'}), 404

    if request.method == 'DELETE':
        admin_id = request.args.get('id')
        if admin_id in admins:
            # Prevent deleting the last owner
            if admins[admin_id]['role'] == 'owner' and len([x for x in admins.values() if x['role'] == 'owner']) <= 1:
                return jsonify({'error': 'Cannot delete the last owner account'}), 400
                
            del admins[admin_id]
            db.save(ADMIN_USERS_FILE, admins)
            return jsonify({'success': True})
        return jsonify({'error': 'Admin not found'}), 404

@admins_api.route('/api/admins/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400
        
    admins = ensure_super_admin()
    target_pwd = hash_password(password)
    
    admin = next((a for a in admins.values() if a['username'] == username), None)
    
    if not admin or admin['password'] != target_pwd:
        return jsonify({'error': 'Invalid username or password'}), 401
        
    res = admin.copy()
    if 'password' in res: del res['password']
    return jsonify(res)

@admins_api.route('/api/admins/profile', methods=['POST'])
def update_profile():
    data = request.json
    admin_id = data.get('id')
    admins = db.load(ADMIN_USERS_FILE)
    
    if admin_id in admins:
        a = admins[admin_id]
        a['full_name'] = data.get('full_name', a['full_name'])
        a['bio'] = data.get('bio', a.get('bio', ''))
        if data.get('password'):
            a['password'] = hash_password(data.get('password'))
        db.save(ADMIN_USERS_FILE, admins)
        return jsonify({'success': True})
    return jsonify({'error': 'Admin not found'}), 404

@admins_api.route('/api/admins/avatar', methods=['POST'])
def upload_avatar():
    if 'avatar' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['avatar']
    admin_id = request.form.get('id')
    
    if file and admin_id:
        import os
        ext = file.filename.split('.')[-1]
        filename = f"{admin_id}.{ext}"
        save_dir = os.path.join('static', 'img', 'avatars')
        if not os.path.exists(save_dir): os.makedirs(save_dir)
        
        save_path = os.path.join(save_dir, filename)
        file.save(save_path)
        
        # Update DB
        admins = db.load(ADMIN_USERS_FILE)
        if admin_id in admins:
            admins[admin_id]['avatar_url'] = f"/static/img/avatars/{filename}"
            db.save(ADMIN_USERS_FILE, admins)
            return jsonify({'success': True, 'url': admins[admin_id]['avatar_url']})
            
    return jsonify({'error': 'Invalid request'}), 400

@admins_api.route('/api/admins/reports/daily', methods=['GET'])
def get_daily_reports():
    admins = db.load(ADMIN_USERS_FILE)
    today = datetime.now().strftime('%Y-%m-%d')
    
    report = []
    for a in admins.values():
        daily_count = a.get('stats', {}).get('daily_actions', {}).get(today, 0)
        report.append({
            'id': a['id'],
            'full_name': a['full_name'],
            'avatar_url': a.get('avatar_url'),
            'role': a['role'],
            'today_actions': daily_count,
            'total_requests': a.get('stats', {}).get('total_processed_requests', 0),
            'total_kyc': a.get('stats', {}).get('total_processed_kyc', 0)
        })
    return jsonify(report)

@admins_api.route('/api/admins/current', methods=['GET'])
def get_current_admin():
    # In this implementation, we simulate session by allowing the frontend to pass an ID or fallback
    admin_id = request.args.get('id', '31a58d38-ec27-4946-9fd0-371b6fa98ae3') # Fallback to default owner for demo
    admins = db.load(ADMIN_USERS_FILE)
    admin = admins.get(admin_id)
    
    if admin:
        res = admin.copy()
        if 'password' in res: del res['password']
        return jsonify(res)
    return jsonify({'error': 'Not logged in'}), 401
