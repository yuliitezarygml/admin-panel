from flask import Blueprint, jsonify, request
from core.database import db, DISCOUNTS_FILE
from datetime import datetime

discounts_api = Blueprint('discounts_api', __name__)

@discounts_api.route('/api/discounts', methods=['GET'])
def get_discounts():
    discounts = db.load(DISCOUNTS_FILE)
    return jsonify(discounts)

@discounts_api.route('/api/discounts', methods=['POST'])
def save_discount():
    data = request.json
    date = data.get('date') # Format: YYYY-MM-DD
    discount_type = data.get('type') # 'discount' or 'blackout'
    value = data.get('value', 0) # Discount percentage
    description = data.get('description', '')

    if not date:
        return jsonify({'error': 'Date is required'}), 400

    discounts = db.load(DISCOUNTS_FILE)
    
    if data.get('delete'):
        if date in discounts:
            del discounts[date]
    else:
        discounts[date] = {
            'type': discount_type,
            'value': value,
            'description': description,
            'updated_at': datetime.now().isoformat()
        }

    db.save(DISCOUNTS_FILE, discounts)
    return jsonify({'success': True})

@discounts_api.route('/api/discounts/check', methods=['GET'])
def check_date():
    date = request.args.get('date')
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    discounts = db.load(DISCOUNTS_FILE)
    res = discounts.get(date, {'type': 'none'})
    return jsonify(res)
