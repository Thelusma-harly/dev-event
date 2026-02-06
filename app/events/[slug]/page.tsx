import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const revalidate = 3600; // Revalidate every 1 hour

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const EventDetailItem = ({
  icon,
  alt,
  label,
}: {
  icon: string;
  alt: string;
  label: string;
}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} height={17} width={17} />
    <p>{label}</p>
  </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>
        {tag}
      </div>
    ))}
  </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((agenda) => (
        <li key={agenda}>{agenda}</li>
      ))}
    </ul>
  </div>
);

async function SimilarEventsList({ slug }: { slug: string }) {
  const similarEvents = await getSimilarEventsBySlug(slug);

  return (
    <div className="events">
      {similarEvents.map((event: IEvent) => (
        <EventCard key={event.title} event={event} />
      ))}
    </div>
  );
}

async function EventContent({ slug }: { slug: string }) {
  const response = await fetch(`${BASE_URL}/api/events/${slug}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return notFound();
  }

  const event = (await response.json()).event;

  const {
    description,
    image,
    overview,
    date,
    time,
    location,
    mode,
    agenda,
    audience,
    tags,
    organizer,
    _id,
  }: IEvent = event;

  if (!event.description) return notFound();

  const bookings = 10;

  return (
    <>
      <div className="header">
        <h1>Event Description</h1>
        <p className="mt-2">{description}</p>
      </div>
      <div className="details">
        <div className="content">
          <Image
            src={image}
            alt="Event Image"
            width={800}
            height={800}
            className="banner"
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="calendar"
              label={date}
            />
            <EventDetailItem icon="/icons/clock.svg" alt="time" label={time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="audience"
              label={audience}
            />
          </section>
          <EventAgenda agendaItems={agenda} />
          <section className="flex-col-gap-2">
            <h2>About The Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags} />
        </div>
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked their spot{" "}
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot</p>
            )}
            <BookEvent eventId={_id} />
          </div>
        </aside>
      </div>
    </>
  );
}

const EventDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  return (
    <section id="event">
      <Suspense fallback={<div>Loading event details...</div>}>
        <EventContent slug={slug} />
      </Suspense>

      <div className="flex flex-col w-full pt-20 gap-4">
        <h2>Similar Events</h2>
        <Suspense fallback={<div>Loading similar events...</div>}>
          <SimilarEventsList slug={slug} />
        </Suspense>
      </div>
    </section>
  );
};

export default EventDetailsPage;
