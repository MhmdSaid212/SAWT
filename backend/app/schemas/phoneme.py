from pydantic import BaseModel, Field


class PhonemeCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=100)
    language: str = Field(min_length=2, max_length=20)
    description: str | None = None




class PhonemeUpdate(BaseModel):

    symbol: str = Field(min_length=1, max_length=20)

    name: str = Field(min_length=1, max_length=100)

    language: str = Field(min_length=2, max_length=20)

    description: str | None = None


    
class PhonemeResponse(BaseModel):
    id: str
    symbol: str
    name: str
    language: str
    description: str | None