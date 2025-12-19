from flask import Flask, send_from_directory
from flask_cors import CORS
from api.consoles import consoles_api
from api.stats import stats_api
from api.settings import settings_api
from api.rentals import rentals_api
from api.users import users_api
from api.history import history_api
from api.health import health_api
from api.admins import admins_api
from api.kyc import kyc_api
from api.discounts import discounts_api
from bot.bot_core import get_bot
from bot.handlers import register_handlers
import os
import threading
import time

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(consoles_api)
app.register_blueprint(stats_api)
app.register_blueprint(settings_api)
app.register_blueprint(rentals_api)
app.register_blueprint(users_api)
app.register_blueprint(history_api)
app.register_blueprint(health_api)
app.register_blueprint(admins_api)
app.register_blueprint(kyc_api)
app.register_blueprint(discounts_api)

# Static files serving for KYC photos
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

def run_bot():
    print("🤖 Bot thread waiting for server to stabilize...")
    time.sleep(2) # Give Flask a moment to start/restart
    last_token = None
    while True:
        try:
            bot = get_bot()
            if bot:
                if not last_token or bot.token != last_token:
                    print(f"🤖 Telegram Bot initializing with token {bot.token[:10]}...")
                    register_handlers(bot)
                    last_token = bot.token
                
                print("🤖 Telegram Bot starting polling...")
                bot.polling(none_stop=True, interval=0, timeout=20)
            else:
                time.sleep(10)
        except Exception as e:
            if "Conflict" in str(e):
                print("❌ Conflict: Another bot instance is running. Retrying in 5s...")
                time.sleep(5)
            else:
                print(f"❌ Bot error: {e}")
                time.sleep(5)

if __name__ == '__main__':
    # Ensure static directories exist
    os.makedirs('static/img/console', exist_ok=True)
    
    # Set debug mode explicitly so the check below works correctly
    app.debug = True
    
    # Start bot in a background thread - ONLY in the child process of the reloader
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        bot_thread = threading.Thread(target=run_bot, daemon=True)
        bot_thread.start()
    elif not app.debug:
        # If not in debug mode, just start it
        bot_thread = threading.Thread(target=run_bot, daemon=True)
        bot_thread.start()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
