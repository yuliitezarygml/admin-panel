from flask import Blueprint, jsonify
from core.database import db, USERS_FILE, RENTALS_FILE, CONSOLES_FILE

users_api = Blueprint('users_api', __name__)

@users_api.route('/api/users')
def get_users():
    users = db.load(USERS_FILE)
    rentals = db.load(RENTALS_FILE)
    consoles = db.load(CONSOLES_FILE)
    
    result = []
    for uid, user in users.items():
        user_data = user.copy()
        # Find and enrich rentals for this user
        user_rentals = []
        for r in rentals.values():
            if str(r.get('user_id')) == str(uid):
                r_enriched = r.copy()
                r_enriched['console_name'] = consoles.get(r.get('console_id'), {}).get('name', 'Неизвестная консоль')
                user_rentals.append(r_enriched)
        
        user_data['rentals'] = user_rentals
        user_data['rental_count'] = len(user_rentals)
        result.append(user_data)
        
    return jsonify(result)
