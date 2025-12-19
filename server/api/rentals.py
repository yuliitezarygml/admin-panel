from flask import Blueprint, request, jsonify
from core.database import db, RENTAL_REQUESTS_FILE, RENTALS_FILE, CONSOLES_FILE, USERS_FILE, DISCOUNTS_FILE, ADMIN_USERS_FILE
from bot.bot_core import get_bot
import uuid
from datetime import datetime, timedelta

rentals_api = Blueprint('rentals_api', __name__)

@rentals_api.route('/api/requests', methods=['GET'])
def get_requests():
    requests = db.load(RENTAL_REQUESTS_FILE)
    users = db.load(USERS_FILE)
    consoles = db.load(CONSOLES_FILE)
    
    result = []
    for rid, req in requests.items():
        req_data = req.copy()
        req_data['user_name'] = users.get(str(req.get('user_id')), {}).get('full_name', 'Неизвестный')
        req_data['console_name'] = consoles.get(req.get('console_id'), {}).get('name', 'Неизвестная консоль')
        result.append(req_data)
        
    return jsonify(result)

@rentals_api.route('/api/requests/action', methods=['POST'])
def request_action():
    data = request.json
    request_id = data.get('id')
    action = data.get('action') # 'approve' or 'reject'
    
    requests = db.load(RENTAL_REQUESTS_FILE)
    if request_id not in requests:
        return jsonify({'error': 'Request not found'}), 404
        
    req = requests[request_id]
    user_id = req.get('user_id')
    console_id = req.get('console_id')
    
    bot = get_bot()
    
    if action == 'approve':
        consoles = db.load(CONSOLES_FILE)
        rentals = db.load(RENTALS_FILE)
        
        # Check if console is available
        if consoles.get(console_id, {}).get('status') != 'available':
            return jsonify({'error': 'Console is not available'}), 400
            
        # Update request status
        req['status'] = 'approved'
        req['updated_at'] = datetime.now().isoformat()
        
        # Get current discount
        today = datetime.now().strftime('%Y-%m-%d')
        discounts = db.load(DISCOUNTS_FILE)
        day_rule = discounts.get(today, {})
        discount_pct = day_rule.get('value', 0) if day_rule.get('type') == 'discount' else 0
        
        # Create rental
        rental_id = str(uuid.uuid4())
        hours = req.get('selected_hours', 24)
        rental = {
            'id': rental_id,
            'user_id': user_id,
            'console_id': console_id,
            'start_time': datetime.now().isoformat(),
            'expected_end_time': (datetime.now() + timedelta(hours=hours)).isoformat(),
            'status': 'active',
            'discount_percent': discount_pct,
            'total_cost': 0
        }
        rentals[rental_id] = rental
        consoles[console_id]['status'] = 'rented'
        
        db.save(RENTALS_FILE, rentals)
        db.save(CONSOLES_FILE, consoles)
        
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
                stats['total_processed_requests'] = stats.get('total_processed_requests', 0) + 1
                
                today = datetime.now().strftime('%Y-%m-%d')
                daily = stats.get('daily_actions', {})
                daily[today] = daily.get(today, 0) + 1
                stats['daily_actions'] = daily
                
                admins[admin_id]['stats'] = stats
                db.save(ADMIN_USERS_FILE, admins)

        db.save(RENTAL_REQUESTS_FILE, requests)
        
        # Notify user
        if bot:
            try:
                msg = f"✅ Ваша заявка на {consoles[console_id]['name']} одобрена!\nАренда успешно начата."
                bot.send_message(user_id, msg)
            except Exception as e:
                print(f"Failed to notify user: {e}")
                
        return jsonify({'success': True, 'rental_id': rental_id})
        
    elif action == 'reject':
        req['status'] = 'rejected'
        req['updated_at'] = datetime.now().isoformat()
        
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
                stats['total_processed_requests'] = stats.get('total_processed_requests', 0) + 1
                
                today = datetime.now().strftime('%Y-%m-%d')
                daily = stats.get('daily_actions', {})
                daily[today] = daily.get(today, 0) + 1
                stats['daily_actions'] = daily
                
                admins[admin_id]['stats'] = stats
                db.save(ADMIN_USERS_FILE, admins)

        db.save(RENTAL_REQUESTS_FILE, requests)
        
        # Notify user
        if bot:
            try:
                bot.send_message(user_id, "❌ К сожалению, ваша заявка на аренду была отклонена администратором.")
            except Exception as e:
                print(f"Failed to notify user: {e}")
                
        return jsonify({'success': True})

    return jsonify({'error': 'Invalid action'}), 400
@rentals_api.route('/api/rentals/manual', methods=['POST'])
def manual_rental():
    data = request.json
    console_id = data.get('console_id')
    hours = data.get('hours', 1)
    
    if not console_id:
        return jsonify({'error': 'Console ID is required'}), 400
        
    consoles = db.load(CONSOLES_FILE)
    if console_id not in consoles:
        return jsonify({'error': 'Console not found'}), 404
        
    if consoles[console_id].get('status') != 'available':
        return jsonify({'error': 'Console is not available'}), 400
        
    # Get current discount
    today = datetime.now().strftime('%Y-%m-%d')
    discounts = db.load(DISCOUNTS_FILE)
    day_rule = discounts.get(today, {})
    discount_pct = day_rule.get('value', 0) if day_rule.get('type') == 'discount' else 0
    
    rentals = db.load(RENTALS_FILE)
    rental_id = str(uuid.uuid4())
    
    rental = {
        'id': rental_id,
        'user_id': 'admin_manual',
        'console_id': console_id,
        'start_time': datetime.now().isoformat(),
        'expected_end_time': (datetime.now() + timedelta(hours=int(hours))).isoformat(),
        'status': 'active',
        'discount_percent': discount_pct,
        'total_cost': 0
    }
    
    rentals[rental_id] = rental
    consoles[console_id]['status'] = 'rented'
    
    db.save(RENTALS_FILE, rentals)
    db.save(CONSOLES_FILE, consoles)
    
    return jsonify({'success': True, 'rental_id': rental_id})
@rentals_api.route('/api/rentals/terminate', methods=['POST'])
def terminate_rental():
    data = request.json
    console_id = data.get('console_id')
    
    if not console_id:
        return jsonify({'error': 'Console ID is required'}), 400
        
    rentals = db.load(RENTALS_FILE)
    consoles = db.load(CONSOLES_FILE)
    
    # Find active rental for this console
    active_rental = None
    rental_key = None
    for rid, r in rentals.items():
        if r.get('console_id') == console_id and r.get('status') == 'active':
            active_rental = r
            rental_key = rid
            break
            
    if not active_rental:
        return jsonify({'error': 'No active rental found for this console'}), 404
        
    # Calculate costs
    start_time = datetime.fromisoformat(active_rental['start_time'])
    now = datetime.now()
    duration = now - start_time
    hours = max(1, round(duration.total_seconds() / 3600, 2)) # Min 1 hour charge or exact
    
    hourly_price = consoles.get(console_id, {}).get('rental_price', 0)
    total_cost = hours * hourly_price
    
    # Apply discount if recorded in rental
    discount_pct = active_rental.get('discount_percent', 0)
    if discount_pct > 0:
        total_cost = total_cost * (1 - discount_pct / 100)
    
    total_cost = round(total_cost, 2)
    
    # Update rental
    active_rental['status'] = 'completed'
    active_rental['end_time'] = now.isoformat()
    active_rental['total_cost'] = total_cost
    
    # Update console
    if console_id in consoles:
        consoles[console_id]['status'] = 'available'
        
    db.save(RENTALS_FILE, rentals)
    db.save(CONSOLES_FILE, consoles)
    
    return jsonify({
        'success': True,
        'total_cost': total_cost,
        'duration_hours': hours
    })
