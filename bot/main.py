import os
from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, Update
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
MINI_APP_URL = os.getenv("MINI_APP_URL")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Greet the user in English and Amharic with a Browse Jobs button."""
    user = update.effective_user
    first_name = user.first_name or "there"

    message = (
        f"👋 Hello {first_name}!\n\n"
        "🇬🇧 Welcome to EthioJobs! Find your dream job in Ethiopia.\n\n"
        "🇪🇹 እንኳን ወደ ኢትዮጆብስ በደህና መጡ! በኢትዮጵያ ውስጥ ያለዎትን ሥራ ያግኙ።\n\n"
        "Tap the button below to start browsing jobs 👇"
    )

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "🔍 Browse Jobs",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])

    await update.message.reply_text(message, reply_markup=keyboard)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show list of commands and how the app works."""
    help_text = (
        "📖 <b>EthioJobs Help</b>\n\n"
        "Here's how to use EthioJobs:\n\n"
        "🔹 /start — Open the main menu and browse jobs\n"
        "🔹 /help — Show this help message\n\n"
        "📱 <b>How it works:</b>\n"
        "1. Tap '🔍 Browse Jobs' to open the Mini App\n"
        "2. Search and filter jobs by category, location, or keyword\n"
        "3. View job details and tap 'Apply Now' to submit your application\n"
        "4. Track your applications in your Profile page\n\n"
        "💡 <b>Tips:</b>\n"
        "• Your Telegram profile is used to pre-fill your info\n"
        "• Add your CV link and phone number in your profile\n"
        "• You can share interesting jobs with friends!\n\n"
        "🇪🇹 ኢትዮጆብስን እንዴት እንደሚጠቀሙ ለማወቅ /start ይጫኑ"
    )
    await update.message.reply_html(help_text)


async def post_init(application: Application):
    """Set bot commands after initialization."""
    await application.bot.set_my_commands([
        ("start", "Open EthioJobs"),
        ("help", "How to use EthioJobs"),
    ])


def main():
    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))

    print("🤖 EthioJobs Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
