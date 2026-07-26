from sqlalchemy.orm import Session
from backend.models.models import User
from backend.repositories.base import BaseRepository

class UserRepository(BaseRepository):
    def get_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: str) -> User:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
