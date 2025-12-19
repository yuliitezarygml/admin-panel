from flask import Blueprint, request, jsonify
from core.database import db, CONSOLES_FILE
import uuid
from datetime import datetime
import os

consoles_api = Blueprint('consoles_api', __name__)

@consoles_api.route('/api/consoles', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_consoles():
    consoles = db.load(CONSOLES_FILE)
    
    if request.method == 'GET':
        return jsonify(list(consoles.values()))

    if request.method == 'POST':
        data = request.json
        console_id = str(uuid.uuid4())
        new_console = {
            'id': console_id,
            'name': data.get('name'),
            'model': data.get('model', 'PS5'),
            'rental_price': int(data.get('rental_price', 0)),
            'sale_price': int(data.get('sale_price', 0)),
            'show_photo_in_bot': data.get('show_photo_in_bot', True),
            'games': [g.strip() for g in data.get('games', '').split(',')] if isinstance(data.get('games'), str) else data.get('games', []),
            'status': 'available',
            'created_at': datetime.now().isoformat()
        }
        consoles[console_id] = new_console
        db.save(CONSOLES_FILE, consoles)
        return jsonify(new_console)

    if request.method == 'PUT':
        data = request.json
        console_id = data.get('id')
        if console_id in consoles:
            console = consoles[console_id]
            console.update({
                'name': data.get('name', console['name']),
                'model': data.get('model', console['model']),
                'rental_price': int(data.get('rental_price', console['rental_price'])),
                'sale_price': int(data.get('sale_price', console.get('sale_price', 0))),
                'show_photo_in_bot': data.get('show_photo_in_bot', console.get('show_photo_in_bot', True)),
                'games': [g.strip() for g in data.get('games', '').split(',')] if isinstance(data.get('games'), str) else data.get('games', []),
                'updated_at': datetime.now().isoformat()
            })
            db.save(CONSOLES_FILE, consoles)
            return jsonify(console)
        return jsonify({'error': 'Not found'}), 404

    if request.method == 'DELETE':
        console_id = request.args.get('id')
        if console_id in consoles:
            del consoles[console_id]
            db.save(CONSOLES_FILE, consoles)
            return jsonify({'success': True})
        return jsonify({'error': 'Not found'}), 404
