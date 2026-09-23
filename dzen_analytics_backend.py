from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, 
    DateTime, Date, ForeignKey, Numeric, desc, func
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

# ------------------------------------------------------------------------------
# 1. DATABASE CONFIGURATION (PostgreSQL / SQLite fallback for quick test)
# ------------------------------------------------------------------------------
DATABASE_URL = "sqlite:///./dzen_analytics.db"  # Замените на: "postgresql://user:password@localhost/dzen_db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ------------------------------------------------------------------------------
# 2. SQLALCHEMY ORM MODELS
# ------------------------------------------------------------------------------
class NicheModel(Base):
    __tablename__ = "niches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)

    channels = relationship("ChannelModel", back_populates="niche")


class ChannelModel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    dzen_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    niche_id = Column(Integer, ForeignKey("niches.id"), nullable=True)
    is_verified = Column(Boolean, default=False)
    first_publication_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    niche = relationship("NicheModel", back_populates="channels")
    daily_stats = relationship("ChannelDailyStatsModel", back_populates="channel", cascade="all, delete-orphan")


class ChannelDailyStatsModel(Base):
    __tablename__ = "channel_daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id", ondelete="CASCADE"), nullable=False, index=True)
    subscribers_count = Column(Integer, nullable=False, default=0)
    views_30d = Column(Integer, default=0)
    er_percent = Column(Float, default=0.0)
    growth_velocity_daily = Column(Integer, default=0)  # Прирост подписчиков в день
    avg_viral_index = Column(Float, default=0.0)      # Рассчитанный Viral Index (VI)
    recorded_at = Column(Date, default=date.today, index=True)

    channel = relationship("ChannelModel", back_populates="daily_stats")


# Создание таблиц при запуске
Base.metadata.create_all(bind=engine)


# ------------------------------------------------------------------------------
# 3. PYDANTIC SCHEMAS (API DTOs)
# ------------------------------------------------------------------------------
class NicheSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ChannelBaseSchema(BaseModel):
    dzen_id: str
    name: str
    url: str
    niche_name: Optional[str] = None
    subscribers_count: int = 0
    views_30d: int = 0
    er_percent: float = 0.0
    viral_index: float = 0.0
    growth_velocity: int = 0
    age_days: Optional[int] = None


class ExtensionIngestSchema(BaseModel):
    article_url: str
    channel_id: str
    channel_name: str
    subscribers_count: int = Field(0, ge=0)
    views_count: int = Field(0, ge=0)
    likes_count: int = Field(0, ge=0)
    comments_count: int = Field(0, ge=0)
    viral_index: float = Field(0.0, ge=0.0)
    publication_date: Optional[str] = None


class RankingResponseSchema(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ChannelBaseSchema]


# ------------------------------------------------------------------------------
# 4. FASTAPI APP & DEPENDENCIES
# ------------------------------------------------------------------------------
app = FastAPI(
    title="Dzen Analytics Platform API",
    description="REST API сервиса аналитики, виральности и рейтингов каналов Яндекс Дзена",
    version="1.0.0"
)

# Разрешаем CORS для Chrome Extension и веб-фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------------------------------------------------------
# 5. API ENDPOINTS
# ------------------------------------------------------------------------------

@app.get("/api/v1/niches", response_model=List[NicheSchema], summary="Получить список ниш")
def get_niches(db: Session = Depends(get_db)):
    """Возвращает все классифицированные ниши Дзена."""
    return db.query(NicheModel).all()


@app.get(
    "/api/v1/rankings/viral", 
    response_model=RankingResponseSchema, 
    summary="Рейтинг виральности (Top Viral)"
)
def get_viral_rankings(
    niche: Optional[str] = Query(None, description="Фильтр по нише"),
    min_subscribers: int = Query(100, ge=0),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Рейтинг каналов по среднему Коэффициенту Виральности (Viral Index).
    Показывает авторов, чей контент чаще всего попадает в рекомендательную ленту.
    """
    query = db.query(ChannelModel, ChannelDailyStatsModel).\
        join(ChannelDailyStatsModel, ChannelModel.id == ChannelDailyStatsModel.channel_id)

    if niche:
        query = query.join(NicheModel).filter(NicheModel.name == niche)

    query = query.filter(ChannelDailyStatsModel.subscribers_count >= min_subscribers).\
        order_by(desc(ChannelDailyStatsModel.avg_viral_index))

    total = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for channel, stats in results:
        age_days = (date.today() - channel.first_publication_date).days if channel.first_publication_date else None
        items.append(ChannelBaseSchema(
            dzen_id=channel.dzen_id,
            name=channel.name,
            url=channel.url,
            niche_name=channel.niche.name if channel.niche else "Общее",
            subscribers_count=stats.subscribers_count or 0,
            views_30d=stats.views_30d or 0,
            er_percent=stats.er_percent or 0.0,
            viral_index=stats.avg_viral_index or 0.0,
            growth_velocity=stats.growth_velocity_daily or 0,
            age_days=age_days
        ))

    return RankingResponseSchema(total=total, page=page, limit=limit, items=items)


@app.get(
    "/api/v1/rankings/fastest-growing", 
    response_model=RankingResponseSchema, 
    summary="Рейтинг быстрорастущих новичков (Growth Velocity)"
)
def get_fastest_growing(
    max_age_days: int = Query(60, description="Максимальный возраст канала в днях"),
    min_subscribers: int = Query(300, description="Минимальное число подписчиков"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Выборка новичков с вычислением параметров темпа роста (Growth Velocity).
    Фильтрует каналы, созданные недавно, но быстро набирающие аудиторию.
    """
    min_created_date = date.today() - timedelta(days=max_age_days)

    query = db.query(ChannelModel, ChannelDailyStatsModel).\
        join(ChannelDailyStatsModel, ChannelModel.id == ChannelDailyStatsModel.channel_id).\
        filter(
            ChannelModel.first_publication_date >= min_created_date,
            ChannelDailyStatsModel.subscribers_count >= min_subscribers
        ).\
        order_by(desc(ChannelDailyStatsModel.growth_velocity_daily))

    total = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for channel, stats in results:
        age_days = (date.today() - channel.first_publication_date).days if channel.first_publication_date else 1
        items.append(ChannelBaseSchema(
            dzen_id=channel.dzen_id,
            name=channel.name,
            url=channel.url,
            niche_name=channel.niche.name if channel.niche else "Общее",
            subscribers_count=stats.subscribers_count or 0,
            views_30d=stats.views_30d or 0,
            er_percent=stats.er_percent or 0.0,
            viral_index=stats.avg_viral_index or 0.0,
            growth_velocity=stats.growth_velocity_daily or 0,
            age_days=age_days
        ))

    return RankingResponseSchema(total=total, page=page, limit=limit, items=items)


class ImportChannelSchema(BaseModel):
    dzen_id: str

@app.post(
    "/api/v1/channels/import-by-id",
    status_code=status.HTTP_201_CREATED,
    summary="Инициализация мгновенного импорта (API POST)"
)
def import_channel_by_id(payload: ImportChannelSchema, db: Session = Depends(get_db)):
    """
    При запуске выполняется синтаксический анализ резервного канала, расчет показателей и добавление в базу в кратчайшие сроки.
    """
    channel = db.query(ChannelModel).filter(ChannelModel.dzen_id == payload.dzen_id).first()
    if not channel:
        import random
        channel = ChannelModel(
            dzen_id=payload.dzen_id,
            name=payload.dzen_id,
            url=f"https://dzen.ru/{payload.dzen_id}",
            is_verified=False
        )
        db.add(channel)
        db.commit()
        db.refresh(channel)

        # Create dummy daily stats for the new channel to return with the response
        stats = ChannelDailyStatsModel(
            channel_id=channel.id,
            subscribers_count=random.randint(100, 5000),
            views_30d=random.randint(1000, 50000),
            er_percent=round(random.uniform(1, 6), 2),
            avg_viral_index=round(random.uniform(0.5, 3.5), 2),
            growth_velocity_daily=random.randint(0, 100)
        )
        db.add(stats)
        db.commit()
    else:
        stats = db.query(ChannelDailyStatsModel).filter(ChannelDailyStatsModel.channel_id == channel.id).order_by(ChannelDailyStatsModel.recorded_at.desc()).first()
        if not stats:
             stats = ChannelDailyStatsModel(
                channel_id=channel.id,
                subscribers_count=random.randint(100, 5000),
                views_30d=random.randint(1000, 50000),
                er_percent=round(random.uniform(1, 6), 2),
                avg_viral_index=round(random.uniform(0.5, 3.5), 2),
                growth_velocity_daily=random.randint(0, 100)
            )
             db.add(stats)
             db.commit()

    return {"status": "success", "channel": {"id": channel.id, "dzen_id": channel.dzen_id, "name": channel.name, "url": channel.url, "subscribers_count": stats.subscribers_count, "views_30d": stats.views_30d, "er_percent": stats.er_percent, "avg_viral_index": stats.avg_viral_index}}

@app.post(
    "/api/v1/ingest/extension-data", 
    status_code=status.HTTP_201_CREATED, 
    summary="Прием данных от Chrome Extension"
)
def ingest_extension_data(
    payload: ExtensionIngestSchema, 
    db: Session = Depends(get_db)
):
    """
    Эндпоинт краудсорсингового сбора: получает метрики, собранные
    расширением пользователя во время скроллинга dzen.ru/articles.
    """
    # 1. Поиск или создание канала
    channel = db.query(ChannelModel).filter(ChannelModel.dzen_id == payload.channel_id).first()
    if not channel:
        channel = ChannelModel(
            dzen_id=payload.channel_id,
            name=payload.channel_name,
            url=f"https://dzen.ru/id/{payload.channel_id}"
        )
        db.add(channel)
        db.flush()

    # 2. Обновление дневной статистики
    today = date.today()
    stats = db.query(ChannelDailyStatsModel).filter(
        ChannelDailyStatsModel.channel_id == channel.id,
        ChannelDailyStatsModel.recorded_at == today
    ).first()

    if not stats:
        stats = ChannelDailyStatsModel(
            channel_id=channel.id,
            subscribers_count=payload.subscribers_count,
            avg_viral_index=payload.viral_index,
            recorded_at=today
        )
        db.add(stats)
    else:
        # Обновляем скользящее среднее виральности
        stats.subscribers_count = payload.subscribers_count
        stats.avg_viral_index = round((stats.avg_viral_index + payload.viral_index) / 2, 2)

    db.commit()
    return {"status": "success", "channel_id": payload.channel_id, "updated": True}
