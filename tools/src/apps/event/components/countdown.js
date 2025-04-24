import { useState, useEffect } from "react";

function Countdown({ weddingDate }) {
  const parsedDate = new Date(weddingDate); // Ensure weddingDate is correctly parsed

  const calculateTimeLeft = () => {
    const difference = parsedDate - new Date();
    return difference > 0
      ? {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        }
      : { days: 0, hours: 0, minutes: 0, seconds: 0 }; // Default after event date
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]); // Make sure countdown updates when date changes

  return (
    <div>
      <h2>Countdown to the Event</h2>
      {isNaN(parsedDate.getTime()) ? (
        <h2>Invalid date format</h2>
      ) : (
        <p>{`${timeLeft.days} Days, ${timeLeft.hours} Hours, ${timeLeft.minutes} Minutes, ${timeLeft.seconds} Seconds`}</p>
      )}
    </div>
  );
}

export default Countdown;
