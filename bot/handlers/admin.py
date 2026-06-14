import os
import httpx
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

API_URL = os.getenv("API_URL", "http://backend:8000/api")
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_ID = os.getenv("ADMIN_ID")

async def is_admin(user_id: int) -> bool:
    if not ADMIN_ID:
        return True # Default allow for demo
    return str(user_id) == ADMIN_ID

async def list_pending_jobs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if not await is_admin(user_id):
        await update.message.reply_text("⛔ You are not authorized to use this command.")
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{API_URL}/jobs/admin/pending",
                headers={"X-Bot-Token": BOT_TOKEN}
            )
            response.raise_for_status()
            jobs = response.json()
            
            if not jobs:
                await update.message.reply_text("✅ No pending jobs at the moment!")
                return
                
            await update.message.reply_text(f"📋 Found {len(jobs)} pending jobs:")
            
            for job in jobs:
                message_text = (
                    f"*{job['title']}*\n"
                    f"🏢 {job['company']}\n"
                    f"📍 {job['location']}\n"
                    f"💼 {job['job_type']}\n\n"
                    f"{job['description'][:200]}..."
                )
                
                keyboard = [
                    [
                        InlineKeyboardButton("✅ Approve", callback_data=f"approve_{job['id']}"),
                        InlineKeyboardButton("❌ Reject", callback_data=f"reject_{job['id']}")
                    ]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.message.reply_text(
                    message_text,
                    reply_markup=reply_markup,
                    parse_mode="Markdown"
                )
                
    except Exception as e:
        print(f"Error fetching pending jobs: {e}")
        await update.message.reply_text("❌ Failed to fetch pending jobs. Check API connection.")

async def handle_job_action(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user_id = query.from_user.id
    
    if not await is_admin(user_id):
        await query.answer("⛔ Unauthorized", show_alert=True)
        return
        
    await query.answer()
    
    data = query.data
    action, job_id = data.split("_", 1)
    
    try:
        async with httpx.AsyncClient() as client:
            if action == "approve":
                response = await client.patch(
                    f"{API_URL}/jobs/{job_id}/approve",
                    headers={"X-Bot-Token": BOT_TOKEN}
                )
                response.raise_for_status()
                await query.edit_message_text(f"✅ Job {job_id} approved!\n\n" + query.message.text)
            elif action == "reject":
                # For reject, we can just delete the message or ideally call a DELETE API.
                # Since we don't have a DELETE API for jobs, we'll just remove the message.
                await query.edit_message_text(f"❌ Job {job_id} rejected.\n\n" + query.message.text)
    except Exception as e:
        print(f"Error processing job action: {e}")
        await query.message.reply_text("❌ Failed to process action.")
