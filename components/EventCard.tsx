import { IEvent } from "@/database";
import Image from "next/image";
import Link from "next/link";

const EventCard = ({ event }: { event: IEvent }) => {
  const { image, slug, title, date, time, location } = event;
  return (
    <Link href={`/events/${slug}`} id="event-card">
      <Image
        src={image}
        alt="image"
        width={410}
        height={300}
        className="poster"
      />
      <div className="flex flex-row gap-2">
        <Image
          src="/icons/pin.svg"
          alt="location"
          width={14}
          height={14}
          unoptimized
        />
        <p>{location}</p>
      </div>
      <p className="title">{title}</p>

      <div className="datetime">
        <div>
          <Image
            src="/icons/calendar.svg"
            alt="date"
            width={14}
            height={14}
            unoptimized
          />
          <p>{date}</p>
        </div>
        <div>
          <Image
            src="/icons/clock.svg"
            alt="time"
            width={14}
            height={14}
            unoptimized
          />
          <p>{time}</p>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
