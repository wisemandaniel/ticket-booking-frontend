export const mockUsers = [
  {
    id: 'user1',
    fullName: 'John Doe',
    email: 'john@example.com',
    currentAddress: '123 Main St, Buea',
    idCardNumber: 'ID12345678',
    phoneNumber: '677123456',
  },
  {
    id: 'user2',
    fullName: 'Sarah Nfor',
    email: 'sarah@example.com',
    currentAddress: '456 Commercial Ave, Douala',
    idCardNumber: 'ID87654321',
    phoneNumber: '699987654',
  }
];

export const mockAgencies = [
  {
    id: 'agency1',
    name: 'Musango Express',
    location: 'Buea',
    destinations: ['Douala', 'Yaounde', 'Limbe', 'Bamenda', 'Baffoussam', 'Kumba', 'Dschang'],
    buses: [
      {
        id: 'bus1',
        busNumber: 'ME-101',
        totalSeats: 30,
        basePrice: 6500,
        seatLayout: generateSeatLayout(30)
      },
      {
        id: 'bus2',
        busNumber: 'ME-202',
        totalSeats: 56,
        basePrice: 6500,
        seatLayout: generateSeatLayout(56)
      },
      {
        id: 'bus3',
        busNumber: 'ME-303',
        totalSeats: 70,
        basePrice: 6500,
        seatLayout: generateSeatLayout(70)
      }
    ]
  },
  {
    id: 'agency2',
    name: 'Africon Voyages',
    location: 'Douala',
    destinations: ['Buea', 'Yaounde', 'Limbe', 'Bamenda', 'Baffoussam', 'Kumba', 'Edea', 'Nkongsamba'],
    buses: [
      {
        id: 'bus4',
        busNumber: 'AV-404',
        totalSeats: 70,
        basePrice: 7000,
        seatLayout: generateSeatLayout(70)
      },
      {
        id: 'bus5',
        busNumber: 'AV-505',
        totalSeats: 30,
        basePrice: 7000,
        seatLayout: generateSeatLayout(30)
      }
    ]
  },
  {
    id: 'agency3',
    name: 'Oasis Travels',
    location: 'Yaounde',
    destinations: ['Douala', 'Buea', 'Bamenda', 'Baffoussam', 'Edea', 'Ebolowa', 'Bertoua'],
    buses: [
      {
        id: 'bus6',
        busNumber: 'OT-606',
        totalSeats: 30,
        basePrice: 6000,
        seatLayout: generateSeatLayout(30)
      },
      {
        id: 'bus7',
        busNumber: 'OT-707',
        totalSeats: 56,
        basePrice: 6000,
        seatLayout: generateSeatLayout(56)
      }
    ]
  },
  {
    id: 'agency4',
    name: 'Guarantee Express',
    location: 'Bamenda',
    destinations: ['Douala', 'Yaounde', 'Buea', 'Baffoussam', 'Kumba', 'Nkongsamba'],
    buses: [
      {
        id: 'bus8',
        busNumber: 'GE-808',
        totalSeats: 56,
        basePrice: 5500,
        seatLayout: generateSeatLayout(56)
      },
      {
        id: 'bus9',
        busNumber: 'GE-909',
        totalSeats: 70,
        basePrice: 5500,
        seatLayout: generateSeatLayout(70)
      }
    ]
  },
  {
    id: 'agency5',
    name: 'Amour Mezam',
    location: 'Bamenda',
    destinations: ['Douala', 'Yaounde', 'Buea', 'Baffoussam', 'Ngaoundere', 'Garoua'],
    buses: [
      {
        id: 'bus10',
        busNumber: 'AM-1010',
        totalSeats: 70,
        basePrice: 5000,
        seatLayout: generateSeatLayout(70)
      }
    ]
  },
  {
    id: 'agency6',
    name: 'Touristique Express',
    location: 'Douala',
    destinations: ['Yaounde', 'Buea', 'Limbe', 'Kumba', 'Edea', 'Bafang'],
    buses: [
      {
        id: 'bus11',
        busNumber: 'TE-1111',
        totalSeats: 30,
        basePrice: 7500,
        seatLayout: generateSeatLayout(30)
      },
      {
        id: 'bus12',
        busNumber: 'TE-1212',
        totalSeats: 56,
        basePrice: 7500,
        seatLayout: generateSeatLayout(56)
      }
    ]
  },
  {
    id: 'agency7',
    name: 'Nouvelle Liberte',
    location: 'Yaounde',
    destinations: ['Douala', 'Bamenda', 'Baffoussam', 'Ebolowa', 'Bertoua', 'Ngaoundere'],
    buses: [
      {
        id: 'bus13',
        busNumber: 'NL-1313',
        totalSeats: 56,
        basePrice: 8000,
        seatLayout: generateSeatLayout(56)
      },
      {
        id: 'bus14',
        busNumber: 'NL-1414',
        totalSeats: 70,
        basePrice: 8000,
        seatLayout: generateSeatLayout(70)
      }
    ]
  }
];

export const mockBookings = [
  {
    id: 'booking1',
    userId: 'user1',
    agencyId: 'agency1',
    busId: 'bus1',
    seats: ['1', '2'],
    from: 'Buea',
    to: 'Douala',
    departureTime: '2023-06-15T08:00:00',
    status: 'completed',
    price: 13000
  },
  {
    id: 'booking2',
    userId: 'user1',
    agencyId: 'agency1',
    busId: 'bus2',
    seats: ['5', '6'],
    from: 'Buea',
    to: 'Yaounde',
    departureTime: '2023-07-20T10:30:00',
    status: 'confirmed',
    price: 13000
  },
  {
    id: 'booking3',
    userId: 'user2',
    agencyId: 'agency4',
    busId: 'bus8',
    seats: ['10', '11'],
    from: 'Bamenda',
    to: 'Douala',
    departureTime: '2023-08-05T07:00:00',
    status: 'confirmed',
    price: 11000
  }
];

function generateSeatLayout(totalSeats) {
  const layout = [];
  
  // First row (driver + 2 seats)
  layout.push({
    seatNumber: 'DRIVER',
    row: 1,
    position: 'left',
    isDriverSeat: true,
    isAvailable: false
  });
  
  layout.push({
    seatNumber: '1',
    row: 1,
    position: 'right',
    isDriverSeat: false,
    isAvailable: true
  });
  
  layout.push({
    seatNumber: '2',
    row: 1,
    position: 'right',
    isDriverSeat: false,
    isAvailable: true
  });
  
  // Subsequent rows (3 left, 2 right)
  let seatNumber = 3;
  let currentRow = 2;
  
  while (seatNumber <= totalSeats) {
    // Left side (3 seats)
    for (let i = 0; i < 3 && seatNumber <= totalSeats; i++) {
      layout.push({
        seatNumber: seatNumber.toString(),
        row: currentRow,
        position: 'left',
        isDriverSeat: false,
        isAvailable: true
      });
      seatNumber++;
    }
    
    // Right side (2 seats)
    for (let i = 0; i < 2 && seatNumber <= totalSeats; i++) {
      layout.push({
        seatNumber: seatNumber.toString(),
        row: currentRow,
        position: 'right',
        isDriverSeat: false,
        isAvailable: true
      });
      seatNumber++;
    }
    
    currentRow++;
  }
  
  return layout;
}