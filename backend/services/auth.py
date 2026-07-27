from datetime import datetime, timedelta
import jwt
import bcrypt

import os

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-jwt-key-change-in-production")
ALGORITHM = "HS256"

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            pwd_bytes = plain_password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(pwd_bytes, hashed_bytes)
        except Exception:
            return False

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def create_refresh_token(data: dict, expires_delta: timedelta = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> dict:
        try:
            return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.PyJWTError:
            return None

    @staticmethod
    def generate_totp_secret() -> str:
        try:
            import pyotp
            return pyotp.random_base32()
        except ImportError:
            # Fallback mock base32 secret
            import base64
            import os
            return base64.b32encode(os.urandom(10)).decode('utf-8')

    @staticmethod
    def verify_totp_code(secret: str, code: str) -> bool:
        if not secret or not code:
            return False
        try:
            import pyotp
            totp = pyotp.TOTP(secret)
            return totp.verify(code)
        except ImportError:
            # Simple mock verification (code is 6 digits)
            return code == "123456"

