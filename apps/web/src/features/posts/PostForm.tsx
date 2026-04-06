import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { postsApi } from '../../api/posts';
import { vehiclesApi } from '../../api/vehicles';
import { useAuth } from '../../auth/AuthContext';
import type { CreatePostInput } from '@nextride/shared';

const NEIGHBORHOODS = ['Wersten', 'Flingern', 'Bilk', 'Oberbilk', 'Unterbilk'];

interface PostFormProps {
  leicht: boolean;
  onSuccess?: () => void;
}

export function PostForm({ leicht, onSuccess }: PostFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isPilot = user?.role === 'pilot' || user?.role === 'coordinator';

  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('10:00');
  const [timeEnd, setTimeEnd] = useState('12:00');
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [passengers, setPassengers] = useState('1');
  const [routeWish, setRouteWish] = useState('');
  const [a11yNotes, setA11yNotes] = useState('');

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'mine'],
    queryFn: () => vehiclesApi.mine(),
    enabled: isPilot,
  });

  const mutation = useMutation({
    mutationFn: (data: CreatePostInput) => postsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      showToast(
        isPilot
          ? leicht ? 'Dein Angebot ist da!' : 'Fahrt-Angebot veröffentlicht!'
          : leicht ? 'Dein Wunsch ist da!' : 'Fahrt-Wunsch abgesendet!',
      );
      // Reset form
      setVehicleId('');
      setDate('');
      setRouteWish('');
      setA11yNotes('');
      onSuccess?.();
    },
    onError: () => showToast('Fehler beim Speichern. Bitte erneut versuchen.', 'error'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data: CreatePostInput = {
      type: isPilot ? 'offer' : 'request',
      vehicleId: vehicleId || undefined,
      date: date ? new Date(date).toISOString() : undefined,
      timeSlot: date ? { start: timeStart, end: timeEnd } : undefined,
      neighborhood,
      passengerCount: parseInt(passengers),
      routeWish: routeWish || undefined,
      accessibilityNotes: a11yNotes || undefined,
    };
    mutation.mutate(data);
  }

  const fieldClass = `
    w-full px-4 py-3.5 rounded-btn border-2 border-gray-300
    text-base bg-surface text-gray-900
    focus:outline-none focus:border-offer focus:ring-1 focus:ring-offer
    min-h-touch
  `;
  const labelClass = 'block text-sm font-semibold text-gray-800 mb-1.5';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {isPilot
            ? leicht ? 'Ich kann fahren' : 'Fahrt anbieten'
            : leicht ? 'Ich möchte mitfahren' : 'Fahrt anfragen'}
        </h2>
        <p className="text-sm text-muted mt-1">
          {isPilot
            ? leicht
              ? 'Sag uns, wann du fahren kannst.'
              : 'Teile mit, wann und wo du eine Rikscha-Fahrt anbieten möchtest.'
            : leicht
              ? 'Sag uns, wann du fahren möchtest.'
              : 'Beschreibe deinen Fahrtwunsch — wir finden eine:n Pilot:in.'}
        </p>
      </div>

      {/* Vehicle — pilots only */}
      {isPilot && (
        <div>
          <label className={labelClass} htmlFor="vehicle">
            {leicht ? 'Welches Fahrzeug?' : 'Fahrzeug'}
          </label>
          <select
            id="vehicle"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className={fieldClass}
          >
            <option value="">Bitte wählen…</option>
            {vehiclesData?.data.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.certificationRequired})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div>
        <label className={labelClass} htmlFor="date">
          {leicht ? 'Wann?' : 'Datum'}
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={fieldClass}
        />
        <p className="text-xs text-muted mt-1">
          {leicht ? 'Leer lassen = flexibel' : 'Leer lassen für flexible Terminwünsche'}
        </p>
      </div>

      {/* Time slot — only shown when date is set */}
      {date && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelClass} htmlFor="timeStart">
              {leicht ? 'Von' : 'Beginn'}
            </label>
            <input
              id="timeStart"
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass} htmlFor="timeEnd">
              {leicht ? 'Bis' : 'Ende'}
            </label>
            <input
              id="timeEnd"
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {/* Neighborhood */}
      <div>
        <label className={labelClass} htmlFor="neighborhood">
          {leicht ? 'Wo?' : 'Stadtteil'}
        </label>
        <select
          id="neighborhood"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          className={fieldClass}
        >
          {NEIGHBORHOODS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Passenger count — riders/facilities only */}
      {!isPilot && (
        <div>
          <label className={labelClass} htmlFor="passengers">
            {leicht ? 'Wie viele Personen?' : 'Anzahl Fahrgäste'}
          </label>
          <select
            id="passengers"
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
            className={fieldClass}
          >
            <option value="1">1 Person</option>
            <option value="2">2 Personen</option>
          </select>
        </div>
      )}

      {/* Route wish */}
      <div>
        <label className={labelClass} htmlFor="routeWish">
          {leicht ? 'Wohin möchtest du? (optional)' : 'Routenwunsch (optional)'}
        </label>
        <input
          id="routeWish"
          type="text"
          value={routeWish}
          onChange={(e) => setRouteWish(e.target.value)}
          placeholder={leicht ? 'z.B. an den Rhein' : 'z.B. entlang des Rheins, zum Südpark…'}
          className={fieldClass}
        />
      </div>

      {/* Accessibility notes — riders/facilities only */}
      {!isPilot && (
        <div>
          <label className={labelClass} htmlFor="a11y">
            {leicht ? 'Braucht ihr Hilfe? (optional)' : 'Hinweise zur Barrierefreiheit (optional)'}
          </label>
          <input
            id="a11y"
            type="text"
            value={a11yNotes}
            onChange={(e) => setA11yNotes(e.target.value)}
            placeholder={leicht ? 'z.B. Rollstuhl' : 'z.B. Rollstuhltransfer nötig'}
            className={fieldClass}
          />
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={mutation.isPending}
        className={isPilot ? 'bg-offer hover:bg-offer/90' : 'bg-request hover:bg-request/90'}
      >
        {mutation.isPending
          ? 'Wird gesendet…'
          : isPilot
            ? leicht ? 'Angebot senden' : 'Fahrt-Angebot veröffentlichen'
            : leicht ? 'Wunsch senden' : 'Fahrt-Wunsch absenden'}
      </Button>
    </form>
  );
}
