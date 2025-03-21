import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDnwGBvCI_7JM4Nvp4M6ZNRDO688Ru5lw4",
    authDomain: "ailandclean-api.firebaseapp.com",
    databaseURL: "https://ailandclean-api-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ailandclean-api",
    storageBucket: "ailandclean-api.appspot.com",
    messagingSenderId: "183559415832",
    appId: "1:183559415832:web:239345b488dc48597ffb6d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Realtime Database
const database = getDatabase(app);

// Fonction pour s'authentifier anonymement ou accéder directement
const signInAnonymous = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Authentification anonyme réussie", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Erreur d'authentification anonyme:", error);
    
    // Si l'authentification anonyme échoue, on vérifie si c'est une erreur de configuration
    if (error.code === 'auth/configuration-not-found') {
      console.warn("L'authentification anonyme n'est pas configurée. Utilisation de règles publiques.");
      // On retourne null, l'application devra utiliser les règles publiques
    }
    
    throw error;
  }
};

// Fonction pour récupérer des données sans authentification
const getDataWithoutAuth = async (path) => {
  try {
    const dataRef = ref(database, path);
    const snapshot = await get(dataRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Erreur lors de la récupération des données sans auth:", error);
    throw error;
  }
};

// Exporter les éléments nécessaires
export { auth, database, ref, onValue, get, set, signInAnonymous, getDataWithoutAuth };