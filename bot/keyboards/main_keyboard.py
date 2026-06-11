from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo


def get_main_menu_keyboard(mini_app_url: str) -> InlineKeyboardMarkup:
    """Returns the main menu inline keyboard with WebApp button."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "🔍 Browse Jobs",
            web_app=WebAppInfo(url=mini_app_url)
        )],
        [InlineKeyboardButton(
            "👤 My Profile",
            web_app=WebAppInfo(url=f"{mini_app_url}/profile")
        )],
    ])


def get_job_apply_keyboard(mini_app_url: str, job_id: str) -> InlineKeyboardMarkup:
    """Returns an inline keyboard with an Apply Now button for a specific job."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "Apply Now 🚀",
            web_app=WebAppInfo(url=f"{mini_app_url}/apply/{job_id}")
        )],
        [InlineKeyboardButton(
            "View Details 📋",
            web_app=WebAppInfo(url=f"{mini_app_url}/job/{job_id}")
        )],
    ])
