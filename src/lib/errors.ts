/**
 * Standardized Error Handling
 * Classes for consistent error reporting across the application
 */

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly metadata?: Record<string, any>;

    constructor(message: string, code: string, statusCode: number = 500, metadata?: Record<string, any>) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = true; // Trusted operational errors (vs programming bugs)
        this.metadata = metadata;

        // Restore prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, metadata?: Record<string, any>) {
        super(message, 'VALIDATION_ERROR', 400, metadata);
    }
}

export class NetworkError extends AppError {
    constructor(message: string, metadata?: Record<string, any>) {
        super(message, 'NETWORK_ERROR', 503, metadata);
    }
}

export class BusinessError extends AppError {
    constructor(message: string, code: string = 'BUSINESS_ERROR', metadata?: Record<string, any>) {
        super(message, code, 422, metadata);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string, metadata?: Record<string, any>) {
        super(message, 'NOT_FOUND', 404, metadata);
    }
}
