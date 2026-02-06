import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";

export type EventMode = "online" | "offline" | "hybrid" | (string & {});

export interface IEvent {
  title: string;
  /** Auto-generated from title in a pre-save hook. */
  slug?: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // Normalized time string (HH:mm)
  mode: EventMode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventDocument = HydratedDocument<IEvent>;

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function slugify(title: string): string {
  // Create a stable, URL-friendly slug (lowercase, hyphen-separated).
  return title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeIsoDate(input: string): string {
  // Normalize to an ISO-8601 date-only string (YYYY-MM-DD).
  // Avoid timezone shifts by formatting using the local calendar date.
  const trimmed = input.trim();
  const isoDatePrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDatePrefix) return isoDatePrefix[1];

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeTime(input: string): string {
  // Store time consistently as 24h HH:mm.
  const raw = input.trim();

  const twentyFourHour = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  const ampm = /^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)$/i;

  const m24 = raw.match(twentyFourHour);
  if (m24) return `${m24[1]}:${m24[2]}`;

  const m12 = raw.match(ampm);
  if (!m12) throw new Error(`Invalid time: ${input}`);

  let hours = Number(m12[1]);
  const minutes = Number(m12[2] ?? "00");
  const period = m12[3].toLowerCase();

  if (hours < 1 || hours > 12) throw new Error(`Invalid time: ${input}`);
  if (minutes < 0 || minutes > 59) throw new Error(`Invalid time: ${input}`);

  if (period === "pm" && hours !== 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "title is required",
      },
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "description is required",
      },
    },
    overview: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "overview is required",
      },
    },
    image: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "image is required",
      },
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "venue is required",
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "location is required",
      },
    },
    date: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "date is required",
      },
    },
    time: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "time is required",
      },
    },
    mode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "mode is required",
      },
    },
    audience: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "audience is required",
      },
    },
    agenda: {
      type: [
        {
          type: String,
          required: true,
          trim: true,
        },
      ],
      required: true,
      validate: {
        validator: (v: string[]) =>
          Array.isArray(v) && v.length > 0 && v.every(isNonEmptyString),
        message: "agenda must be a non-empty array of strings",
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "organizer is required",
      },
    },
    tags: {
      type: [
        {
          type: String,
          required: true,
          trim: true,
        },
      ],
      required: true,
      validate: {
        validator: (v: string[]) =>
          Array.isArray(v) && v.length > 0 && v.every(isNonEmptyString),
        message: "tags must be a non-empty array of strings",
      },
    },
  },
  {
    timestamps: true,
  },
);

EventSchema.index({ slug: 1 }, { unique: true });

EventSchema.pre("save", async function () {
  try {
    // Only regenerate the slug when the title changes.
    if (!this.slug || this.isModified("title")) {
      this.slug = slugify(this.title);
    }

    // Normalize date/time on every save to keep stored values consistent.
    this.date = normalizeIsoDate(this.date);
    this.time = normalizeTime(this.time);

    // Defensive check: required fields should never be empty strings.
    const requiredStrings: Array<
      keyof Pick<
        IEvent,
        | "title"
        | "description"
        | "overview"
        | "image"
        | "venue"
        | "location"
        | "date"
        | "time"
        | "mode"
        | "audience"
        | "organizer"
      >
    > = [
      "title",
      "description",
      "overview",
      "image",
      "venue",
      "location",
      "date",
      "time",
      "mode",
      "audience",
      "organizer",
    ];

    for (const key of requiredStrings) {
      const value = this[key];
      if (!isNonEmptyString(value)) {
        throw new Error(`${key} is required`);
      }
    }

    if (!Array.isArray(this.agenda) || this.agenda.length === 0) {
      throw new Error("agenda must be a non-empty array");
    }

    if (!Array.isArray(this.tags) || this.tags.length === 0) {
      throw new Error("tags must be a non-empty array");
    }
  } catch (error) {
    throw error as Error;
  }
});

export const Event =
  (mongoose.models.Event as Model<IEvent> | undefined) ??
  mongoose.model<IEvent>("Event", EventSchema);
