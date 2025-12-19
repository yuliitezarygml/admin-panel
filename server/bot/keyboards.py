from telebot import types

def create_user_keyboard(help_button_text='ℹ️ Помощь'):
    keyboard = types.ReplyKeyboardMarkup(row_width=2, resize_keyboard=True)
    keyboard.add(
        types.KeyboardButton('📊 Мой кабинет'),
        types.KeyboardButton('📝 Арендовать')
    )
    keyboard.add(
        types.KeyboardButton(help_button_text)
    )
    return keyboard

def create_admin_keyboard(help_button_text='ℹ️ Помощь'):
    keyboard = types.ReplyKeyboardMarkup(row_width=2, resize_keyboard=True)
    keyboard.add(
        types.KeyboardButton('⚙️ Админ панель'),
        types.KeyboardButton('📈 Статистика')
    )
    keyboard.add(
        types.KeyboardButton('👥 Пользователи'),
        types.KeyboardButton('🔔 Уведомления')
    )
    keyboard.add(
        types.KeyboardButton('📝 Арендовать'),
        types.KeyboardButton(help_button_text)
    )
    return keyboard

def get_main_keyboard(is_admin=False, help_button_text='ℹ️ Помощь'):
    return create_admin_keyboard(help_button_text) if is_admin else create_user_keyboard(help_button_text)

def create_console_keyboard(consoles, category=None):
    keyboard = types.InlineKeyboardMarkup(row_width=1)
    for cid, console in consoles.items():
        if console.get('status') == 'available':
            btn_text = f"🎮 {console['name']} - {console['rental_price']} MDL/ч"
            keyboard.add(types.InlineKeyboardButton(btn_text, callback_data=f"select_console_{cid}"))
    keyboard.add(types.InlineKeyboardButton("⬅️ Назад", callback_data="back_to_main"))
    return keyboard

def create_hours_keyboard(console_id):
    keyboard = types.InlineKeyboardMarkup(row_width=3)
    hours = [1, 2, 3, 4, 5, 6, 12, 24]
    btns = []
    for h in hours:
        label = f"{h}ч" if h < 24 else "Сутки"
        btns.append(types.InlineKeyboardButton(label, callback_data=f"rent_{console_id}_{h}"))
    keyboard.add(*btns)
    keyboard.add(types.InlineKeyboardButton("⬅️ Отмена", callback_data="cancel_rental"))
    return keyboard
