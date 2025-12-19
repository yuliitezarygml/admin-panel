from core.database import db, SETTINGS_FILE
import telebot
import os

# Initialize bot from database settings
settings = db.load(SETTINGS_FILE)
token = settings.get('bot_token')

if token:
    bot = telebot.TeleBot(token)
else:
    bot = None

def get_bot():
    """Helper to get bot instance, checking for updates if needed"""
    global bot
    current_settings = db.load(SETTINGS_FILE)
    current_token = current_settings.get('bot_token')
    
    if not current_token:
        return None
        
    if not bot or bot.token != current_token:
        print(f"🔄 Bot re-initializing with new token: {current_token[:10]}...")
        bot = telebot.TeleBot(current_token)
    
    return bot
