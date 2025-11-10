const path = require('path');
// Wczytujemy .env z głównego folderu backendu
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = require('pg'); // Importujemy Pool bezpośrednio
const bcrypt = require('bcryptjs');

// Tworzymy nowe, niezależne połączenie z bazą
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Odczytujemy argumenty z linii poleceń
// process.argv[0] to 'node'
// process.argv[1] to 'scripts/createUser.js'
// process.argv[2] to <username>
// process.argv[3] to <password>
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.error('BŁĄD: Wymagane są nazwa użytkownika i hasło.');
    console.log('Użycie: node scripts/createUser.js <username> <password>');
    process.exit(1); // Zakończ z kodem błędu
}

const createUser = async () => {
    try {
        // 1. Hashowanie hasła (zgodnie z wymaganiami)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Wstawienie do bazy
        // Używamy db.js z poprzedniego przykładu (który używa parametryzacji)
        await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
            [username, passwordHash]
        );

        console.log(`✅ Sukces! Użytkownik "${username}" został utworzony.`);

    } catch (err) {
        // Obsługa błędu, jeśli użytkownik już istnieje
        if (err.code === '23505') { // Kod błędu Postgresa dla 'unique_violation'
            console.error(`❌ BŁĄD: Użytkownik o nazwie "${username}" już istnieje.`);
        } else {
            console.error('❌ Wystąpił nieoczekiwany błąd:');
            console.error(err.message);
            console.error(err.code);
        }
    } finally {
        // 3. Ważne: Zawsze zamykaj połączenie z bazą,
        // inaczej skrypt się nie zakończy.
        await pool.end();
    }
};

// Uruchomienie funkcji
createUser();