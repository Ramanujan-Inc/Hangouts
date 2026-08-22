class AppException(Exception):
    """Base exception class for application domain errors."""
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundError(AppException):
    """Raised when a requested resource is not found."""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=404)


class ForbiddenError(AppException):
    """Raised when a user lacks permissions to perform an operation."""
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(detail=detail, status_code=403)


class BadRequestError(AppException):
    """Raised when request data or operation is invalid."""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail=detail, status_code=400)


class ConflictError(AppException):
    """Raised when an operation conflicts with existing server state."""
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(detail=detail, status_code=409)


class PayloadTooLargeError(AppException):
    """Raised when request payload or storage quota limit is exceeded."""
    def __init__(self, detail: str = "Payload too large"):
        super().__init__(detail=detail, status_code=413)

