from flask import Flask, send_from_directory
from flask_cors import CORS
from api.consoles import consoles_api
from api.stats import stats_api
from api.settings import settings_api
from bot.bot_core import get_bot
import os
import threading
import time

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(consoles_api)
app.register_blueprint(stats_api)
app.register_blueprint(settings_api)

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

def run_bot():
    while True:
        try:
            bot = get_bot()
            if bot:
                print("🤖 Telegram Bot starting...")
                bot.polling(none_stop=True, interval=0)
            else:
                time.sleep(10) # Wait for settings to be configured
        except Exception as e:
            print(f"❌ Bot error: {e}")
            time.sleep(5)

if __name__ == '__main__':
    # Start bot in a background thread
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    
    # Ensure static directories exist
    os.makedirs('static/img/console', exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
