from pydantic import BaseModel, ConfigDict


class StorageUsageResponse(BaseModel):
    used_bytes: int
    max_bytes: int
    percentage_used: float

    model_config = ConfigDict(from_attributes=True)
