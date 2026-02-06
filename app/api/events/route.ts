import { Event } from "@/database";
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@uploadcare/upload-client";

/**
 * Handle creation of a new event submitted as multipart/form-data.
 *
 * Expects the request body to be form data containing an "image" file (required)
 * and string fields including "tags" and "agenda" (both JSON-encoded). Saves
 * the uploaded image to Uploadcare, constructs a preview URL, creates an Event
 * document in the database with the provided fields plus the image URL, and
 * returns a JSON response describing the result.
 *
 * @param req - NextRequest whose formData must include:
 *   - "image": File (required)
 *   - "tags": JSON-encoded array
 *   - "agenda": JSON-encoded array or object
 *   - other event fields as form fields
 * @returns A NextResponse containing JSON: on success includes a success message
 * and the created event; on failure includes an error message (and error detail when available).
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await req.formData();

    let event;

    try {
      event = Object.fromEntries(formData.entries());
      // Convert File to Buffer/ArrayBuffer for the upload client
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { message: "Invalid JSON Format" },
        { status: 400 },
      );
    }

    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Image file is required !" },
        { status: 400 },
      );
    }

    const fileData = await file.arrayBuffer();

    const fileBuffer = Buffer.from(fileData);

    const result = await uploadFile(fileBuffer, {
      publicKey: process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY!,
      store: "auto",
      fileName: file.name,
    }); // This is the persistent link to your image

    const subdomain = process.env.NEXT_PUBLIC_UPLOADCARE_SUBDOMAIN;
    const uuid = result.uuid; // Get this from the upload result

    // Structure for the Preview URL
    const imageUrl = `https://${subdomain}.ucarecd.net/${uuid}/-/preview/1000x562/`;
    // 3. Prepare the final event object for MongoDB
    event = Object.fromEntries(formData.entries());

    const tags = JSON.parse(formData.get("tags") as string);
    const agenda = JSON.parse(formData.get("agenda") as string);

    event.image = imageUrl;

    const newEvent = await Event.create({
      ...event,
      tags,
      agenda,
    });

    return NextResponse.json(
      { message: "Event Created Successfully!", event: newEvent },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Creation Failed!",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

/**
 * Fetches all events from the database ordered by newest first and returns them as a JSON response.
 *
 * @returns A NextResponse whose JSON body contains `message` and `events` (an array of event documents) on success, or a `message` describing the failure on error. The response uses HTTP status 200 for success and 500 for failure.
 */
export async function GET() {
  try {
    await connectToDatabase();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Successfully fetched event", events },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch events!" },
      { status: 500 },
    );
  }
}