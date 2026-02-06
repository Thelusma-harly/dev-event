"use server";

import { Event } from "@/database";
import { connectToDatabase } from "../mongodb";
import { cacheLife } from "next/cache";

export const getSimilarEventsBySlug = async (slug: string) => {
  try {
    await connectToDatabase();

    const event = await Event.findOne({ slug });

    return await Event.find({
      _id: { $ne: event?._id },
      tags: { $in: event?.tags || [] },
    });
  } catch (error) {
    console.error("Error fetching similar events:", error);
    return [];
  }
};

export const getAllEvents = async () => {
  "use cache";
  cacheLife("hours");

  try {
    await connectToDatabase();

    // .lean() is mandatory here so Next.js can serialize the data for the cache
    const events = await Event.find().lean();

    // Mongoose _id is an object, convert it to a string for the cache
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    console.error("Error fetching all events:", error);
    return [];
  }
};
