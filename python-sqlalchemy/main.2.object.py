"""
This is using sessionmaker. Object oriented approach.
run with - `python main.2.object.py`
"""

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, sessionmaker, declarative_base

engine = sa.create_engine("sqlite:///:memory:", echo=True)  #echo=True prints more details in output
Session = sessionmaker(bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str]
    email: Mapped[str]

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"

def main() -> None:
    Base.metadata.create_all(engine)
    user = User(username="Test2", email="test2@email.com")

    with Session() as session:
        session.add(user)
        session.commit()
        print(session.query(User).all())

if __name__ == "__main__":
    main()