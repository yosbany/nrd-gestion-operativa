// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnr6JoPRK_-TwSEv1IVFYmpYevZaAnY2A",
  authDomain: "nrd-pedidos-afbc2.firebaseapp.com",
  databaseURL: "https://nrd-pedidos-afbc2-default-rtdb.firebaseio.com",
  projectId: "nrd-pedidos-afbc2",
  storageBucket: "nrd-pedidos-afbc2.firebasestorage.app",
  messagingSenderId: "36380125630",
  appId: "1:36380125630:web:970001f135ee515b1c31ef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const database = firebase.database();

