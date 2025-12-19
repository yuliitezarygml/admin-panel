import os
import uuid
from bot.bot_core import get_bot
from bot.keyboards import get_main_keyboard, create_console_keyboard, create_hours_keyboard
from core.database import db, CONSOLES_FILE, SETTINGS_FILE, USERS_FILE, DISCOUNTS_FILE, RENTALS_FILE, RENTAL_REQUESTS_FILE, KYC_REQUESTS_FILE
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
                'is_banned': False,
                'kyc_status': 'none'
            }
            db.save(USERS_FILE, users)
        
        user_status = users.get(user_id, {}).get('kyc_status', 'none')
        welcome_text = f"👋 Привет, {message.from_user.first_name}!\n\nДобро пожаловать в PlayStation Rental. Используйте меню ниже для навигации."
        if is_admin:
            welcome_text += "\n\n🛠 Вы вошли как администратор."
            
        bot.reply_to(message, welcome_text, reply_markup=get_main_keyboard(is_admin, help_btn_text, user_status))

    @bot.message_handler(func=lambda m: m.text == '📊 Мой кабинет')
    def my_cabinet(message):
        user_id = str(message.from_user.id)
        print(f"📊 User {user_id} requested cabinet")
        users = db.load(USERS_FILE)
        user = users.get(user_id, {})
        
        kyc_status = user.get('kyc_status', 'none')
        kyc_label = "✅ Верифицирован" if kyc_status == 'verified' else "⏳ Ожидает" if kyc_status == 'pending' else "❌ Не верифицирован"
        
        stats_text = f"👤 **Ваш кабинет**\n\n"
        stats_text += f"📅 Дата регистрации: {user.get('joined_at', 'Неизвестно')[:10]}\n"
        stats_text += f"🎮 Всего аренд: {len(user.get('rentals', []))}\n"
        stats_text += f"🛡️ Статус: {kyc_label}\n"
        
        bot.reply_to(message, stats_text, parse_mode='Markdown')

    @bot.message_handler(func=lambda m: True)
    def handle_all_messages(message):
        user_id = str(message.from_user.id)
        settings = db.load(SETTINGS_FILE)
        users = db.load(USERS_FILE)
        user = users.get(user_id, {})
        user_status = user.get('kyc_status', 'none')

        help_btn_text = settings.get('help_button_text', 'ℹ️ Помощь')
        help_text = settings.get('help_text', 'Текст помощи еще не настроен администратором.')
        
        print(f"📩 Message from {user_id}: {message.text}")
        
        if message.text == help_btn_text:
            print(f"ℹ️ User {user_id} requested help")
            bot.reply_to(message, help_text, parse_mode='Markdown')
        elif message.text == '📅 Скидки':
            print(f"📅 User {user_id} requested discounts")
            discounts = db.load(DISCOUNTS_FILE)
            
            if not discounts:
                bot.reply_to(message, "📅 *Календарь акций*\n\nНа ближайшее время акций не запланировано. Следите за обновлениями!", parse_mode='Markdown')
                return
            
            # Sort upcoming discounts
            now = datetime.now().strftime('%Y-%m-%d')
            upcoming = []
            for date, rule in sorted(discounts.items()):
                if date >= now:
                    type_label = "🔥 Скидка" if rule['type'] == 'discount' else "🛠 Перерыв"
                    val = f" {rule['value']}%" if rule['type'] == 'discount' else ""
                    desc = f" ({rule['description']})" if rule.get('description') else ""
                    upcoming.append(f"• *{date}*: {type_label}{val}{desc}")

            if not upcoming:
                bot.reply_to(message, "📅 *Календарь акций*\n\nНа ближайшее время акций не запланировано.", parse_mode='Markdown')
            else:
                msg = "📅 *Предстоящие акции и события:*\n\n" + "\n".join(upcoming[:10])
                bot.reply_to(message, msg, parse_mode='Markdown')

        elif message.text == '📝 Арендовать':
            if user_status != 'verified':
                bot.reply_to(message, "⚠️ *Доступ ограничен*\n\nДля аренды консолей необходимо сначала пройти верификацию профиля. Нажмите кнопку «🛡️ Верификация» в меню.", parse_mode='Markdown')
                return

            print(f"📝 User {user_id} started rental flow")
            
            # Check for Blackout
            today = datetime.now().strftime('%Y-%m-%d')
            discounts = db.load(DISCOUNTS_FILE)
            day_rule = discounts.get(today)
            
            if day_rule and day_rule.get('type') == 'blackout':
                msg = "🚫 *Технический перерыв*\n\n"
                msg += f"Сегодня консоли недоступны для аренды: {day_rule.get('description', 'Профилактические работы')}.\n\nПриходите завтра!"
                bot.reply_to(message, msg, parse_mode='Markdown')
                return

            # Continue with rental...
            consoles = db.load(CONSOLES_FILE)
            
            if not consoles:
                bot.reply_to(message, "❌ Список консолей пуст.")
                return
                
            from bot.keyboards import create_console_keyboard
            bot.reply_to(message, "🎮 Выберите консоль для аренды:", reply_markup=create_console_keyboard(consoles))
        elif message.text == '🛡️ Верификация':
            users = db.load(USERS_FILE)
            user_status = users.get(user_id, {}).get('kyc_status', 'none')
            
            if user_status == 'verified':
                bot.reply_to(message, "✅ Вы уже верифицированы!")
                return
            if user_status == 'pending':
                bot.reply_to(message, "⏳ Ваша заявка уже на проверке. Ожидайте.")
                return
                
            msg = bot.reply_to(message, "🛡️ *Верификация профиля*\n\nПожалуйста, отправьте ОДНО фото вашего документа (паспорт или права) для подтверждения личности.\n\n*Важно:* Фото должно быть четким, все данные должны быть читаемы.", parse_mode='Markdown')
            bot.register_next_step_handler(msg, process_kyc_photo)

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

    def process_kyc_photo(message):
        if not message.photo:
            bot.reply_to(message, "❌ Пожалуйста, отправьте именно фото.")
            return

        user_id = str(message.from_user.id)
        print(f"📸 Received KYC photo from {user_id}")
        
        try:
            # Create KYC folder if not exists
            kyc_dir = os.path.join('static', 'img', 'kyc')
            if not os.path.exists(kyc_dir): os.makedirs(kyc_dir)
            
            # Download photo
            file_info = bot.get_file(message.photo[-1].file_id)
            downloaded_file = bot.download_file(file_info.file_path)
            
            filename = f"{user_id}_{uuid.uuid4().hex[:8]}.jpg"
            save_path = os.path.join(kyc_dir, filename)
            
            with open(save_path, 'wb') as f:
                f.write(downloaded_file)
                
            photo_url = f"/static/img/kyc/{filename}"
            
            # Create request in DB
            from core.database import KYC_REQUESTS_FILE
            requests = db.load(KYC_REQUESTS_FILE)
            
            req_id = str(uuid.uuid4())
            requests[req_id] = {
                'user_id': user_id,
                'photo_url': photo_url,
                'status': 'pending',
                'timestamp': datetime.now().isoformat()
            }
            db.save(KYC_REQUESTS_FILE, requests)
            
            # Update user status
            users = db.load(USERS_FILE)
            if user_id in users:
                users[user_id]['kyc_status'] = 'pending'
                db.save(USERS_FILE, users)
                
            bot.reply_to(message, "✅ Фото получено! Администрация проверит ваши данные в течение 24 часов.")
            
            # Notify Admin
            settings = db.load(SETTINGS_FILE)
            admin_id = settings.get('admin_chat_id')
            if admin_id:
                bot.send_message(admin_id, f"🔔 *Новая заявка на верификацию!*\n\n👤 От: {message.from_user.first_name} (@{message.from_user.username})", parse_mode='Markdown')
                
        except Exception as e:
            print(f"Error processing KYC photo: {e}")
            bot.reply_to(message, "❌ Произошла ошибка при сохранении фото. Попробуйте позже.")

    @bot.callback_query_handler(func=lambda call: call.data.startswith('select_console_'))
    def select_console(call):
        console_id = call.data.replace('select_console_', '')
        consoles = db.load(CONSOLES_FILE)
        console = consoles.get(console_id)
        
        if not console:
            bot.answer_callback_query(call.id, "❌ Консоль не найдена.")
            return

        if console.get('status') == 'rented':
            rentals = db.load(RENTALS_FILE)
            active_rental = None
            for rid, r in rentals.items():
                if r.get('console_id') == console_id and r.get('status') == 'active':
                    active_rental = r
                    break
            
            msg = f"🔴 *{console['name']}* сейчас занята.\n\n"
            if active_rental and active_rental.get('expected_end_time'):
                end_time = datetime.fromisoformat(active_rental['expected_end_time'])
                msg += f"Ожидаемое время освобождения: *{end_time.strftime('%H:%M')}* ({end_time.strftime('%d.%m')})"
            else:
                msg += "Ожидайте освобождения."
            
            bot.answer_callback_query(call.id, "⚠️ Консоль занята")
            bot.edit_message_text(msg, call.message.chat.id, call.message.message_id, parse_mode='Markdown')
            return

        # Calculate Price with Discount
        base_price = console['rental_price']
        final_price = base_price
        
        today = datetime.now().strftime('%Y-%m-%d')
        discounts = db.load(DISCOUNTS_FILE)
        day_rule = discounts.get(today)
        
        price_text = f"💰 Цена: {base_price} MDL/ч"
        if day_rule and day_rule.get('type') == 'discount':
            discount_val = day_rule.get('value', 0)
            final_price = round(base_price * (1 - discount_val / 100))
            price_text = f"💰 Цена: ~~{base_price}~~ *{final_price} MDL/ч* (Скидка {discount_val}%! 🔥)"

        from bot.keyboards import create_hours_keyboard
        text = f"🎮 *{console['name']}*\n{price_text}\n\nВыберите время аренды:"
        
        # Send/Edit with photo if exists
        photo_path = console.get('photo_path')
        if photo_path and console.get('show_photo_in_bot', True):
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
