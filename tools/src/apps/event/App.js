import './App.css';
import { useParams } from "react-router-dom";
import Countdown from './components/countdown';

function Event() {
  const { id } = useParams();
  const weddingDate = "2025-06-15T00:00:00"; // Example wedding date

  return (
    <div className="App">
      <div className="flex-grid">
        <div className="grid-item">
          <h1>Hi welcome to the event of {id}</h1>
          <Countdown weddingDate={weddingDate} />
          <a href='https://wa.me/526142171150?text=%C2%A1Hola, soy puto, mensaje al darle clic.' >  Confirmar asistencia </a>
        </div>
      </div>
    </div>
  );
}


export default Event;
