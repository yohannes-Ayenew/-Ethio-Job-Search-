import os
import httpx
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    ContextTypes,
    ConversationHandler,
    CommandHandler,
    MessageHandler,
    filters,
)

TITLE, COMPANY, CATEGORY, LOCATION, JOB_TYPE, DESCRIPTION = range(6)

API_URL = os.getenv("API_URL", "http://backend:8000/api")
BOT_TOKEN = os.getenv("BOT_TOKEN", "")

async def post_job_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the job posting conversation."""
    await update.message.reply_text(
        "Let's post a new job! First, what is the Job Title?\n\n(Type /cancel to abort)",
        reply_markup=ReplyKeyboardRemove(),
    )
    return TITLE

async def post_job_title(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['title'] = update.message.text
    await update.message.reply_text("Great! What is the Company Name?")
    return COMPANY

async def post_job_company(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['company'] = update.message.text
    
    reply_keyboard = [['IT', 'Finance', 'NGO'], ['Health', 'Education', 'Engineering', 'Marketing']]
    await update.message.reply_text(
        "Choose a Category:",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True, resize_keyboard=True),
    )
    return CATEGORY

async def post_job_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['category'] = update.message.text
    await update.message.reply_text("What is the Location? (e.g., Addis Ababa, Remote)", reply_markup=ReplyKeyboardRemove())
    return LOCATION

async def post_job_location(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['location'] = update.message.text
    
    reply_keyboard = [['Full-time', 'Part-time'], ['Contract', 'Internship']]
    await update.message.reply_text(
        "Choose a Job Type:",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True, resize_keyboard=True),
    )
    return JOB_TYPE

async def post_job_type(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['job_type'] = update.message.text
    await update.message.reply_text(
        "Finally, please enter the Job Description:",
        reply_markup=ReplyKeyboardRemove()
    )
    return DESCRIPTION

async def post_job_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['description'] = update.message.text
    
    job_data = {
        "title": context.user_data['title'],
        "company": context.user_data['company'],
        "category": context.user_data['category'],
        "location": context.user_data['location'],
        "job_type": context.user_data['job_type'],
        "description": context.user_data['description'],
    }
    
    await update.message.reply_text("Submitting your job posting...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{API_URL}/jobs",
                json=job_data,
                headers={
                    "X-Bot-Token": BOT_TOKEN,
                    "telegram-user-id": str(update.message.from_user.id)
                }
            )
            response.raise_for_status()
            
            await update.message.reply_text(
                "✅ Job submitted successfully!\n"
                "Note: It is currently pending approval by an administrator. "
                "Once approved, it will be visible on the platform."
            )
    except httpx.HTTPStatusError as e:
        print(f"HTTP Error: {e.response.text}")
        await update.message.reply_text("❌ Failed to submit job due to an API error.")
    except Exception as e:
        print(f"Error submitting job: {e}")
        await update.message.reply_text("❌ An unexpected error occurred while submitting the job.")
        
    context.user_data.clear()
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancels and ends the conversation."""
    await update.message.reply_text("Job posting cancelled.", reply_markup=ReplyKeyboardRemove())
    context.user_data.clear()
    return ConversationHandler.END

def get_post_job_handler() -> ConversationHandler:
    return ConversationHandler(
        entry_points=[CommandHandler("postjob", post_job_start)],
        states={
            TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, post_job_title)],
            COMPANY: [MessageHandler(filters.TEXT & ~filters.COMMAND, post_job_company)],
            CATEGORY: [MessageHandler(filters.TEXT & ~filters.COMMAND, post_job_category)],
            LOCATION: [MessageHandler(filters.TEXT & ~filters.COMMAND, post_job_location)],
            JOB_TYPE: [MessageHandler(filters.TEXT & ~filters.COMMAND, post_job_type)],
            DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, post_job_description)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
