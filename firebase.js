import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDnwGBvCI_7JM4Nvp4M6ZNRDO688Ru5lw4",
    authDomain: "ailandclean-api.firebaseapp.com",
    databaseURL: "https://ailandclean-api-default-rtdb.europe-west1.firebasedatabase.app", // Make sure this is included
    projectId: "ailandclean-api", // Make sure this is included
    storageBucket: "ailandclean-api.appspot.com",
    messagingSenderId: "183559415832",
    appId: "1:183559415832:web:239345b488dc48597ffb6d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

export { database };