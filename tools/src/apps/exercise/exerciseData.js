const exerciseData = [
  {
    id: 'biceps',
    name: 'Bíceps',
    icon: '💪',
    exercises: [
      { id: 'bicep-curl', name: 'Bicep Curl', description: 'Curl de bíceps con mancuerna', sets: 3, reps: 12 },
      { id: 'hammer-curl', name: 'Hammer Curl', description: 'Curl martillo alternado', sets: 3, reps: 12 },
      { id: 'concentration-curl', name: 'Concentration Curl', description: 'Curl concentrado sentado', sets: 3, reps: 10 },
      { id: 'barbell-curl', name: 'Barbell Curl', description: 'Curl con barra recta', sets: 4, reps: 10 },
      { id: 'preacher-curl', name: 'Preacher Curl', description: 'Curl en banco predicador', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'triceps',
    name: 'Tríceps',
    icon: '🦾',
    exercises: [
      { id: 'tricep-dip', name: 'Tricep Dip', description: 'Fondos en paralelas para tríceps', sets: 3, reps: 10 },
      { id: 'overhead-extension', name: 'Overhead Extension', description: 'Extensión de tríceps sobre la cabeza', sets: 3, reps: 12 },
      { id: 'skull-crusher', name: 'Skull Crusher', description: 'Rompecráneos con barra EZ', sets: 3, reps: 10 },
      { id: 'cable-pushdown', name: 'Cable Pushdown', description: 'Jalón de tríceps en polea', sets: 3, reps: 12 },
      { id: 'kickback', name: 'Kickback', description: 'Patada trasera con mancuerna', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'quadriceps',
    name: 'Cuádriceps',
    icon: '🦵',
    exercises: [
      { id: 'squat', name: 'Squat', description: 'Sentadilla con barra', sets: 4, reps: 10 },
      { id: 'leg-press', name: 'Leg Press', description: 'Prensa de pierna', sets: 4, reps: 12 },
      { id: 'leg-extension', name: 'Leg Extension', description: 'Extensión de pierna en máquina', sets: 3, reps: 12 },
      { id: 'front-squat', name: 'Front Squat', description: 'Sentadilla frontal', sets: 3, reps: 10 },
      { id: 'lunges', name: 'Lunges', description: 'Desplantes con mancuernas', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'legs',
    name: 'Pierna',
    icon: '🏋️',
    exercises: [
      { id: 'deadlift', name: 'Deadlift', description: 'Peso muerto convencional', sets: 4, reps: 8 },
      { id: 'romanian-deadlift', name: 'Romanian Deadlift', description: 'Peso muerto rumano', sets: 3, reps: 10 },
      { id: 'leg-curl', name: 'Leg Curl', description: 'Curl de pierna acostado', sets: 3, reps: 12 },
      { id: 'hip-thrust', name: 'Hip Thrust', description: 'Empuje de cadera con barra', sets: 4, reps: 10 },
      { id: 'step-up', name: 'Step Up', description: 'Subidas al cajón con mancuerna', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'abdomen',
    name: 'Abdomen',
    icon: '🧱',
    exercises: [
      { id: 'crunch', name: 'Crunch', description: 'Crunch abdominal clásico', sets: 3, reps: 20 },
      { id: 'plank', name: 'Plank', description: 'Plancha isométrica (segundos)', sets: 3, reps: 60 },
      { id: 'bicycle-crunch', name: 'Bicycle Crunch', description: 'Crunch de bicicleta', sets: 3, reps: 20 },
      { id: 'leg-raise', name: 'Leg Raise', description: 'Elevación de piernas colgado', sets: 3, reps: 15 },
      { id: 'russian-twist', name: 'Russian Twist', description: 'Giro ruso con peso', sets: 3, reps: 20 },
      { id: 'mountain-climber', name: 'Mountain Climber', description: 'Escaladores rápidos', sets: 3, reps: 30 },
    ],
  },
  {
    id: 'chest',
    name: 'Pecho',
    icon: '🫁',
    exercises: [
      { id: 'bench-press', name: 'Bench Press', description: 'Press de banca plano con barra', sets: 4, reps: 10 },
      { id: 'incline-bench', name: 'Incline Bench Press', description: 'Press de banca inclinado', sets: 3, reps: 10 },
      { id: 'dumbbell-fly', name: 'Dumbbell Fly', description: 'Aperturas con mancuernas', sets: 3, reps: 12 },
      { id: 'cable-crossover', name: 'Cable Crossover', description: 'Cruce de cables', sets: 3, reps: 12 },
      { id: 'push-up', name: 'Push Up', description: 'Lagartija clásica', sets: 3, reps: 15 },
      { id: 'decline-press', name: 'Decline Press', description: 'Press declinado con mancuernas', sets: 3, reps: 10 },
    ],
  },
  {
    id: 'calves',
    name: 'Pantorrilla',
    icon: '🦶',
    exercises: [
      { id: 'standing-calf-raise', name: 'Standing Calf Raise', description: 'Elevación de talones de pie', sets: 4, reps: 15 },
      { id: 'seated-calf-raise', name: 'Seated Calf Raise', description: 'Elevación de talones sentado', sets: 3, reps: 15 },
      { id: 'donkey-calf-raise', name: 'Donkey Calf Raise', description: 'Elevación tipo burro', sets: 3, reps: 15 },
      { id: 'single-leg-calf-raise', name: 'Single Leg Calf Raise', description: 'Elevación a una pierna', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'shoulders',
    name: 'Hombros',
    icon: '🤸',
    exercises: [
      { id: 'overhead-press', name: 'Overhead Press', description: 'Press militar con barra', sets: 4, reps: 10 },
      { id: 'lateral-raise', name: 'Lateral Raise', description: 'Elevaciones laterales', sets: 3, reps: 12 },
      { id: 'front-raise', name: 'Front Raise', description: 'Elevaciones frontales', sets: 3, reps: 12 },
      { id: 'face-pull', name: 'Face Pull', description: 'Tirón a la cara con cuerda', sets: 3, reps: 15 },
      { id: 'arnold-press', name: 'Arnold Press', description: 'Press Arnold con mancuernas', sets: 3, reps: 10 },
    ],
  },
  {
    id: 'back',
    name: 'Espalda',
    icon: '🔙',
    exercises: [
      { id: 'pull-up', name: 'Pull Up', description: 'Dominadas con peso corporal', sets: 4, reps: 8 },
      { id: 'barbell-row', name: 'Barbell Row', description: 'Remo con barra', sets: 4, reps: 10 },
      { id: 'lat-pulldown', name: 'Lat Pulldown', description: 'Jalón al pecho en polea', sets: 3, reps: 12 },
      { id: 'seated-row', name: 'Seated Row', description: 'Remo sentado en polea', sets: 3, reps: 12 },
      { id: 'dumbbell-row', name: 'Dumbbell Row', description: 'Remo con mancuerna a un brazo', sets: 3, reps: 10 },
      { id: 't-bar-row', name: 'T-Bar Row', description: 'Remo en T', sets: 3, reps: 10 },
    ],
  },
];

export default exerciseData;
