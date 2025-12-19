from flask import Blueprint, jsonify
from core.database import db, CONSOLES_FILE, USERS_FILE, RENTALS_FILE

stats_api = Blueprint('stats_api', __name__)

@stats_api.route('/api/stats')
def get_stats():
    consoles = db.load(CONSOLES_FILE)
    users = db.load(USERS_FILE)
    rentals = db.load(RENTALS_FILE)
    
    total_revenue = sum(r.get('total_cost', 0) for r in rentals.values())
    active_rentals_list = [r for r in rentals.values() if r.get('status') == 'active']
    active_rentals_count = len(active_rentals_list)
    
    # Calculate revenue per minute from active rentals
    revenue_per_minute = 0
    for r in active_rentals_list:
        console_id = r.get('console_id')
        if console_id in consoles:
            hourly_price = consoles[console_id].get('rental_price', 0)
            revenue_per_minute += hourly_price / 60
    
    # Generate Activity Stream
    activity = []
    
    # Sort all rentals by time
    all_rentals = list(rentals.values())
    sorted_rentals = sorted(all_rentals, key=lambda x: x.get('start_time', ''), reverse=True)[:10]
    
    for r in sorted_rentals:
        user = users.get(str(r.get('user_id')), {})
        console = consoles.get(r.get('console_id'), {})
        is_active = r.get('status') == 'active'
        
        activity.append({
            'type': 'rental',
            'title': f"{console.get('name', 'Консоль')} - {'В аренде' if is_active else 'Завершена'}",
            'subtitle': f"Клиент: {user.get('first_name', 'User')}",
            'time': r.get('start_time'),
            'amount': r.get('total_cost') if not is_active else None,
            'status': r.get('status')
        })
        
    return jsonify({
        'total_revenue': total_revenue,
        'revenue_per_minute': round(revenue_per_minute, 2),
        'active_rentals': active_rentals_count,
        'total_users': len(users),
        'total_consoles': len(consoles),
        'available_consoles': len([c for c in consoles.values() if c.get('status') == 'available']),
        'activity': activity
    })
