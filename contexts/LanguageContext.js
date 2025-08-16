// src/context/LanguageContext.js
import React, { createContext, useState, useContext } from 'react';

const translations = {
  en: {
    // Profile Screen
    title: 'My Profile',
    fullName: 'Full Name',
    email: 'Email',
    currentAddress: 'Current Address',
    idCardNumber: 'ID Card Number',
    phoneNumber: 'Phone Number',
    editProfile: 'Edit Profile',
    saveChanges: 'Update',
    cancel: 'Cancel',
    settings: 'Settings',
    language: 'Language',
    english: 'English',
    french: 'French',
    success: 'Success',
    profileUpdated: 'Profile updated successfully',
    
    // Agencies Screen
    agenciesTitle: 'Bus Agencies',
    currentLocation: 'Current Location',
    destination: 'Destination',
    selectLocation: 'Select location',
    selectDestination: 'Select destination',
    selectCity: 'Select City',
    destinations: 'Destinations',
    selectRouteText: 'Select route to book',
    noAgencies: 'No agencies available',
    agencyLocation: 'Location',
    bookNow: 'Book Now',
    cancelBooking: 'Cancel',
    
    // Input Placeholders
    enterFullName: 'Enter full name',
    enterAddress: 'Enter current address',
    enterIdNumber: 'Enter ID card number',
    enterPhoneNumber: 'Enter phone number',
    
    // Validation Messages
    nameRequired: 'Full name is required',
    addressRequired: 'Address is required',
    idNumberRequired: 'ID number is required',
    phoneRequired: 'Phone number is required',
    invalidPhone: 'Please enter a valid phone number',
    
    // Settings
    accountSettings: 'Account Settings',
    notificationSettings: 'Notifications',
    privacySettings: 'Privacy',
    darkMode: 'Dark Mode',
    
    // Actions
    edit: 'Edit',
    save: 'Save',
    delete: 'Delete',
    confirm: 'Confirm',
    logout: 'Logout',

    // Booking Screen
    bookYourSeats: 'Book Your Seats',
    selectBusType: 'Select Bus Type',
    availableSeats: 'Available Seats',
    pricePerSeat: 'Price per seat',
    selected: 'Selected',
    available: 'Available',
    booked: 'Booked',
    bookingSummary: 'Booking Summary',
    selectedSeatsLabel: 'Selected Seats:',
    seatPriceLabel: 'Seat Price:',
    serviceFeeLabel: 'Service Fee:',
    totalLabel: 'Total:',
    confirmBooking: 'Confirm Booking',
    confirmBookingTitle: 'Confirm Booking',
    passengerForSeat: 'Passenger for Seat',
    fullName: 'Full Name',
    idNumber: 'ID Number',
    idCardPhoto: 'ID Card Photo',
    changePhoto: 'Change Photo',
    selectPhoto: 'Select Photo',
    maximumSeats: 'Maximum seats',
    maxSeatsMessage: 'You can select maximum 5 seats',
    noSeatsSelected: 'No seats selected',
    selectSeatsMessage: 'Please select at least one seat',
    missingInfo: 'Missing Information',
    fillAllInfo: 'Please fill all information for seat',
    bookingConfirmed: 'Booking Confirmed',
    bookingConfirmationMessage: ({ count, agency, total }) => 
      `Your booking for ${count} seat(s) has been confirmed with ${agency}.\n\nTotal: FCFA ${total}`,
    driver: 'DRIVER',

    // Dashboard Screen
    dashboardTitle: 'Dashboard',
    totalBookings: 'Total Bookings',
    upcomingTrips: 'Upcoming Trips',
    pastTrips: 'Past Trips',
    viewTravelHistory: 'View Travel History',

    // Travel History Screen
    travelHistoryTitle: 'Travel History',
    unknownAgency: 'Unknown Agency',
    busLabel: 'Bus',
    routeSeparator: '→',
    seatsLabel: 'Seats',
    statusLabel: 'Status',
    noHistoryText: 'No travel history found',
    // Status translations moved to root level
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    at: 'at',

    // Tab Bar
      index: 'Dashboard',
      agencies: 'Agencies',
      profile: 'Profile',

      // Auth Screen
    login: 'Login',
    signUp: 'Sign Up',
    fullName: 'Full Name',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    orContinueWith: 'Or continue with',
    needAccount: 'Need an account? Sign up',
    haveAccount: 'Already have an account? Login',
    emailError: 'Please enter a valid email',
    passwordError: 'Password must be at least 6 characters',
    nameError: 'Name is required',
    nameInputLabel: 'Name input',
    nameInputHint: 'Enter your full name',
    emailInputLabel: 'Email input',
    emailInputHint: 'Enter your email address',
    passwordInputLabel: 'Password input',
    passwordInputHint: 'Enter your password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',

    paymentTitle: 'Mobile Money Payment',
    paymentInstructions: 'Please enter your mobile money details to complete payment',
    momoNumber: 'Mobile Money Number',
    enterMomoNumber: 'Enter your mobile money number',
    amount: 'Amount',
    confirmPayment: 'Confirm Payment',
    proceedToPayment: 'Proceed to Payment',
    paymentError: 'Payment Error',
    provideMomoNumber: 'Please provide your mobile money number',
    paymentConfirmationMessage: ({ count, agency, total }) => `Your payment of FCFA ${total} for ${count} seat(s) with ${agency} has been confirmed. Thank you for your booking!`,

    
    changeLanguage: 'Change language',
  },
  fr: {
    // Profile Screen
    title: 'Profil',
    fullName: 'Nom',
    email: 'Email',
    currentAddress: 'Adresse',
    idCardNumber: 'Carte ID',
    phoneNumber: 'Téléphone',
    editProfile: 'Modifier',
    saveChanges: 'Enregistrer',
    cancel: 'Annuler',
    settings: 'Paramètres',
    language: 'Langue',
    english: 'Anglais',
    french: 'Français',
    success: 'Succès',
    profileUpdated: 'Profil mis à jour',
    
    // Agencies Screen
    agenciesTitle: 'Agences de bus',
    currentLocation: 'Localisation actuelle',
    destination: 'Destination',
    selectLocation: 'Sélectionner lieu',
    selectDestination: 'Sélectionner destination',
    selectCity: 'Choisir ville',
    destinations: 'Destinations',
    selectRouteText: 'Choisir un trajet',
    noAgencies: 'Aucune agence disponible',
    agencyLocation: 'Emplacement',
    bookNow: 'Réserver',
    cancelBooking: 'Annuler',
    
    // Input Placeholders
    enterFullName: 'Entrez votre nom',
    enterAddress: 'Entrez votre adresse',
    enterIdNumber: 'Numéro de carte ID',
    enterPhoneNumber: 'Numéro de téléphone',
    
    // Validation Messages
    nameRequired: 'Le nom est requis',
    addressRequired: 'L\'adresse est requise',
    idNumberRequired: 'Le numéro ID est requis',
    phoneRequired: 'Le téléphone est requis',
    invalidPhone: 'Numéro de téléphone invalide',
    
    // Settings
    accountSettings: 'Paramètres du compte',
    notificationSettings: 'Notifications',
    privacySettings: 'Confidentialité',
    darkMode: 'Mode sombre',
    
    // Actions
    edit: 'Modifier',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    logout: 'Déconnexion',

    // Booking Screen
    bookYourSeats: 'Réserver vos places',
    selectBusType: 'Choisir le type de bus',
    availableSeats: 'Places disponibles',
    pricePerSeat: 'Prix par place',
    selected: 'Sélectionné',
    available: 'Disponible',
    booked: 'Réservé',
    bookingSummary: 'Résumé de réservation',
    selectedSeatsLabel: 'Places choisies:',
    seatPriceLabel: 'Prix place:',
    serviceFeeLabel: 'Frais service:',
    totalLabel: 'Total:',
    confirmBooking: 'Confirmer réservation',
    confirmBookingTitle: 'Confirmer réservation',
    passengerForSeat: 'Passager place',
    fullName: 'Nom complet',
    idNumber: 'Numéro ID',
    idCardPhoto: 'Photo carte ID',
    changePhoto: 'Changer photo',
    selectPhoto: 'Choisir photo',
    maximumSeats: 'Places maximum',
    maxSeatsMessage: 'Maximum 5 places autorisées',
    noSeatsSelected: 'Aucune place choisie',
    selectSeatsMessage: 'Choisissez au moins une place',
    missingInfo: 'Information manquante',
    fillAllInfo: 'Remplissez toutes les informations pour la place',
    bookingConfirmed: 'Réservation confirmée',
    bookingConfirmationMessage: ({ count, agency, total }) => 
      `Votre réservation de ${count} place(s) avec ${agency} est confirmée.\n\nTotal: FCFA ${total}`,
    driver: 'CONDUCTEUR',

    // Dashboard Screen
    dashboardTitle: 'Tableau de bord',
    totalBookings: 'Réservations totales',
    upcomingTrips: 'Voyages à venir',
    pastTrips: 'Voyages passés',
    viewTravelHistory: 'Voir historique',

    // Travel History Screen
    travelHistoryTitle: 'Historique des voyages',
    unknownAgency: 'Agence inconnue',
    busLabel: 'Bus',
    routeSeparator: '→',
    seatsLabel: 'Places',
    statusLabel: 'Statut',
    noHistoryText: 'Aucun historique trouvé',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
    completed: 'Terminé',
    at: 'à',

    // Tab Bar
    index: 'Tableau de bord',
    agencies: 'Agences',
    profile: 'Profil',

      // Auth Screen
    login: 'Connexion',
    signUp: 'Inscription',
    fullName: 'Nom complet',
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    orContinueWith: 'Ou continuer avec',
    needAccount: 'Besoin d\'un compte ? Inscrivez-vous',
    haveAccount: 'Déjà un compte ? Connectez-vous',
    emailError: 'Veuillez entrer un email valide',
    passwordError: 'Le mot de passe doit contenir au moins 6 caractères',
    nameError: 'Le nom est requis',
    nameInputLabel: 'Saisie du nom',
    nameInputHint: 'Entrez votre nom complet',
    emailInputLabel: 'Saisie de l\'email',
    emailInputHint: 'Entrez votre adresse email',
    passwordInputLabel: 'Saisie du mot de passe',
    passwordInputHint: 'Entrez votre mot de passe',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',

    paymentTitle: 'Paiement Mobile Money',
    paymentInstructions: 'Veuillez entrer vos détails Mobile Money pour compléter le paiement',
    momoNumber: 'Numéro Mobile Money',
    enterMomoNumber: 'Entrez votre numéro Mobile Money',
    amount: 'Montant',
    confirmPayment: 'Confirmer Paiement',
    proceedToPayment: 'Procéder au Paiement',
    paymentError: 'Erreur de Paiement',
    provideMomoNumber: 'Veuillez fournir votre numéro Mobile Money',
    paymentConfirmationMessage: ({ count, agency, total }) => `Votre paiement de FCFA ${total} pour ${count} place(s) avec ${agency} a été confirmé. Merci pour votre réservation!`,

    changeLanguage: 'Changer de langue',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
    // Optional: Save to AsyncStorage for persistence
    // AsyncStorage.setItem('appLanguage', newLang);
  };

  const t = (key, params) => {
    const translation = translations[language][key];
    if (typeof translation === 'function') {
        return translation(params);
    }
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);