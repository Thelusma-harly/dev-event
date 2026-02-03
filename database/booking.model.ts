import mongoose, {
  type HydratedDocument,
  type Model,
  Schema,
  Types,
} from "mongoose";

import { Event } from "./event.model";

export interface IBooking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = HydratedDocument<IBooking>;

const EMAIL_REGEX =
  /^(?=.{1,254}$)(?=.{1,64}@)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function isValidEmail(value: unknown): boolean {
  return typeof value === "string" && EMAIL_REGEX.test(value.trim());
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: isValidEmail,
        message: "email must be a valid email address",
      },
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.pre("save", async function (this: BookingDocument) {
  // Validate foreign-key like reference at write-time to avoid orphan bookings.
  const exists = await Event.exists({ _id: this.eventId });
  if (!exists) {
    throw new Error(`Event not found for eventId: ${this.eventId.toString()}`);
  }
});

export const Booking =
  (mongoose.models.Booking as Model<IBooking> | undefined) ??
  mongoose.model<IBooking>("Booking", BookingSchema);
