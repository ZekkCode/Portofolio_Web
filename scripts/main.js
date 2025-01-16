// DOM Pop Up
document.addEventListener('DOMContentLoaded', function() {
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            alert('Hello! Feel free to contact me!');
        });
    }
});

    // PESAN POP UP
    const profilePicture = document.querySelector('.profile-picture');
    const popUpChat = document.createElement('div');
    popUpChat.className = 'pop-up-chat';
    popUpChat.textContent = "Hello, I'm Zekk";
    profilePicture.appendChild(popUpChat);

    profilePicture.addEventListener('mouseenter', function() {
        popUpChat.style.display = 'block';
    });

    profilePicture.addEventListener('mouseleave', function() {
        popUpChat.style.display = 'none';
    });


// PANEL BIOGRAPHY
function openTab(tabName) {
    var tabContents = document.querySelectorAll('.tab-content, .tab-content2');
    tabContents.forEach(function(content) {
        content.classList.remove('active');
    });

    var selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

// PANEL
document.querySelector(".tab-button").click();

// meninggalkan web
window.addEventListener('beforeunload', function (e) {
    const confirmationMessage = 'Udah Mampirnya?';
    
    e.returnValue = confirmationMessage;
    
    return confirmationMessage;
});

function BukaTAB(evt, tabName) {
    // Sembunyikan semua tab-pane
    var tabContents = document.querySelectorAll(".tab-pane");
    tabContents.forEach(function(tab) {
        tab.style.display = "none"; 
    });

    var tabLinks = document.querySelectorAll(".nav-link");
    tabLinks.forEach(function(link) {
        link.classList.remove("active");
    });

    // Tampilkan tab yang dipilih
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

// Tambahkan event listener untuk tab-link
const scrollToTopButton = document.querySelector('.scroll-to-top');

// Tampilkan tombol saat scroll ke bawah
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopButton.style.display = 'block';
    } else {
        scrollToTopButton.style.display = 'none';
    }
});

// Tambahkan event listener untuk scroll ke atas
scrollToTopButton.addEventListener('click', (event) => {
    event.preventDefault(); // Mencegah perilaku default
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Efek smooth saat scroll
    });
});