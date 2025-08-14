const GEMINI_API_KEY = 'AIzaSyCw6efW_iRlepoqSVPzqmTizisuO8JEP_4';

async function connectToGemini(prompt) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        console.log('API Response Status:', response.status); // เพิ่ม log

        const data = await response.json();
        console.log('API Response Data:', data); // เพิ่ม log

        // ตรวจสอบ error จาก API
        if (data.error) {
            throw new Error(`API Error: ${data.error.message}`);
        }

        // ตรวจสอบและแกะข้อมูลจาก response
        if (data.candidates && 
            data.candidates[0] && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        }

        throw new Error('Invalid response format from API');
    } catch (error) {
        console.error('Gemini API Error:', error);
        return `ขออภัย เกิดข้อผิดพลาด: ${error.message}`;
    }
}

// เพิ่มตัวแปรสำหรับห้องแชทรวม
let publicChatMessages = [];

function joinPublicChat() {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('กรุณาใส่ชื่อก่อนเข้าห้องแชท');
        return;
    }

    // แสดงส่วนแชท
    document.getElementById('chatBox').innerHTML = '';
    document.getElementById('chatSection').classList.remove('hidden');
    
    // แจ้งเซิร์ฟเวอร์ว่าเข้าห้องแชทรวม
    socket.emit('join_public_chat');
    
    // เปลี่ยนสถานะเป็นแชทรวม
    chatPartner = { 
        isPublic: true 
    };

    addMessage('System', 'ยินดีต้อนรับสู่ห้องแชทรวม');
}

// รับข้อความใหม่จากห้องแชทรวม
socket.on('new_public_message', (data) => {
    if (chatPartner?.isPublic) {
        const isOwnMessage = data.id === socket.id;
        addMessage(
            isOwnMessage ? 'คุณ' : data.username,
            data.message
        );
    }
});

// รับประวัติข้อความเมื่อเข้าห้องแชทรวม
socket.on('public_chat_history', (messages) => {
    messages.forEach(msg => {
        const isOwnMessage = msg.id === socket.id;
        addMessage(
            isOwnMessage ? 'คุณ' : msg.username,
            msg.message
        );
    });
});

// ฟังก์ชันจัดการการอัพโหลดรูปภาพ
function handleImageUpload(event) {
    const file = event.target.files[0];
    const username = document.getElementById('username').value;
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (chatPartner.isPublic) {
                // เก็บรูปภาพในห้องแชทรวม
                const newMessage = {
                    sender: username,
                    imageUrl: e.target.result,
                    timestamp: new Date()
                };
                publicChatMessages.push(newMessage);
                addMessage(username, null, e.target.result);
            } else {
                addMessage('คุณ', null, e.target.result);
                if (chatPartner.isAI) {
                    connectToGemini("มีคนส่งรูปภาพมาให้").then(response => {
                        addMessage('AI Tutor', response);
                    });
                }
            }
        };
        reader.readAsDataURL(file);
    }
}

// ปรับปรุงฟังก์ชัน addMessage ให้รองรับรูปภาพ
function addMessage(sender, message, imageUrl = null, messageId = null) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-4 ' + (sender === 'คุณ' ? 'text-right' : 'text-left');
    if (messageId) {
        messageDiv.id = messageId;
    }

    const senderSpan = document.createElement('div');
    senderSpan.className = 'font-bold mb-1';
    senderSpan.textContent = sender;
    messageDiv.appendChild(senderSpan);

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'max-w-[200px] rounded-lg inline-block';
        img.onclick = () => window.open(imageUrl, '_blank');
        messageDiv.appendChild(img);
    } else if (message) {
        const messageContent = document.createElement('div');
        messageContent.className = 'bg-gray-100 rounded-lg p-2 inline-block';
        messageContent.textContent = message;
        messageDiv.appendChild(messageContent);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// เพิ่มการเชื่อมต่อ Socket.IO
const socket = io();

// รับข้อมูลจำนวนผู้ใช้ออนไลน์
socket.on('online_count', (data) => {
    document.getElementById('onlineCount').textContent = data.count;
    updateOnlineUsers(data.users);
});

// อัพเดทจำนวนผู้ใช้ออนไลน์
socket.on('online_users', (users) => {
    document.getElementById('onlineCount').textContent = users.length;
});

// อัพเดทสถิติทั้งหมด
socket.on('stats_update', (stats) => {
    document.getElementById('matchCount').textContent = stats.matchCount;
    document.getElementById('aiChatCount').textContent = stats.aiChatCount;
    document.getElementById('totalUsers').textContent = stats.totalUsers;
});

// ขอข้อมูลสถิติเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    socket.emit('request_stats');
});

// ปรับปรุง event listener ของปุ่มส่งข้อความ
document.getElementById('sendMessage').addEventListener('click', async () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const username = document.getElementById('username').value;
    
    if (message) {
        if (chatPartner.isAI) {
            // แสดงข้อความของผู้ใช้
            addMessage('คุณ', message);
            messageInput.value = '';

            // แสดงว่ากำลังโหลด
            const loadingId = `loading-${Date.now()}`;
            addMessage('AI Tutor', 'กำลังคิดคำตอบ...', null, loadingId);
            
            try {
                const subject = document.getElementById('subject')?.value || 'general';
                const contextPrompt = `คุณคือ AI Tutor ที่สอนวิชา ${subject} กรุณาตอบคำถามต่อไปนี้: ${message}`;
                
                const aiResponse = await connectToGemini(contextPrompt);
                document.getElementById(loadingId)?.remove();
                addMessage('AI Tutor', aiResponse);
            } catch (error) {
                document.getElementById(loadingId)?.remove();
                addMessage('System', 'ขออภัย ไม่สามารถเชื่อมต่อกับ AI ได้ กรุณาลองใหม่อีกครั้ง');
            }
        } else if (chatPartner?.isPublic) {
            // ส่งข้อความไปห้องแชทรวม
            socket.emit('public_message', message);
        } else {
            // ส่งข้อความส่วนตัว
            socket.emit('private_message', {
                to: chatPartner.username,
                message: message
            });
            addMessage('คุณ', message);
        }
        messageInput.value = '';
    }
});

let timerInterval;
let timeLeft = 60;

function startTimer() {
    const timerSection = document.getElementById('timerSection');
    const timerElement = document.getElementById('timer');
    const findMatchButton = document.getElementById('findMatch');
    
    timerSection.classList.remove('hidden');
    findMatchButton.disabled = true;
    findMatchButton.classList.add('opacity-50');
    
    timeLeft = 60;
    timerElement.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerSection.classList.add('hidden');
            
            // เริ่มแชทกับ AI โดยอัตโนมัติ
            chatPartner = { username: 'AI Tutor', isAI: true };
            showChatSection();
            connectToGemini("สวัสดี ฉันต้องการความช่วยเหลือ").then(response => {
                addMessage('System', 'ไม่พบคู่ติวที่เหมาะสม กำลังเชื่อมต่อกับ AI Tutor...');
                addMessage('AI Tutor', response);
            });
        }
    }, 1000);
}

let matchTimer;
let timeRemaining = 60;

function startMatching() {
    const matchingStatus = document.getElementById('matchingStatus');
    const findMatchBtn = document.getElementById('findMatch');
    const matchTimer = document.getElementById('matchTimer');
    
    // แสดงสถานะการจับคู่
    matchingStatus.classList.remove('hidden');
    findMatchBtn.disabled = true;
    findMatchBtn.classList.add('opacity-50');
    
    // เริ่มจับเวลาถอยหลัง
    timeRemaining = 60;
    matchTimer.textContent = timeRemaining;
    
    const countdown = setInterval(() => {
        timeRemaining--;
        matchTimer.textContent = timeRemaining;
        
        if (timeRemaining <= 0) {
            clearInterval(countdown);
            handleMatchTimeout();
        }
    }, 1000);

    // เก็บ interval ID ไว้สำหรับยกเลิก
    matchTimer = countdown;
}

function handleMatchTimeout() {
    const matchingStatus = document.getElementById('matchingStatus');
    const findMatchBtn = document.getElementById('findMatch');
    
    // ซ่อนสถานะการจับคู่
    matchingStatus.classList.add('hidden');
    findMatchBtn.disabled = false;
    findMatchBtn.classList.remove('opacity-50');
    
    // แสดงตัวเลือกให้ผู้ใช้
    showMatchingOptions();
}

function cancelMatching() {
    if (matchTimer) {
        clearInterval(matchTimer);
    }
    
    const matchingStatus = document.getElementById('matchingStatus');
    const findMatchBtn = document.getElementById('findMatch');
    
    matchingStatus.classList.add('hidden');
    findMatchBtn.disabled = false;
    findMatchBtn.classList.remove('opacity-50');
}

// ปรับปรุง event listener ของปุ่มค้นหา
document.getElementById('findMatch').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const subject = document.getElementById('subject').value;
    const grade = document.getElementById('grade').value;

    if (!username || !subject || !grade) {
        alert('กรุณากรอกข้อมูลให้ครบ');
        return;
    }

    startMatching();
    
    // ส่งข้อมูลไปหาคู่
    socket.emit('find_match', { username, subject, grade });
});

// รับเหตุการณ์เมื่อจับคู่สำเร็จ
socket.on('match_found', (data) => {
    cancelMatching();
    showChatSection();
    addMessage('System', `จับคู่สำเร็จกับ ${data.partnerName}!`);
});

function findMatch(user) {
    const match = onlineUsers.find(u => 
        u !== user && 
        u.subject === user.subject && 
        u.grade === user.grade &&
        !u.matched
    );

    if (match) {
        clearInterval(timerInterval);
        document.getElementById('timerSection').classList.add('hidden');
        document.getElementById('findMatch').disabled = false;
        document.getElementById('findMatch').classList.remove('opacity-50');
        chatPartner = match;
        match.matched = true;
        showChatSection();
        addMessage('System', `จับคู่สำเร็จกับ: ${match.username}`);
    } else if (timeLeft <= 0) {
        clearInterval(timerInterval);
        document.getElementById('timerSection').classList.add('hidden');
        showChatSection();
        addMessage('System', 'ไม่พบคู่ที่เหมาะสมในขณะนี้');
        addMessage('System', 'คุณสามารถลองค้นหาใหม่อีกครั้ง หรือเลือกปรึกษากับ AI Tutor');
        
        // เพิ่มปุ่มให้เลือก
        const choiceDiv = document.createElement('div');
        choiceDiv.className = 'flex gap-2 justify-center mt-4';
        
        const retryBtn = document.createElement('button');
        retryBtn.className = 'bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600';
        retryBtn.textContent = 'ค้นหาใหม่';
        retryBtn.onclick = () => window.location.reload();
        
        const aiTutorBtn = document.createElement('button');
        aiTutorBtn.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500';
        aiTutorBtn.textContent = 'ปรึกษา AI Tutor';
        aiTutorBtn.onclick = () => {
            chatPartner = { username: 'AI Tutor', isAI: true };
            connectToGemini("สวัสดี ฉันต้องการความช่วยเหลือ").then(response => {
                addMessage('AI Tutor', response);
            });
        };
        
        choiceDiv.appendChild(retryBtn);
        choiceDiv.appendChild(aiTutorBtn);
        document.getElementById('chatBox').appendChild(choiceDiv);
    }
}

// เพิ่มฟังก์ชันเชื่อมต่อ socket เมื่อล็อกอิน
function connectSocket(userData) {
    socket.emit('user_join', userData);
}

// รับข้อความส่วนตัว
socket.on('receive_message', (data) => {
    addMessage(data.from, data.message);
});

// รับข้อความในห้องแชทรวม
socket.on('receive_public_message', (data) => {
    if (chatPartner?.isPublic) {
        addMessage(data.from, data.message);
    }
});

// ปรับปรุงฟังก์ชัน updateOnlineUsers
function updateOnlineUsers(users) {
    const container = document.getElementById('onlineUsers');
    container.innerHTML = '';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'p-2 bg-gray-100 rounded flex items-center';
        
        const statusDot = document.createElement('span');
        statusDot.className = 'w-2 h-2 bg-green-500 rounded-full mr-2';
        userDiv.appendChild(statusDot);
        
        const userInfo = document.createElement('span');
        userInfo.textContent = `${user.username} (${user.grade} - ${user.subject})`;
        userDiv.appendChild(userInfo);
        
        container.appendChild(userDiv);
    });
}
