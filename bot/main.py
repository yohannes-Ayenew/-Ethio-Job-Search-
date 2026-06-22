import os
from dotenv import load_dotenv

load_dotenv()

from telegram import Update, MenuButtonWebApp, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler
from handlers.commands import start, help_command, my_jobs_command
from handlers.admin import list_pending_jobs, handle_job_action

BOT_TOKEN = os.getenv("BOT_TOKEN")
MINI_APP_URL = os.getenv("MINI_APP_URL", "")


async def post_init(application: Application):
    """Configure bot commands and the persistent WebApp menu button."""

    # Set the bottom-left menu button to open the Mini App directly
    if MINI_APP_URL:
        await application.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Open EthioJobs",
                web_app=WebAppInfo(url=MINI_APP_URL),
            )
        )

    # Set visible slash commands
    await application.bot.set_my_commands([
        ("start", "Open EthioJobs"),
        ("help",  "How to use EthioJobs"),
        ("myjobs", "View your posted jobs"),
        ("pendingjobs", "Pending approvals (Admin only)"),
    ])


def main():
    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("myjobs", my_jobs_command))
    app.add_handler(CommandHandler("pendingjobs", list_pending_jobs))
    app.add_handler(CallbackQueryHandler(handle_job_action))

    print("🤖 EthioJobs Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
