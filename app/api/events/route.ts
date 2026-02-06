import { Event } from "@/database";
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@uploadcare/upload-client";

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
