"use client";

import { useEffect } from "react";
import {
  NotFoundError,
  GeneralError,
  UnauthorizedError,
  ForbiddenError,
  MaintenanceError,
} from "@/components/errors";
import { getErrorType, ErrorType, logError } from "@/lib/errors";

function getErrorComponent(errorType: ErrorType) {
  switch (errorType) {
    case ErrorType.UNAUTHORIZED:
      return UnauthorizedError;
    case ErrorType.FORBIDDEN:
      return ForbiddenError;
    case ErrorType.NOT_FOUND:
      return NotFoundError;
    case ErrorType.SERVICE_UNAVAILABLE:
      return MaintenanceError;
    default:
      return GeneralError;
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, "Global Error Boundary");
  }, [error]);

  const errorType = getErrorType(error);
  const ErrorComponent = getErrorComponent(errorType);

  if (ErrorComponent === GeneralError) {
    return (
      <html>
        <body>
          <div className="h-svh w-full">
            <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
              <h1 className="text-[7rem] leading-tight font-bold">500</h1>
              <span className="font-medium">
                Oops! Something went wrong {`:')`}
              </span>
              <p className="text-muted-foreground text-center">
                We apologize for the inconvenience. <br /> Please try again
                later.
              </p>
              <div className="mt-6 flex gap-4">
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => reset()}
                >
                  Try Again
                </button>
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  onClick={() => (window.location.href = "/")}
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return <ErrorComponent />;
}
