from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import engine
from auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    validate_password,
)
from deps import get_db, get_current_active_user, get_current_admin
from routers.chatbot_router import router as chatbot_router
from routers.ticket_router import router as ticket_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PulseMate Auth Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chatbot_router)
app.include_router(ticket_router)


@app.post("/auth/signup", response_model=schemas.UserOut)
def signup(user_create: schemas.UserCreate, db: Session = Depends(get_db)):
    if not validate_password(user_create.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password must be at least 8 characters and include uppercase, "
                "lowercase, number, and special character."
            ),
        )
    existing = db.query(models.User).filter(models.User.email == user_create.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if user_create.role not in {"user", "admin"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'user' or 'admin'")

    hashed_password = get_password_hash(user_create.password)
    user = models.User(email=user_create.email, hashed_password=hashed_password, role=user_create.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user


@app.get("/admin/users", response_model=list[schemas.UserOut])
def list_users(admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(models.User).all()
