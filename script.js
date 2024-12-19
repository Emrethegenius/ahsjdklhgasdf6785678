// Global variables
let marker = null;
let correctMarker = null;
let line = null;
let currentQuestion = 0;
let allGuesses = [];
let allMarkers = [];
let allLines = [];
let map, correctLocation, canGuess = true, totalScore = 0, roundsPlayed = 0;

function showGuessAndCorrectLocation(userLatLng, correctLatLng) {
    const bounds = L.latLngBounds([userLatLng, correctLatLng]);
    map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 12,
        animate: true,
        duration: 1
    });
}



// Initial theme setup
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Icon definitions
const userIcon = L.divIcon({
    className: 'custom-marker',
    html: `<img src="images/your-correct-pin.svg.svg" style="width: 40px; height: 40px;">`,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

const correctIcon = L.divIcon({
    className: 'custom-marker',
    html: `<img src="images/your-user-pin.svg.svg" style="width: 40px; height: 40px;">`,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const root = document.documentElement;
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    const questions = [
        {
            question: "Where is the world's oldest stock exchange still in operation?",
            answer: [52.3702, 4.8952],
            name: "Amsterdam Stock Exchange",
            image: "images/Hendrick_de_Keyser_exchange-1024x808.jpg",
            info: "Established in 1602 by the Dutch East India Company, the Amsterdam Stock Exchange is considered the world's oldest 'modern' securities market. It pioneered many financial innovations including continuous trading and options trading."
        },
        {
            question: "Where is the coldest permanently inhabited place on Earth?",
            answer: [63.4641, 142.7737],
            name: "Oymyakon, Russia",
            image: "images/oymyakon-1[3].jpg",
            info: "Oymyakon in Siberia holds the record for the coldest permanently inhabited place, with temperatures dropping to -71.2°C (-96.16°F). Around 500 people live in this extreme environment where ground is permanently frozen."
        },
        {
            question: "Where was the Apollo 11 command module recovered after splashdown?",
            answer: [13.3290, 169.1490],
            name: "Pacific Ocean Recovery Site",
            image: "images/Splashdown_3.jpg",
            info: "On July 24, 1969, Apollo 11 splashed down 900 miles southwest of Hawaii. The USS Hornet recovered the command module Columbia and its crew, marking the successful completion of the first human moon landing mission."
        },
        {
            question: "Where was the first written peace treaty in history signed?",
            answer: [34.5679, 36.0513],
            name: "Kadesh, Syria",
            image: "images/200px-Treaty_of_Kadesh.jpg",
            info: "The Treaty of Kadesh (1259 BCE), signed between Egyptian Pharaoh Ramesses II and Hittite King Hattusili III, is the oldest known peace treaty. A copy is displayed at the UN Headquarters as a symbol of diplomatic relations."
        },
        {
            question: "Where was the first successful human heart transplant performed?",
            answer: [-33.94113063924009, 18.462912490286236],
            name: "Groote Schuur Hospital, Cape Town",
            image: "images/treaty-of-kadesh-3.jpg",
            info: "On December 3, 1967, Dr. Christiaan Barnard performed the world's first successful human heart transplant at Groote Schuur Hospital. The patient, Louis Washkansky, lived for 18 days after the groundbreaking surgery."
        }
    ];

    const startGame = document.getElementById("start-game");
    if (startGame) {
        startGame.onclick = function() {
            const introSection = document.getElementById('intro-section');
            const gameSection = document.getElementById('game-section');
            
            if (introSection && gameSection) {
                introSection.style.display = "none";
                gameSection.style.display = "block";
                
                map = L.map('map').setView([20, 0], 2);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '©OpenStreetMap, ©CartoDB'                 
                }).addTo(map);
            
                document.getElementById("question").textContent = questions[currentQuestion].question;
                map.on('click', handleGuess);
            }
        };
    }

    function createLocationPointer(question, coordinates) {
        const pointer = document.createElement('div');
        pointer.className = 'location-pointer';
        
        pointer.innerHTML = `
            <div class="location-name">
                ${question.name}
                <span class="expand-icon">+</span>
            </div>
            <div class="location-content">
                <img class="location-image" src="${question.image}" alt="${question.name}">
                <div class="location-info">${question.info}</div>
            </div>
        `;
        
        const point = map.latLngToContainerPoint(coordinates);
        pointer.style.left = `${point.x}px`;
        pointer.style.top = `${point.y}px`;
        
        pointer.addEventListener('click', () => {
            pointer.classList.toggle('expanded');
        });
    
        map.on('move', () => {
            const newPoint = map.latLngToContainerPoint(coordinates);
            pointer.style.left = `${newPoint.x}px`;
            pointer.style.top = `${newPoint.y}px`;
        });
    
        return pointer;
    }
    

    function handleGuess(e) {
        if (currentQuestion >= questions.length) return;
    
        map.off('click', handleGuess);
        const userGuess = e.latlng;
        const correctAnswer = questions[currentQuestion].answer;
        const distance = calculateDistance(userGuess.lat, userGuess.lng, correctAnswer[0], correctAnswer[1]);
    
        allGuesses.push({
            guess: [userGuess.lat, userGuess.lng],
            answer: correctAnswer,
            distance: distance
        });
    
        if (marker && map) {
            map.removeLayer(marker);
            if (correctMarker) map.removeLayer(correctMarker);
            if (line) map.removeLayer(line);
        }
    
        marker = L.marker([userGuess.lat, userGuess.lng], { icon: userIcon }).addTo(map);
        const locationPointer = createLocationPointer(questions[currentQuestion], correctAnswer);
        document.getElementById('map').appendChild(locationPointer);
        
        line = L.polyline([[userGuess.lat, userGuess.lng], correctAnswer], {
            color: '#4CAF50',
            weight: 3,
            opacity: 0.8,
            smoothFactor: 1,
            className: 'animated-line'
        }).addTo(map);
        showGuessAndCorrectLocation(userGuess, correctAnswer);

    
        const points = Math.round(4000 * Math.exp(-distance / 2000));
        totalScore += points;
    
        document.getElementById("distance").textContent = `${Math.round(distance)} km`;
        document.getElementById("score").textContent = `${totalScore}`;
    
        const isCorrect = distance <= 100;
        document.getElementById("feedback").innerHTML += 
            `<span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>`;
    
        const nextButton = document.createElement('button');
        nextButton.className = 'next-button';
        nextButton.textContent = 'Next Question →';
        document.getElementById('question-container').appendChild(nextButton);
    
        nextButton.onclick = () => {
            locationPointer.remove();
            nextButton.remove();
            currentQuestion++;
            if (currentQuestion < questions.length) {
                if (marker && map) {
                    map.removeLayer(marker);
                    if (correctMarker) map.removeLayer(correctMarker);
                    if (line) map.removeLayer(line);
                }
                document.getElementById("question").textContent = questions[currentQuestion].question;
                map.on('click', handleGuess);
            } else {
                endGame();
            }
        };
    }
    
    

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    function endGame() {
        const maxScore = questions.length * 4000;
        const percentage = Math.round((totalScore / maxScore) * 100);
        const ticks = document.getElementById('feedback').innerHTML;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Game Complete! 🎉</h2>
                <p>Final Score: ${totalScore} / ${maxScore}</p>
                <p>Accuracy: ${percentage}%</p>
                <div class="ticks-container">${ticks}</div>
                <div class="modal-buttons">
                    <button class="modal-button share-button" onclick="shareResults()">Share Results</button>
                    <button class="modal-button collapse-button" onclick="toggleModal(this)">Check Map</button>
                    <button class="modal-button" onclick="location.reload()">Play Again</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
});

function shareResults() {
    const score = document.getElementById('score').textContent;
    const feedback = document.getElementById('feedback').innerHTML;
    const text = `🌍 Map Quiz Results:\n${score}\n${feedback}\nPlay at: [your-game-url]`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Map Quiz Results',
            text: text
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text)
            .then(() => alert('Results copied to clipboard!'));
    }
}

function toggleModal(button) {
    const modalContent = button.closest('.modal-content');
    const modal = button.closest('.modal');
    
    if (typeof map !== 'undefined' && map !== null) {
        allMarkers.forEach(m => map.removeLayer(m));
        allLines.forEach(l => map.removeLayer(l));
        allMarkers = [];
        allLines = [];
        
        allGuesses.forEach((guess) => {
            const userMarker = L.marker(guess.guess, {
                icon: userIcon
            }).addTo(map);
            
            const correctMarker = L.marker(guess.answer, {
                icon: correctIcon
            }).addTo(map);
            
            const line = L.polyline([guess.guess, guess.answer], {
                color: '#4CAF50',
                weight: 3,
                opacity: 0.8,
                smoothFactor: 1,
                className: 'animated-line'
            }).addTo(map);
                            
            allMarkers.push(userMarker, correctMarker);
            allLines.push(line);
        });
    }
    
    let floatingButton = document.getElementById('floating-results');
    if (!floatingButton) {
        floatingButton = document.createElement('button');
        floatingButton.id = 'floating-results';
        floatingButton.className = 'modal-button collapse-button';
        floatingButton.style.position = 'fixed';
        floatingButton.style.bottom = '20px';
        floatingButton.style.right = '20px';
        floatingButton.style.zIndex = '2000';
        floatingButton.textContent = 'Show Results';
        floatingButton.onclick = () => {
            modal.style.display = 'flex';
            modalContent.style.display = 'block';
            floatingButton.style.display = 'none';
        };
        document.body.appendChild(floatingButton);
    }

    modal.style.display = 'none';
    modalContent.style.display = 'none';
    floatingButton.style.display = 'block';
}

function handleMapResize() {
    if (typeof map !== 'undefined' && map !== null) {
        const infoBoxes = document.querySelectorAll('.info-box');
        infoBoxes.forEach(box => {
            const coordinates = box.dataset.coordinates.split(',');
            const point = map.latLngToContainerPoint([coordinates[0], coordinates[1]]);
            box.style.left = `${point.x}px`;
            box.style.top = `${point.y}px`;
        });
    }
}

if (typeof map !== 'undefined' && map !== null) {
    map.on('resize', handleMapResize);
}
