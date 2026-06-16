from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.business import Business
from app.crud.business import crud_business

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

def get_current_business(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Business:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        token_data_sub = payload.get("sub")
        if token_data_sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    
    # Check by email first
    business = crud_business.get_by_email(db, email=token_data_sub)
    if not business:
        # Fallback to checking by ID
        business = crud_business.get(db, id=token_data_sub)
        
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business.is_active:
        raise HTTPException(status_code=400, detail="Inactive business")
    return business
