function insertNav() {
    const nav = document.createElement('nav');
    nav.className = 'bg-gray-800 text-white p-4 mb-6';
    nav.innerHTML = `
        <div class="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
            <a href="/" class="text-2xl font-bold hover:text-gray-300 mb-2 sm:mb-0">TryTutor Match</a>
            <div class="flex flex-wrap justify-center gap-4">
                <a href="/" class="hover:text-gray-300">หน้าแรก</a>
                <a href="/matching.html" class="hover:text-gray-300">จับคู่ติว</a>
                <a href="/public-chat.html" class="hover:text-gray-300">แชทรวม</a>
                <a href="/ai-chat.html" class="hover:text-gray-300">AI Tutor</a>
                <a href="/library.html" class="hover:text-gray-300">คลังข้อสอบ</a>
                <a href="/about.html" class="hover:text-gray-300">เกี่ยวกับเรา</a>
            </div>
        </div>
    `;
    document.body.insertBefore(nav, document.body.firstChild);
}

// เพิ่มการตรวจสอบหน้าปัจจุบันและไฮไลท์เมนู
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('nav a');
    
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('text-blue-300');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    insertNav();
    highlightCurrentPage();
});
