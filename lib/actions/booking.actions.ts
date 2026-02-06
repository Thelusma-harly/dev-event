"use server";

import { Booking } from "@/database";
import { connectToDatabase } from "../mongodb";
import { Types } from "mongoose";

export const createBooking = async ({
  eventId,
  email,
}: {
  eventId: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate inputs
    if (!eventId || !email) {
      return { success: false, error: "eventId and email are required" };
    }

    if (!email.includes("@")) {
      return { success: false, error: "Invalid email format" };
    }

    await connectToDatabase();

    // Convert string eventId to ObjectId
    const objectId = new Types.ObjectId(eventId);

    await Booking.create({
      eventId: objectId,
      email: email.toLowerCase().trim(),
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating booking:", errorMessage);
    return { success: false, error: errorMessage };
  }
};
