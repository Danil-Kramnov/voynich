from celery import Celery
from config import get_settings

settings = get_settings()

celery_app = Celery(
    "voynich",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)

celery_app.conf.task_routes = {
    "tasks.conversion_tasks.*": {"queue": "conversions"}
}

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Import tasks to register them
import tasks.conversion_tasks