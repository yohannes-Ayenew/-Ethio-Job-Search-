import os
import httpx
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, Update
from telegram.ext import ContextTypes

MINI_APP_URL = os.getenv("MINI_APP_URL", "")
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/api")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show a welcome message with a single WebApp button to open the Mini App."""
    user = update.effective_user
    first_name = user.first_name or "there"

    message = (
        f"👋 Hello, *{first_name}*!\n\n"
        "🇪🇹 *EthioJobs* — Find & post jobs in Ethiopia.\n\n"
        "Tap the button below to open the app 👇"
    )

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open EthioJobs",
            web_app=WebAppInfo(url=MINI_APP_URL),
        )],
    ])

    await update.message.reply_markdown(message, reply_markup=keyboard)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show how to use the bot."""
    text = (
        "📖 *EthioJobs Help*\n\n"
        "🔹 *Browse Jobs* — Open the app and search by category, location, or keyword\n"
        "🔹 *Post a Job* — Inside the app, tap ➕ Post Job\n"
        "🔹 *Apply* — Tap any listing and hit Apply Now\n\n"
        "🛠 *Commands*\n"
        "/start — Open the Mini App\n"
        "/myjobs — See your posted listings\n\n"
        "🇪🇹 Built for Ethiopia's job market."
    )
    await update.message.reply_markdown(text)


async def my_jobs_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """List jobs posted by the user, with a button to open the app."""
    user_id = update.message.from_user.id

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(f"{API_URL}/jobs/user/{user_id}")
            response.raise_for_status()
            jobs = response.json()

        if not jobs:
            await update.message.reply_text(
                "You haven't posted any jobs yet.\n\nTap ➕ Post Job inside the app to get started!",
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("➕ Post a Job", web_app=WebAppInfo(url=f"{MINI_APP_URL}/post-job")),
                ]]),
            )
            return

        lines = [f"📋 *Your Posted Jobs ({len(jobs)}):*\n"]
        for job in jobs:
            status = "✅ Approved" if job.get("is_approved") else "⏳ Pending"
            lines.append(f"🔹 *{job['title']}*\n🏢 {job['company']} · {status}\n")

        await update.message.reply_markdown(
            "\n".join(lines),
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔍 Open EthioJobs", web_app=WebAppInfo(url=MINI_APP_URL)),
            ]]),
        )

    except Exception as e:
        print(f"Error fetching user jobs: {e}")
        await update.message.reply_text("❌ Could not load your jobs. Make sure the backend is running.")
