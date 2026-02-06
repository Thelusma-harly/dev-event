"use client";

import { createBooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import { useState } from "react";

const BookEvent = ({ eventId }: { eventId: string }) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const result = await createBooking({
        eventId,
        email,
      });

      if (result.success) {
        setSubmitted(true);
        setEmail("");
        posthog.capture("booking_created", {
          eventId,
          email,
        });
      } else {
        setError(result.error || "Failed to create booking. Please try again.");
        posthog.captureException(new Error(`Booking failed: ${result.error}`));
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMsg);
      console.error("Error booking event:", error);
      posthog.captureException(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="book-event">
      {submitted ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-green-400">Thank you for signing up!</p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
              setError(null);
            }}
            className="text-xs text-light-100 hover:text-light-200">
            Book another event
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={loading}
              required
            />
          </div>
          <button type="submit" className="button-submit" disabled={loading}>
            {loading ? "Booking..." : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
};

export default BookEvent;
