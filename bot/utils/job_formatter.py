def format_job_card(job: dict) -> str:
    """Format a job dict into a clean Telegram HTML message card."""
    title = job.get("title", "Untitled")
    company = job.get("company", "Unknown")
    location = job.get("location", "N/A")
    category = job.get("category", "")
    job_type = job.get("job_type", "")
    salary = job.get("salary")
    deadline = job.get("deadline")

    lines = [
        f"💼 <b>{title}</b>",
        f"🏢 {company}",
        f"📍 {location}",
    ]

    if category:
        lines.append(f"🏷️ {category}")
    if job_type:
        lines.append(f"⏰ {job_type}")
    if salary:
        lines.append(f"💰 {salary}")
    if deadline:
        lines.append(f"📅 Deadline: {deadline}")

    lines.append("")
    lines.append("Tap below to apply 👇")

    return "\n".join(lines)
