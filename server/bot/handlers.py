import os
import uuid
from bot.bot_core import get_bot
from bot.keyboards import get_main_keyboard
from core.database import db, USERS_FILE, SETTINGS_FILE, CONSOLES_FILE, RENTALS_FILE, RENTAL_REQUESTS_FILE
from datetime import datetime
from telebot import types

def register_handlers(bot):
    @bot.message_handler(commands=['start'])
    def start_command(message):
        user_id = str(message.from_user.id)
        users = db.load(USERS_FILE)
        settings = db.load(SETTINGS_FILE)
        
        print(f"👤 User {user_id} (@{message.from_user.username}) started the bot")
        
        # Simple admin check
        is_admin = str(user_id) == str(settings.get('admin_chat_id'))
        help_btn_text = settings.get('help_button_text', 'ℹ️ Помощь')
        
        if user_id not in users:
            users[user_id] = {
                'id': user_id,
                'username': message.from_user.username,
                'first_name': message.from_user.first_name,
                'joined_at': datetime.now().isoformat(),
                'is_banned': False
            }
            db.save(USERS_FILE, users)
        
        welcome_text = f"👋 Привет, {message.from_user.first_name}!\n\nДобро пожаловать в PlayStation Rental. Используйте меню ниже для навигации."
        if is_admin:
            welcome_text += "\n\n🛠 Вы вошли как администратор."
            
        bot.reply_to(message, welcome_text, reply_markup=get_main_keyboard(is_admin, help_btn_text))

    @bot.message_handler(func=lambda m: m.text == '📊 Мой кабинет')
    def my_cabinet(message):
        user_id = str(message.from_user.id)
        print(f"📊 User {user_id} requested cabinet")
        users = db.load(USERS_FILE)
        user = users.get(user_id, {})
        
        stats_text = f"👤 **Ваш кабинет**\n\n"
        stats_text += f"📅 Дата регистрации: {user.get('joined_at', 'Неизвестно')[:10]}\n"
        stats_text += f"🎮 Всего аренд: {len(user.get('rentals', []))}\n"
        
        bot.reply_to(message, stats_text, parse_mode='Markdown')

    @bot.message_handler(func=lambda m: True)
    def handle_all_messages(message):
        user_id = str(message.from_user.id)
        settings = db.load(SETTINGS_FILE)
        help_btn_text = settings.get('help_button_text', 'ℹ️ Помощь')
        help_text = settings.get('help_text', 'Текст помощи еще не настроен администратором.')
        
        print(f"📩 Message from {user_id}: {message.text}")
        
        if message.text == help_btn_text:
            print(f"ℹ️ User {user_id} requested help")
            bot.reply_to(message, help_text, parse_mode='Markdown')
        elif message.text == '📝 Арендовать':
            print(f"📝 User {user_id} started rental flow")
            consoles = db.load(CONSOLES_FILE)
            available = {cid: c for cid, c in consoles.items() if c.get('status') == 'available'}
            
            if not available:
                bot.reply_to(message, "❌ К сожалению, сейчас нет свободных консолей.")
                return
                
            from bot.keyboards import create_console_keyboard
            bot.reply_to(message, "🎮 Выберите консоль для аренды:", reply_markup=create_console_keyboard(available))
        elif message.text == '⚙️ Админ панель':
            if str(user_id) == str(settings.get('admin_chat_id')):
                bot.reply_to(message, "🛠 *Админ панель управления*\n\nВы можете управлять системой через веб-интерфейс:\n🔗 [Открыть панель](http://localhost:3000)", parse_mode='Markdown')
        elif message.text == '📈 Статистика':
            if str(user_id) == str(settings.get('admin_chat_id')):
                rentals = db.load(RENTALS_FILE)
                consoles = db.load(CONSOLES_FILE)
                active = len([r for r in rentals.values() if r.get('status') == 'active'])
                stats = f"📈 *Статистика системы*\n\n✅ Активных аренд: {active}\n🎮 Всего консолей: {len(consoles)}\n👥 Всего пользователей: {len(db.load(USERS_FILE))}"
                bot.reply_to(message, stats, parse_mode='Markdown')

    @bot.callback_query_handler(func=lambda call: call.data.startswith('select_console_'))
    def select_console(call):
        console_id = call.data.replace('select_console_', '')
        consoles = db.load(CONSOLES_FILE)
        console = consoles.get(console_id)
        
        if not console or console.get('status') != 'available':
            bot.answer_callback_query(call.id, "❌ Эта консоль уже не доступна.")
            return

        from bot.keyboards import create_hours_keyboard
        text = f"🎮 *{console['name']}*\n💰 Цена: {console['rental_price']} MDL/ч\n\nВыберите время аренды:"
        
        # Send/Edit with photo if exists
        photo_path = console.get('photo_path')
        if photo_path and console.get('show_photo_in_bot', True):
            # Photo path is usually /static/img/console/ID.jpg
            # We need the absolute path for telebot
            local_path = os.path.join(os.getcwd(), photo_path.lstrip('/'))
            if os.path.exists(local_path):
                with open(local_path, 'rb') as photo:
                    bot.send_photo(call.message.chat.id, photo, caption=text, 
                                 reply_markup=create_hours_keyboard(console_id), parse_mode='Markdown')
                bot.delete_message(call.message.chat.id, call.message.message_id)
                return

        bot.edit_message_text(text, call.message.chat.id, call.message.message_id, 
                            reply_markup=create_hours_keyboard(console_id), parse_mode='Markdown')

    @bot.callback_query_handler(func=lambda call: call.data.startswith('rent_'))
    def finalize_request(call):
        _, console_id, hours = call.data.split('_')
        user_id = str(call.from_user.id)
        
        requests = db.load(RENTAL_REQUESTS_FILE)
        consoles = db.load(CONSOLES_FILE)
        settings = db.load(SETTINGS_FILE)
        
        request_id = str(uuid.uuid4())
        new_request = {
            'id': request_id,
            'user_id': user_id,
            'console_id': console_id,
            'selected_hours': int(hours),
            'status': 'pending',
            'created_at': datetime.now().isoformat()
        }
        
        requests[request_id] = new_request
        db.save(RENTAL_REQUESTS_FILE, requests)
        
        console_name = consoles.get(console_id, {}).get('name', 'Консоль')
        bot.edit_message_text(f"✅ Заявка на *{console_name}* ({hours}ч) отправлена!\nОжидайте подтверждения администратором.", 
                            call.message.chat.id, call.message.message_id, parse_mode='Markdown')
        
        # Notify Admin
        admin_id = settings.get('admin_chat_id')
        if admin_id:
            try:
                admin_msg = f"🔔 *Новая заявка на аренду!*\n\n👤 От: {call.from_user.first_name}\n🎮 Консоль: {console_name}\n⏱ Время: {hours}ч"
                bot.send_message(admin_id, admin_msg, parse_mode='Markdown')
            except: pass

    @bot.callback_query_handler(func=lambda call: call.data == 'cancel_rental' or call.data == 'back_to_main')
    def cancel_rental(call):
        bot.delete_message(call.message.chat.id, call.message.message_id)
        bot.send_message(call.message.chat.id, "Действие отменено.")
