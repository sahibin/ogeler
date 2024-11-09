const elementTypes = [
    "Seçiniz...",
    "Özne",
    "Yüklem",
    "Belirtili Nesne",
    "Belirtisiz Nesne",
    "Dolaylı Tümleç",
    "Edat Tümleci",
    "Zarf Tümleci",
    "Cümle Dışı Öğe"
];

let sentences = [];
let currentSentenceIndex = 0;
let touchTimeout;
let lastTap = 0;

// Fetch sentences from sentences.json
fetch('sentences.json')
    .then(response => response.json())
    .then(data => {
        sentences = data.sentences;
        showCurrentSentence();
    })
    .catch(error => {
        console.error('Error loading sentences:', error);
        sentences = [{
            text: "Cümle yüklenemedi. Lütfen sayfayı yenileyin.",
            analysis: {}
        }];
        showCurrentSentence();
    });

function showCurrentSentence() {
    const sentence = sentences[currentSentenceIndex];
    const words = sentence.text.split(' ');
    const container = document.getElementById('currentSentence');
    container.innerHTML = '';
    
    words.forEach(word => {
        const wordEl = document.createElement('span');
        wordEl.className = 'word';
        wordEl.draggable = true;
        wordEl.textContent = word;
        
        wordEl.addEventListener('touchstart', handleTouchStart);
        wordEl.addEventListener('touchend', handleTouchEnd);
        wordEl.addEventListener('touchmove', handleTouchMove);
        wordEl.addEventListener('dragstart', handleDragStart);
        container.appendChild(wordEl);
    });

    clearElementBoxes();
    updateNavigation();
    hideResult();
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    const word = e.target;
    
    e.preventDefault();
    word.style.opacity = '0.7';
    word.classList.add('dragging');
    
    word.dataset.touchX = touch.clientX;
    word.dataset.touchY = touch.clientY;
    
    const rect = word.getBoundingClientRect();
    word.dataset.initialX = rect.left;
    word.dataset.initialY = rect.top;
}

function handleTouchMove(e) {
    const word = e.target;
    if (!word.classList.contains('dragging')) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - word.dataset.touchX;
    const deltaY = touch.clientY - word.dataset.touchY;
    
    word.style.position = 'fixed';
    word.style.left = `${parseInt(word.dataset.initialX) + deltaX}px`;
    word.style.top = `${parseInt(word.dataset.initialY) + deltaY}px`;
    word.style.zIndex = '1000';
    
    const elementBoxes = document.querySelectorAll('.element-content');
    elementBoxes.forEach(box => {
        const rect = box.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            box.style.background = '#f0fff4';
        } else {
            box.style.background = '#f7fafc';
        }
    });
}

function handleTouchEnd(e) {
    const word = e.target;
    if (!word.classList.contains('dragging')) return;
    
    const touch = e.changedTouches[0];
    
    const elementBoxes = document.querySelectorAll('.element-content');
    elementBoxes.forEach(box => {
        const rect = box.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            const wordContainer = document.createElement('div');
            wordContainer.className = 'word-in-box';
            
            const wordText = document.createElement('span');
            wordText.className = 'word-text';
            wordText.textContent = word.textContent;
            
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-word';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = () => wordContainer.remove();
            
            wordContainer.appendChild(wordText);
            wordContainer.appendChild(deleteBtn);
            box.appendChild(wordContainer);
        }
        box.style.background = '#f7fafc';
    });
    
    word.style.position = '';
    word.style.left = '';
    word.style.top = '';
    word.style.zIndex = '';
    word.style.opacity = '';
    word.classList.remove('dragging');
    
    hideResult();
}

function clearElementBoxes() {
    document.querySelectorAll('.element-content').forEach(box => {
        box.innerHTML = '';
        box.addEventListener('dragover', handleDragOver);
        box.addEventListener('drop', handleDrop);
    });
}

function updateNavigation() {
    document.getElementById('prevButton').disabled = currentSentenceIndex === 0;
    document.getElementById('nextButton').disabled = currentSentenceIndex === sentences.length - 1;
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.target.style.opacity = '0.7';
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.background = '#f0fff4';
}

function handleDragLeave(e) {
    e.currentTarget.style.background = '#f7fafc';
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.style.background = '#f7fafc';
    
    const word = e.dataTransfer.getData('text/plain');
    const elementBox = e.target.closest('.element-content');
    if (!elementBox) return;

    document.querySelectorAll('.element-content .word-in-box').forEach(el => {
        if (el.querySelector('.word-text').textContent === word) {
            el.remove();
        }
    });

    const wordContainer = document.createElement('div');
    wordContainer.className = 'word-in-box';
    
    const wordText = document.createElement('span');
    wordText.className = 'word-text';
    wordText.textContent = word;

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-word';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = () => wordContainer.remove();

    wordContainer.appendChild(wordText);
    wordContainer.appendChild(deleteBtn);
    elementBox.appendChild(wordContainer);
    hideResult();
}

function hideResult() {
    const result = document.getElementById('result');
    result.style.display = 'none';
}

function showResult(message, success) {
    const result = document.getElementById('result');
    result.textContent = message;
    result.className = `result ${success ? 'success' : 'error'}`;
    result.style.display = 'block';
}
document.getElementById('checkButton').addEventListener('click', () => {
    const currentSentence = sentences[currentSentenceIndex];
    let isCorrect = true;

    // Get current assignments
    const currentAssignments = {};
    document.querySelectorAll('.element-content').forEach(box => {
        const element = box.dataset.element;
        const words = Array.from(box.querySelectorAll('.word-text'))
            .map(el => el.textContent);
        if (words.length > 0) {
            currentAssignments[element] = words;
        }
    });

    // Check if all words are assigned
    const assignedWords = Object.values(currentAssignments)
        .flat()
        .map(word => word.trim().toLowerCase());

    const originalWords = currentSentence.text
        .split(' ')
        .map(word => word.trim().toLowerCase());

    if (assignedWords.length !== originalWords.length) {
        showResult('Lütfen tüm sözcükleri yerleştirin.', false);
        return;
    }

    // Compare with correct analysis
    for (const [element, words] of Object.entries(currentSentence.analysis)) {
        const correctWords = words.join(' ').toLowerCase().split(' ');
        const userWords = (currentAssignments[element] || [])
            .join(' ')
            .toLowerCase()
            .split(' ');

        if (!correctWords.every(word => userWords.includes(word)) ||
            !userWords.every(word => correctWords.includes(word))) {
            isCorrect = false;
            break;
        }
    }

    if (isCorrect) {
        showResult('Tebrikler! Cümle analizi doğru.', true);
    } else {
        showResult('Bazı sözcükler yanlış yerde. Tekrar deneyin.', false);
    }
});

// Add/Edit sentence functionality
document.getElementById('addButton').addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('newSentence').value = '';
    document.getElementById('wordAssignments').style.display = 'none';
    document.getElementById('analysisPreview').style.display = 'none';
    delete document.getElementById('addModal').dataset.editIndex;
});

document.getElementById('editButton').addEventListener('click', () => {
    const sentence = sentences[currentSentenceIndex];
    document.getElementById('addModal').dataset.editIndex = currentSentenceIndex;
    document.getElementById('newSentence').value = sentence.text;
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('splitSentence').click();
});

document.getElementById('splitSentence').addEventListener('click', () => {
    const sentence = document.getElementById('newSentence').value.trim();
    if (!sentence) return;

    const words = sentence.split(' ');
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';

    words.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        const wordLabel = document.createElement('span');
        wordLabel.textContent = word;
        wordLabel.style.minWidth = '100px';

        const select = document.createElement('select');
        select.className = 'element-select';
        select.dataset.word = word;
        
        elementTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });

        if (document.getElementById('addModal').dataset.editIndex) {
            const currentSentence = sentences[currentSentenceIndex];
            for (const [element, words] of Object.entries(currentSentence.analysis)) {
                if (words.includes(word) || words.join(' ').includes(word)) {
                    select.value = element;
                }
            }
        }

        select.addEventListener('change', updateAnalysisPreview);

        wordItem.appendChild(wordLabel);
        wordItem.appendChild(select);
        wordList.appendChild(wordItem);
    });

    document.getElementById('wordAssignments').style.display = 'block';
    document.getElementById('analysisPreview').style.display = 'block';
    updateAnalysisPreview();
});

function updateAnalysisPreview() {
    const analysis = {};
    document.querySelectorAll('.element-select').forEach(select => {
        const element = select.value;
        const word = select.dataset.word;
        
        if (element && element !== "Seçiniz...") {
            if (!analysis[element]) {
                analysis[element] = [];
            }
            analysis[element].push(word);
        }
    });

    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = '';

    Object.entries(analysis).forEach(([element, words]) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `<strong>${element}:</strong> ${words.join(' ')}`;
        previewContent.appendChild(item);
    });
}

document.getElementById('saveNewSentence').addEventListener('click', () => {
    const text = document.getElementById('newSentence').value.trim();
    if (!text) return;

    const analysis = {};
    document.querySelectorAll('.element-select').forEach(select => {
        const element = select.value;
        const word = select.dataset.word;
        
        if (element && element !== "Seçiniz...") {
            if (!analysis[element]) {
                analysis[element] = [];
            }
            analysis[element].push(word);
        }
    });

    const allWordsAssigned = Array.from(document.querySelectorAll('.element-select'))
        .every(select => select.value !== "Seçiniz...");

    if (!allWordsAssigned) {
        alert('Lütfen tüm sözcüklere öğe atayın.');
        return;
    }

    if (document.getElementById('addModal').dataset.editIndex) {
        const editIndex = parseInt(document.getElementById('addModal').dataset.editIndex);
        sentences[editIndex] = { text, analysis };
        currentSentenceIndex = editIndex;
    } else {
        sentences.push({ text, analysis });
        currentSentenceIndex = sentences.length - 1;
    }

    showCurrentSentence();
    document.getElementById('addModal').style.display = 'none';
});

document.getElementById('cancelNewSentence').addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'none';
});

// Delete functionality
document.getElementById('deleteButton').addEventListener('click', () => {
    if (confirm('Bu cümleyi silmek istediğinizden emin misiniz?')) {
        sentences.splice(currentSentenceIndex, 1);
        if (sentences.length === 0) {
            sentences.push({
                text: "Lütfen yeni bir cümle ekleyin",
                analysis: {}
            });
        }
        if (currentSentenceIndex >= sentences.length) {
            currentSentenceIndex = sentences.length - 1;
        }
        showCurrentSentence();
    }
});

// Export functionality
document.getElementById('exportButton').addEventListener('click', () => {
    const data = JSON.stringify({ sentences }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentences.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Import functionality
document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.sentences && Array.isArray(data.sentences)) {
                    sentences = data.sentences;
                    currentSentenceIndex = 0;
                    showCurrentSentence();
                }
            } catch (error) {
                alert('Geçersiz dosya formatı');
            }
        };
        reader.readAsText(file);
    }
});

// Navigation
document.getElementById('prevButton').addEventListener('click', () => {
    if (currentSentenceIndex > 0) {
        currentSentenceIndex--;
        showCurrentSentence();
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    if (currentSentenceIndex < sentences.length - 1) {
        currentSentenceIndex++;
        showCurrentSentence();
    }
});

// Prevent zooming on double tap for iOS
document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
        e.preventDefault();
    }
    lastTap = currentTime;
});