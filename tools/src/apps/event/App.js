import './App.css';
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import eventData from './scrtdb.json'; // Import JSON directly
import Countdown from './components/countdown';

function Event() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const foundEvent = eventData.events.find(e => e.id === id); // Compare as a string
    setEvent(foundEvent || null);
  }, [id]);

  if (!event) {
    return <h1>Event {id} not found</h1>;
  }

  return (
    <div className="App">
      <div className="flex-grid">
        <div className="grid-item">
          <h1>Hi, welcome to the event {event.id}</h1>
          <h2>Song: {event.song.name}</h2>
          <Countdown weddingDate={event.date} />
          <a href='https://wa.me/526142171150?text=%C2%A1Hola, soy puto, mensaje al darle clic.'>Confirmar asistencia</a>
        </div>
      </div>
    </div>
  );
}

export default Event;
