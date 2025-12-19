from flask import Blueprint, jsonify
from core.database import db, CONSOLES_FILE, USERS_FILE, RENTALS_FILE

stats_api = Blueprint('stats_api', __name__)

@stats_api.route('/api/stats')
def get_stats():
    consoles = db.load(CONSOLES_FILE)
    users = db.load(USERS_FILE)
    rentals = db.load(RENTALS_FILE)
    
    total_revenue = sum(r.get('total_cost', 0) for r in rentals.values())
    active_rentals = len([r for r in rentals.values() if r.get('status') == 'active'])
    
    return jsonify({
        'total_revenue': total_revenue,
        'active_rentals': active_rentals,
        'total_users': len(users),
        'total_consoles': len(consoles),
        'available_consoles': len([c for c in consoles.values() if c.get('status') == 'available'])
    })
