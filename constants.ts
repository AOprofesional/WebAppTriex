
import { DayItinerary, Document, User } from './types';

export const MOCK_USER: User = {
  name: "Camila Silva",
  memberSince: "2023",
  tripsCompleted: 12,
  upcomingTrips: 3,
  points: 1250
};

export const MOCK_ITINERARY: DayItinerary[] = [
  {
    day: 1,
    activities: [
      {
        id: '1',
        time: '08:00 AM',
        title: 'Desayuno en el Hotel',
        description: 'Encuentro en el salón principal para el buffet de bienvenida.',
        location: 'Hotel Grand Plaza, Comedor',
        status: 'approved',
        icon: 'restaurant'
      },
      {
        id: '2',
        time: '09:30 AM',
        title: 'City Tour Histórico',
        description: 'Recorrido por los monumentos principales y el casco antiguo con guía certificado.',
        location: 'Punto de encuentro: Recepción',
        status: 'in_course',
        icon: 'directions_bus',
        instructions: [
          "Estar en la recepción del hotel 10 minutos antes de la hora pactada.",
          "Llevar calzado cómodo y protector solar para la caminata.",
          "Tener el voucher digital o impreso a mano para el registro.",
          "Llevar una botella de agua personal."
        ],
        meetingPoint: {
          name: "Recepción principal, Hotel Grand Plaza",
          mapUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqG8vZyQkb03BPP3xDQEBm7uNMboJ_rFBDB4_23h2QEJT7OC2YsZ-50M2o2FK8tvdlo2DcSHN64Jg33rTuepSqhGMm4sKIkUZXRL_FF-PbSvgMLpg6mmwzE1XJiMd62jt5qpHi0sX-rDoAH3-ppucj5TCYtxb_agtpe9j2qNW5BY_X64fHz788ksesBjUkFV0KVfKtTtnhw1QDyEK17CilrHHvG53QuUMW-QjNeUqX1BP0kArll1M3N9yZ_RAbQEnWjQZFym0J9u4S"
        }
      },
      {
        id: '3',
        time: '01:30 PM',
        title: 'Almuerzo Grupal',
        description: 'Degustación de comida típica local en el restaurante El Solar.',
        location: 'Restaurante El Solar, Centro Histórico',
        status: 'pending',
        icon: 'restaurant'
      },
      {
        id: '4',
        time: '04:00 PM',
        title: 'Visita al Museo de Arte',
        description: 'Entrada incluida y tiempo libre para explorar las galerías contemporáneas.',
        location: 'Museo de Arte Moderno, Distrito Norte',
        status: 'pending',
        icon: 'camera_alt'
      }
    ]
  },
  {
    day: 2,
    activities: [
      {
        id: '5',
        time: '09:00 AM',
        title: 'Excursión Cerro Catedral',
        description: 'Ascenso en teleférico y tiempo de nieve.',
        location: 'Base del Cerro',
        status: 'pending',
        icon: 'mountain_flag'
      }
    ]
  }
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'd1',
    name: 'Ticket Aéreo',
    description: 'Vuelo AR1304 - Confirmado',
    status: 'approved',
    type: 'voucher',
    icon: 'confirmation_number'
  },
  {
    id: 'd2',
    name: 'Seguro de Viaje',
    description: 'Documento de respaldo obligatorio',
    status: 'pending',
    type: 'personal',
    icon: 'health_and_safety'
  },
  {
    id: 'd3',
    name: 'Voucher Hotel',
    description: 'Hilton Bariloche - 7 noches',
    status: 'approved',
    type: 'voucher',
    icon: 'hotel'
  }
];

export const LOGO_URL = "https://i.imgur.com/dhfJR0n.png";
export const AVATAR_URL = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200";
