"""Shared enumerations used across models and schemas."""

from __future__ import annotations

from enum import StrEnum


class EmploymentType(StrEnum):
    INTERNSHIP = "internship"
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    FREELANCE = "freelance"


class WorkArrangement(StrEnum):
    ON_SITE = "on_site"
    REMOTE = "remote"
    HYBRID = "hybrid"


class ApplicationStatus(StrEnum):
    INTERESTED = "interested"
    APPLIED = "applied"
    UNDER_REVIEW = "under_review"
    ASSESSMENT = "assessment"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Priority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class InterviewType(StrEnum):
    PHONE = "phone"
    VIDEO = "video"
    IN_PERSON = "in_person"
    TECHNICAL = "technical"
    ASSESSMENT = "assessment"


class InterviewOutcome(StrEnum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DocumentCategory(StrEnum):
    RESUME = "resume"
    COVER_LETTER = "cover_letter"
    CERTIFICATE = "certificate"
    PORTFOLIO = "portfolio"
    OTHER = "other"


class ActivityType(StrEnum):
    APPLICATION_CREATED = "application_created"
    APPLICATION_UPDATED = "application_updated"
    STATUS_CHANGED = "status_changed"
    APPLICATION_ARCHIVED = "application_archived"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_UPDATED = "interview_updated"
    REMINDER_CREATED = "reminder_created"
    DOCUMENT_UPLOADED = "document_uploaded"


class ReminderCategory(StrEnum):
    FOLLOW_UP = "follow_up"
    INTERVIEW_PREP = "interview_prep"
    DEADLINE = "deadline"
    OTHER = "other"
