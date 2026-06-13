import os
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler
from handlers.commands import start, help_command

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")


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
