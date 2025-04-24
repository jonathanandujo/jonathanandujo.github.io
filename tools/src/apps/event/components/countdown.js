import { useState, useEffect } from "react";

function Countdown({ weddingDate }) {
  const calculateTimeLeft = () => {
    const difference = new Date(weddingDate) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h2>Countdown to the Wedding</h2>
      <p>{`${timeLeft.days} Days, ${timeLeft.hours} Hours, ${timeLeft.minutes} Minutes, ${timeLeft.seconds} Seconds`}</p>
    </div>
  );
}


export default Countdown;