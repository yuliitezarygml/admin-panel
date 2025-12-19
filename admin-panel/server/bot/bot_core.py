from core.database import db, SETTINGS_FILE
import telebot
import os

# Initialize bot from database settings
settings = db.load(SETTINGS_FILE)
token = settings.get('bot_token')

if token:
    bot = telebot.TeleBot(token)
else:
    # Use a dummy or print a warning if no token is set yet
    print("⚠️ Telegram Bot Token is not set in settings. Use Admin Panel to set it.")
    bot = None

def get_bot():
    """Helper to get bot instance, checking for updates if needed"""
    global bot
    current_settings = db.load(SETTINGS_FILE)
    current_token = current_settings.get('bot_token')
    
    if current_token and (not bot or bot.token != current_token):
        bot = telebot.TeleBot(current_token)
        print(f"🔄 Bot re-initialized with new token: {current_token[:10]}...")
    
    return bot
