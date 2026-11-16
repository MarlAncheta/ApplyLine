"""Import all models so SQLAlchemy metadata is fully populated."""

from app.models.activity import Activity
from app.models.application import Application, application_documents
from app.models.company import Company
from app.models.document import Document
from app.models.enums import (
    ActivityType,
    ApplicationStatus,
    DocumentCategory,
    EmploymentType,
    InterviewOutcome,
    InterviewType,
    Priority,
    ReminderCategory,
    WorkArrangement,
)
from app.models.interview import Interview
from app.models.reminder import Reminder
from app.models.user import RefreshToken, User

__all__ = [
    "Activity",
    "ActivityType",
    "Application",
    "ApplicationStatus",
    "Company",
    "Document",
    "DocumentCategory",
    "EmploymentType",
    "Interview",
    "InterviewOutcome",
    "InterviewType",
    "Priority",
    "RefreshToken",
    "Reminder",
    "ReminderCategory",
    "User",
    "WorkArrangement",
    "application_documents",
]
