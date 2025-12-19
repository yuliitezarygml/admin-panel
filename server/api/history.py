from flask import Blueprint, jsonify
from core.database import db, RENTALS_FILE, USERS_FILE, CONSOLES_FILE

history_api = Blueprint('history_api', __name__)

@history_api.route('/api/history')
def get_history():
    rentals = db.load(RENTALS_FILE)
    users = db.load(USERS_FILE)
    consoles = db.load(CONSOLES_FILE)
    
    result = []
    # Sort by start time descending
    sorted_rentals = sorted(rentals.values(), key=lambda x: x.get('start_time', ''), reverse=True)
    
    for r in sorted_rentals:
        user = users.get(str(r.get('user_id')), {})
        console = consoles.get(r.get('console_id'), {})
        
        result.append({
            'id': r.get('id'),
            'user_name': user.get('first_name', 'Неизвестный'),
            'user_handle': user.get('username', 'user'),
            'console_name': console.get('name', 'Консоль'),
            'start_time': r.get('start_time'),
            'end_time': r.get('expected_end_time'),
            'status': r.get('status'),
            'total_cost': r.get('total_cost', 0)
        })
        
    return jsonify(result)
